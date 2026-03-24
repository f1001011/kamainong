/**
 * @file 产品排序 API
 * @description PUT /api/admin/products/sort - 产品排序
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第7节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { updateProductSort } from '@/services/product.service';

// ================================
// 请求体校验 Schema
// ================================
const sortSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, '至少需要一个产品ID'),
});

// ================================
// PUT /api/admin/products/sort - 产品排序
// ================================
export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const body = await req.json();

      // 校验请求体
      const parseResult = sortSchema.safeParse(body);
      if (!parseResult.success) {
        return errorResponse('VALIDATION_ERROR', parseResult.error.errors[0]?.message || '参数校验失败', 400);
      }

      const { ids } = parseResult.data;
      await updateProductSort({ ids });

      return successResponse(null, '排序更新成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[PUT /api/admin/products/sort] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
