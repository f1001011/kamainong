/**
 * @file 状态标签组件
 * @description 统一的状态显示组件，支持多种业务状态
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第11.1节 - 状态标签组件
 */

'use client';

import React from 'react';
import { Tag, Badge } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  StopOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';

/**
 * 状态配置类型
 */
interface StatusConfig {
  color: string;
  text: string;
  icon?: React.ReactNode;
}

/**
 * 用户状态配置
 */
const USER_STATUS_CONFIG: Record<string, StatusConfig> = {
  ACTIVE: { color: 'green', text: '正常', icon: <CheckCircleOutlined /> },
  BANNED: { color: 'red', text: '封禁', icon: <StopOutlined /> },
};

/**
 * 充值订单状态配置
 */
const RECHARGE_STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING_PAYMENT: { color: 'orange', text: '待支付', icon: <ClockCircleOutlined /> },
  PAID: { color: 'green', text: '已支付', icon: <CheckCircleOutlined /> },
  FAILED: { color: 'red', text: '失败', icon: <CloseCircleOutlined /> },
  CANCELLED: { color: 'default', text: '已取消', icon: <MinusCircleOutlined /> },
  TIMEOUT: { color: 'default', text: '已超时', icon: <ClockCircleOutlined /> },
};

/**
 * 提现订单状态配置
 */
const WITHDRAW_STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING_REVIEW: { color: 'orange', text: '待审核', icon: <ClockCircleOutlined /> },
  APPROVED: { color: 'blue', text: '已通过', icon: <CheckCircleOutlined /> },
  PAYOUT_FAILED: { color: 'volcano', text: '代付失败', icon: <ExclamationCircleOutlined /> },
  PROCESSING: { color: 'processing', text: '处理中', icon: <SyncOutlined spin /> },
  COMPLETED: { color: 'green', text: '已完成', icon: <CheckCircleOutlined /> },
  FAILED: { color: 'red', text: '已退款', icon: <CloseCircleOutlined /> },
  REJECTED: { color: 'default', text: '已拒绝', icon: <CloseCircleOutlined /> },
};

/**
 * 持仓订单状态配置
 * @description 依据：04.4.1-持仓订单列表页.md 第3.2节
 * - ACTIVE 进行中 = 绿色 success
 * - COMPLETED 已完成 = 灰色 default
 */
const POSITION_STATUS_CONFIG: Record<string, StatusConfig> = {
  ACTIVE: { color: 'green', text: '进行中', icon: <SyncOutlined spin /> },
  COMPLETED: { color: 'default', text: '已完成', icon: <CheckCircleOutlined /> },
  TERMINATED: { color: 'red', text: '已终止', icon: <StopOutlined /> },
};

/**
 * 产品状态配置
 */
const PRODUCT_STATUS_CONFIG: Record<string, StatusConfig> = {
  ACTIVE: { color: 'green', text: '上架', icon: <CheckCircleOutlined /> },
  INACTIVE: { color: 'default', text: '下架', icon: <MinusCircleOutlined /> },
};

/**
 * 通道状态配置
 * @description 依据：04.7.1-支付通道管理页.md 第3.2节
 * - NORMAL 正常 = 绿色（成功率>=90%）
 * - WARNING 警告 = 黄色（成功率50%-90%）
 * - ERROR 异常 = 红色（成功率<50%）
 */
const CHANNEL_STATUS_CONFIG: Record<string, StatusConfig> = {
  NORMAL: { color: 'green', text: '正常', icon: <CheckCircleOutlined /> },
  WARNING: { color: 'orange', text: '警告', icon: <ExclamationCircleOutlined /> },
  ERROR: { color: 'red', text: '异常', icon: <CloseCircleOutlined /> },
  ACTIVE: { color: 'green', text: '启用', icon: <CheckCircleOutlined /> },
  INACTIVE: { color: 'default', text: '禁用', icon: <MinusCircleOutlined /> },
};

/**
 * 收益发放状态配置
 * @description 依据：04.4.1-持仓订单列表页.md 第6.3节
 * - PENDING 待发放 = 蓝色 processing
 * - SETTLED 已发放 = 绿色 success
 * - FAILED 失败 = 红色 error
 */
const INCOME_STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING: { color: 'processing', text: '待发放', icon: <ClockCircleOutlined /> },
  SETTLED: { color: 'green', text: '已发放', icon: <CheckCircleOutlined /> },
  FAILED: { color: 'red', text: '失败', icon: <CloseCircleOutlined /> },
  CANCELLED: { color: 'default', text: '已取消', icon: <MinusCircleOutlined /> },
};

