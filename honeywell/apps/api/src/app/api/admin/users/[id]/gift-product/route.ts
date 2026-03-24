/**
 * @file 赠送产品API
 * @description 后台管理端 - 赠送产品给用户
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第3.4节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { giftProduct } from '@/services/user.service';
import { BusinessError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 请求体校验模式
 */
const bodySchema = z.object({
  productId: z.number().int().positive('产品ID必须为正整数'),
});

/**
 * POST /api/admin/users/:id/gift-product
 * @description 赠送产品给用户
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const { id } = await params;
      const userId = parseInt(id, 10);
      
      if (isNaN(userId)) {
        return errorResponse('VALIDATION_ERROR', '无效的用户ID', 400);
      }

      const body = await req.json();
      const validationResult = bodySchema.safeParse(body);
      
      if (!validationResult.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          validationResult.error.errors.map(e => e.message).join(', '),
          400
        );
      }

      // 获取请求IP
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                 req.headers.get('x-real-ip') || 
                 'unknown';

      const result = await giftProduct(userId, validationResult.data, adminId, ip);
      
      return successResponse(result, '产品赠送成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/users/:id/gift-product] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '产品赠送失败', 500);
    }
  });
}
