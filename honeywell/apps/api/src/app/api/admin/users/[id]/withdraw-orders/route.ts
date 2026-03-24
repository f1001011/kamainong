/**
 * @file 用户提现记录API
 * @description 后台管理端 - 获取用户提现记录列表
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第3.11节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/response';
import { getUserWithdrawOrders } from '@/services/user.service';
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
  status: z.enum(['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
});

/**
 * GET /api/admin/users/:id/withdraw-orders
 * @description 获取用户提现记录列表
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

      const { page, pageSize, status } = validationResult.data;
      const result = await getUserWithdrawOrders(userId, page, pageSize, status);
      
      return paginatedResponse(result.list, result.pagination);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/users/:id/withdraw-orders] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取提现记录失败', 500);
    }
  });
}
