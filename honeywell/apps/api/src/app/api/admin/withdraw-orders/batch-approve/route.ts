/**
 * @file 批量审核通过接口
 * @description POST /api/admin/withdraw-orders/batch-approve
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第5.5节
 *
 * 处理流程：
 * - 每个订单独立事务处理
 * - 部分失败不影响其他订单
 * - 返回每个订单的处理结果
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { adminWithdrawService } from '@/services/admin-withdraw.service';

interface BatchApproveRequestBody {
  ids: number[];
}

/**
 * 批量审核通过
 * @route POST /api/admin/withdraw-orders/batch-approve
 * @auth 需要管理员登录
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      // 解析请求体
      const body: BatchApproveRequestBody = await req.json();

      // 参数校验
      if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
        return errorResponse('VALIDATION_ERROR', '请选择要审核的订单');
      }

      // 批量审核通过
      const result = await adminWithdrawService.batchApprove(body.ids, adminId);

      // 根据结果返回不同消息
      let message = '批量审核成功';
      if (result.failed > 0 && result.succeeded > 0) {
        message = '部分操作成功';
      } else if (result.failed > 0 && result.succeeded === 0) {
        message = '操作失败';
      }

      return successResponse(result, message);
    } catch (error) {
      console.error('[Withdraw Batch Approve Error]', error);
      return errorResponse('INTERNAL_ERROR', '批量审核通过失败');
    }
  });
}
