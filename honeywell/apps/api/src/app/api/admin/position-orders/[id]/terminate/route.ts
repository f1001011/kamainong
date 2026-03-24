/**
 * @file 终止持仓订单API
 * @description 后台管理端 - 终止单条持仓订单
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { terminatePositionOrder } from '@/services/admin-position-order.service';
import { BusinessError } from '@/lib/errors';

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const bodySchema = z.object({
  reason: z.string().max(500).optional(),
});

/**
 * POST /api/admin/position-orders/:id/terminate
 * @description 终止单条持仓订单
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const resolvedParams = await params;
      const paramsValidation = paramsSchema.safeParse({ id: resolvedParams.id });
      if (!paramsValidation.success) {
        return errorResponse('VALIDATION_ERROR', '订单ID格式不正确', 400);
      }

      const orderId = paramsValidation.data.id;

      // 解析请求体
      let body = {};
      try {
        body = await req.json();
      } catch {
        // 空 body 也可以
      }

      const bodyValidation = bodySchema.safeParse(body);
      if (!bodyValidation.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          bodyValidation.error.errors.map((e) => e.message).join(', '),
          400
        );
      }

      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;

      const result = await terminatePositionOrder(orderId, adminId, bodyValidation.data, ip);

      return successResponse(result);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/position-orders/:id/terminate] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '终止持仓订单失败', 500);
    }
  });
}
