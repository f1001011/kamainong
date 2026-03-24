/**
 * @file 驳回代付失败订单接口
 * @description POST /api/admin/withdraw-orders/:id/dismiss
 * 
 * 处理流程：
 * 1. 检查订单状态（必须是 PAYOUT_FAILED）
 * 2. 退回余额（冻结 → 可用）
 * 3. 更新订单状态为 FAILED
 * 4. 通知用户退款
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
 * 驳回代付失败订单
 * @route POST /api/admin/withdraw-orders/:id/dismiss
 * @auth 需要管理员登录
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const { id } = await params;
      const orderId = parseInt(id);

      if (isNaN(orderId)) {
        return errorResponse('VALIDATION_ERROR', '无效的订单ID');
      }

      // 解析请求体（可选的驳回原因）
      let reason: string | undefined;
      try {
        const body = await req.json();
        reason = body.reason;
      } catch {
        // 无请求体，使用默认原因
      }

      // 驳回代付失败订单，退回余额
      await adminWithdrawService.dismissPayoutFailed(orderId, adminId, reason);

      return successResponse(null, '已驳回，余额已退回用户');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[Withdraw Dismiss Error]', error);
      return errorResponse('INTERNAL_ERROR', '驳回操作失败');
    }
  });
}
