/**
 * @file 实时数据监控类型定义
 * @description 实时在线用户、实时交易监控相关类型定义
 * @depends 开发文档.md 第13.23节 - 实时数据监控
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第22节 - 实时数据监控接口
 */

/**
 * 趋势类型
 */
export type TrendType = 'UP' | 'DOWN' | 'STABLE';

/**
 * 设备类型
 */
export type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'unknown';

/**
 * 小时统计数据
 */
export interface HourlyStat {
  /** 小时（00-23） */
  hour: string;
  /** 在线人数 */
  count: number;
}

/**
 * 实时在线用户统计
 * @description 依据：02.4-后台API接口清单.md 第22.1节
 */
export interface OnlineUserStats {
  /** 当前在线人数 */
  currentOnline: number;
  /** 今日峰值在线 */
  todayPeak: number;
  /** 今日峰值时间 */
  todayPeakTime: string;
  /** 昨日同时段在线人数 */
  yesterdaySameTime: number;
  /** 趋势 */
  trend: TrendType;
  /** 24小时在线趋势（每小时统计） */
  hourlyStats: HourlyStat[];
}

/**
 * 在线用户信息
 * @description 依据：02.4-后台API接口清单.md 第22.2节
 */
export interface OnlineUser {
  /** 用户ID */
  userId: number;
  /** 手机号 */
  phone: string;
  /** 昵称 */
  nickname: string;
  /** VIP等级 */
  vipLevel: number;
  /** 最后心跳时间 */
  lastHeartbeatAt: string;
  /** 最后活跃IP */
  lastActiveIp: string;
  /** 设备类型 */
  deviceType: DeviceType;
  /** 本次在线时长（秒） */
  onlineDuration: number;
}

/**
 * 在线用户列表响应
 */
