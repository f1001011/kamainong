/**
 * @file 手动补发收益接口
 * @description POST /api/admin/income-records/:id/retry
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第18.3节
 *
 * 核心逻辑：
 * - 无需请求体，直接重试发放
 * - 检查用户状态，封禁用户无法补发
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { adminIncomeRecordService } from '@/services/admin-income-record.service';
import { BusinessError } from '@/lib/errors';

/**
 * 路径参数校验
 */
const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * POST /api/admin/income-records/:id/retry
 * @description 手动补发收益
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (_req, adminId) => {
    try {
      // 解析路径参数
      const resolvedParams = await params;
      const paramsValidation = paramsSchema.safeParse({ id: resolvedParams.id });
      if (!paramsValidation.success) {
        return errorResponse('VALIDATION_ERROR', '记录ID格式不正确', 400);
      }

      const recordId = paramsValidation.data.id;

      // 执行补发
      const result = await adminIncomeRecordService.retryIncome(
        recordId,
        adminId
      );

      return successResponse(result, '补发成功');
    } catch (error) {
      // 文档要求：单个补发失败时使用 INCOME_SETTLE_FAILED 错误码，消息包含具体原因
      if (error instanceof BusinessError) {
        return errorResponse(
          'INCOME_SETTLE_FAILED',
          `补发失败：${error.message}`,
          error.httpStatus
        );
      }
      console.error('[POST /api/admin/income-records/:id/retry] 错误:', error);
      return errorResponse('INCOME_SETTLE_FAILED', '补发失败：系统错误', 500);
    }
  });
}
