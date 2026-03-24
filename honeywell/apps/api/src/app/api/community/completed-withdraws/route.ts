/**
 * @file 获取用户已完成的提现订单
 * @description GET /api/community/completed-withdraws
 * 用于社区创建帖子页面，选择关联的提现订单
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, userId) => {
    try {
      // 查询该用户已完成且未发过帖子的提现订单
      const existingPostOrderIds = await prisma.communityPost.findMany({
        where: { userId },
        select: { withdrawOrderId: true },
      });
      const usedOrderIds = existingPostOrderIds
        .map(p => p.withdrawOrderId)
        .filter((id): id is number => id !== null);

      const orders = await prisma.withdrawOrder.findMany({
        where: {
          userId,
          status: 'COMPLETED',
          ...(usedOrderIds.length > 0 ? { id: { notIn: usedOrderIds } } : {}),
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
        select: {
          id: true,
          orderNo: true,
          amount: true,
          paidAt: true,
          updatedAt: true,
        },
      });

      return successResponse({
        list: orders.map(o => ({
          id: o.id,
          orderNo: o.orderNo,
          amount: Number(o.amount),
          completedAt: (o.paidAt ?? o.updatedAt)?.toISOString() ?? null,
        })),
      });
    } catch (error) {
      console.error('[Community] 获取已完成提现订单失败:', error);
      return errorResponse('INTERNAL_ERROR', 'خطأ في الحصول على الطلبات', 500);
    }
  });
}
