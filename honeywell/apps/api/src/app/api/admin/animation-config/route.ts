/**
 * @file 动画配置 API
 * @description GET /api/admin/animation-config - 获取动画配置
 *              PUT /api/admin/animation-config - 更新动画配置
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第12.10节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import {
  getAnimationConfig,
  updateAnimationConfig,
} from '@/services/system-settings.service';

// ================================
// 更新动画配置请求体校验 Schema
// ================================
const updateAnimationSchema = z.object({
  animationEnabled: z.boolean().optional(),
  animationSpeed: z.number().min(0.1).max(3).optional(),
  reducedMotion: z.boolean().optional(),
  celebrationEffect: z.boolean().optional(),
  pageTransition: z.boolean().optional(),
  skeletonLoading: z.boolean().optional(),
  pullToRefresh: z.boolean().optional(),
});

// ================================
// GET /api/admin/animation-config - 获取动画配置
// ================================
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const config = await getAnimationConfig();
      return successResponse(config, '获取动画配置成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/animation-config] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}

// ================================
// PUT /api/admin/animation-config - 更新动画配置
// ================================
export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const body = await req.json();
      
      // 校验请求体
      const parseResult = updateAnimationSchema.safeParse(body);
      if (!parseResult.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          parseResult.error.errors[0]?.message || '参数校验失败',
          400
        );
      }
      
      await updateAnimationConfig(parseResult.data);
      
      // 获取更新后的配置返回
      const updated = await getAnimationConfig();
      
      return successResponse(updated, '更新动画配置成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[PUT /api/admin/animation-config] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
