/**
 * @file 调整用户余额API
 * @description 后台管理端 - 调整用户余额（增加/扣减）
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第3.3节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { adjustBalance } from '@/services/user.service';
import { BusinessError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 请求体校验模式
 */
const bodySchema = z.object({
  type: z.enum(['ADD', 'DEDUCT']),
  amount: z.string().refine(val => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, '金额必须大于0'),
  remark: z.string().optional(),
});

/**
 * POST /api/admin/users/:id/balance
 * @description 调整用户余额
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const { id } = await params;
      const userId = parseInt(id, 10);
      
      if (isNaN(userId)) {
        return errorResponse('VALIDATION_ERROR', '无效的用户ID', 400);
      }

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

      const result = await adjustBalance(userId, validationResult.data, adminId, ip);
      
      return successResponse(result, '余额调整成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/users/:id/balance] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '余额调整失败', 500);
    }
  });
}
