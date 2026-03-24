/**
 * @file 批量标记已处理接口
 * @description POST /api/admin/income-records/batch-mark-handled
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第18.6节
 *
 * 请求体：
 * - ids: 收益记录ID数组
 * - remark: 处理备注（可选）
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
  remark: z.string().max(500).optional(),
});

/**
 * POST /api/admin/income-records/batch-mark-handled
 * @description 批量标记已处理
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

      const { ids, remark } = validationResult.data;
      const result = await adminIncomeRecordService.batchMarkHandled(
        ids,
        adminId,
        remark
      );

      const message =
        result.failed === 0
          ? '批量标记成功'
          : `批量标记完成：成功${result.succeeded}个，失败${result.failed}个`;

      return successResponse(result, message);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error(
        '[POST /api/admin/income-records/batch-mark-handled] 错误:',
        error
      );
      return errorResponse('INTERNAL_ERROR', '批量标记处理失败', 500);
    }
  });
}
