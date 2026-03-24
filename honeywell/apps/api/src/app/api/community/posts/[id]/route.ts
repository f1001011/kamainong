/**
 * GET /api/community/posts/[id] - 获取帖子详情（含评论列表）
 */
import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, userId) => {
    try {
      const { id } = await params;
      const postId = parseInt(id, 10);

      if (isNaN(postId)) {
        return errorResponse('VALIDATION_ERROR', 'معرف غير صالح', 400);
      }

      const post = await prisma.communityPost.findFirst({
        where: {
          id: postId,
          OR: [
            { status: 'APPROVED' },
            { userId },
          ],
        },
        include: {
          user: { select: { id: true, nickname: true, avatar: true } },
          comments: {
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
              user: { select: { id: true, nickname: true, avatar: true } },
            },
          },
          _count: { select: { comments: true, likes: true } },
        },
      });

      if (!post) {
        return errorResponse('NOT_FOUND', 'المنشور غير موجود', 404);
      }

      const liked = await prisma.communityLike.findUnique({
        where: { postId_userId: { postId, userId } },
      });

      return successResponse({
        post: {
          id: post.id,
          userId: post.userId,
          userName: post.user.nickname ?? `User${post.userId}`,
          userAvatar: post.user.avatar,
          withdrawAmount: post.withdrawAmount ? Number(post.withdrawAmount) : 0,
          platformScreenshot: post.platformImage,
          receiptScreenshot: post.receiptImage,
          content: post.content,
          likeCount: post._count.likes,
          commentCount: post._count.comments,
          isLiked: !!liked,
          createdAt: post.createdAt.toISOString(),
        },
        comments: post.comments.map(c => ({
          id: c.id,
          userId: c.userId,
          userName: c.user.nickname ?? `User${c.userId}`,
          userAvatar: c.user.avatar,
          content: c.content,
          createdAt: c.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      console.error('[Community] 获取帖子详情失败:', error);
      return errorResponse('INTERNAL_ERROR', 'خطأ في الحصول على المنشور', 500);
    }
  });
}
