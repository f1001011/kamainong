/**
 * @file 充值订单列表接口
 * @description GET /api/recharge/orders - 获取用户的充值记录列表
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第3节 - 充值模块
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyToken } from '@/lib/auth';
import { paginatedResponse, errorResponse } from '@/lib/response';
import { Errors } from '@/lib/errors';
import { rechargeService } from '@/services/recharge.service';

/**
 * 充值状态枚举值
 */
const RechargeStatusEnum = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

/**
 * 查询参数校验 Schema
 */
const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING_PAYMENT', 'PAID', 'FAILED', 'CANCELLED']).optional(),
});

/**
 * 获取充值订单列表
 * @description 返回用户的充值记录，支持分页和状态筛选
 */
export async function GET(request: NextRequest) {
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

    // 2. 解析查询参数
    const { searchParams } = new URL(request.url);
    const query = {
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '20',
      status: searchParams.get('status') || undefined,
    };

    const parseResult = QuerySchema.safeParse(query);
    if (!parseResult.success) {
      throw Errors.validationError('صيغة المعلمات غير صحيحة');
    }

    const { page, pageSize, status } = parseResult.data;

    // 3. 查询订单列表
    const result = await rechargeService.getOrders(
      payload.userId,
      page,
      pageSize,
      status
    );

    // 4. 格式化返回数据（依据：02.3-前端API接口清单.md 第5.3节）
    interface OrderWithChannel {
      id: number;
      orderNo: string;
      amount: { toString(): string };
      actualAmount: { toString(): string } | null;
      status: string;
      channel: { id: number; code: string; name: string } | null;
      createdAt: Date;
      callbackAt: Date | null;
      expireAt: Date | null;
    }
    
    // 依据：03.4.2-充值记录页.md 第91行 - 倒计时需要 expireAt 字段
    const formattedList = result.list.map((order: OrderWithChannel) => ({
      id: order.id,
      orderNo: order.orderNo,
      amount: order.amount.toString(),
      actualAmount: order.actualAmount?.toString() || null,
      channelName: order.channel?.name || null,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      expireAt: order.expireAt?.toISOString() || null,
    }));

    return paginatedResponse(formattedList, result.pagination);
  } catch (error) {
    // 业务错误处理
    if (error && typeof error === 'object' && 'code' in error) {
      const bizError = error as { code: string; message: string; httpStatus: number };
      return errorResponse(bizError.code, bizError.message, bizError.httpStatus);
    }

    // 未知错误
    console.error('[RechargeOrders] 查询订单失败:', error);
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500);
  }
}