export interface OnlineUserListResponse {
  list: OnlineUser[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 交易类型
 */
export type TransactionType = 'recharge' | 'withdraw' | 'purchase';

/**
 * 充值记录（实时）
 * @description 依据：02.4-后台API接口清单.md 第22.3节
 */
export interface RecentRecharge {
  /** 记录ID */
  id: number;
  /** 订单号 */
  orderNo: string;
  /** 用户ID */
  userId: number;
  /** 用户手机号（脱敏） */
  userPhone: string;
  /** 金额 */
  amount: string;
  /** 通道名称 */
  channelName: string;
  /** 状态 */
  status: string;
  /** 创建时间 */
  createdAt: string;
  /** 相对时间描述 */
  timeAgo: string;
}

/**
 * 提现记录（实时）
 * @description 依据：02.4-后台API接口清单.md 第22.3节
 */
export interface RecentWithdraw {
  /** 记录ID */
  id: number;
  /** 订单号 */
  orderNo: string;
  /** 用户ID */
  userId: number;
  /** 用户手机号（脱敏） */
  userPhone: string;
  /** 金额 */
  amount: string;
  /** 状态 */
  status: string;
  /** 创建时间 */
  createdAt: string;
  /** 相对时间描述 */
  timeAgo: string;
}

/**
 * 购买记录（实时）
 * @description 依据：02.4-后台API接口清单.md 第22.3节
 */
export interface RecentPurchase {
  /** 记录ID */
  id: number;
  /** 订单号 */
  orderNo: string;
  /** 用户ID */
  userId: number;
  /** 用户手机号（脱敏） */
  userPhone: string;
  /** 产品名称 */
  productName: string;
  /** 金额 */
  amount: string;
  /** 创建时间 */
  createdAt: string;
  /** 相对时间描述 */
  timeAgo: string;
}

/**
 * 5分钟汇总统计
 * @description 依据：02.4-后台API接口清单.md 第22.3节
 * 注意：API 文档只定义了金额字段，笔数字段为扩展字段（可选）
 */
export interface FiveMinuteSummary {
  /** 近5分钟充值金额 */
  last5MinRecharge: string;
  /** 近5分钟提现金额 */
  last5MinWithdraw: string;
  /** 近5分钟购买金额 */
  last5MinPurchase: string;
  /** 近5分钟充值笔数（扩展字段，API可能不返回） */
  last5MinRechargeCount?: number;
  /** 近5分钟提现笔数（扩展字段，API可能不返回） */
  last5MinWithdrawCount?: number;
  /** 近5分钟购买笔数（扩展字段，API可能不返回） */
  last5MinPurchaseCount?: number;
}

/**
 * 实时交易监控数据
 * @description 依据：02.4-后台API接口清单.md 第22.3节
 */
export interface RealtimeTransactions {
  /** 汇总数据 */
  summary: FiveMinuteSummary;
  /** 最近充值记录 */
  recentRecharges: RecentRecharge[];
  /** 最近提现记录 */
  recentWithdraws: RecentWithdraw[];
  /** 最近购买记录 */
  recentPurchases: RecentPurchase[];
}

/**
 * 统一的交易记录（用于合并显示）
 */
export interface UnifiedTransaction {
  /** 唯一ID */
  id: string;
  /** 交易类型 */
  type: TransactionType;
  /** 订单号 */
  orderNo: string;
  /** 用户ID */
  userId: number;
  /** 用户手机号（脱敏） */
  userPhone: string;
  /** 金额 */
  amount: string;
  /** 状态 */
  status?: string;
  /** 产品名称（购买时有） */
  productName?: string;
  /** 通道名称（充值时有） */
  channelName?: string;
  /** 创建时间 */
  createdAt: string;
  /** 相对时间描述 */
  timeAgo: string;
}

/**
 * 支付通道状态
 */
export interface ChannelStatusInfo {
  /** 通道ID */
  id: number;
  /** 通道编码 */
  code: string;
  /** 通道名称 */
  name: string;
  /** 通道状态（NORMAL/WARNING/ERROR） */
  status: 'NORMAL' | 'WARNING' | 'ERROR';
  /** 是否启用 */
  enabled: boolean;
  /** 余额 */
  balance: string | null;
  /** 成功率（百分比） */
  successRate: string;
  /** 最后检查时间 */
  lastCheckAt: string | null;
}

/**
 * 定时任务状态
 */
export interface TaskStatusInfo {
  /** 任务编码 */
  taskCode: string;
  /** 任务名称 */
  taskName: string;
  /** 最后执行时间 */
  lastRunAt: string | null;
  /** 最后执行状态 */
  lastRunStatus: 'SUCCESS' | 'FAILED' | 'RUNNING' | null;
  /** 连续失败次数 */
  consecutiveFailures: number;
}

/**
 * 系统状态监控数据
 */
export interface SystemStatusData {
  /** 支付通道状态列表 */
  channels: ChannelStatusInfo[];
  /** 定时任务状态列表 */
  tasks: TaskStatusInfo[];
  /** 异常告警数量 */
  alertCount: number;
  /** 系统整体状态（normal/warning/critical） */
  overallStatus: 'normal' | 'warning' | 'critical';
}

/**
 * 高亮金额阈值（金额大于此值高亮显示）
 */
export const HIGHLIGHT_AMOUNT_THRESHOLD = 1000;

/**
 * 设备类型映射
 */
export const DEVICE_TYPE_MAP: Record<DeviceType, { label: string; icon: string }> = {
  mobile: { label: '手机', icon: 'RiSmartphoneLine' },
  desktop: { label: '电脑', icon: 'RiComputerLine' },
  tablet: { label: '平板', icon: 'RiTabletLine' },
  unknown: { label: '未知', icon: 'RiQuestionLine' },
};

/**
 * 交易类型配置
 */
export const TRANSACTION_TYPE_CONFIG: Record<TransactionType, { label: string; color: string; bgColor: string }> = {
  recharge: { label: '充值', color: '#52c41a', bgColor: 'rgba(82, 196, 26, 0.1)' },
  withdraw: { label: '提现', color: '#1677ff', bgColor: 'rgba(22, 119, 255, 0.1)' },
  purchase: { label: '购买', color: '#fa8c16', bgColor: 'rgba(250, 140, 22, 0.1)' },
};

/**
 * 格式化在线时长
 * @param seconds 秒数
 * @returns 格式化后的字符串
 */
export function formatOnlineDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}秒`;
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}分钟`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
}

/**
 * 计算同比变化百分比
 * @param current 当前值
 * @param previous 上期值
 * @returns 变化百分比
 */
export function calculateChangePercent(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}
