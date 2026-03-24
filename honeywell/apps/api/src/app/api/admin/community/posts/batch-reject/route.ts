/**
 * @file 社区帖子批量拒绝接口
 * @description POST /api/admin/community/posts/batch-reject
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

const bodySchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, '至少选择一条帖子'),
  reason: z.string().optional(),
});

/**
 * POST /api/admin/community/posts/batch-reject
 * @description 批量拒绝帖子
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const body = await req.json();
      const validation = bodySchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          validation.error.errors.map(e => e.message).join(', '),
          400
        );
      }

      const { ids, reason } = validation.data;

      const result = await prisma.communityPost.updateMany({
        where: { id: { in: ids }, status: 'PENDING' },
        data: {
          status: 'REJECTED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      console.log(
        `[审计] 管理员(${adminId}) 批量拒绝 ${result.count} 条帖子，原因: ${reason || '无'}`
      );

      return successResponse(
        { rejectedCount: result.count, skippedCount: ids.length - result.count },
        '批量拒绝完成'
      );
    } catch (error) {
      console.error('[POST /api/admin/community/posts/batch-reject] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '批量拒绝失败', 500);
    }
  });
}