/**
 * 管理员状态配置
 */
const ADMIN_STATUS_CONFIG: Record<string, StatusConfig> = {
  ACTIVE: { color: 'green', text: '正常', icon: <CheckCircleOutlined /> },
  DISABLED: { color: 'red', text: '禁用', icon: <StopOutlined /> },
};

/**
 * 活动状态配置
 */
const ACTIVITY_STATUS_CONFIG: Record<string, StatusConfig> = {
  ACTIVE: { color: 'green', text: '进行中', icon: <CheckCircleOutlined /> },
  INACTIVE: { color: 'default', text: '未开启', icon: <MinusCircleOutlined /> },
  ENDED: { color: 'default', text: '已结束', icon: <ClockCircleOutlined /> },
};

/**
 * Banner 状态配置
 * @description 依据：04.8.1-Banner管理页.md 第3.1节
 * - ACTIVE 生效中 = 绿色 success
 * - DISABLED 已禁用 = 灰色 default
 * - EXPIRED 已过期 = 红色 error
 * - EXPIRING_SOON 即将过期 = 黄色 warning
 * - NOT_STARTED 未开始 = 蓝色 processing
 */
const BANNER_STATUS_CONFIG: Record<string, StatusConfig> = {
  ACTIVE: { color: 'green', text: '生效中', icon: <CheckCircleOutlined /> },
  DISABLED: { color: 'default', text: '已禁用', icon: <MinusCircleOutlined /> },
  EXPIRED: { color: 'red', text: '已过期', icon: <CloseCircleOutlined /> },
  EXPIRING_SOON: { color: 'orange', text: '即将过期', icon: <ExclamationCircleOutlined /> },
  NOT_STARTED: { color: 'processing', text: '未开始', icon: <ClockCircleOutlined /> },
};

/**
 * 登录状态配置
 * @description 依据：04.10.3-管理员登录日志页.md、04.10.4-用户登录日志页.md
 * - SUCCESS 成功 = 绿色 success
 * - FAILED 失败 = 红色 error
 */
const LOGIN_STATUS_CONFIG: Record<string, StatusConfig> = {
  SUCCESS: { color: 'green', text: '成功', icon: <CheckCircleOutlined /> },
  FAILED: { color: 'red', text: '失败', icon: <CloseCircleOutlined /> },
};

/**
 * 站内信已读状态配置
 * @description 依据：开发文档.md 第13.12节 站内信管理
 * - READ 已读 = 灰色 default
 * - UNREAD 未读 = 蓝色 processing
 */
const NOTIFICATION_READ_STATUS_CONFIG: Record<string, StatusConfig> = {
  READ: { color: 'default', text: '已读', icon: <CheckCircleOutlined /> },
  UNREAD: { color: 'blue', text: '未读', icon: <ClockCircleOutlined /> },
};

/**
 * 定时任务执行状态配置
 * @description 依据：05.3-定时任务.md 第3.1节 ScheduledTask表
 * - SUCCESS 成功 = 绿色 success
 * - FAILED 失败 = 红色 error
 * - RUNNING 运行中 = 绿色 processing（带脉冲动画）
 */
const TASK_STATUS_CONFIG: Record<string, StatusConfig> = {
  SUCCESS: { color: 'green', text: '成功', icon: <CheckCircleOutlined /> },
  FAILED: { color: 'red', text: '失败', icon: <CloseCircleOutlined /> },
  RUNNING: { color: 'green', text: '运行中', icon: <SyncOutlined spin /> },
};

/**
 * 状态类型到配置映射
 */
const STATUS_CONFIG_MAP: Record<string, Record<string, StatusConfig>> = {
  user: USER_STATUS_CONFIG,
  recharge: RECHARGE_STATUS_CONFIG,
  withdraw: WITHDRAW_STATUS_CONFIG,
  position: POSITION_STATUS_CONFIG,
  product: PRODUCT_STATUS_CONFIG,
  channel: CHANNEL_STATUS_CONFIG,
  income: INCOME_STATUS_CONFIG,
  admin: ADMIN_STATUS_CONFIG,
  activity: ACTIVITY_STATUS_CONFIG,
  banner: BANNER_STATUS_CONFIG,
  login: LOGIN_STATUS_CONFIG,
  notification: NOTIFICATION_READ_STATUS_CONFIG,
  task: TASK_STATUS_CONFIG,
};

