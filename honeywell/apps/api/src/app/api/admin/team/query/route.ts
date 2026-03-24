/**
 * @file 团队关系查询API
 * @description 后台管理端 - 按 userId/phone/inviteCode 查询团队关系
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第20.1节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { adminTeamService } from '@/services/admin-team.service';
import { BusinessError } from '@/lib/errors';

/**
 * 查询参数校验模式
 * @description userId、phone、inviteCode 三选一
 */
const querySchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
  phone: z.string().min(1).optional(),
  inviteCode: z.string().min(1).optional(),
}).refine(
  (data) => data.userId || data.phone || data.inviteCode,
  { message: '请提供 userId、phone 或 inviteCode 参数' }
);

/**
 * GET /api/admin/team/query
 * @description 团队关系查询（按 userId/phone/inviteCode）
 *
 * 查询参数：
 * - userId: 用户ID（可选）
 * - phone: 手机号（可选）
 * - inviteCode: 邀请码（可选）
 * 注意：三个参数必须至少提供一个
 *
 * 返回数据：
 * - user: 目标用户信息
 * - upline: 三级上级信息（level1、level2、level3）
 * - downlineSummary: 下线统计（各级数量和总数）
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const { searchParams } = new URL(req.url);
      const rawParams = Object.fromEntries(searchParams.entries());

      // 参数校验
      const validationResult = querySchema.safeParse(rawParams);
      if (!validationResult.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          validationResult.error.errors.map((e) => e.message).join(', '),
          400
        );
      }

      const { userId, phone, inviteCode } = validationResult.data;

      // 调用服务查询团队关系
      const result = await adminTeamService.queryTeamRelation({
        userId,
        phone,
        inviteCode,
      });

      return successResponse(result);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/team/query] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '查询团队关系失败', 500);
    }
  });
}
