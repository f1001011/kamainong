/**
 * @file 用户资金流水API
 * @description 后台管理端 - 获取用户资金流水列表
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第3.12节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/response';
import { getUserTransactions } from '@/services/user.service';
import { BusinessError } from '@/lib/errors';
import { TransactionType } from '@honeywell/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 查询参数校验模式
 */
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  type: z.enum([
    'RECHARGE',
    'WITHDRAW_FREEZE',
    'WITHDRAW_SUCCESS',
    'WITHDRAW_REFUND',
    'PURCHASE',
    'INCOME',
    'REFERRAL_COMMISSION',
    'SIGN_IN',
    'ACTIVITY_REWARD',
    'REGISTER_BONUS',
    'ADMIN_ADD',
    'ADMIN_DEDUCT',
  ]).optional(),
});

/**
 * GET /api/admin/users/:id/transactions
 * @description 获取用户资金流水列表
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

      const { page, pageSize, type } = validationResult.data;
      const result = await getUserTransactions(userId, page, pageSize, type as TransactionType);
      
      return paginatedResponse(result.list, result.pagination);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/users/:id/transactions] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取资金流水失败', 500);
    }
  });
}
