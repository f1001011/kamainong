/**
 * @file Banner管理 - 排序 API
 * @description 后台管理 Banner 排序
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第11.1节 - Banner管理接口
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { updateBannerSort } from '@/services/content-management.service';

// ================================
// 排序请求体验证Schema
// ================================
const sortBannersSchema = z.object({
  items: z.array(
    z.object({
      id: z.number().int().positive('Banner ID必须为正整数'),
      sortOrder: z.number().int().min(0, '排序值不能为负数'),
    })
  ).min(1, '排序列表不能为空'),
});

// ================================
// PUT /api/admin/banners/sort - 更新 Banner 排序
// ================================
export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const body = await req.json();
      
      // 验证请求体
      const parseResult = sortBannersSchema.safeParse(body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }

      await updateBannerSort(parseResult.data.items);
      return successResponse(null, '排序更新成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[Banner排序] 更新失败:', error);
      return errorResponse('SYSTEM_ERROR', '更新Banner排序失败', 500);
    }
  });
}
