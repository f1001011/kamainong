/**
 * @file 社区帖子列表接口
 * @description GET /api/admin/community/posts - 获取社区帖子列表（支持状态筛选、分页）
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { errorResponse, paginatedResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  userId: z.coerce.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * GET /api/admin/community/posts
 * @description 获取社区帖子列表，支持状态筛选和分页
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
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

      const { page, pageSize, status, userId, startDate, endDate } = validation.data;

      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (userId) where.userId = userId;
      if (startDate || endDate) {
        where.createdAt = {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lte: new Date(endDate + 'T23:59:59.999Z') } : {}),
        };
      }

      const [records, total] = await Promise.all([
        prisma.communityPost.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                nickname: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.communityPost.count({ where }),
      ]);

      const list = records.map(r => ({
        ...r,
        userPhone: r.user?.phone || '',
        images: [r.platformImage, r.receiptImage].filter(Boolean),
        withdrawAmount: r.withdrawAmount ? String(r.withdrawAmount) : null,
        rewardAmount: r.rewardAmount ? String(r.rewardAmount) : null,
      }));

      return paginatedResponse(list, { page, pageSize, total });
    } catch (error) {
      console.error('[GET /api/admin/community/posts] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取社区帖子列表失败', 500);
    }
  });
}
