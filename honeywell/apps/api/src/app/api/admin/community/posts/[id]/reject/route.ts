/**
 * @file 社区帖子审核拒绝接口
 * @description PUT /api/admin/community/posts/:id/reject
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const bodySchema = z.object({
  reason: z.string().optional(),
});

/**
 * PUT /api/admin/community/posts/:id/reject
 * @description 拒绝帖子，可附带拒绝理由
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const { id } = await params;
      const postId = parseInt(id, 10);
      if (isNaN(postId)) {
        return errorResponse('VALIDATION_ERROR', '无效的帖子ID', 400);
      }

      const body = await req.json().catch(() => ({}));
      const validation = bodySchema.safeParse(body);
      if (!validation.success) {
        return errorResponse('VALIDATION_ERROR', '参数校验失败', 400);
      }

      const post = await prisma.communityPost.findUnique({
        where: { id: postId },
      });
      if (!post) {
        return errorResponse('NOT_FOUND', '帖子不存在', 404);
      }
      if (post.status !== 'PENDING') {
        return errorResponse('INVALID_STATUS', '该帖子已被审核，无法重复操作', 400);
      }

      await prisma.communityPost.update({
        where: { id: postId },
        data: {
          status: 'REJECTED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      console.log(
        `[审计] 管理员(${adminId}) 拒绝帖子 #${postId}，原因: ${validation.data.reason || '无'}`
      );

      return successResponse({ id: postId }, '帖子已拒绝');
    } catch (error) {
      console.error('[PUT /api/admin/community/posts/:id/reject] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '拒绝帖子失败', 500);
    }
  });
}
