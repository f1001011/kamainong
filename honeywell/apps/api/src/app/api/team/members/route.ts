/**
 * @file 团队成员列表接口
 * @description GET /api/team/members - 获取团队成员列表
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第12.2节 - 团队成员列表
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { paginatedResponse } from '@/lib/response';
import { teamService } from '@/services/team.service';

/**
 * GET /api/team/members
 *
 * @description 获取团队成员列表
 * @requires 登录认证
 *
 * Query参数：
 * - level: 层级筛选（1 | 2 | 3，不传则返回全部）
 * - page: 页码（默认1）
 * - pageSize: 每页数量（默认20）
 *
 * 响应格式（依据：02.3-前端API接口清单.md 第12.2节）：
 * {
 *   "success": true,
 *   "data": {
 *     "list": [
 *       {
 *         "id": 123,
 *         "nickname": "用户A",
 *         "avatar": "/uploads/avatar/xxx.png",
 *         "phoneMask": "987****321",
 *         "level": 1,
 *         "vipLevel": 2,
 *         "isValidInvite": true,
 *         "contributedCommission": "50.00",
 *         "registeredAt": "2026-01-20T08:00:00.000Z",
 *         "totalRecharge": "500.00",
 *         "totalPurchase": "300.00"
 *       }
 *     ],
 *     "pagination": { "page": 1, "pageSize": 20, "total": 50, "totalPages": 3 }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, userId) => {
    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const levelParam = searchParams.get('level');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    // 参数校验
    const validPage = Math.max(1, page);
    const validPageSize = Math.min(Math.max(1, pageSize), 100); // 限制最大100条

    // 层级参数校验
    let level: number | undefined;
    if (levelParam) {
      const parsedLevel = parseInt(levelParam, 10);
      if ([1, 2, 3].includes(parsedLevel)) {
        level = parsedLevel;
      }
    }

    // 获取团队成员列表
    const result = await teamService.getTeamMembers(userId, validPage, validPageSize, level);

    return paginatedResponse(result.list, result.pagination);
  });
}
