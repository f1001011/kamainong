/**
 * @file 产品详情、更新、删除 API
 * @description GET /api/admin/products/:id - 产品详情
 *              PUT /api/admin/products/:id - 更新产品
 *              DELETE /api/admin/products/:id - 删除产品（软删除）
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第7节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { ProductType, ProductSeries, ProductStatus } from '@honeywell/database';
import {
  getProductDetail,
  updateProduct,
  deleteProduct,
  ProductFormData,
} from '@/services/product.service';

// ================================
// 更新产品请求体校验 Schema
// ================================
const updateProductSchema = z.object({
  code: z.string().min(1, '产品编码不能为空').max(20, '产品编码最多20个字符').optional(),
  name: z.string().min(1, '产品名称不能为空').max(100, '产品名称最多100个字符').optional(),
  type: z.nativeEnum(ProductType, { errorMap: () => ({ message: '无效的产品类型' }) }).optional(),
  series: z.nativeEnum(ProductSeries, { errorMap: () => ({ message: '无效的产品系列' }) }).optional(),
  price: z.string().refine(v => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, '价格必须为非负数').optional(),
  dailyIncome: z.string().refine(v => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, '日收益必须为非负数').optional(),
  cycleDays: z.number().int().min(1, '周期天数至少为1天').optional(),
  grantVipLevel: z.number().int().min(0).max(10).optional(),
  grantSvipLevel: z.number().int().min(0).max(10).optional(),
  requireVipLevel: z.number().int().min(0).max(10).optional(),
  purchaseLimit: z.number().int().min(1, '购买限制至少为1').optional(),
  userPurchaseLimit: z.number().int().min(1).nullable().optional(),
  globalStock: z.number().int().min(0).nullable().optional(),
  displayUserLimit: z.number().int().min(1).nullable().optional(),
  svipDailyReward: z.number().min(0).nullable().optional(),
  svipRequireCount: z.number().int().min(1).nullable().optional(),
  returnPrincipal: z.boolean().optional(),
  productStatus: z.string().optional(),
  mainImage: z.string().nullable().optional(),
  detailImages: z.array(z.string()).nullable().optional(),
  detailContent: z.string().nullable().optional(),
  showRecommendBadge: z.boolean().optional(),
  customBadgeText: z.string().max(50).nullable().optional(),
  sortOrder: z.number().int().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
});

// ================================
// GET /api/admin/products/:id - 产品详情
// ================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      const { id } = await params;
      const productId = parseInt(id, 10);

      if (isNaN(productId)) {
        return errorResponse('VALIDATION_ERROR', '无效的产品ID', 400);
      }

      const result = await getProductDetail(productId);

      return successResponse(result, '获取产品详情成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/products/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}

// ================================
// PUT /api/admin/products/:id - 更新产品
// ================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const { id } = await params;
      const productId = parseInt(id, 10);

      if (isNaN(productId)) {
        return errorResponse('VALIDATION_ERROR', '无效的产品ID', 400);
      }

      const body = await req.json();

      // 校验请求体
      const parseResult = updateProductSchema.safeParse(body);
      if (!parseResult.success) {
        return errorResponse('VALIDATION_ERROR', parseResult.error.errors[0]?.message || '参数校验失败', 400);
      }

      const productData: Partial<ProductFormData> = parseResult.data;
      const result = await updateProduct(productId, productData);

      return successResponse(result, '产品更新成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[PUT /api/admin/products/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}

// ================================
// DELETE /api/admin/products/:id - 删除产品
// ================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      const { id } = await params;
      const productId = parseInt(id, 10);

      if (isNaN(productId)) {
        return errorResponse('VALIDATION_ERROR', '无效的产品ID', 400);
      }

      await deleteProduct(productId);

      return successResponse(null, '产品删除成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[DELETE /api/admin/products/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
