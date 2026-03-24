/**
 * @file 奖池领取记录接口
 * @description GET /api/admin/prize-pool/claims - 查询奖池领取记录
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
  tierId: z.coerce.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * GET /api/admin/prize-pool/claims
 * @description 获取奖池领取记录列表
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

      const { page, pageSize, userId, tierId, startDate, endDate } = validation.data;

      const where: Record<string, unknown> = {};
      if (userId) where.userId = userId;
      if (tierId) where.tierId = tierId;
      if (startDate || endDate) {
        where.createdAt = {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lte: new Date(endDate + 'T23:59:59.999Z') } : {}),
        };
      }

      const [records, total] = await Promise.all([
        prisma.prizePoolClaim.findMany({
          where,
          include: {
            user: {
              select: { id: true, phone: true, nickname: true },
            },
            tier: {
              select: { id: true, requiredInvites: true, rewardAmount: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.prizePoolClaim.count({ where }),
      ]);

      const list = records.map(r => ({
        ...r,
        userPhone: r.user?.phone || '',
        tierName: r.tier
          ? `邀请${r.tier.requiredInvites}人 奖励${r.tier.rewardAmount}`
          : '',
        amount: String(r.amount),
      }));

      return paginatedResponse(list, { page, pageSize, total });
    } catch (error) {
      console.error('[GET /api/admin/prize-pool/claims] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取奖池领取记录失败', 500);
    }
  });
}
