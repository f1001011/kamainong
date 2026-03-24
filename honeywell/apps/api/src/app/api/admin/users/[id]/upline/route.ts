/**
 * @file 用户邀请链路API
 * @description 后台管理端 - 获取用户邀请链路（上级关系）
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第3.14节
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getUserUpline } from '@/services/user.service';
import { BusinessError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/users/:id/upline
 * @description 获取用户邀请链路
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      const { id } = await params;
      const userId = parseInt(id, 10);
      
      if (isNaN(userId)) {
        return errorResponse('VALIDATION_ERROR', '无效的用户ID', 400);
      }

      const result = await getUserUpline(userId);
      
      return successResponse(result);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/users/:id/upline] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取邀请链路失败', 500);
    }
  });
}
