/**
 * @file 产品列表与创建 API
 * @description GET /api/admin/products - 产品列表
 *              POST /api/admin/products - 创建产品
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第7节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { ProductType, ProductSeries, ProductStatus } from '@honeywell/database';
import {
  getProductList,
  createProduct,
  ProductListParams,
  ProductFormData,
} from '@/services/product.service';

// ================================
// 查询参数校验 Schema
// ================================
const querySchema = z.object({
  name: z.string().optional(),
  series: z.nativeEnum(ProductSeries).optional(),
  type: z.nativeEnum(ProductType).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  priceMin: z.string().transform(v => parseFloat(v)).optional(),
  priceMax: z.string().transform(v => parseFloat(v)).optional(),
});

// ================================
// 创建产品请求体校验 Schema
// ================================
const createProductSchema = z.object({
  code: z.string().min(1, '产品编码不能为空').max(20, '产品编码最多20个字符'),
  name: z.string().min(1, '产品名称不能为空').max(100, '产品名称最多100个字符'),
  type: z.nativeEnum(ProductType, { errorMap: () => ({ message: '无效的产品类型' }) }),
  series: z.nativeEnum(ProductSeries, { errorMap: () => ({ message: '无效的产品系列' }) }),
  price: z.string().refine(v => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, '价格必须为非负数'),
  dailyIncome: z.string().refine(v => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, '日收益必须为非负数'),
  cycleDays: z.number().int().min(1, '周期天数至少为1天'),
  grantVipLevel: z.number().int().min(0).max(10).optional().default(0),
  grantSvipLevel: z.number().int().min(0).max(10).optional().default(0),
  requireVipLevel: z.number().int().min(0).max(10).optional().default(0),
  purchaseLimit: z.number().int().min(1, '购买限制至少为1').optional().default(1),
  userPurchaseLimit: z.number().int().min(1).nullable().optional(),
  globalStock: z.number().int().min(0).nullable().optional(),
  displayUserLimit: z.number().int().min(1).nullable().optional(),
  svipDailyReward: z.number().min(0).nullable().optional(),
  svipRequireCount: z.number().int().min(1).nullable().optional(),
  returnPrincipal: z.boolean().optional().default(false),
  productStatus: z.string().optional().default('OPEN'),
  mainImage: z.string().nullable().optional(),
  detailImages: z.array(z.string()).nullable().optional(),
  detailContent: z.string().nullable().optional(),
  showRecommendBadge: z.boolean().optional().default(false),
  customBadgeText: z.string().max(50).nullable().optional(),
  sortOrder: z.number().int().optional().default(0),
  status: z.nativeEnum(ProductStatus).optional().default('ACTIVE'),
});

// ================================
// GET /api/admin/products - 产品列表
// ================================
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const { searchParams } = new URL(req.url);

      // 解析查询参数
      const rawParams = {
        name: searchParams.get('name') || undefined,
        series: searchParams.get('series') || undefined,
        type: searchParams.get('type') || undefined,
        status: searchParams.get('status') || undefined,
        priceMin: searchParams.get('priceMin') || undefined,
        priceMax: searchParams.get('priceMax') || undefined,
      };

      // 校验参数
      const parseResult = querySchema.safeParse(rawParams);
      if (!parseResult.success) {
        return errorResponse('VALIDATION_ERROR', parseResult.error.errors[0]?.message || '参数校验失败', 400);
      }

      const params: ProductListParams = parseResult.data;
      const result = await getProductList(params);

      return successResponse(result, '获取产品列表成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/products] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}

// ================================
// POST /api/admin/products - 创建产品
// ================================
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const body = await req.json();

      // 校验请求体
      const parseResult = createProductSchema.safeParse(body);
      if (!parseResult.success) {
        return errorResponse('VALIDATION_ERROR', parseResult.error.errors[0]?.message || '参数校验失败', 400);
      }

      const productData: ProductFormData = parseResult.data;
      const result = await createProduct(productData);

      return successResponse(result, '产品创建成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/products] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
