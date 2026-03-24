/**
 * @file 管理员充值订单服务
 * @description 后台管理端充值订单相关业务逻辑
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第4节 - 充值订单接口
 * @depends 开发文档/开发文档.md 第5节 - 充值系统
 */

import { prisma } from '@/lib/prisma';
import { generateOrderNo, ORDER_TYPE } from '@/lib/order';
import {
  paymentChannelManager,
  CollectionParams,
  CollectionStatus,
} from '@/lib/payment';
import { BusinessError, Errors } from '@/lib/errors';
import { Decimal } from '@prisma/client/runtime/library';
import { CACHE_KEYS, deleteCache } from '@/lib/redis';
import { formatNotificationAmount } from '@/lib/config';

/**
 * Prisma 事务客户端类型
 */
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * 充值订单列表查询参数
 */
export interface RechargeOrderListParams {
  page: number;
  pageSize: number;
  orderNo?: string;
  thirdOrderNo?: string;
  userId?: number;
  userPhone?: string;
  channelId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  amountMin?: number;
  amountMax?: number;
  createIp?: string;
}

/**
 * 充值订单列表响应
 * @description 依据：04.4.2-充值订单列表页.md 第5节 - 列表需包含 payUrl 用于复制支付链接
 */
export interface RechargeOrderListItem {
  id: number;
  orderNo: string;
  userId: number;
  userPhone: string;
  channelName: string;
  amount: string;
  actualAmount: string | null;
  status: string;
  thirdOrderNo: string | null;
  /** 支付链接（待支付订单用于复制） */
  payUrl: string | null;
  createIp: string | null;
  createdAt: Date;
  callbackAt: Date | null;
}

/**
 * 手动充值参数
 */
export interface ManualRechargeParams {
  userId: number;
  channelId: number;
  amount: number;
}

/**
 * 手动充值结果
 */
export interface ManualRechargeResult {
  orderId: number;
  orderNo: string;
  payUrl: string;
  expireAt: Date;
}

/**
 * 查询上游结果
 */
