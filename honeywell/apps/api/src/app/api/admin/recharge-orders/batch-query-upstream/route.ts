/**
 * @file 批量查询上游状态API
 * @description 后台管理端 - 批量查询充值订单在上游支付通道的状态，支持补单
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第4.3节 - 批量查询上游
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { adminRechargeOrderService } from '@/services/admin-recharge-order.service';
import { BusinessError } from '@/lib/errors';

/**
 * 请求参数校验模式
 */
const requestSchema = z.object({
  ids: z
    .array(z.number().int().positive())
    .min(1, '至少选择一个订单')
    .max(50, '单次最多查询50个订单'),
});

/**
 * POST /api/admin/recharge-orders/batch-query-upstream
 * @description 批量查询充值订单的上游状态
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const body = await req.json();

      const validationResult = requestSchema.safeParse(body);
      if (!validationResult.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          validationResult.error.errors.map((e) => e.message).join(', '),
          400
        );
      }

      const { ids } = validationResult.data;

      const result = await adminRechargeOrderService.batchQueryUpstream(ids);

      // 依据：02.4-后台API接口清单.md 第4.3节 - 返回格式
      return successResponse({
        total: result.total,
        succeeded: result.succeeded,
        failed: result.failed,
        results: result.results,
      });
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/recharge-orders/batch-query-upstream] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '批量查询上游状态失败', 500);
    }
  });
}
