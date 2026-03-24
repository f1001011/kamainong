/**
 * @file Banner管理 - 批量启用/禁用 API
 * @description 后台管理 Banner 批量状态更新
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第11.1节 - Banner管理接口
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { batchUpdateBannerStatus } from '@/services/content-management.service';

// ================================
// 批量状态更新请求体验证Schema
// ================================
const batchStatusSchema = z.object({
  ids: z.array(z.number().int().positive('Banner ID必须为正整数')).min(1, 'ID列表不能为空'),
  isActive: z.boolean({ required_error: '状态字段必填' }),
});

// ================================
// POST /api/admin/banners/batch-status - 批量启用/禁用 Banner
// ================================
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const body = await req.json();
      
      // 验证请求体
      const parseResult = batchStatusSchema.safeParse(body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }

      const { ids, isActive } = parseResult.data;
      const result = await batchUpdateBannerStatus(ids, isActive);

      return successResponse(result, isActive ? '批量启用成功' : '批量禁用成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[Banner批量状态] 更新失败:', error);
      return errorResponse('SYSTEM_ERROR', '批量更新Banner状态失败', 500);
    }
  });
}
