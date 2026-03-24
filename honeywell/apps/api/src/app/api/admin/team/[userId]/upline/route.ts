/**
 * @file 向上追溯上级链路API
 * @description 后台管理端 - 获取用户的三级上级链路
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第20.2节
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { adminTeamService } from '@/services/admin-team.service';
import { BusinessError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/**
 * GET /api/admin/team/:userId/upline
 * @description 向上追溯上级链路（最多3级）
 *
 * 路径参数：
 * - userId: 目标用户ID
 *
 * 返回数据：
 * - chain: 上级链路数组，包含 level（1/2/3）和 user 信息
 *   - level: 级别（1=一级上级，2=二级上级，3=三级上级）
 *   - user: 上级用户信息（id、phone、nickname、vipLevel、status、createdAt），无上级时为 null
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      const { userId: userIdStr } = await params;
      const userId = parseInt(userIdStr, 10);

      if (isNaN(userId) || userId <= 0) {
        return errorResponse('VALIDATION_ERROR', '无效的用户ID', 400);
      }

      // 调用服务获取上级链路
      const result = await adminTeamService.getUplineChain(userId);

      return successResponse(result);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/team/:userId/upline] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取上级链路失败', 500);
    }
  });
}
