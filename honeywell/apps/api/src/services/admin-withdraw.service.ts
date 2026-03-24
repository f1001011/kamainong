/**
 * @file 后台提现订单管理服务
 * @description 实现提现订单审核、查询、批量操作等管理功能
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第5节 - 提现订单接口
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.3节 - WithdrawOrder表
 *
 * 核心业务规则：
 * 1. 审核通过自动调用代付通道
 * 2. 拒绝时冻结余额退回可用余额
 * 3. 批量操作独立事务，部分失败不影响其他
 * 4. 记录审核人和审核时间
 */

import { prisma } from '@/lib/prisma';
import { withdrawService } from './withdraw.service';
import {
  paymentChannelManager,
  TransferParams,
  TransferStatus,
} from '@/lib/payment';
import { Errors } from '@/lib/errors';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma, WithdrawStatus } from '@honeywell/database';
import { deleteCache, CACHE_KEYS, withLock, LOCK_TTL } from '@/lib/redis';
import { formatNotificationAmount } from '@/lib/config';

// ================================
// 类型定义
// ================================

/**
 * Prisma 事务客户端类型
 */
type TransactionClient = Prisma.TransactionClient;

/**
 * 银行卡快照数据结构
 * 注意：accountNo、documentNo 在快照中为解密后的明文
 */
interface BankCardSnapshot {
  bankCode: string;
  bankName: string;
  accountNo: string;
  accountNoMask: string;
  accountName: string;
  phone: string;
  documentType: string;
  documentNo: string;
  snapshotAt: string;
}

/**
 * 提现订单列表查询参数
 */
export interface WithdrawOrderListParams {
  page?: number;
  pageSize?: number;
  orderNo?: string;
  userId?: number;
  userPhone?: string;
  bankCode?: string;
  accountNo?: string;
  status?: WithdrawStatus;
  reviewedBy?: number;
  startDate?: string;
  endDate?: string;
  amountMin?: number;
  amountMax?: number;
  isAutoApproved?: boolean;
}

/**
 * 批量操作结果
 */
export interface BatchOperationResult {
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{
    id: number;
    success: boolean;
    error?: {
      code: string;
      message: string;
    };
  }>;
}

// ================================
// 管理员提现订单服务
// ================================

export class AdminWithdrawService {
  /**
   * 获取提现订单列表（含summary统计）
   * @depends 02.4-后台API接口清单.md 5.1 提现订单列表
   */
  async getOrderList(params: WithdrawOrderListParams) {
    const {
      page = 1,
      pageSize = 20,
      orderNo,
      userId,
      userPhone,
      bankCode,
      accountNo,
      status,
      reviewedBy,
      startDate,
      endDate,
      amountMin,
      amountMax,
      isAutoApproved,
    } = params;

    // 构建查询条件
    const where: Prisma.WithdrawOrderWhereInput = {};

    if (orderNo) {
      where.orderNo = { contains: orderNo };
    }

    if (userId) {
      where.userId = userId;
    }

    if (userPhone) {
      where.user = { phone: { contains: userPhone } };
    }

    // 银行卡筛选使用快照字段
    if (bankCode || accountNo) {
      // 使用 JSON 路径查询（MySQL支持）
      const jsonConditions: Prisma.WithdrawOrderWhereInput[] = [];
      if (bankCode) {
        jsonConditions.push({
          bankCardSnapshot: {
            path: '$.bankCode',
            equals: bankCode,
          },
        });
      }
      if (accountNo) {
        jsonConditions.push({
          bankCardSnapshot: {
            path: '$.accountNo',
            string_contains: accountNo,
          },
        });
      }
      if (jsonConditions.length > 0) {
        where.AND = jsonConditions;
      }
    }

    if (status) {
      where.status = status;
    }

    if (reviewedBy) {
      where.reviewedBy = reviewedBy;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    if (amountMin !== undefined || amountMax !== undefined) {
      where.amount = {};
      if (amountMin !== undefined) {
        where.amount.gte = new Decimal(amountMin);
      }
      if (amountMax !== undefined) {
        where.amount.lte = new Decimal(amountMax);
      }
    }

    if (isAutoApproved !== undefined) {
      where.isAutoApproved = isAutoApproved;
    }

    // 并行查询列表、总数、待审核统计、代付失败统计
    const [list, total, pendingStats, payoutFailedStats] = await Promise.all([
      prisma.withdrawOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          orderNo: true,
          userId: true,
          amount: true,
          fee: true,
          actualAmount: true,
          status: true,
          bankCardSnapshot: true,
          isAutoApproved: true,
          createIp: true,
          createdAt: true,
          reviewedBy: true,
          reviewedAt: true,
          channelOrderNo: true,
          thirdOrderNo: true,
          retryCount: true,
          payoutFailReason: true,
          user: {
            select: {
              phone: true,
            },
          },
          channel: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      }),
      prisma.withdrawOrder.count({ where }),
      // 待审核统计
      prisma.withdrawOrder.aggregate({
        where: { status: 'PENDING_REVIEW' },
        _count: { id: true },
        _sum: { actualAmount: true },
      }),
      // 代付失败待处理统计
      prisma.withdrawOrder.aggregate({
        where: { status: 'PAYOUT_FAILED' },
        _count: { id: true },
        _sum: { actualAmount: true },
      }),
    ]);

