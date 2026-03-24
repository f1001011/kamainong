/**
 * @file 重置密码API
 * @description 后台管理端 - 重置用户密码
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第3节
 * 
 * 重置规则：密码重置为手机号后8位
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { resetPassword } from '@/services/user.service';
import { BusinessError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/users/:id/reset-password
 * @description 重置用户密码
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const { id } = await params;
      const userId = parseInt(id, 10);
      
      if (isNaN(userId)) {
        return errorResponse('VALIDATION_ERROR', '无效的用户ID', 400);
      }

      // 获取请求IP
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                 req.headers.get('x-real-ip') || 
                 'unknown';

      const result = await resetPassword(userId, adminId, ip);
      
      return successResponse(result);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/users/:id/reset-password] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '重置密码失败', 500);
    }
  });
}
