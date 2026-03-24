/**
 * @file 关于我们页面内容 API
 * @description 后台管理关于我们页面内容的获取和更新
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第11.5节 - 页面内容配置接口
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import {
  getAboutUsContent,
  updateAboutUsContent,
} from '@/services/content-management.service';

// ================================
// 更新关于我们的请求体验证Schema
// ================================
const updateAboutUsSchema = z.object({
  content: z.string().min(1, '内容不能为空'),
});

// ================================
// GET /api/admin/page-content/about - 获取关于我们页面内容
// ================================
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      const result = await getAboutUsContent();
      return successResponse(result);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[关于我们] 获取失败:', error);
      return errorResponse('SYSTEM_ERROR', '获取页面内容失败', 500);
    }
  });
}

// ================================
// PUT /api/admin/page-content/about - 更新关于我们页面内容
// ================================
export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const body = await req.json();
      
      // 验证请求体
      const parseResult = updateAboutUsSchema.safeParse(body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }

      await updateAboutUsContent(parseResult.data.content);
      
      // 获取更新后的数据返回
      const result = await getAboutUsContent();
      return successResponse(result, '更新成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[关于我们] 更新失败:', error);
      return errorResponse('SYSTEM_ERROR', '更新页面内容失败', 500);
    }
  });
}
