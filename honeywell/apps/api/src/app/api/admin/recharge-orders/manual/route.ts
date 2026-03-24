/**
 * @file 手动充值API
 * @description 后台管理端 - 管理员为用户生成充值订单
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第4.2节 - 手动充值
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { adminRechargeOrderService } from '@/services/admin-recharge-order.service';
import { BusinessError } from '@/lib/errors';

/**
 * 请求参数校验模式
 * @depends 02.4-后台API接口清单.md 第4.2节 - amount 为字符串格式 "100.00"
 */
const requestSchema = z.object({
  userId: z.coerce.number().int().positive('用户ID必须为正整数'),
  channelId: z.coerce.number().int().positive('通道ID必须为正整数'),
  // 依据：02.4-后台API接口清单.md - amount 应为字符串 "100.00"
  // 同时支持 number 类型以便前端灵活调用
  amount: z.union([
    z.string().regex(/^\d+(\.\d{1,2})?$/, '金额格式错误，应为正数且最多两位小数'),
    z.number().positive('金额必须大于0'),
  ]).transform((val) => {
    // 统一转换为 number
    return typeof val === 'string' ? parseFloat(val) : val;
  }).refine((val) => val > 0, '金额必须大于0'),
});

/**
 * POST /api/admin/recharge-orders/manual
 * @description 管理员手动为用户创建充值订单
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const body = await req.json();

      const validationResult = requestSchema.safeParse(body);
      if (!validationResult.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          validationResult.error.errors.map((e) => e.message).join(', '),
          400
        );
      }

      const { userId, channelId, amount } = validationResult.data;

      const result = await adminRechargeOrderService.manualRecharge(
        { userId, channelId, amount },
        adminId
      );

      // 依据：02.4-后台API接口清单.md 第4.2节 - 返回格式
      return successResponse(
        {
          orderId: result.orderId,
          orderNo: result.orderNo,
          payUrl: result.payUrl,
          expireAt: result.expireAt.toISOString(),
        },
        '充值订单已生成'
      );
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/recharge-orders/manual] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '创建充值订单失败', 500);
    }
  });
}
