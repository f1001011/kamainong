/**
 * @file 批量审核拒绝接口
 * @description POST /api/admin/withdraw-orders/batch-reject
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第5.6节
 *
 * 处理流程：
 * - 每个订单独立事务处理
 * - 部分失败不影响其他订单
 * - 统一拒绝原因
 * - 返回每个订单的处理结果
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { adminWithdrawService } from '@/services/admin-withdraw.service';

interface BatchRejectRequestBody {
  ids: number[];
  reason?: string;
}

/**
 * 批量审核拒绝
 * @route POST /api/admin/withdraw-orders/batch-reject
 * @auth 需要管理员登录
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      // 解析请求体
      const body: BatchRejectRequestBody = await req.json();

      // 参数校验
      if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
        return errorResponse('VALIDATION_ERROR', '请选择要拒绝的订单');
      }

      // 批量审核拒绝
      const result = await adminWithdrawService.batchReject(
        body.ids,
        adminId,
        body.reason
      );

      // 根据结果返回不同消息
      let message = '批量拒绝成功';
      if (result.failed > 0 && result.succeeded > 0) {
        message = '部分操作成功';
      } else if (result.failed > 0 && result.succeeded === 0) {
        message = '操作失败';
      }

      return successResponse(result, message);
    } catch (error) {
      console.error('[Withdraw Batch Reject Error]', error);
      return errorResponse('INTERNAL_ERROR', '批量审核拒绝失败');
    }
  });
}