    // 批量查询审核人信息（reviewedBy → Admin 无 Prisma 关联，需手动查询）
    const reviewerIds = [...new Set(list.map(o => o.reviewedBy).filter((id): id is number => id !== null))];
    const reviewerMap: Record<number, string> = {};
    if (reviewerIds.length > 0) {
      const admins = await prisma.admin.findMany({
        where: { id: { in: reviewerIds } },
        select: { id: true, nickname: true, username: true },
      });
      for (const admin of admins) {
        reviewerMap[admin.id] = admin.nickname || admin.username;
      }
    }

    // 格式化列表数据
    const formattedList = list.map((order) => {
      const snapshot = order.bankCardSnapshot as BankCardSnapshot | null;
      return {
        id: order.id,
        orderNo: order.orderNo,
        userId: order.userId,
        userPhone: order.user.phone,
        amount: order.amount.toFixed(2),
        fee: order.fee.toFixed(2),
        actualAmount: order.actualAmount.toFixed(2),
        status: order.status,
        bankCardSnapshot: snapshot
          ? {
              bankName: snapshot.bankName,
              accountNoMask: snapshot.accountNoMask,
              accountName: snapshot.accountName,
            }
          : null,
        isAutoApproved: order.isAutoApproved,
        createIp: order.createIp,
        createdAt: order.createdAt.toISOString(),
        reviewedBy: order.reviewedBy,
        reviewedByName: order.reviewedBy ? (reviewerMap[order.reviewedBy] || null) : null,
        reviewedAt: order.reviewedAt?.toISOString() || null,
        // 代付通道信息
        channelOrderNo: order.channelOrderNo || null,
        thirdOrderNo: order.thirdOrderNo || null,
        retryCount: order.retryCount,
        payoutFailReason: order.payoutFailReason,
        channelName: order.channel?.name || null,
        channelCode: order.channel?.code || null,
      };
    });

