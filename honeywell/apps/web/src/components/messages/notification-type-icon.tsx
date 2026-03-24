/**
 * @file 消息类型图标组件
 * @description 根据消息类型渲染对应图标和颜色
 * @depends 开发文档/03-前端用户端/03.12-消息模块/03.12.1-消息列表页.md 第2.1节
 * @depends 开发文档/03-前端用户端/03.12-消息模块/03.12.2-消息详情页.md 第2.3节
 */

'use client';

import {
  RiWalletFill,
  RiCheckboxCircleFill,
  RiBankFill,
  RiCloseCircleFill,
  RiErrorWarningFill,
  RiLineChartFill,
  RiUserAddFill,
  RiCalendarCheckFill,
  RiGiftFill,
  RiNotification3Fill,
} from '@remixicon/react';
import { cn } from '@/lib/utils';
import type { NotificationType, NotificationTypeConfig } from '@/types/notification';

/**
 * 消息类型配置映射
 * @description 依据：03.12.1-消息列表页.md 第2.1节 - 消息类型定义
 * @description 依据：03.12.2-消息详情页.md 第2.3节 - 消息类型与语义
 */
const TYPE_CONFIG: Record<NotificationType, NotificationTypeConfig> = {
  // 充值成功 - 绿色
  RECHARGE_SUCCESS: {
    icon: RiWalletFill,
    iconColor: 'text-primary-500',
    bgGradient: 'bg-gradient-to-br from-primary-100 to-primary-50',
  },
  // 提现审核通过 - 蓝色
  WITHDRAW_APPROVED: {
    icon: RiCheckboxCircleFill,
    iconColor: 'text-blue-500',
    bgGradient: 'bg-gradient-to-br from-blue-100 to-blue-50',
  },
  // 提现完成 - 绿色
  WITHDRAW_COMPLETED: {
    icon: RiBankFill,
    iconColor: 'text-primary-500',
    bgGradient: 'bg-gradient-to-br from-primary-100 to-primary-50',
  },
  // 提现被拒绝 - 红色
  WITHDRAW_REJECTED: {
    icon: RiCloseCircleFill,
    iconColor: 'text-red-500',
    bgGradient: 'bg-gradient-to-br from-red-100 to-red-50',
  },
  // 提现失败 - 红色
  WITHDRAW_FAILED: {
    icon: RiErrorWarningFill,
    iconColor: 'text-red-500',
    bgGradient: 'bg-gradient-to-br from-red-100 to-red-50',
  },
  // 收益到账 - 主色
  INCOME_RECEIVED: {
    icon: RiLineChartFill,
    iconColor: 'text-primary-500',
    bgGradient: 'bg-gradient-to-br from-primary-100 to-primary-50',
  },
  // 返佣到账 - 紫色
  COMMISSION_RECEIVED: {
    icon: RiUserAddFill,
    iconColor: 'text-rose-500',
    bgGradient: 'bg-gradient-to-br from-rose-100 to-rose-50',
  },
  // 签到奖励 - 香槟金色
  SIGN_IN_REWARD: {
    icon: RiCalendarCheckFill,
    iconColor: 'text-gold-500',
    bgGradient: 'bg-gradient-to-br from-gold-100 to-gold-50',
  },
  // 活动奖励 - 粉色
  ACTIVITY_REWARD: {
    icon: RiGiftFill,
    iconColor: 'text-pink-500',
    bgGradient: 'bg-gradient-to-br from-pink-100 to-pink-50',
  },
  // 系统公告 - 中性色
  SYSTEM_ANNOUNCEMENT: {
    icon: RiNotification3Fill,
    iconColor: 'text-neutral-500',
    bgGradient: 'bg-gradient-to-br from-neutral-100 to-neutral-50',
  },
};

/**
 * 默认类型配置
 */
const DEFAULT_CONFIG: NotificationTypeConfig = {
  icon: RiNotification3Fill,
  iconColor: 'text-neutral-500',
  bgGradient: 'bg-gradient-to-br from-neutral-100 to-neutral-50',
};

/**
 * NotificationTypeIcon 组件属性
 */
export interface NotificationTypeIconProps {
  /** 消息类型 */
  type: NotificationType;
  /** 图标大小：small=列表卡片(10x10)，large=详情页(14x14) */
  size?: 'small' | 'large';
  /** 自定义类名 */
  className?: string;
}

/**
 * 消息类型图标组件
 * @description 依据：03.12.1-消息列表页.md 第4.3节 - 类型图标渲染
 * @description 依据：03.12.2-消息详情页.md 第4.1节 - NotificationTypeIcon
 *
 * @example
 * ```tsx
 * // 列表卡片中使用
 * <NotificationTypeIcon type="RECHARGE_SUCCESS" size="small" />
 *
 * // 详情页中使用
 * <NotificationTypeIcon type="RECHARGE_SUCCESS" size="large" />
 * ```
 */
export function NotificationTypeIcon({
  type,
  size = 'small',
  className,
}: NotificationTypeIconProps) {
  const config = TYPE_CONFIG[type] || DEFAULT_CONFIG;
  const Icon = config.icon;

  // 尺寸配置 - 依据文档规范
  const sizeClasses = {
    small: {
      container: 'w-10 h-10 rounded-xl',
      icon: 'w-5 h-5',
    },
    large: {
      container: 'w-14 h-14 rounded-2xl shadow-soft',
      icon: 'w-7 h-7',
    },
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center',
        config.bgGradient,
        sizeClasses[size].container,
        className
      )}
    >
      <Icon className={cn(sizeClasses[size].icon, config.iconColor)} />
    </div>
  );
}

/**
 * 获取消息类型配置
 * @param type 消息类型
 * @returns 类型配置
 */
export function getNotificationTypeConfig(type: NotificationType): NotificationTypeConfig {
  return TYPE_CONFIG[type] || DEFAULT_CONFIG;
}
