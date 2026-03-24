/**
 * @file 转盘抽奖记录接口
 * @description GET /api/admin/spin-wheel/records - 查询转盘抽奖记录
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { errorResponse, paginatedResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  userId: z.coerce.number().optional(),
  prizeId: z.coerce.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * GET /api/admin/spin-wheel/records
 * @description 获取转盘抽奖记录列表
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const rawParams = Object.fromEntries(searchParams.entries());

      const validation = querySchema.safeParse(rawParams);
      if (!validation.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          validation.error.errors.map(e => e.message).join(', '),
          400
        );
      }

      const { page, pageSize, userId, prizeId, startDate, endDate } = validation.data;

      const where: Record<string, unknown> = {};
      if (userId) where.userId = userId;
      if (prizeId) where.prizeId = prizeId;
      if (startDate || endDate) {
        where.createdAt = {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lte: new Date(endDate + 'T23:59:59.999Z') } : {}),
        };
      }

      const today = new Date().toISOString().slice(0, 10);
      const [records, total, todayStats, totalStats] = await Promise.all([
        prisma.spinRecord.findMany({
          where,
          include: {
            user: {
              select: { id: true, phone: true, nickname: true },
            },
            prize: {
              select: { id: true, name: true, amount: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.spinRecord.count({ where }),
        prisma.spinRecord.aggregate({
          where: { spinDate: today },
          _count: true,
          _sum: { amount: true },
        }),
        prisma.spinRecord.aggregate({
          _count: true,
          _sum: { amount: true },
        }),
      ]);

      const list = records.map(r => ({
        ...r,
        userPhone: r.user?.phone || '',
        prizeName: r.prize?.name || '',
        amount: String(r.amount),
      }));

      const stats = {
        todayCount: todayStats._count,
        todayAmount: String(todayStats._sum.amount || 0),
        totalCount: totalStats._count,
        totalAmount: String(totalStats._sum.amount || 0),
      };

      return paginatedResponse(list, { page, pageSize, total }, { stats });
    } catch (error) {
      console.error('[GET /api/admin/spin-wheel/records] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取抽奖记录失败', 500);
    }
  });
}
