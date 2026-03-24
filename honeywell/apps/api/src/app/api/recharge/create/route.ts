/**
 * @file 创建充值订单接口
 * @description POST /api/recharge/create - 创建新的充值订单
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第3节 - 充值模块
 * @depends 开发文档/开发文档.md 第5节 - 充值流程
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { Errors } from '@/lib/errors';
import { rechargeService } from '@/services/recharge.service';

/**
 * 请求参数校验 Schema
 * @description 依据：02.3-前端API接口清单.md 第5.2节
 */
const CreateRechargeSchema = z.object({
  // amount 支持数字或字符串格式
  amount: z.union([
    z.number().positive('مبلغ الإيداع يجب أن يكون أكبر من 0'),
    z.string().regex(/^\d+(\.\d{1,2})?$/, 'صيغة المبلغ غير صالحة').transform(Number),
  ]),
  // channelId 仅开启多通道时需要
  channelId: z.number().int().positive('معرف القناة يجب أن يكون عدداً صحيحاً موجباً').optional(),
});

/**
 * 创建充值订单
 * @description 根据选择的通道和金额创建充值订单，返回支付链接
 */
export async function POST(request: NextRequest) {
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

    // 2. 解析并校验请求参数
    const body = await request.json();
    const parseResult = CreateRechargeSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors
        .map((e) => e.message)
        .join(', ');
      throw Errors.validationError(errorMessage);
    }

    const { channelId, amount } = parseResult.data;

    // 3. 获取支付通道信息
    const { channels } = await rechargeService.getChannelsWithConfig();
    if (channels.length === 0) {
      throw Errors.validationError('لا توجد قنوات دفع متاحة');
    }

    // 4. 确定使用的通道（如果没有指定，使用默认通道）
    let actualChannelId = channelId;
    let channelCode: string;
    
    if (actualChannelId) {
      // 指定了通道ID，查找对应的通道代码
      const selectedChannel = channels.find((c) => c.id === actualChannelId);
      if (!selectedChannel) {
        throw Errors.validationError('قناة الدفع المحددة غير متاحة');
      }
      channelCode = selectedChannel.code;
    } else {
      // 未指定，使用第一个可用通道
      actualChannelId = channels[0].id;
      channelCode = channels[0].code;
    }

    // 5. 构建回调地址
    // 依据：统一回调路由格式 /api/callback/[channel]/[type]
    const baseUrl = process.env.CALLBACK_DOMAIN || process.env.API_BASE_URL || 'http://localhost:3001';
    const notifyUrl = `${baseUrl}/api/callback/${channelCode.toLowerCase()}/recharge`;
    const callbackUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/recharge/result`;

    // 6. 创建充值订单
    const result = await rechargeService.createOrder({
      userId: payload.userId,
      channelId: actualChannelId,
      amount,
      notifyUrl,
      callbackUrl,
    });

    // 7. 返回成功结果（依据：02.3-前端API接口清单.md 第5.2节）
    return successResponse(
      {
        orderId: result.orderId,
        orderNo: result.orderNo,
        amount: amount.toFixed(2),
        payUrl: result.payUrl,
        expireAt: result.expireAt.toISOString(),
      },
      'تم إنشاء طلب الإيداع بنجاح'
    );
  } catch (error) {
    // 业务错误处理
    if (error && typeof error === 'object' && 'code' in error) {
      const bizError = error as { code: string; message: string; httpStatus: number };
      return errorResponse(bizError.code, bizError.message, bizError.httpStatus);
    }

    // 未知错误
    console.error('[RechargeCreate] 创建订单失败:', error);
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500);
  }
}
