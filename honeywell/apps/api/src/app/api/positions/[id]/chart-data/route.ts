/**
 * @file 持仓收益图表数据接口
 * @description GET /api/positions/:id/chart-data - 获取用于图表绘制的轻量级收益数据
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { positionService } from '@/services/position.service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (_req, userId) => {
    const { id } = await context.params;
    const positionId = parseInt(id, 10);

    if (isNaN(positionId) || positionId <= 0) {
      return errorResponse('VALIDATION_ERROR', 'معرف الطلب غير صالح', 400);
    }

    const result = await positionService.getChartData(userId, positionId);
    return successResponse(result);
  });
}
