/**
 * @file 用户SVIP状态查询接口
 * @description GET /api/admin/svip/user/:id/status - 查询用户的SVIP资质和活跃持仓
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/svip/user/:id/status
 * @description 查询指定用户的SVIP等级、资质和活跃持仓信息
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;
      const userId = parseInt(id, 10);
      if (isNaN(userId)) {
        return errorResponse('VALIDATION_ERROR', '无效的用户ID', 400);
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
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

      // 查询用户活跃持仓（状态为 ACTIVE 的持仓订单）
      const activePositions = await prisma.positionOrder.findMany({
        where: {
          userId,
          status: 'ACTIVE',
        },
        include: {
          product: {
            select: { id: true, name: true, code: true, type: true, series: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // 查询近期SVIP奖励记录
      const recentRewards = await prisma.svipRewardRecord.findMany({
        where: { userId },
        include: {
          product: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      // 累计SVIP奖励金额
      const totalRewards = await prisma.svipRewardRecord.aggregate({
        where: { userId },
        _sum: { amount: true },
        _count: true,
      });

      return successResponse({
        user,
        activePositions,
        recentRewards,
        summary: {
          totalRewardCount: totalRewards._count,
          totalRewardAmount: totalRewards._sum.amount || 0,
          activePositionCount: activePositions.length,
        },
      }, '获取用户SVIP状态成功');
    } catch (error) {
      console.error('[GET /api/admin/svip/user/:id/status] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取用户SVIP状态失败', 500);
    }
  });
}
