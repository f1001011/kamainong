/**
 * @file 封禁用户API
 * @description 后台管理端 - 封禁用户
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第3.7节
 * 
 * 封禁时自动处理：
 * - 可用余额 → 冻结余额
 * - 待审核提现 → 自动拒绝
 * - 持仓收益 → 停止发放
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { banUser } from '@/services/user.service';
import { BusinessError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 请求体校验模式
 */
const bodySchema = z.object({
  reason: z.string().optional(),
});

/**
 * POST /api/admin/users/:id/ban
 * @description 封禁用户
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const { id } = await params;
      const userId = parseInt(id, 10);
      
      if (isNaN(userId)) {
        return errorResponse('VALIDATION_ERROR', '无效的用户ID', 400);
      }

      const body = await req.json().catch(() => ({}));
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

      const result = await banUser(userId, adminId, validationResult.data.reason, ip);
      
      return successResponse(result);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/users/:id/ban] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '封禁用户失败', 500);
    }
  });
}
