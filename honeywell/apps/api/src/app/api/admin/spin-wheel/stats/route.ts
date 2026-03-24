/**
 * @file 转盘统计接口
 * @description GET /api/admin/spin-wheel/stats - 获取转盘抽奖统计数据
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/spin-wheel/stats
 * @description 获取今日转盘统计和累计统计
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);

      const [todayRecords, allRecords, todayWinRecords, allWinRecords] =
        await Promise.all([
          // 今日抽奖记录
          prisma.spinRecord.aggregate({
            where: { spinDate: today },
            _count: true,
            _sum: { amount: true },
          }),
          // 累计抽奖记录
          prisma.spinRecord.aggregate({
            _count: true,
            _sum: { amount: true },
          }),
          // 今日中奖记录（金额 > 0）
          prisma.spinRecord.count({
            where: {
              spinDate: today,
              amount: { gt: 0 },
            },
          }),
          // 累计中奖记录
          prisma.spinRecord.count({
            where: { amount: { gt: 0 } },
          }),
        ]);

      const todayTotal = todayRecords._count;
      const todayAmount = todayRecords._sum.amount || 0;
      const todayWinRate = todayTotal > 0 ? ((todayWinRecords / todayTotal) * 100).toFixed(2) : '0.00';

      const allTotal = allRecords._count;
      const allAmount = allRecords._sum.amount || 0;
      const allWinRate = allTotal > 0 ? ((allWinRecords / allTotal) * 100).toFixed(2) : '0.00';

      return successResponse({
        today: {
          totalSpins: todayTotal,
          totalAmount: todayAmount,
          winCount: todayWinRecords,
          winRate: `${todayWinRate}%`,
        },
        cumulative: {
          totalSpins: allTotal,
          totalAmount: allAmount,
          winCount: allWinRecords,
          winRate: `${allWinRate}%`,
        },
      }, '获取转盘统计成功');
    } catch (error) {
      console.error('[GET /api/admin/spin-wheel/stats] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取转盘统计失败', 500);
    }
  });
}
