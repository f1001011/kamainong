/**
 * @file 提现订单状态轮询任务
 * @description 主动查询上游代付通道，补偿回调丢失的提现订单
 * @depends 开发文档/05-后端服务/05.3-定时任务.md - 定时任务规范
 * @depends 开发文档/开发文档.md 第6节 - 提现系统
 *
 * 核心规则：
 * 1. 扫描 status = 'APPROVED' 且 channelId 不为空（已提交代付）且更新超过5分钟的提现订单
 * 2. 逐个向上游代付通道查询真实状态
 * 3. 上游已成功 → 执行补偿（扣减冻结余额 + 标记完成）
 * 4. 上游已失败 → 标记为 PAYOUT_FAILED，等待管理员决策
 * 5. 上游仍处理中 → 跳过，等待下次轮询
 * 6. 每次最多处理30单，避免超时
 */

import { prisma } from '@/lib/prisma';
import {
  paymentChannelManager,
  TransferStatus,
} from '@/lib/payment';
import { CACHE_KEYS, deleteCache } from '@/lib/redis';
import { Decimal } from '@prisma/client/runtime/library';
import type { TaskResult } from '@/lib/task-lock';

/**
 * 提现状态轮询任务结果
 */
export interface WithdrawStatusPollResult extends TaskResult {
  processedCount: number;
  completedCount: number;
  payoutFailedCount: number;
  skippedCount: number;
}

/**
 * Prisma 事务客户端类型
 */
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * 提现订单状态轮询任务
 *
 * @description 主动查询上游代付通道订单状态，补偿回调丢失的订单
 *
 * 处理流程：
 * 1. 查询已通过且已提交代付、更新超过5分钟的提现订单
 * 2. 逐个查询上游代付状态
 * 3. 根据上游状态执行补偿或标记失败
 *
 * @returns 处理结果统计
 */
