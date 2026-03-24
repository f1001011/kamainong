/**
 * @file 批量上下架 API
 * @description POST /api/admin/products/batch-status - 批量上下架
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第7.4节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { ProductStatus } from '@honeywell/database';
import { batchUpdateProductStatus } from '@/services/product.service';

// ================================
// 请求体校验 Schema
// ================================
const batchStatusSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, '至少需要一个产品ID'),
  status: z.nativeEnum(ProductStatus, { errorMap: () => ({ message: '无效的产品状态' }) }),
});

// ================================
// POST /api/admin/products/batch-status - 批量上下架
// ================================
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const body = await req.json();

      // 校验请求体
      const parseResult = batchStatusSchema.safeParse(body);
      if (!parseResult.success) {
        return errorResponse('VALIDATION_ERROR', parseResult.error.errors[0]?.message || '参数校验失败', 400);
      }

      const { ids, status } = parseResult.data;
      const result = await batchUpdateProductStatus({ ids, status });

      return successResponse(result, '批量更新状态完成');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/products/batch-status] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
