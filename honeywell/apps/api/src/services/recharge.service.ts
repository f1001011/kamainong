/**
 * @file 充值服务
 * @description 处理充值订单创建、回调处理、订单查询等核心业务逻辑
 * @depends 开发文档/开发文档.md 第5节 - 充值系统
 * @depends 开发文档/05-后端服务/05.2-支付通道集成.md 第5节 - 业务服务层
 */

import { prisma } from '@/lib/prisma';
import { generateOrderNo, ORDER_TYPE } from '@/lib/order';
import {
  paymentChannelManager,
  CollectionParams,
  CollectionResult,
  CollectionCallbackData,
} from '@/lib/payment';
import { withLock, CACHE_KEYS, deleteCache } from '@/lib/redis';
import { Errors } from '@/lib/errors';
import { Decimal } from '@prisma/client/runtime/library';
import { formatNotificationAmount } from '@/lib/config';

/**
 * Prisma 事务客户端类型
 * @description 从 prisma.$transaction 方法签名中推断出的事务客户端类型
 */
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * 充值订单状态枚举
 * @description 与 Prisma schema 中的 RechargeStatus 保持一致
 */
type RechargeStatus = 'PENDING_PAYMENT' | 'PAID' | 'FAILED' | 'CANCELLED';

/**
 * 充值订单查询条件类型
 * @description 支持 Prisma 的过滤器语法
 */
interface RechargeOrderWhereInput {
  userId?: number;
  status?: RechargeStatus | { in: RechargeStatus[] };
}

/**
 * 创建充值订单的请求参数
 */
export interface CreateRechargeOrderParams {
  userId: number;
  channelId: number;
  amount: number;
  notifyUrl: string;
  callbackUrl: string;
}

/**
 * 创建充值订单的返回结果
 */
export interface CreateRechargeOrderResult {
  orderId: number;
  orderNo: string;
  payUrl: string;
  expireAt: Date;
}

/**
 * 充值服务类
 */
