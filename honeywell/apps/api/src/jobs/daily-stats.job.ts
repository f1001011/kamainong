/**
 * @file 每日数据统计汇总任务
 * @description 统计前一天的充值、提现、用户、产品销售等数据
 * @depends 开发文档/05-后端服务/05.3-定时任务.md 第2.5节 - 数据统计汇总任务
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.21节 - DailyStats表
 * 
 * 核心规则：
 * 1. 每日00:05执行，统计前一天数据
 * 2. 使用系统时区计算日期范围
 * 3. 统计维度：新增用户、活跃用户、充值、提现、购买、收益发放、返佣发放
 * 4. 写入 DailyStats 表
 */

import { prisma } from '@/lib/prisma';
import { getYesterdayRange } from '@/lib/config';
import { Decimal } from '@prisma/client/runtime/library';
import type { TaskResult } from '@/lib/task-lock';

/**
 * 每日统计任务结果
 */
export interface DailyStatsResult extends TaskResult {
  processedCount: number;
  date: string;
  stats: {
    newUsers: number;
    activeUsers: number;
    rechargeCount: number;
    rechargeAmount: string;
    withdrawCount: number;
    withdrawAmount: string;
    purchaseCount: number;
    purchaseAmount: string;
    incomeAmount: string;
    commissionAmount: string;
  };
}

/**
 * 每日数据统计汇总任务
 * 
 * @description 依据：05.3-定时任务.md 第2.5节
 * 
 * 处理流程：
 * 1. 获取昨日日期范围（系统时区）
 * 2. 并行统计各项指标
 * 3. 写入 DailyStats 表（使用 upsert 防重复）
 * 
 * @returns 处理结果统计
 */
export async function runDailyStatsJob(): Promise<DailyStatsResult> {
  // 1. 获取昨日日期范围（使用系统时区）
  const { start: yesterdayStart, end: yesterdayEnd } = await getYesterdayRange();
  
  const dateStr = yesterdayStart.toISOString().split('T')[0];
  console.log(`[DailyStats] 统计日期: ${dateStr}, 范围: ${yesterdayStart.toISOString()} ~ ${yesterdayEnd.toISOString()}`);

  // 2. 并行统计各项指标
  const [
    newUserCount,
    activeUserCount,
    rechargeStats,
    withdrawStats,
    purchaseStats,
    incomeStats,
    commissionStats,
  ] = await Promise.all([
    // 新增用户数
    prisma.user.count({
      where: {
        createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
      },
    }),

    // 活跃用户数（有登录记录的用户）
    prisma.userLoginLog.groupBy({
      by: ['userId'],
      where: {
        success: true,
        createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
        userId: { not: null },
      },
    }).then(result => result.length),

    // 充值统计（使用 createdAt，回调时间可能延迟跨天导致统计不准）
    prisma.rechargeOrder.aggregate({
      where: {
        status: 'PAID',
        createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
      },
      _sum: { actualAmount: true },
      _count: true,
    }),

    // 提现统计 - 使用 createdAt 保持一致
    prisma.withdrawOrder.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
      },
      _sum: { actualAmount: true },
      _count: true,
    }),

    // 产品购买统计
    prisma.positionOrder.aggregate({
      where: {
        isGift: false, // 排除赠送
        createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
      },
      _sum: { purchaseAmount: true },
      _count: true,
    }),

    // 收益发放统计
    prisma.incomeRecord.aggregate({
      where: {
        status: 'SETTLED',
        settledAt: { gte: yesterdayStart, lt: yesterdayEnd },
      },
      _sum: { amount: true },
    }),

    // 返佣发放统计
    prisma.commissionRecord.aggregate({
      where: {
        createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
      },
      _sum: { amount: true },
    }),
  ]);

  // 3. 构建统计数据
  const statsData = {
    newUsers: newUserCount,
    activeUsers: activeUserCount,
    rechargeCount: rechargeStats._count,
    rechargeAmount: rechargeStats._sum.actualAmount || new Decimal(0),
    withdrawCount: withdrawStats._count,
    withdrawAmount: withdrawStats._sum.actualAmount || new Decimal(0),
    purchaseCount: purchaseStats._count,
    purchaseAmount: purchaseStats._sum.purchaseAmount || new Decimal(0),
    incomeAmount: incomeStats._sum.amount || new Decimal(0),
    commissionAmount: commissionStats._sum.amount || new Decimal(0),
  };

  // 4. 写入 DailyStats 表（使用 upsert 防重复）
  // 依据：02.1-数据库设计.md 第2.21节 - DailyStats表
  await prisma.dailyStats.upsert({
    where: { date: yesterdayStart },
    create: {
      date: yesterdayStart,
      ...statsData,
    },
    update: statsData,
  });

  // 打印统计结果
  console.log(`[DailyStats] ${dateStr} 统计完成:`);
  console.log(`  - 新增用户: ${statsData.newUsers}`);
  console.log(`  - 活跃用户: ${statsData.activeUsers}`);
  console.log(`  - 充值: ${statsData.rechargeCount}笔, $ ${statsData.rechargeAmount}`);
  console.log(`  - 提现: ${statsData.withdrawCount}笔, $ ${statsData.withdrawAmount}`);
  console.log(`  - 购买: ${statsData.purchaseCount}笔, $ ${statsData.purchaseAmount}`);
  console.log(`  - 收益发放: $ ${statsData.incomeAmount}`);
  console.log(`  - 返佣发放: $ ${statsData.commissionAmount}`);

  return {
    processedCount: 1,
    date: dateStr,
    stats: {
      newUsers: statsData.newUsers,
      activeUsers: statsData.activeUsers,
      rechargeCount: statsData.rechargeCount,
      rechargeAmount: statsData.rechargeAmount.toString(),
      withdrawCount: statsData.withdrawCount,
      withdrawAmount: statsData.withdrawAmount.toString(),
      purchaseCount: statsData.purchaseCount,
      purchaseAmount: statsData.purchaseAmount.toString(),
      incomeAmount: statsData.incomeAmount.toString(),
      commissionAmount: statsData.commissionAmount.toString(),
    },
  };
}
