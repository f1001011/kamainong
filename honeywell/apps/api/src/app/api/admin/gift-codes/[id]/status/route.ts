/**
 * @file 礼品码状态切换接口
 * @description PUT /api/admin/gift-codes/:id/status - 启用/禁用礼品码
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { toggleGiftCodeStatus } from '@/services/gift-code.service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const { id } = await params;
      const giftCodeId = parseInt(id, 10);
      if (isNaN(giftCodeId)) {
        return errorResponse('VALIDATION_ERROR', '无效的礼品码ID', 400);
      }

      const body = await req.json();
      const enabled = Boolean(body.enabled);

      await toggleGiftCodeStatus(giftCodeId, enabled);
      return successResponse(null, enabled ? '礼品码已启用' : '礼品码已禁用');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[PUT /api/admin/gift-codes/:id/status] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
