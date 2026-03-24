/**
 * @file 仪表盘核心统计数据接口
 * @description GET /api/admin/dashboard/stats
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第2.1节
 *
 * 返回数据：
 * - 今日数据：新增用户、活跃用户、充值、提现、净入金、购买、收益、返佣、签到、活动
 * - 昨日数据：同上（用于对比）
 * - 累计数据：用户总数、总充值、总提现
 * - 待处理：提现审核、收益异常
 *
 * 缓存策略：1分钟缓存，支持每分钟更新
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getDashboardStats } from '@/services/dashboard.service';

/**
 * 获取仪表盘核心统计数据
 * @route GET /api/admin/dashboard/stats
 * @auth 需要管理员登录
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      // 获取统计数据（带缓存）
      const stats = await getDashboardStats();

      return successResponse(stats, '获取统计数据成功');
    } catch (error) {
      console.error('[Dashboard Stats Error]', error);
      return errorResponse('INTERNAL_ERROR', '获取统计数据失败');
    }
  });
}
