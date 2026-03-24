/**
 * @file 批量终止持仓订单API
 * @description 后台管理端 - 批量终止持仓订单
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { batchTerminatePositionOrders } from '@/services/admin-position-order.service';
import { BusinessError } from '@/lib/errors';

const bodySchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(50),
  reason: z.string().max(500).optional(),
});

/**
 * POST /api/admin/position-orders/batch-terminate
 * @description 批量终止持仓订单
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const body = await req.json();

      const bodyValidation = bodySchema.safeParse(body);
      if (!bodyValidation.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          bodyValidation.error.errors.map((e) => e.message).join(', '),
          400
        );
      }

      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;

      const result = await batchTerminatePositionOrders(adminId, bodyValidation.data, ip);

      return successResponse(result);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/position-orders/batch-terminate] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '批量终止持仓订单失败', 500);
    }
  });
}
