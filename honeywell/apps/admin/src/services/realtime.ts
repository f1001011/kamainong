/**
 * @file 实时数据监控 API 服务
 * @description 实时在线用户、实时交易监控相关 API 请求封装
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第22节 - 实时数据监控接口
 */

import { get } from '@/utils/request';
import type {
  OnlineUserStats,
  OnlineUserListResponse,
  RealtimeTransactions,
  SystemStatusData,
  ChannelStatusInfo,
  TaskStatusInfo,
  UnifiedTransaction,
  RecentRecharge,
  RecentWithdraw,
  RecentPurchase,
} from '@/types/realtime';

/**
 * 获取实时在线用户统计
 * @description 依据：02.4-后台API接口清单.md 第22.1节
 * @endpoint GET /api/admin/realtime/online-users
 */
export async function fetchOnlineUserStats(): Promise<OnlineUserStats> {
  return get<OnlineUserStats>('/realtime/online-users');
}

/**
 * 获取在线用户列表
 * @description 依据：02.4-后台API接口清单.md 第22.2节
 * @endpoint GET /api/admin/realtime/online-users/list
 */
export async function fetchOnlineUserList(params?: {
  page?: number;
  pageSize?: number;
}): Promise<OnlineUserListResponse> {
  return get<OnlineUserListResponse>('/realtime/online-users/list', params);
}

/**
 * 获取实时交易监控数据
 * @description 依据：02.4-后台API接口清单.md 第22.3节
 * @endpoint GET /api/admin/realtime/transactions
 * @param limit 返回最近N条交易记录（默认50）
 */
export async function fetchRealtimeTransactions(limit = 50): Promise<RealtimeTransactions> {
  return get<RealtimeTransactions>('/realtime/transactions', { limit });
}

/**
 * 获取系统状态监控数据
 * @description 组合多个现有接口获取系统状态（通道、告警等）
 * 注意：API接口清单中没有专用的 system-status 接口，需要组合以下接口：
 * - GET /api/admin/channels（第9节）
 * - GET /api/admin/dashboard/alerts（第2节）
 */
export async function fetchSystemStatus(): Promise<SystemStatusData> {
  // 并行请求通道列表和告警数据
  const [channelsRes, alertsRes] = await Promise.all([
    get<{ list: ChannelStatusInfo[] }>('/channels').catch(() => ({ list: [] })),
    get<{ alerts: Array<{ type: string }> }>('/dashboard/alerts').catch(() => ({ alerts: [] })),
  ]);

  // 转换通道数据格式
  // 使用 as unknown 先转换为未知类型，避免类型不兼容错误
  const rawChannels = channelsRes.list || [];
  const channels: ChannelStatusInfo[] = (rawChannels as unknown as Array<Record<string, unknown>>).map((ch) => ({
    id: ch.id as number,
    code: ch.code as string,
    name: ch.name as string,
    status: (ch.channelStatus || ch.status || 'NORMAL') as 'NORMAL' | 'WARNING' | 'ERROR',
    enabled: (ch.payEnabled as boolean) || (ch.transferEnabled as boolean) || false,
    balance: (ch.balance as string) || null,
    successRate: (ch.hourlySuccessRate as string) || '0',
    lastCheckAt: (ch.lastCheckAt as string) || null,
  }));

  // 计算系统整体状态
  const hasError = channels.some((ch) => ch.status === 'ERROR');
  const hasWarning = channels.some((ch) => ch.status === 'WARNING');
  const alertCount = alertsRes.alerts?.length || 0;

  let overallStatus: 'normal' | 'warning' | 'critical' = 'normal';
  if (hasError || alertCount > 5) {
    overallStatus = 'critical';
  } else if (hasWarning || alertCount > 0) {
    overallStatus = 'warning';
  }

  return {
    channels,
    tasks: [], // 任务状态通过 fetchTasksStatus 单独获取
    alertCount,
    overallStatus,
  };
}

/**
 * 获取定时任务状态列表
 * @description 从任务接口获取任务状态
 * @endpoint GET /api/admin/tasks
 */
export async function fetchTasksStatus(): Promise<TaskStatusInfo[]> {
  try {
    const res = await get<{ list: TaskStatusInfo[] }>('/tasks');
    return res.list || [];
  } catch {
    return [];
  }
}

/**
 * 合并交易记录为统一格式
 * @description 将充值、提现、购买记录合并为统一的交易记录列表
 * @param transactions 实时交易数据
 * @returns 按时间排序的统一交易记录列表
 */
export function mergeTransactions(transactions: RealtimeTransactions): UnifiedTransaction[] {
  const unified: UnifiedTransaction[] = [];

  // 转换充值记录
  transactions.recentRecharges.forEach((item: RecentRecharge) => {
    unified.push({
      id: `recharge-${item.id}`,
      type: 'recharge',
      orderNo: item.orderNo,
      userId: item.userId,
      userPhone: item.userPhone,
      amount: item.amount,
      status: item.status,
      channelName: item.channelName,
      createdAt: item.createdAt,
      timeAgo: item.timeAgo,
    });
  });

  // 转换提现记录
  transactions.recentWithdraws.forEach((item: RecentWithdraw) => {
    unified.push({
      id: `withdraw-${item.id}`,
      type: 'withdraw',
      orderNo: item.orderNo,
      userId: item.userId,
      userPhone: item.userPhone,
      amount: item.amount,
      status: item.status,
      createdAt: item.createdAt,
      timeAgo: item.timeAgo,
    });
  });

  // 转换购买记录
  transactions.recentPurchases.forEach((item: RecentPurchase) => {
    unified.push({
      id: `purchase-${item.id}`,
      type: 'purchase',
      orderNo: item.orderNo,
      userId: item.userId,
      userPhone: item.userPhone,
      amount: item.amount,
      productName: item.productName,
      createdAt: item.createdAt,
      timeAgo: item.timeAgo,
    });
  });

  // 按创建时间降序排序
  unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return unified;
}

/**
 * 刷新间隔常量（毫秒）
 */
export const REFRESH_INTERVALS = {
  /** 默认刷新间隔（10秒） */
  DEFAULT: 10000,
  /** 快速刷新间隔（5秒） */
  FAST: 5000,
  /** 慢速刷新间隔（30秒） */
  SLOW: 30000,
} as const;
