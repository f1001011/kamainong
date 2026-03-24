/**
 * @file 提现订单详情接口
 * @description GET /api/withdraw/orders/:id - 获取提现订单详情
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第6.4节 - 提现订单详情
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { withdrawService } from '@/services/withdraw.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 获取提现订单详情
 * @description 返回指定订单的详细信息
 * 依据：02.3-前端API接口清单.md 第6.4节
 */
export async function GET(request: NextRequest, context: RouteParams) {
  return withAuth(request, async (_req, userId) => {
    // 1. 解析订单ID
    const { id } = await context.params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId) || orderId <= 0) {
      return errorResponse('VALIDATION_ERROR', 'معرف الطلب غير صالح', 400);
    }

    // 2. 调用服务获取订单详情
    const order = await withdrawService.getOrderDetail(userId, orderId);

    // 3. 返回数据（依据：02.3-前端API接口清单.md 第6.4节）
    return successResponse(order);
  });
}
