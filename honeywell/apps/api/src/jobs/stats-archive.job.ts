/**
 * @file 统计数据归档任务
 * @description 将支付通道的今日统计数据归档到昨日，重置今日计数
 * @depends 开发文档/05-后端服务/05.3-定时任务.md 第2.6节 - 统计数据归档任务
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.4节 - PaymentChannel表 统计字段
 * 
 * 核心规则：
 * 1. 每日00:30执行
 * 2. 将所有支付通道的 todayRecharge/todayWithdraw 移动到 yesterdayRecharge/yesterdayWithdraw
 * 3. 重置今日计数为0
 */

import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import type { TaskResult } from '@/lib/task-lock';

/**
 * 统计归档任务结果
 */
export interface StatsArchiveResult extends TaskResult {
  processedCount: number;
  archivedChannels: Array<{
    code: string;
    yesterdayRecharge: string;
    yesterdayWithdraw: string;
  }>;
}

/**
 * 统计数据归档任务
 * 
 * @description 依据：05.3-定时任务.md 第2.6节
 * 
 * 处理流程：
 * 1. 获取所有支付通道
 * 2. 逐个归档：
 *    - yesterdayRecharge = todayRecharge
 *    - yesterdayWithdraw = todayWithdraw
 *    - todayRecharge = 0
 *    - todayWithdraw = 0
 * 3. 记录归档数据
 * 
 * @returns 处理结果统计
 */
export async function runStatsArchiveJob(): Promise<StatsArchiveResult> {
  // 1. 获取所有支付通道
  const channels = await prisma.paymentChannel.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      todayRecharge: true,
      todayWithdraw: true,
      totalRecharge: true,
      totalWithdraw: true,
    },
  });

  console.log(`[StatsArchive] 开始归档 ${channels.length} 个支付通道统计数据`);

  if (channels.length === 0) {
    return { processedCount: 0, archivedChannels: [] };
  }

  const archivedChannels: Array<{
    code: string;
    yesterdayRecharge: string;
    yesterdayWithdraw: string;
  }> = [];

  // 2. 逐个通道归档
  for (const channel of channels) {
    try {
      // 归档：今日 → 昨日，重置今日为0
      await prisma.paymentChannel.update({
        where: { id: channel.id },
        data: {
          // 今日数据移到昨日
          yesterdayRecharge: channel.todayRecharge,
          yesterdayWithdraw: channel.todayWithdraw,
          // 重置今日数据
          todayRecharge: new Decimal(0),
          todayWithdraw: new Decimal(0),
        },
      });

      archivedChannels.push({
        code: channel.code,
        yesterdayRecharge: channel.todayRecharge.toString(),
        yesterdayWithdraw: channel.todayWithdraw.toString(),
      });

      // 只有有数据时才打印详细日志
      if (channel.todayRecharge.gt(0) || channel.todayWithdraw.gt(0)) {
        console.log(
          `[StatsArchive] 通道 ${channel.code}: ` +
          `充值=${channel.todayRecharge}, 提现=${channel.todayWithdraw}`
        );
      }

    } catch (error) {
      console.error(`[StatsArchive] 归档通道 ${channel.code} 失败:`, error);
    }
  }

  console.log(`[StatsArchive] 归档完成: ${archivedChannels.length} 个通道`);

  return {
    processedCount: archivedChannels.length,
    archivedChannels,
  };
}
