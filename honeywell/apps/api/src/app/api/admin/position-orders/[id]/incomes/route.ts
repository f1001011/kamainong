/**
 * @file 收益发放记录API
 * @description 后台管理端 - 获取持仓订单的收益发放记录
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第6.3节 - 收益发放记录
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getPositionOrderIncomes } from '@/services/admin-position-order.service';
import { BusinessError } from '@/lib/errors';

/**
 * 路径参数校验
 */
const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * 查询参数校验
 */
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'SETTLED', 'FAILED', 'CANCELLED']).optional(),
});

/**
 * GET /api/admin/position-orders/:id/incomes
 * @description 获取持仓订单的收益发放记录
 * @returns 收益发放记录列表、分页信息和汇总统计
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      // 解析路径参数
      const resolvedParams = await params;
      const paramsValidation = paramsSchema.safeParse({ id: resolvedParams.id });
      if (!paramsValidation.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          '订单ID格式不正确',
          400
        );
      }

      const orderId = paramsValidation.data.id;

      // 解析查询参数
      const { searchParams } = new URL(req.url);
      const rawParams = Object.fromEntries(searchParams.entries());
      
      const queryValidation = querySchema.safeParse(rawParams);
      if (!queryValidation.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          queryValidation.error.errors.map((e) => e.message).join(', '),
          400
        );
      }

      const queryParams = queryValidation.data;

      // 调用服务获取收益发放记录
      const result = await getPositionOrderIncomes(orderId, {
        page: queryParams.page,
        pageSize: queryParams.pageSize,
        status: queryParams.status,
      });

      // 依据：02.4-后台API接口清单.md 第6.3节 - 返回格式包含 list、pagination、summary
      return successResponse({
        list: result.list,
        pagination: result.pagination,
        summary: result.summary,
      });
    } catch (error) {
      // 处理业务错误
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/position-orders/:id/incomes] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取收益发放记录失败', 500);
    }
  });
}
