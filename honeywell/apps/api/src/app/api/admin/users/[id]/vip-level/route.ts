/**
 * @file 修改用户等级API
 * @description 后台管理端 - 修改用户VIP/SVIP等级
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第3.6节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { updateVipLevel } from '@/services/user.service';
import { BusinessError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 请求体校验模式
 */
const bodySchema = z.object({
  vipLevel: z.number().int().min(0).max(10).optional(),
  svipLevel: z.number().int().min(0).max(10).optional(),
}).refine(data => data.vipLevel !== undefined || data.svipLevel !== undefined, {
  message: '请至少提供一个等级参数',
});

/**
 * PUT /api/admin/users/:id/vip-level
 * @description 修改用户VIP/SVIP等级
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

      const result = await updateVipLevel(userId, validationResult.data, adminId, ip);
      
      return successResponse(result);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[PUT /api/admin/users/:id/vip-level] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '修改等级失败', 500);
    }
  });
}
