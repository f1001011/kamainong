/**
 * @file 返佣记录接口
 * @description GET /api/team/commissions - 获取返佣记录
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第12.3节 - 返佣记录
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.4节 - CommissionRecord表
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { teamService } from '@/services/team.service';

/**
 * GET /api/team/commissions
 *
 * @description 获取返佣记录
 * @requires 登录认证
 *
 * Query参数：
 * - page: 页码（默认1）
 * - pageSize: 每页数量（默认20）
 *
 * 响应格式（依据：02.3-前端API接口清单.md 第12.3节）：
 * {
 *   "success": true,
 *   "data": {
 *     "list": [
 *       {
 *         "id": 1,
 *         "fromUserNickname": "用户A",
 *         "fromUserAvatar": "/uploads/avatar/xxx.png",
 *         "fromUserPhone": "987****321",
 *         "level": "LEVEL_1",
 *         "levelName": "一级返佣",
 *         "rate": "20.00",
 *         "baseAmount": "50.00",
 *         "amount": "10.00",
 *         "productName": "Po1",
 *         "createdAt": "2026-02-03T10:30:00.000Z"
 *       }
 *     ],
 *     "pagination": { "page": 1, "pageSize": 20, "total": 25, "totalPages": 2 },
 *     "summary": {
 *       "totalCommission": "500.00",
 *       "level1Total": "400.00",
 *       "level2Total": "80.00",
 *       "level3Total": "20.00"
 *     }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, userId) => {
    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    // 参数校验
    const validPage = Math.max(1, page);
    const validPageSize = Math.min(Math.max(1, pageSize), 100); // 限制最大100条

    // 获取返佣记录
    const result = await teamService.getCommissionRecords(userId, validPage, validPageSize);

    // 返回包含 summary 的响应
    return NextResponse.json({
      success: true,
      data: {
        list: result.list,
        pagination: {
          ...result.pagination,
          totalPages: Math.ceil(result.pagination.total / result.pagination.pageSize),
        },
        summary: result.summary,
      },
    });
  });
}
