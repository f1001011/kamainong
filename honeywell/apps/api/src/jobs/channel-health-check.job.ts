/**
 * @file 支付通道状态检测任务
 * @description 统计支付通道成功率数据，供后台管理员参考
 * @depends 开发文档/05-后端服务/05.3-定时任务.md 第2.4节 - 通道状态检测任务
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.4节 - PaymentChannel表
 * 
 * 核心规则：
 * 1. 每5分钟统计一次所有启用通道的近1小时成功率
 * 2. 仅更新 hourlySuccessRate 和 lastCheckAt 统计字段
 * 3. channelStatus 由管理员在后台手动控制，此任务不自动修改
 */

import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import type { TaskResult } from '@/lib/task-lock';

/**
 * 通道状态检测任务结果
 */
export interface ChannelHealthCheckResult extends TaskResult {
  processedCount: number;
  normalCount: number;
  warningCount: number;
  errorCount: number;
}

/**
 * 通道统计数据
 */
interface ChannelStats {
  channelId: number;
  total: number;
  success: number;
  successRate: number | null;
}

/**
 * 支付通道健康检查任务
 * 
 * @description 仅统计成功率数据，不自动修改通道状态
 * channelStatus 完全由管理员在后台手动控制
 * 
 * @returns 处理结果统计
 */
export async function runChannelHealthCheckJob(): Promise<ChannelHealthCheckResult> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const channels = await prisma.paymentChannel.findMany({
    where: {
      OR: [
        { payEnabled: true },
        { transferEnabled: true },
      ],
    },
    select: {
      id: true,
      code: true,
    },
  });

  console.log(`[ChannelHealthCheck] 检测 ${channels.length} 个启用通道`);

  if (channels.length === 0) {
    return { processedCount: 0, normalCount: 0, warningCount: 0, errorCount: 0 };
  }

  for (const channel of channels) {
    try {
      const stats = await getChannelStats(channel.id, oneHourAgo);

      // 仅更新统计数据，不修改 channelStatus
      await prisma.paymentChannel.update({
        where: { id: channel.id },
        data: {
          hourlySuccessRate: stats.successRate !== null
            ? new Decimal(stats.successRate.toFixed(2))
            : null,
          lastCheckAt: now,
        },
      });
    } catch (error) {
      console.error(`[ChannelHealthCheck] 检测通道 ${channel.code} 失败:`, error);
    }
  }

  console.log(`[ChannelHealthCheck] 检测完成: ${channels.length} 个通道`);

  return {
    processedCount: channels.length,
    normalCount: channels.length,
    warningCount: 0,
    errorCount: 0,
  };
}

/**
 * 获取通道统计数据
 * @param channelId 通道ID
 * @param since 统计起始时间
 * @returns 统计数据
 */
async function getChannelStats(channelId: number, since: Date): Promise<ChannelStats> {
  // 统计近1小时内已到达终态的充值订单数量
  // 排除 PENDING_PAYMENT（待支付）订单，因为它们尚未完成不应计入成功率
  const stats = await prisma.rechargeOrder.groupBy({
    by: ['status'],
    where: {
      channelId,
      createdAt: { gte: since },
      status: { notIn: ['PENDING_PAYMENT'] },
    },
    _count: true,
  });

  // 计算总数和成功数（仅终态订单）
  const total = stats.reduce((sum, s) => sum + s._count, 0);
  const success = stats.find(s => s.status === 'PAID')?._count || 0;
  
  // 计算成功率
  const successRate = total > 0 ? (success / total) * 100 : null;

  return {
    channelId,
    total,
    success,
    successRate,
  };
}

