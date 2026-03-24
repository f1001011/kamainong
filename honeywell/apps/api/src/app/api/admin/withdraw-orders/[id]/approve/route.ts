/**
 * @file 审核通过接口
 * @description POST /api/admin/withdraw-orders/:id/approve
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第5.3节
 *
 * 处理流程：
 * 1. 检查订单状态（必须是 PENDING_REVIEW）
 * 2. 更新订单状态为 APPROVED
 * 3. 记录审核人和审核时间
 * 4. 异步调用代付通道
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
 * 审核通过
 * @route POST /api/admin/withdraw-orders/:id/approve
 * @auth 需要管理员登录
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (_req, adminId) => {
    try {
      const { id } = await params;
      const orderId = parseInt(id);

      if (isNaN(orderId)) {
        return errorResponse('VALIDATION_ERROR', '无效的订单ID');
      }

      // 审核通过
      await adminWithdrawService.approveOrder(orderId, adminId);

      return successResponse(null, '审核通过，已提交代付');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[Withdraw Approve Error]', error);
      return errorResponse('INTERNAL_ERROR', '审核通过失败');
    }
  });
}
