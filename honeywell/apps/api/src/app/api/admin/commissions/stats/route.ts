/**
 * @file 返佣统计汇总接口
 * @description GET /api/admin/commissions/stats
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第19.2节
 *
 * 筛选条件：
 * - startDate/endDate: 时间范围
 *
 * 返回内容：
 * - summary: 各级别金额汇总
 * - topReceivers: TOP 获佣用户（前10名）
 * - dailyTrend: 每日趋势数据
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import {
  adminCommissionService,
  CommissionStatsParams,
} from '@/services/admin-commission.service';

/**
 * 获取返佣统计汇总
 * @route GET /api/admin/commissions/stats
 * @auth 需要管理员登录
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const searchParams = req.nextUrl.searchParams;

      // 解析查询参数
      const params: CommissionStatsParams = {
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
      };

      // 获取统计数据
      const result = await adminCommissionService.getStats(params);

      return successResponse(result, '获取返佣统计成功');
    } catch (error) {
      console.error('[Commissions Stats Error]', error);
      return errorResponse('INTERNAL_ERROR', '获取返佣统计失败');
    }
  });
}
