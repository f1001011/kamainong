/**
 * @file 批量补发收益接口
 * @description POST /api/admin/income-records/batch-retry
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第18.5节
 *
 * 请求体：
 * - ids: 收益记录ID数组
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { adminIncomeRecordService } from '@/services/admin-income-record.service';
import { BusinessError } from '@/lib/errors';

/**
 * 请求体校验
 */
const bodySchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, '请选择至少一条记录'),
});

/**
 * POST /api/admin/income-records/batch-retry
 * @description 批量补发收益
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const body = await req.json();
      const validationResult = bodySchema.safeParse(body);

      if (!validationResult.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          validationResult.error.errors.map((e) => e.message).join(', '),
          400
        );
      }

      const { ids } = validationResult.data;
      const result = await adminIncomeRecordService.batchRetry(ids, adminId);

      const message =
        result.failed === 0
          ? '批量补发成功'
          : `批量补发完成：成功${result.succeeded}个，失败${result.failed}个`;

      return successResponse(result, message);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/income-records/batch-retry] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '批量补发失败', 500);
    }
  });
}
