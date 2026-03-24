/**
 * @file 充值订单状态轮询任务
 * @description 主动查询上游支付通道，补偿回调丢失的充值订单
 * @depends 开发文档/05-后端服务/05.3-定时任务.md - 定时任务规范
 * @depends 开发文档/开发文档.md 第16.1节 - 补单逻辑
 * @depends 开发文档/开发文档.md 第5节 - 充值系统
 *
 * 核心规则：
 * 1. 扫描 status = 'PENDING_PAYMENT' 且创建超过3分钟的充值订单
 * 2. 逐个向上游支付通道查询真实状态
 * 3. 上游已成功 → 执行补单（更新状态 + 充值到账）
 * 4. 上游已失败 → 更新为 FAILED
 * 5. 上游仍处理中 → 跳过，等待下次轮询
 * 6. 每次最多处理50单，避免超时
 * 7. UZPAY 无独立查询接口，跳过
 */

import { prisma } from '@/lib/prisma';
import {
  paymentChannelManager,
  CollectionStatus,
} from '@/lib/payment';
import { CACHE_KEYS, deleteCache } from '@/lib/redis';
import { Decimal } from '@prisma/client/runtime/library';
import type { TaskResult } from '@/lib/task-lock';
import { formatNotificationAmount } from '@/lib/config';

/**
 * 充值状态轮询任务结果
 */
export interface RechargeStatusPollResult extends TaskResult {
  processedCount: number;
  compensatedCount: number;
  failedCount: number;
  skippedCount: number;
}

/**
 * Prisma 事务客户端类型
 */
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * 充值订单状态轮询任务
 *
 * @description 主动查询上游支付通道订单状态，补偿回调丢失的订单
 *
 * 处理流程：
 * 1. 查询待支付且创建超过3分钟的充值订单（给回调留足时间）
 * 2. 按通道分组，逐个查询上游状态
 * 3. 根据上游状态执行补单或标记失败
 *
 * @returns 处理结果统计
 */
