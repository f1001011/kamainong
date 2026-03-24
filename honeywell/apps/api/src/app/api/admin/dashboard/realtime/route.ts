/**
 * @file 仪表盘实时数据接口
 * @description GET /api/admin/dashboard/realtime
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第2.3节
 *
 * 返回数据：
 * - onlineCount: 当前在线人数
 * - todayPeakOnline: 今日在线峰值
 * - peakTime: 峰值时间
 * - channelBalance: 各通道余额
 * - recentRecharges: 最近10笔充值
 * - recentWithdraws: 最近10笔提现
 *
 * 缓存策略：不缓存，支持30秒轮询
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getDashboardRealtime } from '@/services/dashboard.service';

/**
 * 获取仪表盘实时数据
 * @route GET /api/admin/dashboard/realtime
 * @auth 需要管理员登录
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      // 获取实时数据（不使用缓存）
      const realtime = await getDashboardRealtime();

      return successResponse(realtime, '获取实时数据成功');
    } catch (error) {
      console.error('[Dashboard Realtime Error]', error);
      return errorResponse('INTERNAL_ERROR', '获取实时数据失败');
    }
  });
}
