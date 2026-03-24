/**
 * @file 实时在线用户统计接口
 * @description GET /api/admin/realtime/online-users
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第22.1节
 *
 * 返回数据：
 * - currentOnline: 当前在线人数
 * - todayPeak: 今日在线峰值
 * - todayPeakTime: 今日峰值时间
 * - yesterdaySameTime: 昨日同一时间在线人数
 * - trend: 趋势（UP | DOWN | STABLE）
 * - hourlyStats: 今日24小时在线人数分布
 *
 * 在线判断规则：
 * - 心跳超时时间从 GlobalConfig.heartbeat_timeout 读取（默认120秒）
 * - isOnline = (当前时间 - lastHeartbeat) < heartbeat_timeout
 *
 * 缓存策略：不缓存，支持10-30秒轮询
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getOnlineUsersStats } from '@/services/realtime.service';

/**
 * 获取实时在线用户统计
 * @route GET /api/admin/realtime/online-users
 * @auth 需要管理员登录
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      // 获取在线用户统计（不使用缓存）
      const stats = await getOnlineUsersStats();

      return successResponse(stats, '获取在线用户统计成功');
    } catch (error) {
      console.error('[Realtime Online Users Stats Error]', error);
      return errorResponse('INTERNAL_ERROR', '获取在线用户统计失败');
    }
  });
}
