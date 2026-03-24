/**
 * @file 充值订单详情接口
 * @description GET /api/recharge/orders/:id - 获取指定充值订单的详情
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第3节 - 充值模块
 */

import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { Errors } from '@/lib/errors';
import { rechargeService } from '@/services/recharge.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 获取充值订单详情
 * @description 返回指定订单的完整信息
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. 验证用户身份
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      throw Errors.unauthorized();
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      throw Errors.unauthorized();
    }

    // 2. 获取订单ID
    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId) || orderId <= 0) {
      throw Errors.validationError('معرف الطلب غير صالح');
    }

    // 3. 查询订单详情
    const order = await rechargeService.getOrderDetail(payload.userId, orderId);

    // 4. 格式化返回数据（依据：02.3-前端API接口清单.md 第5.4节）
    const formattedOrder = {
      id: order.id,
      orderNo: order.orderNo,
      amount: order.amount.toString(),
      actualAmount: order.actualAmount?.toString() || null,
      channelName: order.channel?.name || null,
      status: order.status,
      payUrl: order.payUrl,
      expireAt: order.expireAt?.toISOString() || null,
      createdAt: order.createdAt.toISOString(),
      paidAt: order.callbackAt?.toISOString() || null, // 使用 callbackAt 作为支付时间
    };

    return successResponse(formattedOrder, 'تم الحصول على الطلب بنجاح');
  } catch (error) {
    // 业务错误处理
    if (error && typeof error === 'object' && 'code' in error) {
      const bizError = error as { code: string; message: string; httpStatus: number };
      return errorResponse(bizError.code, bizError.message, bizError.httpStatus);
    }

    // 未知错误
    console.error('[RechargeOrderDetail] 查询订单详情失败:', error);
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500);
  }
}
