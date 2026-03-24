/**
 * @file 产品上下架 API
 * @description PUT /api/admin/products/:id/status - 产品上下架
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第7节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { ProductStatus } from '@honeywell/database';
import { updateProductStatus } from '@/services/product.service';

// ================================
// 请求体校验 Schema
// ================================
const statusSchema = z.object({
  status: z.nativeEnum(ProductStatus, { errorMap: () => ({ message: '无效的产品状态' }) }),
});

// ================================
// PUT /api/admin/products/:id/status - 产品上下架
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
      const parseResult = statusSchema.safeParse(body);
      if (!parseResult.success) {
        return errorResponse('VALIDATION_ERROR', parseResult.error.errors[0]?.message || '参数校验失败', 400);
      }

      const { status } = parseResult.data;
      await updateProductStatus(productId, status);

      return successResponse(null, status === 'ACTIVE' ? '产品上架成功' : '产品下架成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[PUT /api/admin/products/:id/status] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
