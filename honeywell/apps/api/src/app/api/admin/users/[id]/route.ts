/**
 * @file 用户详情API
 * @description 后台管理端 - 获取用户详情
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第3.2节
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getUserDetail } from '@/services/user.service';
import { BusinessError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/users/:id
 * @description 获取用户详情
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      const { id } = await params;
      const userId = parseInt(id, 10);
      
      if (isNaN(userId)) {
        return errorResponse('VALIDATION_ERROR', '无效的用户ID', 400);
      }

      const result = await getUserDetail(userId);
      
      return successResponse(result);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/users/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取用户详情失败', 500);
    }
  });
}