export interface StatusBadgeProps {
  /** 状态值 */
  status: string;
  /** 状态类型 */
  type: 'user' | 'recharge' | 'withdraw' | 'position' | 'product' | 'channel' | 'income' | 'admin' | 'activity' | 'banner' | 'login' | 'notification' | 'task';
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 状态标签组件
 * @description 根据业务类型和状态值显示对应的状态标签
 * @example
 * <StatusBadge status="ACTIVE" type="user" />           // 绿色"正常"标签
 * <StatusBadge status="PENDING_REVIEW" type="withdraw" /> // 橙色"待审核"标签
 */
export function StatusBadge({
  status,
  type,
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const configs = STATUS_CONFIG_MAP[type] || {};
  const config = configs[status] || { color: 'default', text: status };

  return (
    <Tag
      color={config.color}
      icon={showIcon ? config.icon : undefined}
      className={className}
    >
      {config.text}
    </Tag>
  );
}

/**
 * 用户状态标签
 */
export function UserStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} type="user" />;
}

/**
 * 充值订单状态标签
 */
export function RechargeStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} type="recharge" />;
}

/**
 * 提现订单状态标签
 */
export function WithdrawStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} type="withdraw" />;
}

/**
 * 持仓订单状态标签
 */
export function PositionStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} type="position" />;
}

/**
 * 产品状态标签
 */
export function ProductStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} type="product" />;
}

/**
 * 通道状态标签
 */
export function ChannelStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} type="channel" />;
}

/**
 * 收益发放状态标签
 */
export function IncomeStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} type="income" />;
}

/**
 * 管理员状态标签
 */
export function AdminStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} type="admin" />;
}

/**
 * 活动状态标签
 */
export function ActivityStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} type="activity" />;
}

/**
 * Banner状态标签
 */
export function BannerStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} type="banner" />;
}

/**
 * 登录状态标签
 * @description 用于管理员登录日志和用户登录日志的状态显示
 * @example
 * <LoginStatusBadge status="SUCCESS" />      // 管理员日志
 * <LoginStatusBadge success={true} />        // 用户日志
 */
export function LoginStatusBadge({ 
  status, 
  success 
}: { 
  status?: 'SUCCESS' | 'FAILED'; 
  success?: boolean;
}) {
  // 支持两种方式：管理员日志使用 status 字段，用户日志使用 success 字段
  let statusKey: string;
  if (status !== undefined) {
    statusKey = status;
  } else if (success !== undefined) {
    statusKey = success ? 'SUCCESS' : 'FAILED';
  } else {
    statusKey = 'FAILED';
  }
  
  return <StatusBadge status={statusKey} type="login" />;
}

/**
 * 站内信已读状态标签
 * @description 用于站内信列表的已读/未读状态显示
 * @example
 * <NotificationReadStatusBadge isRead={true} />
 * <NotificationReadStatusBadge isRead={false} />
 */
export function NotificationReadStatusBadge({ 
  isRead 
}: { 
  isRead: boolean;
}) {
  const statusKey = isRead ? 'READ' : 'UNREAD';
  return <StatusBadge status={statusKey} type="notification" />;
}

/**
 * 定时任务状态标签
 * @description 用于定时任务监控页的状态显示
 * @example
 * <TaskStatusBadge status="SUCCESS" />
 * <TaskStatusBadge status="RUNNING" />
 * <TaskStatusBadge status="FAILED" />
 */
export function TaskStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} type="task" />;
}

/**
 * 简单的状态点
 * @description 用于表格等紧凑场景
 */
export function StatusDot({
  status,
  type,
}: {
  status: string;
  type: StatusBadgeProps['type'];
}) {
  const configs = STATUS_CONFIG_MAP[type] || {};
  const config = configs[status] || { color: 'default', text: status };

  // 将 color 转换为 Badge 的 status
  const badgeStatusMap: Record<string, 'success' | 'processing' | 'error' | 'default' | 'warning'> = {
    green: 'success',
    blue: 'processing',
    red: 'error',
    orange: 'warning',
    default: 'default',
    processing: 'processing',
  };

  const badgeStatus = badgeStatusMap[config.color] || 'default';

  return <Badge status={badgeStatus} text={config.text} />;
}

export default StatusBadge;
