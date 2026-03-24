/**
 * @file 仪表盘异常告警接口
 * @description GET /api/admin/dashboard/alerts
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第2.4节
 *
 * 返回数据：
 * - alerts: 告警数组
 *   - type: 告警类型（INCOME_EXCEPTION | CHANNEL_ERROR | WITHDRAW_BACKLOG）
 *   - count: 相关数量（如异常笔数、积压数量）
 *   - channelCode: 通道编码（仅通道异常时返回）
 *   - message: 告警消息
 *
 * 告警条件：
 * - INCOME_EXCEPTION: 存在未处理的收益发放异常
 * - CHANNEL_ERROR: 支付通道状态异常或成功率低于85%
 * - WITHDRAW_BACKLOG: 待审核提现超过20笔
 *
 * 缓存策略：1分钟缓存
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getDashboardAlerts } from '@/services/dashboard.service';

/**
 * 获取仪表盘异常告警
 * @route GET /api/admin/dashboard/alerts
 * @auth 需要管理员登录
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      // 获取告警数据（带缓存）
      const alertData = await getDashboardAlerts();

      return successResponse(alertData, '获取告警数据成功');
    } catch (error) {
      console.error('[Dashboard Alerts Error]', error);
      return errorResponse('INTERNAL_ERROR', '获取告警数据失败');
    }
  });
}
