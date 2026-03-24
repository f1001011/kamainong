import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/auth';
import { toggleLike } from '@/services/community.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, userId) => {
    try {
      const { id } = await params;
      const postId = parseInt(id, 10);
      const result = await toggleLike(userId, postId);
      return successResponse(result);
    } catch (error) {
      console.error('[Community] 点赞失败:', error);
      return errorResponse('INTERNAL_ERROR', 'Error', 500);
    }
  });
}
