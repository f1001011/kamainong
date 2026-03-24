/**
 * @file SVIP状态搜索接口
 * @description GET /api/admin/svip/status?query=phone_or_id - 按手机号或ID搜索用户SVIP状态
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/svip/status
 * @description 按手机号或用户ID搜索用户的SVIP等级、资质和活跃持仓
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const query = searchParams.get('query')?.trim();

      if (!query) {
        return errorResponse('VALIDATION_ERROR', '请提供查询参数 query', 400);
      }

      const isNumeric = /^\d+$/.test(query);
      const user = await prisma.user.findFirst({
        where: isNumeric
          ? { OR: [{ id: parseInt(query, 10) }, { phone: query }] }
          : { phone: query },
        select: {
          id: true,
          phone: true,
          nickname: true,
          svipLevel: true,
          vipLevel: true,
        },
      });

      if (!user) {
        return errorResponse('NOT_FOUND', '用户不存在', 404);
      }

      const [activePositions, recentRewards, totalRewards] = await Promise.all([
        prisma.positionOrder.findMany({
          where: { userId: user.id, status: 'ACTIVE' },
          include: {
            product: {
              select: { id: true, name: true, code: true, type: true, series: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.svipRewardRecord.findMany({
          where: { userId: user.id },
          include: {
            product: { select: { id: true, name: true, code: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        prisma.svipRewardRecord.aggregate({
          where: { userId: user.id },
          _sum: { amount: true },
          _count: true,
        }),
      ]);

      return successResponse({
        user,
        activePositions,
        recentRewards,
        summary: {
          totalRewardCount: totalRewards._count,
          totalRewardAmount: totalRewards._sum.amount || 0,
          activePositionCount: activePositions.length,
        },
      });
    } catch (error) {
      console.error('[GET /api/admin/svip/status] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '查询SVIP状态失败', 500);
    }
  });
}
