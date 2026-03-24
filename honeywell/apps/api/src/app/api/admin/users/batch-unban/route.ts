/**
 * @file 批量解封API
 * @description 后台管理端 - 批量解封用户
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第3.16节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { batchUnbanUsers } from '@/services/user.service';
import { BusinessError } from '@/lib/errors';

/**
 * 请求体校验模式
 */
const bodySchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, '请选择至少一个用户'),
});

/**
 * POST /api/admin/users/batch-unban
 * @description 批量解封用户
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

      const { ids } = validationResult.data;
      const result = await batchUnbanUsers(ids, adminId, ip);
      
      return successResponse(result, `批量解封完成：成功${result.succeeded}个，失败${result.failed}个`);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/users/batch-unban] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '批量解封失败', 500);
    }
  });
}
