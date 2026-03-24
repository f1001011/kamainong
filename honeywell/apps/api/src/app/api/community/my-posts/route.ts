import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/auth';
import { getMyPosts } from '@/services/community.service';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, userId) => {
    try {
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
      const result = await getMyPosts(userId, page, pageSize);
      return successResponse(result);
    } catch (error) {
      console.error('[Community] 获取我的帖子失败:', error);
      return errorResponse('INTERNAL_ERROR', 'Error', 500);
    }
  });
}
