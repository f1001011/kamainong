/**
 * @file 批量调整余额API
 * @description 后台管理端 - 批量调整用户余额
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第3.17节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { batchAdjustBalance } from '@/services/user.service';
import { BusinessError } from '@/lib/errors';

/**
 * 请求体校验模式
 */
const bodySchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, '请选择至少一个用户'),
  type: z.enum(['ADD', 'DEDUCT']),
  amount: z.string().refine(val => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, '金额必须大于0'),
  remark: z.string().optional(),
});

/**
 * POST /api/admin/users/batch-balance
 * @description 批量调整用户余额
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const body = await req.json();
      const validationResult = bodySchema.safeParse(body);
      
      if (!validationResult.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          validationResult.error.errors.map(e => e.message).join(', '),
          400
        );
      }

      // 获取请求IP
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                 req.headers.get('x-real-ip') || 
                 'unknown';

      const { ids, type, amount, remark } = validationResult.data;
      const result = await batchAdjustBalance(ids, { type, amount, remark }, adminId, ip);
      
      return successResponse(result, `批量调整完成：成功${result.succeeded}个，失败${result.failed}个`);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/users/batch-balance] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '批量调整余额失败', 500);
    }
  });
}
