/**
 * @file 银行状态更新 API
 * @description PUT /api/admin/banks/:id/status - 启用/禁用银行
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第12.10节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { updateBankStatus } from '@/services/system-settings.service';

// ================================
// 更新状态请求体校验 Schema
// ================================
const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

// ================================
// PUT /api/admin/banks/:id/status - 启用/禁用银行
// ================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const { id } = await params;
      const bankId = parseInt(id, 10);
      
      if (isNaN(bankId)) {
        return errorResponse('VALIDATION_ERROR', '银行ID无效', 400);
      }
      
      const body = await req.json();
      
      // 校验请求体
      const parseResult = updateStatusSchema.safeParse(body);
      if (!parseResult.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          parseResult.error.errors[0]?.message || '参数校验失败',
          400
        );
      }
      
      const result = await updateBankStatus(bankId, parseResult.data.isActive);
      
      return successResponse(result, parseResult.data.isActive ? '启用银行成功' : '禁用银行成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[PUT /api/admin/banks/:id/status] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
