/**
 * @file SVIP奖励记录接口
 * @description GET /api/admin/svip/records - 查询SVIP奖励发放记录
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
  svipLevel: z.coerce.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * GET /api/admin/svip/records
 * @description 获取SVIP奖励记录列表
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

      const { page, pageSize, userId, svipLevel, startDate, endDate } = validation.data;

      const where: Record<string, unknown> = {};
      if (userId) where.userId = userId;
      if (svipLevel) where.svipLevel = svipLevel;
      if (startDate || endDate) {
        where.createdAt = {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lte: new Date(endDate + 'T23:59:59.999Z') } : {}),
        };
      }

      const today = new Date().toISOString().slice(0, 10);
      const [records, total, todayStats, totalStats] = await Promise.all([
        prisma.svipRewardRecord.findMany({
          where,
          include: {
            user: {
              select: { id: true, phone: true, nickname: true, svipLevel: true },
            },
            product: {
              select: { id: true, name: true, code: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.svipRewardRecord.count({ where }),
        prisma.svipRewardRecord.aggregate({
          where: { rewardDate: today },
          _count: true,
          _sum: { amount: true },
        }),
        prisma.svipRewardRecord.aggregate({
          _count: true,
          _sum: { amount: true },
        }),
      ]);

      const list = records.map(r => ({
        ...r,
        userPhone: r.user?.phone || '',
        productName: r.product?.name || '',
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
      console.error('[GET /api/admin/svip/records] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取SVIP奖励记录失败', 500);
    }
  });
}