export async function runRechargeStatusPollJob(): Promise<RechargeStatusPollResult> {
  const now = new Date();
  // 只查询创建超过3分钟的订单，避免干扰正常回调流程
  const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000);
  // 只查询10天内的订单，避免查询过旧的数据
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

  // 1. 查询待轮询的充值订单
  const pendingOrders = await prisma.rechargeOrder.findMany({
    where: {
      status: 'PENDING_PAYMENT',
      createdAt: {
        gte: tenDaysAgo,
        lte: threeMinutesAgo,
      },
    },
    include: {
      channel: {
        select: { id: true, code: true, name: true },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: 50, // 每次最多处理50单
  });

  if (pendingOrders.length === 0) {
    return { processedCount: 0, compensatedCount: 0, failedCount: 0, skippedCount: 0 };
  }

  console.log(`[RechargeStatusPoll] 发现 ${pendingOrders.length} 个待查询充值订单`);

  let compensatedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  // 2. 逐个查询上游状态
  for (const order of pendingOrders) {
    try {
      const channel = order.channel;
      if (!channel) {
        console.warn(`[RechargeStatusPoll] 订单 ${order.orderNo} 无关联通道，跳过`);
        skippedCount++;
        continue;
      }

      // UZPAY 无独立查询接口，跳过
      if (channel.code === 'UZPAY') {
        skippedCount++;
        continue;
      }

      const paymentChannel = await paymentChannelManager.getChannel(channel.code);
      if (!paymentChannel) {
        console.warn(`[RechargeStatusPoll] 通道 ${channel.code} 配置不存在，跳过`);
        skippedCount++;
        continue;
      }

      // 调用上游查询接口
      const queryResult = await paymentChannel.queryCollectionOrder(
        order.orderNo,
        order.callbackData,
        order.thirdOrderNo || undefined // JYPAY 查询需要平台订单号
      );

      if (!queryResult.success) {
        console.warn(
          `[RechargeStatusPoll] 查询订单 ${order.orderNo} 失败: ${queryResult.errorMessage || '未知错误'}`
        );
        skippedCount++;
        continue;
      }

      // 3. 根据上游状态处理
      if (queryResult.status === CollectionStatus.SUCCESS) {
        // 上游已成功，执行补单
        await compensateRechargeOrder(
          order.id,
          queryResult.amount || order.amount.toString(),
          queryResult.thirdOrderNo,
          channel.code,
          order.userId
        );
        compensatedCount++;
        console.log(
          `[RechargeStatusPoll] 补单成功: ${order.orderNo}, 通道: ${channel.code}`
        );
      } else if (queryResult.status === CollectionStatus.FAILED) {
        // 上游已失败，更新本地状态
        await prisma.rechargeOrder.update({
          where: { id: order.id, status: 'PENDING_PAYMENT' }, // 乐观锁
          data: {
            status: 'FAILED',
            callbackAt: new Date(),
          },
        });
        failedCount++;
        console.log(
          `[RechargeStatusPoll] 订单标记失败: ${order.orderNo}, 通道: ${channel.code}`
        );
      } else {
        // NOTPAY / PENDING / UNKNOWN → 跳过，等待下次轮询
        skippedCount++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      console.error(`[RechargeStatusPoll] 处理订单 ${order.orderNo} 异常: ${message}`);
      skippedCount++;
    }
  }

  console.log(
    `[RechargeStatusPoll] 完成: 总计=${pendingOrders.length}, 补单=${compensatedCount}, 失败=${failedCount}, 跳过=${skippedCount}`
  );

  return {
    processedCount: pendingOrders.length,
    compensatedCount,
    failedCount,
    skippedCount,
  };
}

/**
 * 充值补单处理
 * @description 复用 admin-recharge-order.service.ts 的补单逻辑
 * 依据：开发文档.md 16.1节 - 补单逻辑
 */
async function compensateRechargeOrder(
  orderId: number,
  amount: string,
  thirdOrderNo: string | undefined,
  channelCode: string,
  userId: number
): Promise<void> {
  const actualAmount = new Decimal(amount);
  const callbackTime = new Date();

  // 使用事务处理：更新订单 + 增加余额 + 创建流水 + 发送通知
  await prisma.$transaction(async (tx: TransactionClient) => {
    // 1. 获取订单并验证状态（事务内二次确认）
    const order = await tx.rechargeOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 幂等性检查：已处理过的订单直接返回
    if (order.status === 'PAID' || order.status === 'FAILED') {
      return;
    }

    // 2. 更新订单状态
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
        remark: `充值成功（轮询补单），通道: ${channelCode}`,
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

  // 5.5 增加转盘机会（充值一次 = 一次抽奖机会）
  try {
    const { getSystemTime } = await import('@/lib/config');
    const systemTime = await getSystemTime();
    const y = systemTime.getFullYear();
    const m = (systemTime.getMonth() + 1).toString().padStart(2, '0');
    const d = systemTime.getDate().toString().padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    await prisma.spinChance.upsert({
      where: { userId_chanceDate: { userId, chanceDate: todayStr } },
      update: { rechargeChances: { increment: 1 } },
      create: {
        userId,
        chanceDate: todayStr,
        rechargeChances: 1,
        inviteChances: 0,
        usedChances: 0,
      },
    });
  } catch (spinError) {
    console.error('[RechargeStatusPoll] 增加转盘机会失败:', spinError);
  }

  // 6. 更新通道统计
  const order = await prisma.rechargeOrder.findUnique({
    where: { id: orderId },
  });
  if (order?.channelId) {
    await prisma.paymentChannel.update({
      where: { id: order.channelId },
      data: {
        todayRecharge: { increment: actualAmount },
        totalRecharge: { increment: actualAmount },
      },
    });
  }

  // 7. 清除用户缓存
  await deleteCache(CACHE_KEYS.USER.INFO(userId));
}
