/**
 * @file 解封用户API
 * @description 后台管理端 - 解封用户
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第3节
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { unbanUser } from '@/services/user.service';
import { BusinessError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/users/:id/unban
 * @description 解封用户
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

      const result = await unbanUser(userId, adminId, ip);
      
      return successResponse(result);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/users/:id/unban] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '解封用户失败', 500);
    }
  });
}
