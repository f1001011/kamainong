/**
 * @file 页面配置 API
 * @description GET /api/admin/page-config/:pageType - 获取页面配置
 *              PUT /api/admin/page-config/:pageType - 更新页面配置
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第13节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import {
  getPageConfig,
  updatePageConfig,
} from '@/services/system-settings.service';

// ================================
// 允许的页面类型
// ================================
const ALLOWED_PAGE_TYPES = ['home', 'profile', 'products', 'product'];

// ================================
// 首页配置校验 Schema
// ================================
const homeConfigSchema = z.object({
  bannerVisible: z.boolean().optional(),
  todayIncomeVisible: z.boolean().optional(),
  signInEntryVisible: z.boolean().optional(),
  quickEntries: z.array(z.object({
    key: z.string(),
    icon: z.string(),
    label: z.string(),
    visible: z.boolean(),
    sortOrder: z.coerce.number(),
    link: z.string().optional(),
  }).passthrough()).optional(),
  recommendEnabled: z.boolean().optional(),
  recommendTitle: z.string().optional(),
  recommendDisplayMode: z.enum(['scroll', 'grid', 'list']).optional(),
  recommendProductIds: z.array(z.coerce.number()).optional(),
  recommendMaxCount: z.coerce.number().min(1).max(10).optional(),
  marqueeVisible: z.boolean().optional(),
}).passthrough();

// ================================
// 个人中心配置校验 Schema
// ================================
const profileConfigSchema = z.object({
  balanceVisible: z.boolean().optional(),
  inviteCodeVisible: z.boolean().optional(),
  vipBadgeVisible: z.boolean().optional(),
  menuItems: z.array(z.object({
    key: z.string(),
    icon: z.string(),
    route: z.string(),
    badge: z.object({
      type: z.enum(['dot', 'count']),
      source: z.string().optional(),
    }).nullable().optional(),
    visible: z.boolean(),
    order: z.number(),
  })).optional(),
});

// ================================
// 产品页配置校验 Schema
// ================================
const productsConfigSchema = z.object({
  tab1Name: z.string().optional(),
  tab1Filter: z.string().optional(),
  tab2Name: z.string().optional(),
  tab2Filter: z.string().optional(),
  defaultTab: z.number().min(1).max(2).optional(),
  listLayout: z.enum(['single', 'double', 'auto']).optional(),
  cardStyle: z.enum(['standard', 'compact', 'large']).optional(),
  vipBadgeColor: z.string().optional(),
  purchasedBadge: z.string().optional(),
  lockedTip: z.string().optional(),
});

// ================================
// 根据页面类型获取对应的校验 Schema
// ================================
function getSchemaForPageType(pageType: string) {
  switch (pageType) {
    case 'home':
      return homeConfigSchema;
    case 'profile':
      return profileConfigSchema;
    case 'products':
    case 'product':
      return productsConfigSchema;
    default:
      return z.record(z.string(), z.unknown());
  }
}

// ================================
// GET /api/admin/page-config/:pageType - 获取页面配置
// ================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageType: string }> }
) {
  return withAdminAuth(request, async () => {
    try {
      const { pageType } = await params;
      
      // 校验页面类型
      if (!ALLOWED_PAGE_TYPES.includes(pageType)) {
        return errorResponse(
          'VALIDATION_ERROR',
          `不支持的页面类型: ${pageType}，支持的类型: ${ALLOWED_PAGE_TYPES.join(', ')}`,
          400
        );
      }
      
      const config = await getPageConfig(pageType);
      
      if (!config) {
        // 返回空配置
        return successResponse(
          {
            pageType,
            config: {},
            version: 0,
          },
          '获取页面配置成功'
        );
      }
      
      return successResponse(config, '获取页面配置成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/page-config/:pageType] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}

// ================================
// PUT /api/admin/page-config/:pageType - 更新页面配置
// ================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ pageType: string }> }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const { pageType } = await params;
      
      // 校验页面类型
      if (!ALLOWED_PAGE_TYPES.includes(pageType)) {
        return errorResponse(
          'VALIDATION_ERROR',
          `不支持的页面类型: ${pageType}，支持的类型: ${ALLOWED_PAGE_TYPES.join(', ')}`,
          400
        );
      }
      
      const body = await req.json();
      
      // 根据页面类型获取对应的校验 Schema
      const schema = getSchemaForPageType(pageType);
      
      // 校验请求体
      const parseResult = schema.safeParse(body);
      if (!parseResult.success) {
        const errorDetail = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
        console.error(`[PUT /api/admin/page-config/${pageType}] 校验失败:`, errorDetail, '\n原始数据:', JSON.stringify(body).slice(0, 500));
        return errorResponse(
          'VALIDATION_ERROR',
          errorDetail || '参数校验失败',
          400
        );
      }
      
      // 直接传入请求体作为配置更新
      const result = await updatePageConfig(pageType, parseResult.data as Record<string, unknown>);
      
      return successResponse(
        { pageType, version: result.version },
        '更新页面配置成功'
      );
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[PUT /api/admin/page-config/:pageType] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