export async function runWithdrawStatusPollJob(): Promise<WithdrawStatusPollResult> {
  const now = new Date();
  // 只查询更新超过5分钟的订单，避免干扰正常回调流程
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  // 只查询10天内的订单
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

  // 1. 查询待轮询的提现订单
  // 条件：APPROVED + channelId 不为空（已提交代付） + 更新超过5分钟
  const pendingOrders = await prisma.withdrawOrder.findMany({
    where: {
      status: 'APPROVED',
      channelId: { not: null },
      updatedAt: {
        gte: tenDaysAgo,
        lte: fiveMinutesAgo,
      },
    },
    include: {
      channel: {
        select: { id: true, code: true, name: true },
      },
    },
    orderBy: { updatedAt: 'asc' },
    take: 30, // 每次最多处理30单
  });

  if (pendingOrders.length === 0) {
    return { processedCount: 0, completedCount: 0, payoutFailedCount: 0, skippedCount: 0 };
  }

  console.log(`[WithdrawStatusPoll] 发现 ${pendingOrders.length} 个待查询提现订单`);

  let completedCount = 0;
  let payoutFailedCount = 0;
  let skippedCount = 0;

  // 2. 逐个查询上游状态
  for (const order of pendingOrders) {
    try {
      const channel = order.channel;
      if (!channel) {
        console.warn(`[WithdrawStatusPoll] 订单 ${order.orderNo} 无关联通道，跳过`);
        skippedCount++;
        continue;
      }

      const paymentChannel = await paymentChannelManager.getChannel(channel.code);
      if (!paymentChannel) {
        console.warn(`[WithdrawStatusPoll] 通道 ${channel.code} 配置不存在，跳过`);
        skippedCount++;
        continue;
      }

      // channelOrderNo 优先（重试后 channelOrderNo 可能与 orderNo 不同）
      const queryOrderNo = order.channelOrderNo || order.orderNo;
      if (!queryOrderNo) {
        console.warn(`[WithdrawStatusPoll] 订单 ${order.orderNo} 无通道订单号，跳过`);
        skippedCount++;
        continue;
      }

      // 调用上游查询接口
      const queryResult = await paymentChannel.queryTransferOrder(queryOrderNo);

      if (!queryResult.success) {
        console.warn(
          `[WithdrawStatusPoll] 查询订单 ${order.orderNo} 失败: ${queryResult.errorMessage || '未知错误'}`
        );
        skippedCount++;
        continue;
      }

      // 3. 根据上游状态处理
      if (queryResult.status === TransferStatus.SUCCESS) {
        // 上游已成功，执行补偿
        await compensateWithdrawSuccess(order, channel.code);
        completedCount++;
        console.log(
          `[WithdrawStatusPoll] 补偿成功: ${order.orderNo}, 通道: ${channel.code}`
        );
      } else if (
        queryResult.status === TransferStatus.FAILED ||
        queryResult.status === TransferStatus.REVERSED
      ) {
        // 上游已失败/冲正，标记为 PAYOUT_FAILED
        await compensateWithdrawFailed(
          order,
          queryResult.failReason || '代付失败（轮询发现）'
        );
        payoutFailedCount++;
        console.log(
          `[WithdrawStatusPoll] 订单标记代付失败: ${order.orderNo}, 通道: ${channel.code}, 原因: ${queryResult.failReason || '未知'}`
        );
      } else {
        // PENDING → 跳过，等待下次轮询
        skippedCount++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      console.error(`[WithdrawStatusPoll] 处理订单 ${order.orderNo} 异常: ${message}`);
      skippedCount++;
    }
  }

  console.log(
    `[WithdrawStatusPoll] 完成: 总计=${pendingOrders.length}, 成功=${completedCount}, 代付失败=${payoutFailedCount}, 跳过=${skippedCount}`
  );

  return {
    processedCount: pendingOrders.length,
    completedCount,
    payoutFailedCount,
    skippedCount,
  };
}

/**
 * 提现补偿：上游成功
 * @description 复用 admin-withdraw.service.ts 的 compensateSuccess 逻辑
 * 当查询上游发现代付成功，但本地订单仍是 APPROVED 状态时调用
 */
async function compensateWithdrawSuccess(
  order: {
    id: number;
    orderNo: string;
    userId: number;
    amount: Decimal;
    actualAmount: Decimal;
    fee: Decimal;
    channelId: number | null;
    payoutAttempts: unknown;
  },
  channelCode: string
): Promise<void> {
  await prisma.$transaction(async (tx: TransactionClient) => {
    // 1. 事务内二次确认状态（幂等性）
    const currentOrder = await tx.withdrawOrder.findUnique({
      where: { id: order.id },
      select: { status: true },
    });
    if (!currentOrder || currentOrder.status !== 'APPROVED') {
      return; // 已被其他流程处理
    }

    // 2. 更新订单状态为已完成
    await tx.withdrawOrder.update({
      where: { id: order.id },
      data: {
        status: 'COMPLETED',
        callbackAt: new Date(),
        paidAt: new Date(),
      },
    });

    // 3. 扣减冻结余额
    await tx.user.update({
      where: { id: order.userId },
      data: {
        frozenBalance: { decrement: order.amount },
      },
    });

    // 4. 记录资金流水
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
          remark: `提现成功（轮询补偿），通道: ${channelCode}，手续费 $ ${order.fee.toFixed(2)}`,
        },
      });
    }

    // 5. 发送站内通知
    await tx.notification.create({
      data: {
        userId: order.userId,
        title: 'تم السحب بنجاح',
        content: `تمت معالجة سحبك بقيمة ${order.actualAmount.toFixed(2)} بنجاح.`,
        type: 'WITHDRAW_COMPLETED',
      },
    });
  });

  // 6. 更新通道统计
  if (order.channelId) {
    await prisma.paymentChannel.update({
      where: { id: order.channelId },
      data: {
        todayWithdraw: { increment: order.actualAmount },
        totalWithdraw: { increment: order.actualAmount },
      },
    });
  }

  // 7. 清除用户缓存
  await deleteCache(CACHE_KEYS.USER.INFO(order.userId));
}

/**
 * 提现补偿：上游失败
 * @description 复用 admin-withdraw.service.ts 的 compensateFailed 逻辑
 * 标记为 PAYOUT_FAILED，保持余额冻结，等待管理员决策（重试或驳回退款）
 */
async function compensateWithdrawFailed(
  order: {
    id: number;
    orderNo: string;
    payoutAttempts: unknown;
  },
  reason: string
): Promise<void> {
  // 幂等性检查
  const currentOrder = await prisma.withdrawOrder.findUnique({
    where: { id: order.id },
    select: { status: true },
  });
  if (!currentOrder || currentOrder.status !== 'APPROVED') {
    return;
  }

  // 构建尝试记录
  const existingAttempts = (order.payoutAttempts as unknown[]) || [];
  const updatedAttempts = [...existingAttempts];
  if (updatedAttempts.length > 0) {
    const lastAttempt = updatedAttempts[updatedAttempts.length - 1] as Record<string, unknown>;
    lastAttempt.status = 'FAILED';
    lastAttempt.failReason = reason;
    lastAttempt.callbackAt = new Date().toISOString();
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
    `[WithdrawStatusPoll] 补偿 → PAYOUT_FAILED: ${order.orderNo}, 原因: ${reason}, 余额保持冻结`
  );
}
