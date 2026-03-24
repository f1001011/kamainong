/**
 * @file 向下展开成员树API
 * @description 后台管理端 - 获取用户的下级成员列表
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第20.3节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { adminTeamService } from '@/services/admin-team.service';
import { BusinessError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/**
 * 查询参数校验模式
 */
const querySchema = z.object({
  level: z.coerce.number().int().min(1).max(3).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * GET /api/admin/team/:userId/downline
 * @description 向下展开成员树
 *
 * 路径参数：
 * - userId: 目标用户ID
 *
 * 查询参数：
 * - level: 层级筛选（1=一级 | 2=二级 | 3=三级，不传=全部）
 * - page: 页码（默认1）
 * - pageSize: 每页数量（默认20，最大100）
 *
 * 返回数据：
 * - list: 下级成员列表
 *   - id: 成员ID
 *   - phone: 手机号（后台不脱敏）
 *   - nickname: 昵称
 *   - level: 相对于目标用户的层级（1/2/3）
 *   - vipLevel: VIP等级
 *   - status: 账号状态
 *   - isValidInvite: 是否为有效邀请
 *   - contributedCommission: 贡献的返佣总额
 *   - registeredAt: 注册时间
 *   - subDownlineCount: 嵌套下级数量（该成员自己的下线数）
 * - pagination: 分页信息
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const { userId: userIdStr } = await params;
      const userId = parseInt(userIdStr, 10);

      if (isNaN(userId) || userId <= 0) {
        return errorResponse('VALIDATION_ERROR', '无效的用户ID', 400);
      }

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

      const { level, page, pageSize } = validationResult.data;

      // 调用服务获取下级成员
      const result = await adminTeamService.getDownlineMembers(userId, level, page, pageSize);

      return successResponse(result);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/team/:userId/downline] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取下级成员失败', 500);
    }
  });
}
