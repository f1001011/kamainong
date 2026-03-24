/**
 * @file 礼品码兑换历史接口
 * @description GET /api/gift-code/history - 获取用户礼品码兑换记录
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getUserRedeemHistory } from '@/services/gift-code.service';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, userId) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

      const result = await getUserRedeemHistory(userId, page, pageSize);
      return successResponse(result);
    } catch (error) {
      console.error('[GET /api/gift-code/history] 错误:', error);
      return errorResponse('INTERNAL_ERROR', 'Error del servidor', 500);
    }
  });
}
