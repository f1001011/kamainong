/**
 * @file 创建提现申请接口
 * @description POST /api/withdraw/create - 创建提现订单
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第6.2节 - 创建提现申请
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { withdrawService } from '@/services/withdraw.service';
import { getClientIp } from '@/lib/client-ip';

/**
 * 请求体类型
 */
interface CreateWithdrawRequest {
  amount: string;
  bankCardId: number;
}

/**
 * 创建提现申请
 * @description 创建提现订单，冻结余额
 * 依据：02.3-前端API接口清单.md 第6.2节
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, userId) => {
    // 1. 解析请求体
    let body: CreateWithdrawRequest;
    try {
      body = await req.json();
    } catch {
      return errorResponse('VALIDATION_ERROR', 'صيغة الطلب غير صحيحة', 400);
    }

    // 2. 参数校验
    const { amount, bankCardId } = body;

    if (!amount || !bankCardId) {
      return errorResponse('VALIDATION_ERROR', 'المعلمات المطلوبة مفقودة', 400);
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return errorResponse('VALIDATION_ERROR', 'صيغة المبلغ غير صحيحة', 400);
    }

    // 3. 获取客户端IP（兼容 Cloudflare CDN）
    const rawIp = getClientIp(req);
    const createIp = rawIp !== 'unknown' ? rawIp : undefined;

    // 4. 调用服务创建提现订单
    const result = await withdrawService.createOrder({
      userId,
      amount: amountNum,
      bankCardId,
      createIp,
    });

    // 5. 返回成功响应（依据：02.3-前端API接口清单.md 第6.2节）
    return successResponse(
      {
        orderId: result.orderId,
        orderNo: result.orderNo,
        amount: result.amount,
        fee: result.fee,
        actualAmount: result.actualAmount,
      },
      'تم إرسال طلب السحب'
    );
  });
}
