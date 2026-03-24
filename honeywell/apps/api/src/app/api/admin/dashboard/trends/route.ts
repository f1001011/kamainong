/**
 * @file 仪表盘趋势图表数据接口
 * @description GET /api/admin/dashboard/trends
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第2.2节
 *
 * 查询参数：
 * - range: 时间范围，7d=近7天 | 30d=近30天（默认7d）
 *
 * 返回数据：
 * - dates: 日期数组
 * - recharge: 充值金额数组
 * - withdraw: 提现金额数组
 * - netInflow: 净入金数组
 * - newUsers: 新增用户数组
 * - activeUsers: 活跃用户数组
 *
 * 缓存策略：5分钟缓存
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getDashboardTrends } from '@/services/dashboard.service';

/**
 * 获取仪表盘趋势图表数据
 * @route GET /api/admin/dashboard/trends?range=7d
 * @auth 需要管理员登录
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      // 获取查询参数
      const { searchParams } = new URL(req.url);
      const range = searchParams.get('range') || '7d';

      // 校验 range 参数
      if (range !== '7d' && range !== '30d') {
        return errorResponse('VALIDATION_ERROR', 'range参数必须为7d或30d');
      }

      // 获取趋势数据（带缓存）
      const trends = await getDashboardTrends(range);

      return successResponse(trends, '获取趋势数据成功');
    } catch (error) {
      console.error('[Dashboard Trends Error]', error);
      return errorResponse('INTERNAL_ERROR', '获取趋势数据失败');
    }
  });
}
