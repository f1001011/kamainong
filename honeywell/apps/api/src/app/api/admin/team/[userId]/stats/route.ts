/**
 * @file 团队统计数据API
 * @description 后台管理端 - 获取用户的团队统计数据
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第20.4节
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
 * GET /api/admin/team/:userId/stats
 * @description 获取团队统计数据
 *
 * 路径参数：
 * - userId: 目标用户ID
 *
 * 返回数据：
 * - teamSummary: 团队人数统计
 *   - level1Count: 一级下线数量
 *   - level2Count: 二级下线数量
 *   - level3Count: 三级下线数量
 *   - totalCount: 团队总人数
 *   - activeCount: 活跃成员数量（状态为 ACTIVE）
 *   - bannedCount: 封禁成员数量（状态为 BANNED）
 *   - paidCount: 已付费成员数量（购买过付费产品）
 * - commissionSummary: 返佣汇总
 *   - totalCommission: 总返佣金额
 *   - level1Commission: 一级返佣总额
 *   - level2Commission: 二级返佣总额
 *   - level3Commission: 三级返佣总额
 * - validInviteSummary: 有效邀请统计
 *   - totalValidInvites: 总有效邀请数量
 *   - rechargePurchaseCount: 通过充值+购买成为有效邀请的数量
 *   - completeSigninCount: 通过完成签到成为有效邀请的数量
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      const { userId: userIdStr } = await params;
      const userId = parseInt(userIdStr, 10);

      if (isNaN(userId) || userId <= 0) {
        return errorResponse('VALIDATION_ERROR', '无效的用户ID', 400);
      }

      // 调用服务获取团队统计数据
      const result = await adminTeamService.getTeamStats(userId);

      return successResponse(result);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/team/:userId/stats] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取团队统计数据失败', 500);
    }
  });
}
