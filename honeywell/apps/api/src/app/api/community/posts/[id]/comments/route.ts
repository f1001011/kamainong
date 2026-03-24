import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/auth';
import { addComment, getComments } from '@/services/community.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, userId) => {
    try {
      const { id } = await params;
      const postId = parseInt(id, 10);
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
      const result = await getComments(postId, page, pageSize);
      return successResponse(result);
    } catch (error) {
      console.error('[Community] 获取评论失败:', error);
      return errorResponse('INTERNAL_ERROR', 'Error', 500);
    }
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, userId) => {
    try {
      const { id } = await params;
      const postId = parseInt(id, 10);
      const body = await req.json();
      if (!body.content?.trim()) {
        return errorResponse('VALIDATION_ERROR', 'المحتوى مطلوب', 400);
      }
      const comment = await addComment(userId, postId, body.content.trim());
      return successResponse({ id: comment.id }, 'تم إرسال التعليق');
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        const bizError = error as { code: string; message: string; httpStatus: number };
        return errorResponse(bizError.code, bizError.message, bizError.httpStatus);
      }
      console.error('[Community] 评论失败:', error);
      return errorResponse('INTERNAL_ERROR', 'Error', 500);
    }
  });
}
