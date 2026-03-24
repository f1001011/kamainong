import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/auth';
import { getSpinChances } from '@/services/spin-wheel.service';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, userId) => {
    try {
      const chances = await getSpinChances(userId);
      return successResponse(chances);
    } catch (error) {
      console.error('[SpinWheel] 获取状态失败:', error);
      return errorResponse('INTERNAL_ERROR', 'Error al obtener estado', 500);
    }
  });
}
