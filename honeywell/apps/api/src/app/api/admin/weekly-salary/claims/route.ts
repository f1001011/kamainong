/**
 * @file 周薪领取记录接口
 * @description GET /api/admin/weekly-salary/claims - 查询周薪领取记录
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
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * GET /api/admin/weekly-salary/claims
 * @description 获取周薪领取记录列表
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

      const { page, pageSize, userId, startDate, endDate } = validation.data;

      const where: Record<string, unknown> = {};
      if (userId) where.userId = userId;
      if (startDate || endDate) {
        where.createdAt = {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lte: new Date(endDate + 'T23:59:59.999Z') } : {}),
        };
      }

      const [records, total] = await Promise.all([
        prisma.weeklySalaryClaim.findMany({
          where,
          include: {
            user: {
              select: { id: true, phone: true, nickname: true },
            },
            salary: {
              select: { id: true, minRecharge: true, rewardAmount: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.weeklySalaryClaim.count({ where }),
      ]);

      const list = records.map(r => ({
        ...r,
        userPhone: r.user?.phone || '',
        matchedTier: r.salary
          ? `充值≥${r.salary.minRecharge} 奖励${r.salary.rewardAmount}`
          : '',
        amount: String(r.amount),
        teamRecharge: String(r.teamRecharge),
      }));

      return paginatedResponse(list, { page, pageSize, total });
    } catch (error) {
      console.error('[GET /api/admin/weekly-salary/claims] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取周薪领取记录失败', 500);
    }
  });
}
