/**
 * @file 恢复限购API
 * @description 后台管理端 - 恢复用户的产品购买资格
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第3.5节
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { restorePurchase } from '@/services/user.service';
import { BusinessError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string; productId: string }>;
}

/**
 * POST /api/admin/users/:id/restore-purchase/:productId
 * @description 恢复用户的产品购买资格
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const { id, productId } = await params;
      const userId = parseInt(id, 10);
      const productIdNum = parseInt(productId, 10);
      
      if (isNaN(userId)) {
        return errorResponse('VALIDATION_ERROR', '无效的用户ID', 400);
      }
      
      if (isNaN(productIdNum)) {
        return errorResponse('VALIDATION_ERROR', '无效的产品ID', 400);
      }

      // 获取请求IP
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                 req.headers.get('x-real-ip') || 
                 'unknown';

      const result = await restorePurchase(userId, productIdNum, adminId, ip);
      
      return successResponse(result);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/users/:id/restore-purchase/:productId] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '恢复限购失败', 500);
    }
  });
}
