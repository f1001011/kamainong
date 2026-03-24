/**
 * @file 取消充值订单接口
 * @description POST /api/recharge/orders/:id/cancel - 取消指定的充值订单
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第3节 - 充值模块
 * @depends 开发文档/开发文档.md 第5.2节 - 订单取消
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
 * 取消充值订单
 * @description 取消待支付状态的充值订单（不通知第三方支付平台）
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // 3. 取消订单
    await rechargeService.cancelOrder(payload.userId, orderId);

    // 4. 返回成功
    return successResponse(null, 'تم إلغاء الطلب بنجاح');
  } catch (error) {
    // 业务错误处理
    if (error && typeof error === 'object' && 'code' in error) {
      const bizError = error as { code: string; message: string; httpStatus: number };
      return errorResponse(bizError.code, bizError.message, bizError.httpStatus);
    }

    // 未知错误
    console.error('[RechargeOrderCancel] 取消订单失败:', error);
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500);
  }
}