export class RechargeService {
  /**
   * 获取可用充值通道列表
   * @returns 支付通道列表
   */
  async getAvailableChannels() {
    const channels = await prisma.paymentChannel.findMany({
      where: {
        payEnabled: true,
        channelStatus: { in: ['NORMAL', 'WARNING'] },
      },
      select: {
        id: true,
        code: true,
        name: true,
        payEnabled: true,
        transferEnabled: true,
        minAmount: true,
        maxAmount: true,
        sortOrder: true,
        remark: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return channels;
  }

  /**
   * 获取充值通道列表及配置
   * @description 依据：02.3-前端API接口清单.md 第5.1节
   * @returns 通道列表和充值配置
   */
  async getChannelsWithConfig() {
    // 并行获取通道和配置
    const [channels, configItems] = await Promise.all([
      this.getAvailableChannels(),
      prisma.globalConfig.findMany({
        where: {
          key: {
            in: [
              'recharge_presets',
              'recharge_min_amount',
              'recharge_max_amount',
              'recharge_page_tips',
            ],
          },
        },
      }),
    ]);

    // 解析配置
    type ConfigItem = { key: string; value: unknown };
    const configMap = new Map(
      configItems.map((c: ConfigItem) => [c.key, c.value])
    );

    // 解析 recharge_presets（JSON 数组，数据库使用 snake_case 命名）
    // 默认值适用于 MAD（摩洛哥迪拉姆）：100 ~ 3000
    let presets: number[] = [100, 300, 500, 1000, 3000];
    const presetsValue = configMap.get('recharge_presets');
    if (presetsValue) {
      try {
        if (typeof presetsValue === 'string') {
          presets = JSON.parse(presetsValue);
        } else if (Array.isArray(presetsValue)) {
          presets = presetsValue as number[];
        }
      } catch {
        // 使用默认值
      }
    }

    return {
      channels,
      config: {
        rechargePresets: presets,
        rechargeMinAmount: parseFloat(String(configMap.get('recharge_min_amount') ?? '50000')),
        rechargeMaxAmount: parseFloat(String(configMap.get('recharge_max_amount') ?? '50000000')),
        rechargePageTips: String(configMap.get('recharge_page_tips') ?? ''),
      },
    };
  }

  /**
   * 创建充值订单
   * @depends 开发文档.md 5.1 充值流程
   * @param params 充值参数
   * @returns 创建结果
   */
  async createOrder(
    params: CreateRechargeOrderParams
  ): Promise<CreateRechargeOrderResult> {
    const { userId, channelId, amount, notifyUrl, callbackUrl } = params;

    // 1. 获取全局配置
    const globalConfig = await this.getGlobalConfig();
    const maxPending = globalConfig.rechargeMaxPending;
    const timeoutMinutes = globalConfig.rechargeTimeoutMinutes;
    const minAmount = globalConfig.rechargeMinAmount;
    const maxAmount = globalConfig.rechargeMaxAmount;

    // 2. 校验金额范围
    if (amount < minAmount || amount > maxAmount) {
      throw Errors.validationError(
        `充值金额必须在 ${minAmount} - ${maxAmount} 之间`
      );
    }

    // 3. 检查待支付订单数量
    const pendingCount = await prisma.rechargeOrder.count({
      where: {
        userId,
        status: 'PENDING_PAYMENT',
        expireAt: { gt: new Date() },
      },
    });

    if (pendingCount >= maxPending) {
      throw Errors.pendingOrderLimit(maxPending);
    }

    // 4. 获取支付通道配置
    const channel = await prisma.paymentChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel || !channel.payEnabled) {
      throw Errors.validationError('قناة الدفع غير متاحة');
    }

    // 5. 检查通道金额限制
    if (channel.minAmount && amount < channel.minAmount.toNumber()) {
      throw Errors.validationError(
        `该通道最低充值金额为 ${channel.minAmount}`
      );
    }
    if (channel.maxAmount && amount > channel.maxAmount.toNumber()) {
      throw Errors.validationError(
        `该通道最高充值金额为 ${channel.maxAmount}`
      );
    }

    // 6. 生成订单号
    const orderNo = generateOrderNo(ORDER_TYPE.RECHARGE);

    // 7. 调用支付通道创建订单
    const paymentChannel = await paymentChannelManager.getChannel(channel.code);
    if (!paymentChannel) {
      throw Errors.validationError('إعدادات قناة الدفع غير صحيحة');
    }

    const collectionParams: CollectionParams = {
      orderNo,
      amount: amount.toFixed(2),
      productName: 'إيداع',
      notifyUrl,
      callbackUrl,
    };

    const result: CollectionResult =
      await paymentChannel.createCollectionOrder(collectionParams);

    if (!result.success || !result.payUrl) {
      console.error('[RechargeService] 创建支付订单失败:', result);
      throw Errors.validationError(result.errorMessage || 'خطأ في إنشاء طلب الدفع');
    }

    // 8. 计算过期时间
    const expireAt = new Date();
    expireAt.setMinutes(expireAt.getMinutes() + timeoutMinutes);

    // 9. 保存订单到数据库
    const order = await prisma.rechargeOrder.create({
      data: {
        orderNo,
        userId,
        channelId,
        amount: new Decimal(amount),
        actualAmount: null, // 实际金额在回调时更新
        thirdOrderNo: result.thirdOrderNo || null,
        payUrl: result.payUrl,
        status: 'PENDING_PAYMENT',
        expireAt,
      },
    });

    return {
      orderId: order.id,
      orderNo: order.orderNo,
      payUrl: result.payUrl,
      expireAt: order.expireAt!,
    };
  }

  /**
   * 处理充值回调
   * @depends 开发文档.md 5.3 回调处理
   * @depends 05.2-支付通道集成.md 5.2 幂等性处理
   * @param channelCode 通道代码
   * @param payload 回调原始数据
   * @returns 处理结果和响应
   */
  async handleCallback(
    channelCode: string,
    payload: unknown
  ): Promise<{ success: boolean; response: { contentType: string; body: string } }> {
    // 1. 获取支付通道
    const channel = await paymentChannelManager.getChannel(channelCode);
    if (!channel) {
      console.error(`[RechargeService] 未知支付通道: ${channelCode}`);
      // UZPAY 返回小写 fail，其他通道（LWPAY/JYPAY）返回大写 FAIL
      const failBody = channelCode === 'UZPAY' ? 'fail' : 'FAIL';
      return {
        success: false,
        response: { contentType: 'text/plain', body: failBody },
      };
    }

    // 2. 验证回调数据（try-catch 防御回调数据畸形导致解析崩溃）
    let callbackData: CollectionCallbackData;
    try {
      callbackData = channel.verifyCollectionCallback(payload);
    } catch (verifyError) {
      console.error('[RechargeService] 回调数据解析异常:', verifyError);
      return {
        success: false,
        response: channel.getCollectionCallbackFailResponse(),
      };
    }

    if (!callbackData.valid) {
      console.error('[RechargeService] 回调签名验证失败:', callbackData);
      return {
        success: false,
        response: channel.getCollectionCallbackFailResponse(),
      };
    }

    // 3. 使用分布式锁处理，防止并发重复处理
    const lockKey = `${CACHE_KEYS.RECHARGE_CALLBACK_LOCK}:${callbackData.orderNo}`;

    try {
      await withLock(
        lockKey,
        10, // 10秒超时
        async () => {
          await this.processCallback(callbackData, channelCode);
        }
      );

      return {
        success: true,
        response: channel.getCollectionCallbackSuccessResponse(),
      };
    } catch (error) {
      console.error('[RechargeService] 处理回调异常:', error);
      // 如果是锁获取失败或处理异常，返回失败让支付平台重试
      return {
        success: false,
        response: channel.getCollectionCallbackFailResponse(),
      };
    }
  }

  /**
   * 处理回调核心逻辑
   * @description 依据：开发文档.md 第5.3节 - 回调处理
   * @param callbackData 回调数据
   * @param channelCode 通道代码
   * 
   * 处理流程：
   * 1. 查询订单（不存在返回错误）
   * 2. 幂等检查：订单状态已 PAID/FAILED 直接返回成功
   * 3. 更新订单状态：status = PAID, actualAmount = 实际金额, callbackAt = now()
   * 4. 入账到用户余额：使用原子更新 availableBalance += actualAmount
   * 5. 创建资金流水：type = RECHARGE
   * 6. 发送站内通知：充值成功通知
   * 
   * 特殊处理（依据：开发文档.md 16.1节）：
   * - 订单已超时取消，但后续收到成功回调 → 仍然给用户充值到账
   */
  private async processCallback(
    callbackData: CollectionCallbackData,
    channelCode: string
  ): Promise<void> {
    const { orderNo, thirdOrderNo, amount, success, paidAt, rawData } =
      callbackData;

    // 1. 查询订单
    const order = await prisma.rechargeOrder.findUnique({
      where: { orderNo },
    });

    if (!order) {
      console.error(`[RechargeService] 订单不存在: ${orderNo}`);
      throw new Error('الطلب غير موجود');
    }

    // 2. 幂等性检查：已处理过的订单直接返回
    // 依据：开发文档.md 5.3节 - 幂等性处理
    // 注意：只检查 PAID 和 FAILED 状态，CANCELLED 状态的订单收到成功回调时仍需处理！
    // 依据：开发文档.md 16.1节 - "订单已超时取消，但后续收到成功回调 → 仍然给用户充值到账"
    if (order.status === 'PAID' || order.status === 'FAILED') {
      console.log(`[RechargeService] 订单已处理: ${orderNo}, 状态: ${order.status}`);
      return;
    }

    // 3. 支付失败处理
    if (!success) {
      await prisma.rechargeOrder.update({
        where: { id: order.id },
        data: {
          status: 'FAILED',
          thirdOrderNo,
          callbackData: rawData as object,
          callbackAt: new Date(),
        },
      });
      console.log(`[RechargeService] 订单支付失败: ${orderNo}`);
      return;
    }

    // 4. 支付成功处理
    // 依据：开发文档.md 5.4节 - 以回调实际金额为准，而非订单申请金额
    const actualAmount = new Decimal(amount);
    // 纵深防御：paidAt 可能是 Invalid Date（各通道日期格式不一致），此处确保传入 Prisma 的是有效 Date
    const callbackTime = (paidAt && !isNaN(paidAt.getTime())) ? paidAt : new Date();

    // 5. 使用事务处理：更新订单 + 增加余额 + 创建流水 + 发送通知
    await prisma.$transaction(async (tx: TransactionClient) => {
      // 5.1 更新订单状态
      await tx.rechargeOrder.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          actualAmount,
          thirdOrderNo,
          callbackData: rawData as object,
          callbackAt: callbackTime,
        },
      });

      // 5.2 增加用户可用余额
      const updatedUser = await tx.user.update({
        where: { id: order.userId },
        data: {
          availableBalance: { increment: actualAmount },
          hasRecharged: true, // 标记用户已充值（用于有效邀请判断）
        },
        select: { availableBalance: true },
      });

      // 5.3 创建资金流水记录
      // 依据：02.1-数据库设计.md 第2.5节 - Transaction表
      await tx.transaction.create({
        data: {
          userId: order.userId,
          type: 'RECHARGE',
          amount: actualAmount, // 正数表示入账
          balanceAfter: updatedUser.availableBalance,
          relatedOrderNo: orderNo,
          remark: `充值成功，通道: ${channelCode}`,
        },
      });

      // 5.4 发送站内通知
      await tx.notification.create({
        data: {
          userId: order.userId,
          title: 'تم الإيداع بنجاح',
          content: `تمت معالجة إيداعك بقيمة ${await formatNotificationAmount(actualAmount)} بنجاح.`,
          type: 'RECHARGE_SUCCESS',
        },
      });

      // 5.5 增加转盘机会（充值一次 = 一次抽奖机会）
      try {
        const { getSystemTime } = await import('@/lib/config');
        const systemTime = await getSystemTime();
        const y = systemTime.getFullYear();
        const m = (systemTime.getMonth() + 1).toString().padStart(2, '0');
        const d = systemTime.getDate().toString().padStart(2, '0');
        const todayStr = `${y}-${m}-${d}`;

        await tx.spinChance.upsert({
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
        console.error('[RechargeService] 增加转盘机会失败:', spinError);
      }
    });

    // 6. 更新通道统计：todayRecharge 和 totalRecharge
    if (order.channelId) {
      await prisma.paymentChannel.update({
        where: { id: order.channelId },
        data: {
          todayRecharge: { increment: actualAmount },
          totalRecharge: { increment: actualAmount },
        },
      });
    }

    // 7. 清除用户相关缓存
    await deleteCache(CACHE_KEYS.USER.INFO(order.userId));

    console.log(
      `[RechargeService] 订单支付成功: ${orderNo}, 实际金额: ${actualAmount}, 通道: ${channelCode}`
    );
  }

  /**
   * 取消充值订单
   * @depends 开发文档.md 5.2 订单取消
   * @param userId 用户ID
   * @param orderId 订单ID
   */
  async cancelOrder(userId: number, orderId: number): Promise<void> {
    const order = await prisma.rechargeOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw Errors.orderNotFound();
    }

    // 只能取消自己的订单
    if (order.userId !== userId) {
      throw Errors.orderNotFound();
    }

    // 只能取消待支付状态的订单
    // 依据：02.3-前端API接口清单.md 5.5节 - 错误码 ORDER_STATUS_INVALID
    if (order.status !== 'PENDING_PAYMENT') {
      throw Errors.orderStatusInvalid();
    }

    await prisma.rechargeOrder.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        // 注意：schema 中没有 cancelledAt 字段，使用 updatedAt 自动更新
      },
    });

    // 依据：开发文档.md 5.2 - 取消订单不通知第三方，无需调用支付通道
  }

  /**
   * 获取用户充值订单列表
   * @param userId 用户ID
   * @param page 页码
   * @param pageSize 每页数量
   * @param status 订单状态过滤
   */
  async getOrders(
    userId: number,
    page: number,
    pageSize: number,
    status?: string
  ) {
    const where: RechargeOrderWhereInput = { userId };
    if (status) {
      // 依据：03.4.2-充值记录页.md 第103-105行
      // "已取消 Tab" 传递 CANCELLED 参数时，同时返回 FAILED 和 CANCELLED 状态
      // 因为两者对用户来说都是未成功的订单
      if (status === 'CANCELLED') {
        where.status = { in: ['CANCELLED', 'FAILED'] };
      } else {
        where.status = status as 'PENDING_PAYMENT' | 'PAID' | 'FAILED' | 'CANCELLED';
      }
    }

    const [list, total] = await Promise.all([
      prisma.rechargeOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          channel: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      }),
      prisma.rechargeOrder.count({ where }),
    ]);

    return {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取订单详情
   * @param userId 用户ID
   * @param orderId 订单ID
   */
  async getOrderDetail(userId: number, orderId: number) {
    const order = await prisma.rechargeOrder.findUnique({
      where: { id: orderId },
      include: {
        channel: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!order) {
      throw Errors.orderNotFound();
    }

    // 只能查看自己的订单
    if (order.userId !== userId) {
      throw Errors.orderNotFound();
    }

    return order;
  }

  /**
   * 获取全局配置
   */
  private async getGlobalConfig() {
    const configs = await prisma.globalConfig.findMany({
      where: {
        key: {
          in: [
            'recharge_max_pending',
            'recharge_timeout_minutes',
            'recharge_min_amount',
            'recharge_max_amount',
          ],
        },
      },
    });

    // 定义配置项类型
    type ConfigItem = { key: string; value: unknown };
    const configMap = new Map<string, string>(
      configs.map((c: ConfigItem) => [c.key, String(c.value ?? '')] as [string, string])
    );

    // 从 Map 获取值，提供默认值（使用 snake_case 数据库键名）
    const getValue = (key: string, defaultValue: string): string => {
      return configMap.get(key) || defaultValue;
    };

    return {
      rechargeMaxPending: parseInt(getValue('recharge_max_pending', '5')),
      rechargeTimeoutMinutes: parseInt(getValue('recharge_timeout_minutes', '30')),
      rechargeMinAmount: parseFloat(getValue('recharge_min_amount', '50000')),
      rechargeMaxAmount: parseFloat(getValue('recharge_max_amount', '50000000')),
    };
  }
}

// 单例导出
export const rechargeService = new RechargeService();
