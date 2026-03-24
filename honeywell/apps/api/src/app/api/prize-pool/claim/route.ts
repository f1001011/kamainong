import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/auth';
import { claimPrizePool } from '@/services/prize-pool.service';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, userId) => {
    try {
      const body = await req.json();
      const tierId = body.tierId;
      if (!tierId) return errorResponse('VALIDATION_ERROR', 'tierId مطلوب', 400);
      await claimPrizePool(userId, tierId);
      return successResponse(null, 'تمت المطالبة بالجائزة بنجاح');
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        const bizError = error as { code: string; message: string; httpStatus: number };
        return errorResponse(bizError.code, bizError.message, bizError.httpStatus);
      }
      console.error('[PrizePool] 领取失败:', error);
      return errorResponse('INTERNAL_ERROR', 'Error al reclamar', 500);
    }
  });
}
