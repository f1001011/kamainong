import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/auth';
import { getPosts, createPost } from '@/services/community.service';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, userId) => {
    try {
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
      const result = await getPosts(page, pageSize, userId);
      return successResponse(result);
    } catch (error) {
      console.error('[Community] 获取帖子失败:', error);
      return errorResponse('INTERNAL_ERROR', 'Error al obtener publicaciones', 500);
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, userId) => {
    try {
      const body = await req.json();
      const { withdrawOrderId, platformImage, receiptImage, content } = body;
      if (!withdrawOrderId || !platformImage || !receiptImage) {
        return errorResponse('VALIDATION_ERROR', 'بيانات غير مكتملة', 400);
      }
      const post = await createPost(userId, { withdrawOrderId, platformImage, receiptImage, content });
      return successResponse({ id: post.id }, 'تم إرسال المنشور للمراجعة');
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        const bizError = error as { code: string; message: string; httpStatus: number };
        return errorResponse(bizError.code, bizError.message, bizError.httpStatus);
      }
      console.error('[Community] 创建帖子失败:', error);
      return errorResponse('INTERNAL_ERROR', 'خطأ في إنشاء المنشور', 500);
    }
  });
}
