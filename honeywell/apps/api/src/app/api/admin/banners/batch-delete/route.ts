/**
 * @file Banner管理 - 批量删除 API
 * @description 后台管理 Banner 批量删除
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第11.1节 - Banner管理接口
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { batchDeleteBanner } from '@/services/content-management.service';

// ================================
// 批量删除请求体验证Schema
// ================================
const batchDeleteSchema = z.object({
  ids: z.array(z.number().int().positive('Banner ID必须为正整数')).min(1, 'ID列表不能为空'),
});

// ================================
// POST /api/admin/banners/batch-delete - 批量删除 Banner
// ================================
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const body = await req.json();
      
      // 验证请求体
      const parseResult = batchDeleteSchema.safeParse(body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }

      const { ids } = parseResult.data;
      const result = await batchDeleteBanner(ids);

      return successResponse(result, '批量删除成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[Banner批量删除] 删除失败:', error);
      return errorResponse('SYSTEM_ERROR', '批量删除Banner失败', 500);
    }
  });
}
