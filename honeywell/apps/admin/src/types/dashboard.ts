/**
 * @file 仪表盘类型定义
 * @description 仪表盘相关的数据类型定义
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第2节 - 仪表盘接口
 */

/**
 * 今日统计数据
 */
export interface TodayStats {
  /** 新增用户数 */
  newUsers: number;
  /** 活跃用户数 */
  activeUsers: number;
  /** 充值金额 */
  rechargeAmount: string;
  /** 充值笔数 */
  rechargeCount: number;
  /** 提现金额 */
  withdrawAmount: string;
  /** 提现笔数 */
  withdrawCount: number;
  /** 净流入金额 */
  netInflow: string;
  /** 购买金额 */
  purchaseAmount: string;
  /** 收益发放金额 */
  incomeAmount: string;
  /** 返佣金额 */
  commissionAmount: string;
  /** 签到奖励金额 */
  signInRewardAmount: string;
  /** 活动奖励金额 */
  activityRewardAmount: string;
}

/**
 * 累计统计数据
 */
export interface TotalStats {
  /** 总用户数 */
  userCount: number;
  /** 总充值金额 */
  rechargeAmount: string;
  /** 总提现金额 */
  withdrawAmount: string;
}

/**
 * 待处理事项统计
 */
export interface PendingStats {
  /** 待审核提现笔数 */
  withdrawReviewCount: number;
  /** 待审核提现金额 */
  withdrawReviewAmount: string;
  /** 收益发放异常数 */
  incomeExceptionCount: number;
}

/**
 * 核心统计数据响应
 */
export interface DashboardStats {
  /** 今日数据 */
  today: TodayStats;
  /** 昨日数据 */
  yesterday: TodayStats;
  /** 累计数据 */
  total: TotalStats;
  /** 待处理事项 */
  pending: PendingStats;
}

/**
 * 趋势数据
 */
export interface TrendData {
  /** 日期数组 */
  dates: string[];
  /** 充值金额趋势 */
  recharge: number[];
  /** 提现金额趋势 */
  withdraw: number[];
  /** 净流入趋势 */
  netInflow: number[];
  /** 新增用户趋势 */
  newUsers: number[];
  /** 活跃用户趋势 */
  activeUsers: number[];
}

/**
 * 最近充值订单
 */
export interface RecentRecharge {
  /** 用户手机号（脱敏） */
  userPhone: string;
  /** 金额 */
  amount: string;
  /** 相对时间 */
  time: string;
}

/**
 * 最近提现订单
 */
export interface RecentWithdraw {
  /** 用户手机号（脱敏） */
  userPhone: string;
  /** 金额 */
  amount: string;
  /** 状态 */
  status: 'PENDING_REVIEW' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'FAILED';
  /** 相对时间 */
  time: string;
}

/**
 * 支付通道余额
 */
export interface ChannelBalance {
  [key: string]: string;
}

/**
 * 实时数据响应
 */
export interface RealtimeData {
  /** 当前在线人数 */
  onlineCount: number;
  /** 今日峰值在线 */
  todayPeakOnline: number;
  /** 峰值时间 */
  peakTime: string;
  /** 支付通道余额 */
  channelBalance: ChannelBalance;
  /** 最近充值订单 */
  recentRecharges: RecentRecharge[];
  /** 最近提现订单 */
  recentWithdraws: RecentWithdraw[];
}

/**
 * 异常告警类型
 */
export type AlertType = 
  | 'INCOME_EXCEPTION' 
  | 'CHANNEL_ERROR' 
  | 'WITHDRAW_BACKLOG'
  | 'SYSTEM_ERROR';

/**
 * 异常告警项
 */
export interface AlertItem {
  /** 告警类型 */
  type: AlertType;
  /** 数量 */
  count?: number;
  /** 通道编码 */
  channelCode?: string;
  /** 告警消息 */
  message: string;
}

/**
 * 异常告警响应
 */
export interface AlertsData {
  /** 告警列表 */
  alerts: AlertItem[];
}

/**
 * 趋势范围类型
 */
export type TrendRange = '7d' | '30d';

/**
 * 指标卡片配置
 */
export interface StatCardConfig {
  /** 标题 */
  title: string;
  /** 数据键名 */
  dataKey: keyof TodayStats;
  /** 是否金额类型 */
  isAmount: boolean;
  /** 后缀 */
  suffix?: string;
  /** 图标颜色 */
  color: string;
  /** 图标组件 */
  icon: React.ReactNode;
}

/**
 * 比较结果
 */
export interface CompareResult {
  /** 增长率 */
  rate: number;
  /** 趋势方向 */
  trend: 'up' | 'down' | 'stable';
  /** 百分比显示文本 */
  text: string;
}
