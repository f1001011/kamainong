/**
 * @file 团队统计接口
 * @description GET /api/team/stats - 获取团队统计概览
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第12.1节 - 团队统计
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse } from '@/lib/response';
import { teamService } from '@/services/team.service';

/**
 * GET /api/team/stats
 *
 * @description 获取团队统计概览
 * @requires 登录认证
 *
 * 响应格式（依据：02.3-前端API接口清单.md 第12.1节）：
 * {
 *   "success": true,
 *   "data": {
 *     "totalMembers": 50,
 *     "level1Count": 30,
 *     "level2Count": 15,
 *     "level3Count": 5,
 *     "totalCommission": "500.00",
 *     "todayCommission": "20.00",
 *     "thisMonthCommission": "150.00"
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, userId) => {
    // 获取团队统计数据
    const stats = await teamService.getTeamStats(userId);

    return successResponse(stats);
  });
}
