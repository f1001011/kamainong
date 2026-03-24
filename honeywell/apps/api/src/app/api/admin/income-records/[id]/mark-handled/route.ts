/**
 * @file 标记异常已处理接口
 * @description POST /api/admin/income-records/:id/mark-handled
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第18.4节
 *
 * 请求体：
 * - remark: 处理备注（可选）
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
 * 请求体校验
 */
const bodySchema = z.object({
  remark: z.string().max(500).optional(),
});

/**
 * POST /api/admin/income-records/:id/mark-handled
 * @description 标记异常已处理
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      // 解析路径参数
      const resolvedParams = await params;
      const paramsValidation = paramsSchema.safeParse({ id: resolvedParams.id });
      if (!paramsValidation.success) {
        return errorResponse('VALIDATION_ERROR', '记录ID格式不正确', 400);
      }

      const recordId = paramsValidation.data.id;

      // 解析请求体（可选）
      let remark: string | undefined;
      try {
        const body = await req.json();
        const bodyValidation = bodySchema.safeParse(body);
        if (bodyValidation.success) {
          remark = bodyValidation.data.remark;
        }
      } catch {
        // 请求体为空或解析失败，使用默认值
      }

      // 执行标记处理
      await adminIncomeRecordService.markHandled(recordId, adminId, remark);

      return successResponse(null, '已标记为已处理');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error(
        '[POST /api/admin/income-records/:id/mark-handled] 错误:',
        error
      );
      return errorResponse('INTERNAL_ERROR', '标记处理失败', 500);
    }
  });
}
