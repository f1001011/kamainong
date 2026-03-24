/**
 * @file 审核拒绝接口
 * @description POST /api/admin/withdraw-orders/:id/reject
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第5.4节
 *
 * 处理流程：
 * 1. 检查订单状态（必须是 PENDING_REVIEW）
 * 2. 更新订单状态为 REJECTED
 * 3. 记录拒绝原因、审核人和审核时间
 * 4. 退回冻结余额到可用余额
 * 5. 创建资金流水
 * 6. 发送站内通知
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { adminWithdrawService } from '@/services/admin-withdraw.service';
import { BusinessError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface RejectRequestBody {
  reason?: string;
}

/**
 * 审核拒绝
 * @route POST /api/admin/withdraw-orders/:id/reject
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

      // 解析请求体（reason 选填）
      let body: RejectRequestBody = {};
      try {
        const text = await req.text();
        if (text) {
          body = JSON.parse(text);
        }
      } catch {
        // 允许无请求体
      }

      // 审核拒绝
      await adminWithdrawService.rejectOrder(orderId, adminId, body.reason);

      return successResponse(null, '已拒绝，余额已退回');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[Withdraw Reject Error]', error);
      return errorResponse('INTERNAL_ERROR', '审核拒绝失败');
    }
  });
}
