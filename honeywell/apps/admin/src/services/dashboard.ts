/**
 * @file 仪表盘 API 服务
 * @description 仪表盘相关的 API 请求封装
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第2节 - 仪表盘接口
 */

import { get } from '@/utils/request';
import type {
  DashboardStats,
  TrendData,
  RealtimeData,
  AlertsData,
  TrendRange,
} from '@/types/dashboard';

/**
 * 获取核心统计数据
 * @description 依据：02.4-后台API接口清单.md 第2.1节
 * @endpoint GET /api/admin/dashboard/stats
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  return get<DashboardStats>('/dashboard/stats');
}

/**
 * 获取趋势图表数据
 * @description 依据：02.4-后台API接口清单.md 第2.2节
 * @endpoint GET /api/admin/dashboard/trends
 * @param range - 时间范围：7d=近7天 | 30d=近30天
 */
export async function fetchTrendData(range: TrendRange = '7d'): Promise<TrendData> {
  return get<TrendData>('/dashboard/trends', { range });
}

/**
 * 获取实时数据
 * @description 依据：02.4-后台API接口清单.md 第2.3节
 * @endpoint GET /api/admin/dashboard/realtime
 */
export async function fetchRealtimeData(): Promise<RealtimeData> {
  return get<RealtimeData>('/dashboard/realtime');
}

/**
 * 获取异常告警
 * @description 依据：02.4-后台API接口清单.md 第2.4节
 * @endpoint GET /api/admin/dashboard/alerts
 */
export async function fetchAlerts(): Promise<AlertsData> {
  return get<AlertsData>('/dashboard/alerts');
}

/**
 * 计算同比变化
 * @param current - 当前值
 * @param previous - 上期值
 * @returns 变化百分比和趋势
 */
export function calculateChange(
  current: number | string,
  previous: number | string
): { rate: number; trend: 'up' | 'down' | 'stable'; text: string } {
  const curr = Number(current) || 0;
  const prev = Number(previous) || 0;

  if (prev === 0) {
    if (curr > 0) {
      return { rate: 100, trend: 'up', text: '+100%' };
    }
    return { rate: 0, trend: 'stable', text: '0%' };
  }

  const rate = ((curr - prev) / prev) * 100;
  const absRate = Math.abs(rate);

  if (absRate < 0.01) {
    return { rate: 0, trend: 'stable', text: '0%' };
  }

  const sign = rate > 0 ? '+' : '';
  const text = `${sign}${rate.toFixed(1)}%`;
  const trend = rate > 0 ? 'up' : rate < 0 ? 'down' : 'stable';

  return { rate, trend, text };
}

/**
 * 格式化大数字（如 12.5K、3.2M）
 * @param value - 数值
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * 告警类型映射
 */
export const ALERT_TYPE_MAP: Record<string, { label: string; route: string }> = {
  INCOME_EXCEPTION: {
    label: '收益发放异常',
    route: '/finance/income?status=FAILED',
  },
  CHANNEL_ERROR: {
    label: '通道异常',
    route: '/settings/channels',
  },
  WITHDRAW_BACKLOG: {
    label: '提现积压',
    route: '/orders/withdraw?status=PENDING_REVIEW',
  },
  SYSTEM_ERROR: {
    label: '系统异常',
    route: '/system/logs',
  },
};

/**
 * 提现状态映射
 */
export const WITHDRAW_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING_REVIEW: { label: '待审核', color: 'orange' },
  APPROVED: { label: '已通过', color: 'blue' },
  PROCESSING: { label: '处理中', color: 'processing' },
  COMPLETED: { label: '已完成', color: 'success' },
  REJECTED: { label: '已拒绝', color: 'error' },
  FAILED: { label: '失败', color: 'error' },
};
