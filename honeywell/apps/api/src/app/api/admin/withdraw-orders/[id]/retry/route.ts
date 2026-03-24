/**
 * @file 重试代付接口
 * @description POST /api/admin/withdraw-orders/:id/retry
 * 
 * 处理流程：
 * 1. 检查订单状态（必须是 PAYOUT_FAILED）
 * 2. 检查重试次数（最多 5 次）
 * 3. 验证目标通道可用
 * 4. 更新订单状态为 APPROVED
 * 5. 提交到新通道代付
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
 * 重试代付
 * @route POST /api/admin/withdraw-orders/:id/retry
 * @auth 需要管理员登录
 * @body { channelId: number } 目标通道ID
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const { id } = await params;
      const orderId = parseInt(id);

      if (isNaN(orderId)) {
        return errorResponse('VALIDATION_ERROR', '无效的订单ID');
      }

      // 解析请求体
      const body = await req.json();
      const { channelId } = body;

      if (!channelId || typeof channelId !== 'number') {
        return errorResponse('VALIDATION_ERROR', '请选择目标代付通道');
      }

      // 重试代付
      await adminWithdrawService.retryPayout(orderId, adminId, channelId);

      return successResponse(null, '已重新提交代付');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[Withdraw Retry Error]', error);
      return errorResponse('INTERNAL_ERROR', '重试代付失败');
    }
  });
}
