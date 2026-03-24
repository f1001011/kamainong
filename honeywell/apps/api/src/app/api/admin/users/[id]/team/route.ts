/**
 * @file 用户团队成员API
 * @description 后台管理端 - 获取用户团队成员列表
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第3.13节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/response';
import { getUserTeam } from '@/services/user.service';
import { BusinessError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 查询参数校验模式
 */
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  level: z.coerce.number().min(1).max(3).optional(),
});

/**
 * GET /api/admin/users/:id/team
 * @description 获取用户团队成员列表
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const { id } = await params;
      const userId = parseInt(id, 10);
      
      if (isNaN(userId)) {
        return errorResponse('VALIDATION_ERROR', '无效的用户ID', 400);
      }

      const { searchParams } = new URL(req.url);
      const rawParams = Object.fromEntries(searchParams.entries());
      
      const validationResult = querySchema.safeParse(rawParams);
      if (!validationResult.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          validationResult.error.errors.map(e => e.message).join(', '),
          400
        );
      }

      const { page, pageSize, level } = validationResult.data;
      const result = await getUserTeam(userId, page, pageSize, level);
      
      return successResponse({
        list: result.list,
        pagination: result.pagination,
        summary: result.summary,
      });
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/users/:id/team] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取团队成员失败', 500);
    }
  });
}
