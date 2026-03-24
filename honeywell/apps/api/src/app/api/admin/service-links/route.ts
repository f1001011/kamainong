/**
 * @file 客服链接配置 API
 * @description 后台管理客服链接配置的获取和更新
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第11.3节 - 客服链接配置接口
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import {
  getServiceLinks,
  updateServiceLinks,
} from '@/services/content-management.service';

// ================================
// 客服链接项Schema
// ================================
const serviceLinkSchema = z.object({
  name: z.string().min(1, '链接名称不能为空').max(50, '链接名称不能超过50个字符'),
  icon: z.string().min(1, '图标不能为空'),
  url: z.string().url('无效的URL格式'),
  isActive: z.boolean().optional().default(true),
});

// ================================
// 更新客服链接的请求体验证Schema
// ================================
const updateServiceLinksSchema = z.object({
  list: z.array(serviceLinkSchema).max(10, '客服链接最多10个'),
});

// ================================
// GET /api/admin/service-links - 获取客服链接配置
// ================================
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      const result = await getServiceLinks();
      return successResponse(result);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[客服链接] 获取失败:', error);
      return errorResponse('SYSTEM_ERROR', '获取客服链接配置失败', 500);
    }
  });
}

// ================================
// PUT /api/admin/service-links - 更新客服链接配置
// ================================
export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const body = await req.json();
      
      // 验证请求体
      const parseResult = updateServiceLinksSchema.safeParse(body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }

      await updateServiceLinks(parseResult.data.list);
      
      // 获取更新后的数据返回
      const result = await getServiceLinks();
      return successResponse(result, '更新成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[客服链接] 更新失败:', error);
      return errorResponse('SYSTEM_ERROR', '更新客服链接配置失败', 500);
    }
  });
}
