import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { getSpinPrizes } from '@/services/spin-wheel.service';

export async function GET(request: NextRequest) {
  try {
    const prizes = await getSpinPrizes();
    return successResponse(prizes.map(p => ({
      id: p.id,
      name: p.name,
      amount: p.amount.toString(),
      sortOrder: p.sortOrder,
    })));
  } catch (error) {
    console.error('[SpinWheel] 获取奖品失败:', error);
    return errorResponse('INTERNAL_ERROR', 'Error al obtener premios', 500);
  }
}
