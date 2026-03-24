/**
 * @file 提现订单详情接口
 * @description GET /api/admin/withdraw-orders/:id
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第5.2节
 *
 * 返回数据：
 * - 订单基本信息
 * - 完整银行卡快照（后台可见完整账号和证件号）
 * - 审核信息（审核人、审核时间）
 * - 回调信息
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
 * 获取提现订单详情
 * @route GET /api/admin/withdraw-orders/:id
 * @auth 需要管理员登录
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      const { id } = await params;
      const orderId = parseInt(id);

      if (isNaN(orderId)) {
        return errorResponse('VALIDATION_ERROR', '无效的订单ID');
      }

      // 获取订单详情
      const detail = await adminWithdrawService.getOrderDetail(orderId);

      return successResponse(detail, '获取提现订单详情成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[Withdraw Order Detail Error]', error);
      return errorResponse('INTERNAL_ERROR', '获取提现订单详情失败');
    }
  });
}
