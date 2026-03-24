/**
 * @file 银行批量状态更新 API
 * @description POST /api/admin/banks/batch-status - 批量启用/禁用银行
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第12.12节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { batchUpdateBankStatus } from '@/services/system-settings.service';

// ================================
// 批量状态更新请求体校验 Schema
// ================================
const batchStatusSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, '至少选择一个银行'),
  isActive: z.boolean(),
});

// ================================
// POST /api/admin/banks/batch-status - 批量启用/禁用银行
// ================================
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const body = await req.json();
      
      // 校验请求体
      const parseResult = batchStatusSchema.safeParse(body);
      if (!parseResult.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          parseResult.error.errors[0]?.message || '参数校验失败',
          400
        );
      }
      
      const result = await batchUpdateBankStatus(
        parseResult.data.ids,
        parseResult.data.isActive
      );
      
      return successResponse(
        result,
        parseResult.data.isActive ? '批量启用银行成功' : '批量禁用银行成功'
      );
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/banks/batch-status] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
