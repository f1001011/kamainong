/**
 * @file 社区帖子详情 / 删除接口
 * @description GET/DELETE /api/admin/community/posts/:id
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/community/posts/:id
 * @description 获取单个帖子详情
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      const { id } = await params;
      const postId = parseInt(id, 10);
      if (isNaN(postId)) {
        return errorResponse('VALIDATION_ERROR', '无效的帖子ID', 400);
      }

      const post = await prisma.communityPost.findUnique({
        where: { id: postId },
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              nickname: true,
              avatar: true,
              vipLevel: true,
            },
          },
        },
      });

      if (!post) {
        return errorResponse('NOT_FOUND', '帖子不存在', 404);
      }

      return successResponse(post);
    } catch (error) {
      console.error('[GET /api/admin/community/posts/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取帖子详情失败', 500);
    }
  });
}

/**
 * DELETE /api/admin/community/posts/:id
 * @description 删除帖子
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (_req, adminId) => {
    try {
      const { id } = await params;
      const postId = parseInt(id, 10);
      if (isNaN(postId)) {
        return errorResponse('VALIDATION_ERROR', '无效的帖子ID', 400);
      }

      const post = await prisma.communityPost.findUnique({
        where: { id: postId },
      });
      if (!post) {
        return errorResponse('NOT_FOUND', '帖子不存在', 404);
      }

      await prisma.communityPost.delete({ where: { id: postId } });

      console.log(`[审计] 管理员(${adminId}) 删除社区帖子 #${postId}`);
      return successResponse({ id: postId }, '帖子已删除');
    } catch (error) {
      console.error('[DELETE /api/admin/community/posts/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '删除帖子失败', 500);
    }
  });
}
