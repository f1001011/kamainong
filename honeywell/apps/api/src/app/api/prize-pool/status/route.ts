import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/auth';
import { getPrizePoolStatus } from '@/services/prize-pool.service';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, userId) => {
    try {
      const status = await getPrizePoolStatus(userId);
      return successResponse(status);
    } catch (error) {
      console.error('[PrizePool] 获取状态失败:', error);
      return errorResponse('INTERNAL_ERROR', 'Error al obtener estado', 500);
    }
  });
}
