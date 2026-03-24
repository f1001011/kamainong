/**
 * @file 查询上游状态接口
 * @description POST /api/admin/withdraw-orders/:id/query-upstream
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md
 *
 * 功能说明：
 * - 主动查询代付通道订单状态
 * - 用于排查问题（如本地状态与上游不一致）
 * - 自动进行补偿处理（如上游已成功但本地未更新）
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { adminWithdrawService } from '@/services/admin-withdraw.service';
import { BusinessError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 查询上游状态
 * @route POST /api/admin/withdraw-orders/:id/query-upstream
 * @auth 需要管理员登录
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      const { id } = await params;
      const orderId = parseInt(id);

      if (isNaN(orderId)) {
        return errorResponse('VALIDATION_ERROR', '无效的订单ID');
      }

      // 查询上游状态
      const result = await adminWithdrawService.queryUpstream(orderId);

      return successResponse(result, '查询上游状态成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[Withdraw Query Upstream Error]', error);
      return errorResponse('INTERNAL_ERROR', '查询上游状态失败');
    }
  });
}