export interface QueryUpstreamResult {
  id: number;
  success: boolean;
  upstreamStatus?: string;
  compensated?: boolean;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 管理员充值订单服务类
 */
export class AdminRechargeOrderService {
  /**
   * 获取充值订单列表
   * @depends 02.4-后台API接口清单.md 第4.1节 - 充值订单列表
   * @param params 查询参数
   * @returns 订单列表和统计摘要
   */
  async getList(params: RechargeOrderListParams) {
    const {
      page,
      pageSize,
      orderNo,
      thirdOrderNo,
      userId,
      userPhone,
      channelId,
      status,
      startDate,
      endDate,
      amountMin,
      amountMax,
      createIp,
    } = params;

    // 构建查询条件
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (orderNo) {
      where.orderNo = { contains: orderNo };
    }
    if (thirdOrderNo) {
      where.thirdOrderNo = { contains: thirdOrderNo };
    }
    if (userId) {
      where.userId = userId;
    }
    if (userPhone) {
      where.user = { phone: { contains: userPhone } };
    }
    if (channelId) {
      where.channelId = channelId;
    }
    if (status) {
      if (Array.isArray(status)) {
        where.status = { in: status };
      } else {
        where.status = status;
      }
    }
    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }
    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate + 'T23:59:59.999Z') };
    }
    if (amountMin !== undefined) {
      where.amount = { ...where.amount, gte: new Decimal(amountMin) };
    }
    if (amountMax !== undefined) {
      where.amount = { ...where.amount, lte: new Decimal(amountMax) };
    }
    if (createIp) {
      where.createIp = { contains: createIp };
    }

    // 并行查询：列表、总数、统计摘要
    const [list, total, summaryResult] = await Promise.all([
      prisma.rechargeOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: { id: true, phone: true, nickname: true },
          },
          channel: {
            select: { id: true, code: true, name: true },
          },
        },
      }),
      prisma.rechargeOrder.count({ where }),
      // 统计已支付订单的总金额和数量
      prisma.rechargeOrder.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { actualAmount: true },
        _count: { id: true },
      }),
    ]);

    // 格式化列表数据
    // 依据：04.4.2-充值订单列表页.md 第5节 - 列表需包含 payUrl 用于复制支付链接
    const formattedList: RechargeOrderListItem[] = list.map((order) => ({
      id: order.id,
      orderNo: order.orderNo,
      userId: order.userId,
      userPhone: order.user?.phone || '',
      channelName: order.channel?.name || order.channel?.code || '',
      amount: order.amount.toString(),
      actualAmount: order.actualAmount?.toString() || null,
      status: order.status,
      thirdOrderNo: order.thirdOrderNo,
      payUrl: order.payUrl, // 支付链接，用于"复制支付链接"操作
      createIp: order.createIp,
      createdAt: order.createdAt,
      callbackAt: order.callbackAt,
    }));

    return {
      list: formattedList,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      summary: {
        totalAmount: summaryResult._sum.actualAmount?.toString() || '0.00',
        totalCount: summaryResult._count.id,
      },
    };
  }

  /**
   * 获取充值订单详情
   * @depends 02.4-后台API接口清单.md 第4节
   * @param id 订单ID
   * @returns 订单详情
   */
  async getDetail(id: number) {
    const order = await prisma.rechargeOrder.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            nickname: true,
            vipLevel: true,
            availableBalance: true,
            createdAt: true,
          },
        },
        channel: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (!order) {
      throw Errors.orderNotFound();
    }

    return order;
  }

  /**
   * 手动充值（创建充值订单）
   * @depends 02.4-后台API接口清单.md 第4.2节 - 手动充值
   * @description 管理员为用户生成充值订单，调用支付通道API获取支付链接
   * @param params 充值参数
   * @param adminId 操作管理员ID
   * @returns 订单信息和支付链接
   */
  async manualRecharge(
    params: ManualRechargeParams,
    adminId: number
  ): Promise<ManualRechargeResult> {
    const { userId, channelId, amount } = params;

    // 1. 校验用户
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw Errors.userNotFound();
    }
    if (user.status !== 'ACTIVE') {
      throw new BusinessError('USER_INACTIVE', '用户账号已被禁用', 400);
    }

    // 2. 获取支付通道配置
    const channel = await prisma.paymentChannel.findUnique({
      where: { id: channelId },
    });
    if (!channel || !channel.payEnabled) {
      throw new BusinessError('CHANNEL_UNAVAILABLE', '支付通道不可用', 400);
    }

    // 3. 校验金额范围
    if (channel.minAmount && amount < channel.minAmount.toNumber()) {
      throw new BusinessError(
        'AMOUNT_TOO_LOW',
        `该通道最低充值金额为 ${channel.minAmount}`,
        400
      );
    }
    if (channel.maxAmount && amount > channel.maxAmount.toNumber()) {
      throw new BusinessError(
        'AMOUNT_TOO_HIGH',
        `该通道最高充值金额为 ${channel.maxAmount}`,
        400
      );
    }

    // 4. 获取全局配置
    const config = await this.getGlobalConfig();

    // 5. 生成订单号
    const orderNo = generateOrderNo(ORDER_TYPE.RECHARGE);

    // 6. 构建回调地址
    // 依据：与用户端充值、统一回调路由一致 - POST /api/callback/:channel/recharge
    const siteDomain = config.siteDomain;
    if (!siteDomain) {
      throw Errors.siteDomainNotConfigured();
    }

    const notifyUrl = `${siteDomain}/api/callback/${channel.code.toLowerCase()}/recharge`;
    const callbackUrl = `${process.env.FRONTEND_URL || siteDomain}/recharge/result?orderNo=${orderNo}`;

    // 7. 调用支付通道创建订单
    const paymentChannel = await paymentChannelManager.getChannel(channel.code);
    if (!paymentChannel) {
      throw new BusinessError('CHANNEL_CONFIG_ERROR', '支付通道配置错误', 500);
    }

    const collectionParams: CollectionParams = {
      orderNo,
      amount: amount.toFixed(2),
      productName: 'إيداع',
      notifyUrl,
      callbackUrl,
    };

    const result = await paymentChannel.createCollectionOrder(collectionParams);

    if (!result.success || !result.payUrl) {
      console.error('[AdminRechargeService] 创建支付订单失败:', result);
      throw new BusinessError(
        'CHANNEL_ERROR',
        result.errorMessage || '创建支付订单失败',
        502
      );
    }

    // 8. 计算过期时间
    const expireAt = new Date();
    expireAt.setMinutes(expireAt.getMinutes() + config.rechargeTimeoutMinutes);

    // 9. 保存订单到数据库
    const order = await prisma.rechargeOrder.create({
      data: {
        orderNo,
        userId,
        channelId,
        amount: new Decimal(amount),
        actualAmount: null,
        thirdOrderNo: result.thirdOrderNo || null,
        payUrl: result.payUrl,
        status: 'PENDING_PAYMENT',
        expireAt,
        // 备注：管理员手动创建（管理员ID: ${adminId}）- 记录在日志中
      },
    });

    console.log(
      `[AdminRechargeService] 手动创建充值订单: ${orderNo}, 用户ID: ${userId}, 金额: ${amount}, 管理员ID: ${adminId}`
    );

    return {
      orderId: order.id,
      orderNo: order.orderNo,
      payUrl: result.payUrl,
      expireAt: order.expireAt!,
    };
  }

  /**
   * 查询上游状态
   * @depends 02.4-后台API接口清单.md 第4.3节 - 批量查询上游
   * @description 主动查询充值订单在上游支付通道的状态，支持补单
   * @param id 订单ID
   * @returns 查询结果
   */
  async queryUpstream(id: number): Promise<QueryUpstreamResult> {
    // 1. 查询订单
    const order = await prisma.rechargeOrder.findUnique({
      where: { id },
      include: {
        channel: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (!order) {
      return {
        id,
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: '订单不存在' },
      };
    }

    // 2. 已完成的订单直接返回当前状态
    if (order.status === 'PAID') {
      return {
        id,
        success: true,
        upstreamStatus: 'PAID',
        compensated: false,
      };
    }

    // 3. 获取支付通道
    const channel = order.channel;
    if (!channel) {
      return {
        id,
        success: false,
        error: { code: 'CHANNEL_NOT_FOUND', message: '支付通道不存在' },
      };
    }

    const paymentChannel = await paymentChannelManager.getChannel(channel.code);
    if (!paymentChannel) {
      return {
        id,
        success: false,
        error: { code: 'CHANNEL_ERROR', message: '支付通道配置错误' },
      };
    }

    // 4. 调用支付通道查询
    // 依据：uzpay.md - UZPAY 需要通过回调数据判断状态（没有独立的查询接口）
    // 依据：lwpay.md 第五节 - LWPAY 有独立的查询接口
    try {
      const queryResult = await paymentChannel.queryCollectionOrder(
        order.orderNo,
        order.callbackData, // 传入回调数据，供 UZPAY 使用
        order.thirdOrderNo || undefined // JYPAY 查询需要平台订单号
      );

      if (!queryResult.success) {
        return {
          id,
          success: false,
          error: {
            code: queryResult.errorCode || 'QUERY_FAILED',
            message: queryResult.errorMessage || '查询上游失败',
          },
        };
      }

      // 5. 判断是否需要补单
      // 依据：开发文档.md 16.1节 - 补单逻辑
      // 条件：上游返回支付成功，但本地订单状态为待支付/已取消
      if (
        queryResult.status === CollectionStatus.SUCCESS &&
        (order.status === 'PENDING_PAYMENT' || order.status === 'CANCELLED')
      ) {
        // 执行补单
        await this.compensateOrder(
          order.id,
          queryResult.amount || order.amount.toString(),
          queryResult.thirdOrderNo,
          channel.code
        );

        console.log(
          `[AdminRechargeService] 补单成功: ${order.orderNo}, 原状态: ${order.status}`
        );

        return {
          id,
          success: true,
          upstreamStatus: 'PAID',
          compensated: true,
        };
      }

      // 6. 返回上游状态（无需补单）
      const statusMap: Record<CollectionStatus, string> = {
        [CollectionStatus.SUCCESS]: 'PAID',
        [CollectionStatus.NOTPAY]: 'PENDING',
        [CollectionStatus.PENDING]: 'PENDING',
        [CollectionStatus.FAILED]: 'FAILED',
        [CollectionStatus.UNKNOWN]: 'UNKNOWN',
      };

      return {
        id,
        success: true,
        upstreamStatus: statusMap[queryResult.status] || 'UNKNOWN',
        compensated: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '查询异常';
      console.error(`[AdminRechargeService] 查询上游异常: ${order.orderNo}`, error);
      return {
        id,
        success: false,
        error: { code: 'QUERY_ERROR', message },
      };
    }
  }

  /**
   * 批量查询上游状态
   * @depends 02.4-后台API接口清单.md 第4.3节 - 批量查询上游
   * @param ids 订单ID列表
   * @returns 批量查询结果
   */
  async batchQueryUpstream(ids: number[]) {
    // 限制单次批量查询数量
    if (ids.length > 50) {
      throw new BusinessError(
        'BATCH_LIMIT_EXCEEDED',
        '单次批量查询不能超过50条',
        400
      );
    }

    const results: QueryUpstreamResult[] = [];
    let succeeded = 0;
    let failed = 0;

    // 逐个查询（避免并发过高导致支付通道限流）
    for (const id of ids) {
      const result = await this.queryUpstream(id);
      results.push(result);
      if (result.success) {
        succeeded++;
      } else {
        failed++;
      }
    }

    return {
      total: ids.length,
      succeeded,
      failed,
      results,
    };
  }

  /**
   * 补单处理
   * @description 依据：开发文档.md 16.1节 - 补单逻辑
   * @param orderId 订单ID
   * @param amount 实际支付金额
   * @param thirdOrderNo 第三方订单号
   * @param channelCode 通道代码
   */
  private async compensateOrder(
    orderId: number,
    amount: string,
    thirdOrderNo: string | undefined,
    channelCode: string
  ): Promise<void> {
    const actualAmount = new Decimal(amount);
    const callbackTime = new Date();

    // 使用事务处理：更新订单 + 增加余额 + 创建流水 + 发送通知
    await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. 获取订单信息
      const order = await tx.rechargeOrder.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      // 2. 更新订单状态
      // 注意：recharge_orders 表没有 remark 字段，补单信息记录在流水中
      await tx.rechargeOrder.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          actualAmount,
          thirdOrderNo: thirdOrderNo || order.thirdOrderNo,
          callbackAt: callbackTime,
        },
      });

      // 3. 增加用户可用余额
      const updatedUser = await tx.user.update({
        where: { id: order.userId },
        data: {
          availableBalance: { increment: actualAmount },
          hasRecharged: true,
        },
        select: { availableBalance: true },
      });

      // 4. 创建资金流水记录
      await tx.transaction.create({
        data: {
          userId: order.userId,
          type: 'RECHARGE',
          amount: actualAmount,
          balanceAfter: updatedUser.availableBalance,
          relatedOrderNo: order.orderNo,
          remark: `充值成功（补单），通道: ${channelCode}`,
        },
      });

      // 5. 发送站内通知
      await tx.notification.create({
        data: {
          userId: order.userId,
          title: 'تم الإيداع بنجاح',
          content: `تمت معالجة إيداعك بقيمة ${await formatNotificationAmount(actualAmount)} بنجاح.`,
          type: 'RECHARGE_SUCCESS',
        },
      });
    });

    // 6. 更新通道统计：todayRecharge 和 totalRecharge
    const order = await prisma.rechargeOrder.findUnique({
      where: { id: orderId },
    });
    if (order) {
      if (order.channelId) {
        await prisma.paymentChannel.update({
          where: { id: order.channelId },
          data: {
            todayRecharge: { increment: actualAmount },
            totalRecharge: { increment: actualAmount },
          },
        });
      }

      // 6.5 增加转盘机会（充值补单也需要赠送抽奖机会）
      try {
        const { getSystemTime } = await import('@/lib/config');
        const systemTime = await getSystemTime();
        const y = systemTime.getFullYear();
        const m = (systemTime.getMonth() + 1).toString().padStart(2, '0');
        const d = systemTime.getDate().toString().padStart(2, '0');
        const todayStr = `${y}-${m}-${d}`;

        await prisma.spinChance.upsert({
          where: { userId_chanceDate: { userId: order.userId, chanceDate: todayStr } },
          update: { rechargeChances: { increment: 1 } },
          create: {
            userId: order.userId,
            chanceDate: todayStr,
            rechargeChances: 1,
            inviteChances: 0,
            usedChances: 0,
          },
        });
      } catch (spinError) {
        console.error('[AdminRechargeService] 增加转盘机会失败:', spinError);
      }

      // 7. 清除用户相关缓存
      await deleteCache(CACHE_KEYS.USER.INFO(order.userId));
    }
  }

  /**
   * 获取全局配置
   */
  private async getGlobalConfig() {
    const configs = await prisma.globalConfig.findMany({
      where: {
        key: {
          in: ['recharge_timeout_minutes', 'site_domain'],
        },
      },
    });

    type ConfigItem = { key: string; value: unknown };
    const configMap = new Map<string, string>(
      configs.map((c: ConfigItem) => [c.key, String(c.value ?? '')])
    );

    return {
      rechargeTimeoutMinutes: parseInt(configMap.get('recharge_timeout_minutes') || '30'),
      siteDomain: configMap.get('site_domain') || '',
    };
  }
}

// 单例导出
export const adminRechargeOrderService = new AdminRechargeOrderService();
