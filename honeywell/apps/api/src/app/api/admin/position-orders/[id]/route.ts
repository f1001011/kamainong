/**
 * @file 持仓订单详情API
 * @description 后台管理端 - 获取持仓订单详情
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第6.2节 - 持仓订单详情
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getPositionOrderDetail } from '@/services/admin-position-order.service';
import { BusinessError } from '@/lib/errors';

/**
 * 路径参数校验
 */
const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * GET /api/admin/position-orders/:id
 * @description 获取持仓订单详情
 * @returns 持仓订单详细信息
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      // 解析路径参数
      const resolvedParams = await params;
      const validationResult = paramsSchema.safeParse({ id: resolvedParams.id });
      if (!validationResult.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          '订单ID格式不正确',
          400
        );
      }

      const orderId = validationResult.data.id;

      // 调用服务获取持仓订单详情
      const result = await getPositionOrderDetail(orderId);

      // 依据：02.4-后台API接口清单.md 第6.2节 - 返回订单详情
      return successResponse(result);
    } catch (error) {
      // 处理业务错误
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/position-orders/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取持仓订单详情失败', 500);
    }
  });
}
