import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/auth';
import { executeSpin } from '@/services/spin-wheel.service';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, userId) => {
    try {
      const result = await executeSpin(userId);
      return successResponse(result);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        const bizError = error as { code: string; message: string; httpStatus: number };
        return errorResponse(bizError.code, bizError.message, bizError.httpStatus);
      }
      console.error('[SpinWheel] 抽奖失败:', error);
      return errorResponse('INTERNAL_ERROR', 'خطأ في الدوران', 500);
    }
  });
}
