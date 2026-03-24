/**
 * @file Banner管理 - 详情/更新/删除 API
 * @description 后台管理单个 Banner 的详情查看、更新和删除
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第11.1节 - Banner管理接口
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import {
  getBannerDetail,
  updateBanner,
  deleteBanner,
} from '@/services/content-management.service';

// ================================
// 更新Banner的请求体验证Schema
// ================================
const updateBannerSchema = z.object({
  imageUrl: z.string().min(1, '图片URL不能为空').optional(),
  linkType: z.enum(['NONE', 'URL', 'PRODUCT'], { errorMap: () => ({ message: '无效的跳转类型' }) }).optional(),
  linkUrl: z.string().url('无效的URL格式').nullable().optional(),
  productId: z.number().int().positive('产品ID必须为正整数').nullable().optional(),
  startAt: z.string().datetime({ offset: true }).nullable().optional(),
  endAt: z.string().datetime({ offset: true }).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
}).refine(
  (data) => {
    // 验证有效期逻辑
    if (data.startAt && data.endAt) {
      return new Date(data.endAt) > new Date(data.startAt);
    }
    return true;
  },
  { message: '结束时间必须大于开始时间', path: ['endAt'] }
);

// ================================
// GET /api/admin/banners/:id - Banner 详情
// ================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      const { id } = await params;
      const bannerId = parseInt(id, 10);
      
      if (isNaN(bannerId) || bannerId <= 0) {
        return errorResponse('VALIDATION_ERROR', '无效的Banner ID', 400);
      }

      const banner = await getBannerDetail(bannerId);
      return successResponse(banner);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[Banner详情] 获取失败:', error);
      return errorResponse('SYSTEM_ERROR', '获取Banner详情失败', 500);
    }
  });
}

// ================================
// PUT /api/admin/banners/:id - 更新 Banner
// ================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const { id } = await params;
      const bannerId = parseInt(id, 10);
      
      if (isNaN(bannerId) || bannerId <= 0) {
        return errorResponse('VALIDATION_ERROR', '无效的Banner ID', 400);
      }

      const body = await req.json();
      
      // 验证请求体
      const parseResult = updateBannerSchema.safeParse(body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }

      const data = parseResult.data;

      // 如果更新了跳转类型，检查相关字段
      if (data.linkType === 'URL' && data.linkUrl === null) {
        return errorResponse('VALIDATION_ERROR', 'URL跳转类型必须提供跳转链接', 400);
      }
      if (data.linkType === 'PRODUCT' && (data.productId === null || data.productId === undefined)) {
        return errorResponse('VALIDATION_ERROR', '产品跳转类型必须提供产品ID', 400);
      }

      const banner = await updateBanner(bannerId, data);
      return successResponse(banner, '更新成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[Banner更新] 更新失败:', error);
      return errorResponse('SYSTEM_ERROR', '更新Banner失败', 500);
    }
  });
}

// ================================
// DELETE /api/admin/banners/:id - 删除 Banner
// ================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      const { id } = await params;
      const bannerId = parseInt(id, 10);
      
      if (isNaN(bannerId) || bannerId <= 0) {
        return errorResponse('VALIDATION_ERROR', '无效的Banner ID', 400);
      }

      await deleteBanner(bannerId);
      return successResponse(null, '删除成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[Banner删除] 删除失败:', error);
      return errorResponse('SYSTEM_ERROR', '删除Banner失败', 500);
    }
  });
}
