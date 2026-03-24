/**
 * @file 充值订单超时取消任务
 * @description 取消超时未支付的充值订单，取消前先查询上游避免误取消已支付订单
 * @depends 开发文档/05-后端服务/05.3-定时任务.md 第2.2节 - 充值超时任务
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.3节 - RechargeOrder表
 * @depends 开发文档/开发文档.md 第5节 - 充值系统
 * @depends 开发文档/开发文档.md 第16.1节 - 补单逻辑
 * 
 * 核心规则：
 * 1. 扫描 status = 'PENDING_PAYMENT' 且 expireAt < now() 的订单
 * 2. 对有 thirdOrderNo 的订单（上游已受理），先查询上游状态
 *    - 上游已成功 → 不取消，留给 recharge_status_poll 任务处理补单
 *    - 上游已失败/未支付 → 正常取消
 *    - 查询失败 → 正常取消（后续回调仍可补单，依据：开发文档.md 第16.1节）
 * 3. 无 thirdOrderNo 的订单直接取消
 * 4. 注意：已超时取消的订单如果后续收到成功回调，仍然给用户充值（依据：开发文档.md 第16.1节）
 */

import { prisma } from '@/lib/prisma';
import {
  paymentChannelManager,
  CollectionStatus,
} from '@/lib/payment';
import type { TaskResult } from '@/lib/task-lock';

/**
 * 充值超时任务结果
 */
export interface RechargeTimeoutResult extends TaskResult {
  processedCount: number;
}

/**
 * 充值订单超时取消任务
 * 
 * @description 依据：05.3-定时任务.md 第2.2节
 * 
 * 处理流程：
 * 1. 查询超时的待支付订单（status = PENDING_PAYMENT AND expireAt < now）
 * 2. 对有 thirdOrderNo 的订单先查上游，避免取消已支付订单
 * 3. 批量更新未支付订单状态为 CANCELLED
 * 
 * 注意：
 * - 超时时间在创建订单时根据 GlobalConfig.recharge_timeout_minutes 计算并保存到 expireAt 字段
 * - 已取消的订单如果后续收到支付成功回调，仍会按回调金额充值到用户账户（依据：开发文档.md 第16.1节）
 * 
 * @returns 处理结果统计
 */
export async function runRechargeTimeoutJob(): Promise<RechargeTimeoutResult> {
  const now = new Date();

  // 1. 查询超时的待支付订单
  // 依据：02.1-数据库设计.md - expireAt 索引用于超时任务扫描
  const timeoutOrders = await prisma.rechargeOrder.findMany({
    where: {
      status: 'PENDING_PAYMENT',
      expireAt: { lt: now }, // 超时时间 < 当前时间
    },
    include: {
      channel: {
        select: { id: true, code: true },
      },
    },
  });

  console.log(`[RechargeTimeout] 发现 ${timeoutOrders.length} 个超时订单`);

  if (timeoutOrders.length === 0) {
    return { processedCount: 0 };
  }

  // 2. 对有 thirdOrderNo 的订单先查上游，排除上游已成功的订单
  // 避免在回调丢失时误取消已支付订单
  const excludeIds: Set<number> = new Set();

  for (const order of timeoutOrders) {
    // 只对有 thirdOrderNo 且有通道且非 UZPAY（无查询接口）的订单查询上游
    if (!order.thirdOrderNo || !order.channel || order.channel.code === 'UZPAY') {
      continue;
    }

    try {
      const paymentChannel = await paymentChannelManager.getChannel(order.channel.code);
      if (!paymentChannel) continue;

      const queryResult = await paymentChannel.queryCollectionOrder(
        order.orderNo,
        order.callbackData,
        order.thirdOrderNo || undefined
      );

      if (queryResult.success && queryResult.status === CollectionStatus.SUCCESS) {
        // 上游已成功，不取消此订单，留给 recharge_status_poll 处理补单
        excludeIds.add(order.id);
        console.log(
          `[RechargeTimeout] 订单 ${order.orderNo} 上游已支付成功，跳过取消，等待轮询补单`
        );
      }
    } catch (error) {
      // 查询失败不影响取消流程，后续回调仍可补单
      console.warn(
        `[RechargeTimeout] 查询订单 ${order.orderNo} 上游状态失败，继续取消`,
        error instanceof Error ? error.message : error
      );
    }
  }

  // 3. 批量更新状态为已取消（排除上游已成功的订单）
  const cancelIds = timeoutOrders
    .filter(o => !excludeIds.has(o.id))
    .map(o => o.id);

  if (cancelIds.length === 0) {
    console.log(`[RechargeTimeout] 所有超时订单上游均已成功，无需取消`);
    return { processedCount: 0 };
  }

  const updateResult = await prisma.rechargeOrder.updateMany({
    where: {
      id: { in: cancelIds },
      status: 'PENDING_PAYMENT', // 双重检查状态，防止并发问题
    },
    data: {
      status: 'CANCELLED',
    },
  });

  console.log(
    `[RechargeTimeout] 已取消 ${updateResult.count} 个超时订单` +
    (excludeIds.size > 0 ? `，跳过 ${excludeIds.size} 个上游已成功订单` : '')
  );

  // 打印详细日志（便于排查问题）
  const cancelledOrders = timeoutOrders.filter(o => !excludeIds.has(o.id));
  if (cancelledOrders.length <= 10) {
    for (const order of cancelledOrders) {
      console.log(`[RechargeTimeout] 订单 ${order.orderNo} 已超时取消, 用户=${order.userId}, 金额=${order.amount}`);
    }
  }

  return { processedCount: updateResult.count };
}