    return {
      list: formattedList,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      summary: {
        pendingCount: pendingStats._count.id,
        pendingAmount: (pendingStats._sum.actualAmount || new Decimal(0)).toFixed(2),
        payoutFailedCount: payoutFailedStats._count.id,
        payoutFailedAmount: (payoutFailedStats._sum.actualAmount || new Decimal(0)).toFixed(2),
      },
    };
  }

  /**
   * 获取提现订单详情（含完整银行卡快照）
   * @depends 02.4-后台API接口清单.md 5.2 提现订单详情
   */
  async getOrderDetail(orderId: number) {
    const order = await prisma.withdrawOrder.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            phone: true,
          },
        },
        channel: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!order) {
      throw Errors.adminOrderNotFound();
    }

    // 获取审核人信息
    let reviewedByName: string | null = null;
    if (order.reviewedBy) {
      const admin = await prisma.admin.findUnique({
        where: { id: order.reviewedBy },
        select: { nickname: true, username: true },
      });
      reviewedByName = admin?.nickname || admin?.username || null;
    }

    const snapshot = order.bankCardSnapshot as BankCardSnapshot | null;

    return {
      id: order.id,
      orderNo: order.orderNo,
      userId: order.userId,
      userPhone: order.user.phone,
      amount: order.amount.toFixed(2),
      fee: order.fee.toFixed(2),
      actualAmount: order.actualAmount.toFixed(2),
      status: order.status,
      rejectReason: order.rejectReason,
      isAutoApproved: order.isAutoApproved,
      autoApproveReason: order.autoApproveReason,
      bankCardSnapshot: snapshot
        ? {
            bankCode: snapshot.bankCode,
            bankName: snapshot.bankName,
            accountNo: snapshot.accountNo, // 完整账号（后台可见）
            accountNoMask: snapshot.accountNoMask,
            accountName: snapshot.accountName,
            phone: snapshot.phone,
            documentType: snapshot.documentType,
            documentNo: snapshot.documentNo,
            snapshotAt: snapshot.snapshotAt,
          }
        : null,
      thirdOrderNo: order.thirdOrderNo,
      channelName: order.channel?.name || null,
      channelId: order.channelId,
      createIp: order.createIp,
      callbackData: order.callbackData,
      callbackAt: order.callbackAt?.toISOString() || null,
      reviewedBy: order.reviewedBy,
      reviewedByName,
      reviewedAt: order.reviewedAt?.toISOString() || null,
      createdAt: order.createdAt.toISOString(),
      // 代付重试相关
      retryCount: order.retryCount,
      payoutFailReason: order.payoutFailReason,
      payoutAttempts: order.payoutAttempts,
    };
  }

  /**
   * 审核通过（调用代付通道）
   * @depends 02.4-后台API接口清单.md 5.3 审核通过
   */
  async approveOrder(orderId: number, adminId: number): Promise<void> {
    // 1. 获取订单信息
    const order = await prisma.withdrawOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw Errors.adminOrderNotFound();
    }

    // 2. 检查订单状态
    if (order.status !== 'PENDING_REVIEW') {
      throw Errors.adminOrderStatusInvalid();
    }

    // 3. 更新订单状态为已通过
    await prisma.withdrawOrder.update({
      where: { id: orderId },
      data: {
        status: 'APPROVED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    console.log(
      `[AdminWithdrawService] 提现订单审核通过: ${order.orderNo}, 管理员ID: ${adminId}`
    );

    // 4. 异步调用代付（不阻塞返回）
    withdrawService.submitTransfer(orderId).catch((err) => {
      console.error(
        `[AdminWithdrawService] 代付请求失败: ${order.orderNo}, 错误: ${err.message}`
      );
    });
  }

  /**
   * 审核拒绝（退回余额）
   * @depends 02.4-后台API接口清单.md 5.4 审核拒绝
   */
  async rejectOrder(
    orderId: number,
    adminId: number,
    reason?: string
  ): Promise<void> {
    // 1. 获取订单信息
    const order = await prisma.withdrawOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw Errors.adminOrderNotFound();
    }

    // 2. 检查订单状态
    if (order.status !== 'PENDING_REVIEW') {
      throw Errors.adminOrderStatusInvalid();
    }

    // 3. 使用事务：更新订单状态 + 退回余额
    await prisma.$transaction(async (tx: TransactionClient) => {
      // 3.1 更新订单状态为已拒绝
      await tx.withdrawOrder.update({
        where: { id: orderId },
        data: {
          status: 'REJECTED',
          rejectReason: reason || '审核不通过',
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      // 3.2 退回余额：冻结余额转回可用余额
      const updatedUser = await tx.user.update({
        where: { id: order.userId },
        data: {
          availableBalance: { increment: order.amount },
          frozenBalance: { decrement: order.amount },
        },
        select: { availableBalance: true },
      });

      // 3.3 记录资金流水（提现退回）
      await tx.transaction.create({
        data: {
          userId: order.userId,
          type: 'WITHDRAW_REFUND',
          amount: order.amount, // 正数表示退回
          balanceAfter: updatedUser.availableBalance,
          relatedOrderNo: order.orderNo,
          remark: `提现审核拒绝: ${reason || '审核不通过'}`,
        },
      });

      // 3.4 发送站内通知
      await tx.notification.create({
        data: {
          userId: order.userId,
          title: 'تم رفض السحب',
          content: `تم رفض طلب السحب الخاص بك بقيمة ${await formatNotificationAmount(order.amount)}. ${reason ? `السبب: ${reason}` : ''} تم إعادة المبلغ إلى رصيدك المتاح.`,
          type: 'WITHDRAW_REJECTED',
        },
      });
    });

    // 4. 清除用户缓存
    await deleteCache(CACHE_KEYS.USER.INFO(order.userId));

    console.log(
      `[AdminWithdrawService] 提现订单审核拒绝: ${order.orderNo}, 管理员ID: ${adminId}, 原因: ${reason || '无'}`
    );
  }

  /**
   * 查询上游状态
   * @depends 02.4-后台API接口清单.md 5.5 查询上游状态
   * @description 主动查询代付通道订单状态，用于排查问题
   */
  async queryUpstream(orderId: number): Promise<{
    upstreamStatus: string;
    thirdOrderNo: string | null;
    compensated: boolean;
    rawData?: object;
  }> {
    // 1. 获取订单信息
    const order = await prisma.withdrawOrder.findUnique({
      where: { id: orderId },
      include: {
        channel: true,
      },
    });

    if (!order) {
      throw Errors.adminOrderNotFound();
    }

    // 只能查询已提交代付的订单
    // channelId 为空表示代付从未成功提交（如免审核通过但通道异常导致 submitTransfer 失败）
    if (!order.channelId) {
      throw Errors.validationError('该订单尚未提交代付，可能是代付通道异常导致提交失败，请尝试重试代付');
    }

    // thirdOrderNo 可能为空（部分通道通过回调返回），但 channelOrderNo 必须存在才能查询
    if (!order.channelOrderNo && !order.thirdOrderNo) {
      throw Errors.validationError('该订单缺少通道订单号，无法查询上游状态');
    }

    // 2. 获取支付通道
    const channel = await paymentChannelManager.getChannel(order.channel!.code);
    if (!channel) {
      throw Errors.adminNoAvailableChannel();
    }

    // 3. 查询上游状态（使用 channelOrderNo，重试后 channelOrderNo 可能与 orderNo 不同）
    const queryOrderNo = order.channelOrderNo || order.orderNo;
    const queryResult = await channel.queryTransferOrder(queryOrderNo);

    // 4. 如果本地状态与上游状态不一致，且上游已成功/失败，进行补偿处理
    let compensated = false;
    if (queryResult.success) {
      if (
        queryResult.status === TransferStatus.SUCCESS &&
        order.status === 'APPROVED'
      ) {
        // 上游成功但本地还是已通过状态，补偿处理
        await this.compensateSuccess(order);
        compensated = true;
      } else if (
        queryResult.status === TransferStatus.FAILED &&
        order.status === 'APPROVED'
      ) {
        // 上游失败但本地还是已通过状态，补偿处理
        await this.compensateFailed(order, queryResult.failReason || '代付失败');
        compensated = true;
      }
    }

    return {
      upstreamStatus: queryResult.status || 'UNKNOWN',
      thirdOrderNo: queryResult.thirdOrderNo || null,
      compensated,
      rawData: queryResult.rawResponse as object | undefined,
    };
  }

  /**
   * 批量审核通过
   * @depends 02.4-后台API接口清单.md 5.5 批量审核通过
   */
  async batchApprove(
    ids: number[],
    adminId: number
  ): Promise<BatchOperationResult> {
    const results: BatchOperationResult['results'] = [];
    let succeeded = 0;
    let failed = 0;

    // 每个订单独立事务处理
    for (const id of ids) {
      try {
        await this.approveOrder(id, adminId);
        results.push({ id, success: true });
        succeeded++;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '操作失败';
        results.push({
          id,
          success: false,
          error: {
            code: 'ORDER_OPERATION_FAILED',
            message,
          },
        });
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
   * 批量审核拒绝
   * @depends 02.4-后台API接口清单.md 5.6 批量审核拒绝
   */
  async batchReject(
    ids: number[],
    adminId: number,
    reason?: string
  ): Promise<BatchOperationResult> {
    const results: BatchOperationResult['results'] = [];
    let succeeded = 0;
    let failed = 0;

    // 每个订单独立事务处理
    for (const id of ids) {
      try {
        await this.rejectOrder(id, adminId, reason);
        results.push({ id, success: true });
        succeeded++;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '操作失败';
        results.push({
          id,
          success: false,
          error: {
            code: 'ORDER_OPERATION_FAILED',
            message,
          },
        });
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
   * 驳回代付失败订单（退回余额）
   * @description PAYOUT_FAILED → FAILED，退回余额到可用余额
   * @param orderId 订单ID
   * @param adminId 管理员ID
   * @param reason 驳回原因（选填）
   */
  async dismissPayoutFailed(
    orderId: number,
    adminId: number,
    reason?: string
  ): Promise<void> {
    const lockKey = `lock:withdraw:admin:${orderId}`;

    await withLock(lockKey, 10, async () => {
      // 1. 获取订单信息
      const order = await prisma.withdrawOrder.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw Errors.adminOrderNotFound();
      }

      // 2. 检查订单状态必须为 PAYOUT_FAILED
      if (order.status !== 'PAYOUT_FAILED') {
        throw Errors.validationError('只能驳回代付失败状态的订单');
      }

      const dismissReason = reason || '管理员驳回代付失败订单';

      // 3. 事务：更新状态 + 退回余额 + 资金流水 + 通知
      await prisma.$transaction(async (tx: TransactionClient) => {
        // 3.1 更新订单状态为 FAILED（终态）
        await tx.withdrawOrder.update({
          where: { id: orderId },
          data: {
            status: 'FAILED',
            rejectReason: dismissReason,
            reviewedBy: adminId,
            reviewedAt: new Date(),
          },
        });

        // 3.2 退回余额：冻结余额 → 可用余额
        const updatedUser = await tx.user.update({
          where: { id: order.userId },
          data: {
            availableBalance: { increment: order.amount },
            frozenBalance: { decrement: order.amount },
          },
          select: { availableBalance: true },
        });

        // 3.3 记录资金流水（提现退回）
        await tx.transaction.create({
          data: {
            userId: order.userId,
            type: 'WITHDRAW_REFUND',
            amount: order.amount, // 正数表示退回
            balanceAfter: updatedUser.availableBalance,
            relatedOrderNo: order.orderNo,
            remark: `代付失败驳回退款: ${dismissReason}`,
          },
        });

        // 3.4 发送站内通知（提现失败退款）
        await tx.notification.create({
          data: {
            userId: order.userId,
            title: 'فشل السحب',
            content: `فشل سحبك بقيمة ${await formatNotificationAmount(order.amount)}. تم إعادة المبلغ إلى رصيدك المتاح.`,
            type: 'WITHDRAW_FAILED',
          },
        });
      });

      // 4. 清除用户缓存
      await deleteCache(CACHE_KEYS.USER.INFO(order.userId));

      console.log(
        `[AdminWithdrawService] 驳回代付失败订单: ${order.orderNo}, 管理员ID: ${adminId}, 原因: ${dismissReason}`
      );
    });
  }

  /**
   * 重试代付（选择新通道）
   * @description PAYOUT_FAILED → APPROVED，使用指定通道重新提交代付
   * @param orderId 订单ID
   * @param adminId 管理员ID
   * @param targetChannelId 目标通道ID
   */
  async retryPayout(
    orderId: number,
    adminId: number,
    targetChannelId: number
  ): Promise<void> {
    const lockKey = `lock:withdraw:admin:${orderId}`;

    await withLock(lockKey, 10, async () => {
      // 1. 获取订单信息
      const order = await prisma.withdrawOrder.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw Errors.adminOrderNotFound();
      }

      // 2. 检查订单状态：PAYOUT_FAILED 或 APPROVED（免审核通过但代付提交失败的场景）
      if (order.status !== 'PAYOUT_FAILED' && order.status !== 'APPROVED') {
        throw Errors.validationError('只能重试代付失败或已通过状态的订单');
      }

      // 3. 检查重试次数（最多 5 次）
      if (order.retryCount >= 5) {
        throw Errors.validationError('已达到最大重试次数(5次)，请选择驳回退款');
      }

      // 4. 验证目标通道
      const targetChannel = await prisma.paymentChannel.findUnique({
        where: { id: targetChannelId },
      });

      if (!targetChannel) {
        throw Errors.validationError('目标通道不存在');
      }

      if (!targetChannel.transferEnabled) {
        throw Errors.validationError('目标通道代付未启用');
      }

      if (targetChannel.channelStatus === 'ERROR') {
        throw Errors.validationError('目标通道状态异常');
      }

      // 5. 更新订单状态为 APPROVED，准备重新提交
      await prisma.withdrawOrder.update({
        where: { id: orderId },
        data: {
          status: 'APPROVED',
          channelId: targetChannelId,
          thirdOrderNo: null,     // 清空第三方订单号（等待新回调）
          payoutFailReason: null,  // 清空失败原因
          retryCount: { increment: 1 },
          callbackData: { cleared: true },  // 使用空对象标记已清空（Prisma Json 类型不接受 null）
          callbackAt: null,                 // 清空旧回调时间
        },
      });

      console.log(
        `[AdminWithdrawService] 重试代付: ${order.orderNo}, 新通道: ${targetChannel.code}(${targetChannel.name}), 管理员ID: ${adminId}, 重试次数: ${order.retryCount + 1}`
      );

      // 6. 异步调用代付（不阻塞返回）
      withdrawService.submitTransfer(orderId, targetChannel.code).catch((err) => {
        console.error(
          `[AdminWithdrawService] 重试代付请求失败: ${order.orderNo}, 错误: ${err.message}`
        );
      });
    });
  }

  /**
   * 获取可用的代付通道列表
   * @description 返回所有启用代付的通道，供管理员选择重试通道
   * @param excludeChannelId 排除的通道ID（可选，用于标记当前失败通道）
   */
  async getAvailableTransferChannels(excludeChannelId?: number) {
    const channels = await prisma.paymentChannel.findMany({
      where: {
        transferEnabled: true,
        channelStatus: { in: ['NORMAL', 'WARNING'] },
      },
      select: {
        id: true,
        code: true,
        name: true,
        channelStatus: true,
        balance: true,
        balanceUpdatedAt: true,
        hourlySuccessRate: true,
        weeklySuccessRate: true,
        transferFeeRate: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return channels.map((ch) => ({
      id: ch.id,
      code: ch.code,
      name: ch.name,
      channelStatus: ch.channelStatus,
      balance: ch.balance?.toFixed(2) || null,
      balanceUpdatedAt: ch.balanceUpdatedAt?.toISOString() || null,
      hourlySuccessRate: ch.hourlySuccessRate?.toFixed(2) || null,
      weeklySuccessRate: ch.weeklySuccessRate?.toFixed(2) || null,
      transferFeeRate: ch.transferFeeRate?.toFixed(2) || null,
      isCurrentFailed: excludeChannelId ? ch.id === excludeChannelId : false,
    }));
  }

  // ================================
  // 私有方法
  // ================================

  /**
   * 补偿处理：上游成功
   * @description 当查询上游状态发现代付成功，但本地订单仍是 APPROVED 状态时调用
   */
  private async compensateSuccess(
    order: Prisma.WithdrawOrderGetPayload<{
      include: { channel: true };
    }>
  ): Promise<void> {
    await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. 更新订单状态为已完成
      await tx.withdrawOrder.update({
        where: { id: order.id },
        data: {
          status: 'COMPLETED',
          callbackAt: new Date(),
          paidAt: new Date(),
        },
      });

      // 2. 扣减冻结余额
      await tx.user.update({
        where: { id: order.userId },
        data: {
          frozenBalance: { decrement: order.amount },
        },
      });

      // 3. 记录资金流水
      const user = await tx.user.findUnique({
        where: { id: order.userId },
        select: { availableBalance: true },
      });

      if (user) {
        await tx.transaction.create({
          data: {
            userId: order.userId,
            type: 'WITHDRAW_SUCCESS',
            amount: new Decimal(-order.actualAmount.toNumber()),
            balanceAfter: user.availableBalance,
            relatedOrderNo: order.orderNo,
            remark: `提现成功（补偿），手续费 ${await formatNotificationAmount(order.fee)}`,
          },
        });
      }

      // 4. 发送站内通知
      await tx.notification.create({
        data: {
          userId: order.userId,
          title: 'تم السحب بنجاح',
          content: `تمت معالجة سحبك بقيمة ${await formatNotificationAmount(order.actualAmount)} بنجاح.`,
          type: 'WITHDRAW_COMPLETED',
        },
      });
    });

    // 更新通道统计：todayWithdraw 和 totalWithdraw
    if (order.channelId) {
      await prisma.paymentChannel.update({
        where: { id: order.channelId },
        data: {
          todayWithdraw: { increment: order.actualAmount },
          totalWithdraw: { increment: order.actualAmount },
        },
      });
    }

    // 清除用户缓存
    await deleteCache(CACHE_KEYS.USER.INFO(order.userId));

    console.log(
      `[AdminWithdrawService] 补偿处理成功: ${order.orderNo}`
    );
  }

  /**
   * 补偿处理：上游失败
   * @description 当查询上游状态发现代付失败，但本地订单仍是 APPROVED 状态时调用
   * 改为 PAYOUT_FAILED 状态，不退回余额，等待管理员决策
   */
  private async compensateFailed(
    order: Prisma.WithdrawOrderGetPayload<{
      include: { channel: true };
    }>,
    reason: string
  ): Promise<void> {
    // 构建尝试记录
    const existingAttempts = (order as unknown as { payoutAttempts?: unknown[] }).payoutAttempts || [];
    const updatedAttempts = [...(existingAttempts as unknown[])];
    if (updatedAttempts.length > 0) {
      (updatedAttempts[updatedAttempts.length - 1] as Record<string, unknown>).status = 'FAILED';
      (updatedAttempts[updatedAttempts.length - 1] as Record<string, unknown>).failReason = reason;
      (updatedAttempts[updatedAttempts.length - 1] as Record<string, unknown>).callbackAt = new Date().toISOString();
    }

    // 更新为 PAYOUT_FAILED，不退回余额
    await prisma.withdrawOrder.update({
      where: { id: order.id },
      data: {
        status: 'PAYOUT_FAILED',
        payoutFailReason: reason,
        callbackAt: new Date(),
        payoutAttempts: updatedAttempts as object,
      },
    });

    console.log(
      `[AdminWithdrawService] 补偿处理 → PAYOUT_FAILED: ${order.orderNo}, 原因: ${reason}, 余额保持冻结`
    );
  }
}

// 单例导出
export const adminWithdrawService = new AdminWithdrawService();
