/**
 * @file 礼品码兑换接口
 * @description POST /api/gift-code/redeem - 用户兑换礼品码
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { redeemGiftCode } from '@/services/gift-code.service';

const redeemSchema = z.object({
  code: z.string().min(1, 'أدخل رمز الهدية').max(32),
});

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, userId) => {
    try {
      const body = await req.json();
      const parseResult = redeemSchema.safeParse(body);
      if (!parseResult.success) {
        return errorResponse('VALIDATION_ERROR', parseResult.error.errors[0]?.message || 'بيانات غير صالحة', 400);
      }

      const result = await redeemGiftCode(userId, parseResult.data.code);
      return successResponse(result, 'تم استخدام الرمز بنجاح');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/gift-code/redeem] 错误:', error);
      return errorResponse('INTERNAL_ERROR', 'خطأ في الخادم', 500);
    }
  });
}
