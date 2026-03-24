/**
 * @file SVIP统计接口
 * @description GET /api/admin/svip/stats - 获取SVIP奖励统计数据
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/svip/stats
 * @description 获取今日SVIP奖励统计、累计统计、各等级分布
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);

      const [todayStats, cumulativeStats, levelDistribution, todayLevelDistribution] =
        await Promise.all([
          // 今日奖励统计
          prisma.svipRewardRecord.aggregate({
            where: { rewardDate: today },
            _count: true,
            _sum: { amount: true },
          }),
          // 累计奖励统计
          prisma.svipRewardRecord.aggregate({
            _count: true,
            _sum: { amount: true },
          }),
          // 各等级累计分布
          prisma.svipRewardRecord.groupBy({
            by: ['svipLevel'],
            _count: true,
            _sum: { amount: true },
            orderBy: { svipLevel: 'asc' },
          }),
          // 今日各等级分布
          prisma.svipRewardRecord.groupBy({
            by: ['svipLevel'],
            where: { rewardDate: today },
            _count: true,
            _sum: { amount: true },
            orderBy: { svipLevel: 'asc' },
          }),
        ]);

      return successResponse({
        today: {
          totalRecords: todayStats._count,
          totalAmount: todayStats._sum.amount || 0,
          levelDistribution: todayLevelDistribution.map((item) => ({
            svipLevel: item.svipLevel,
            count: item._count,
            totalAmount: item._sum.amount || 0,
          })),
        },
        cumulative: {
          totalRecords: cumulativeStats._count,
          totalAmount: cumulativeStats._sum.amount || 0,
          levelDistribution: levelDistribution.map((item) => ({
            svipLevel: item.svipLevel,
            count: item._count,
            totalAmount: item._sum.amount || 0,
          })),
        },
      }, '获取SVIP统计成功');
    } catch (error) {
      console.error('[GET /api/admin/svip/stats] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取SVIP统计失败', 500);
    }
  });
}
