/**
 * @file 充值订单详情API
 * @description 后台管理端 - 获取充值订单详情
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第4节 - 充值订单接口
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { adminRechargeOrderService } from '@/services/admin-recharge-order.service';
import { BusinessError } from '@/lib/errors';

/**
 * GET /api/admin/recharge-orders/:id
 * @description 获取充值订单详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      const { id } = await params;
      const orderId = parseInt(id, 10);

      if (isNaN(orderId)) {
        return errorResponse('VALIDATION_ERROR', '无效的订单ID', 400);
      }

      const order = await adminRechargeOrderService.getDetail(orderId);

      return successResponse(order);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/recharge-orders/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取订单详情失败', 500);
    }
  });
}
