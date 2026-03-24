/**
 * @file Banner管理 - 列表/创建 API
 * @description 后台管理 Banner 列表获取和创建
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第11.1节 - Banner管理接口
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import {
  getBannerList,
  createBanner,
  type BannerListParams,
} from '@/services/content-management.service';

// ================================
// 创建Banner的请求体验证Schema
// ================================
const createBannerSchema = z.object({
  imageUrl: z.string().min(1, '图片URL不能为空'),
  linkType: z.enum(['NONE', 'URL', 'PRODUCT'], { errorMap: () => ({ message: '无效的跳转类型' }) }),
  linkUrl: z.string().url('无效的URL格式').nullable().optional(),
  productId: z.number().int().positive('产品ID必须为正整数').nullable().optional(),
  startAt: z.string().datetime({ offset: true }).nullable().optional(),
  endAt: z.string().datetime({ offset: true }).nullable().optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(0),
}).refine(
  (data) => {
    // 如果是URL跳转类型，则linkUrl必填
    if (data.linkType === 'URL') {
      return data.linkUrl && data.linkUrl.length > 0;
    }
    return true;
  },
  { message: 'URL跳转类型必须提供跳转链接', path: ['linkUrl'] }
).refine(
  (data) => {
    // 如果是产品跳转类型，则productId必填
    if (data.linkType === 'PRODUCT') {
      return data.productId && data.productId > 0;
    }
    return true;
  },
  { message: '产品跳转类型必须提供产品ID', path: ['productId'] }
).refine(
  (data) => {
    // 验证有效期逻辑：如果同时设置了开始和结束时间，结束时间必须大于开始时间
    if (data.startAt && data.endAt) {
      return new Date(data.endAt) > new Date(data.startAt);
    }
    return true;
  },
  { message: '结束时间必须大于开始时间', path: ['endAt'] }
);

// ================================
// GET /api/admin/banners - Banner 列表
// ================================
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const { searchParams } = new URL(req.url);
      
      // 解析查询参数
      const params: BannerListParams = {
        keyword: searchParams.get('keyword') ?? undefined,
      };

      // 处理 isActive 参数（字符串转布尔值）
      const isActiveStr = searchParams.get('isActive');
      if (isActiveStr !== null) {
        params.isActive = isActiveStr === 'true';
      }

      const result = await getBannerList(params);
      return successResponse(result);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[Banner列表] 获取失败:', error);
      return errorResponse('SYSTEM_ERROR', '获取Banner列表失败', 500);
    }
  });
}

// ================================
// POST /api/admin/banners - 创建 Banner
// ================================
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const body = await req.json();
      
      // 验证请求体
      const parseResult = createBannerSchema.safeParse(body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }

      const data = parseResult.data;
      const banner = await createBanner({
        imageUrl: data.imageUrl,
        linkType: data.linkType,
        linkUrl: data.linkUrl ?? null,
        productId: data.productId ?? null,
        startAt: data.startAt ?? null,
        endAt: data.endAt ?? null,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      });

      return successResponse(banner, '创建成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[Banner创建] 创建失败:', error);
      return errorResponse('SYSTEM_ERROR', '创建Banner失败', 500);
    }
  });
}
