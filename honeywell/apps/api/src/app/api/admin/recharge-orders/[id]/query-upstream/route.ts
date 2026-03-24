/**
 * @file 查询上游状态API
 * @description 后台管理端 - 查询充值订单在上游支付通道的状态，支持补单
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第4节 - 充值订单接口
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { adminRechargeOrderService } from '@/services/admin-recharge-order.service';

/**
 * POST /api/admin/recharge-orders/:id/query-upstream
 * @description 查询单个充值订单的上游状态
 */
export async function POST(
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

      const result = await adminRechargeOrderService.queryUpstream(orderId);

      if (!result.success) {
        return errorResponse(
          result.error?.code || 'QUERY_FAILED',
          result.error?.message || '查询上游失败',
          400
        );
      }

      return successResponse({
        id: result.id,
        success: result.success,
        upstreamStatus: result.upstreamStatus,
        compensated: result.compensated,
      });
    } catch (error) {
      console.error('[POST /api/admin/recharge-orders/:id/query-upstream] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '查询上游状态失败', 500);
    }
  });
}
