/**
 * @file 提现限制提示区组件
 * @description 显示提现时间窗口、每日次数限制、金额范围
 * @reference 开发文档/03-前端用户端/03.5-财务模块/03.5.1-提现页.md 第4.2节
 */

'use client';

import { type HTMLAttributes } from 'react';
import { RiTimeFill, RiRepeatLine, RiMoneyDollarCircleFill } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useText } from '@/hooks/use-text';
import { formatCurrency } from '@/lib/format';

/**
 * 提现限制提示区属性
 */
export interface WithdrawLimitsProps extends HTMLAttributes<HTMLDivElement> {
  /** 提现时间窗口 */
  timeRange: string;
  /** 是否在时间窗口内 */
  inTimeRange: boolean;
  /** 今日已提现次数 */
  todayCount: number;
  /** 每日提现次数上限 */
  dailyLimit: number;
  /** 最小提现金额 */
  minAmount: number;
  /** 最大提现金额 */
  maxAmount: number;
}

/**
 * 提现限制提示区组件
 * @description 依据：03.5.1-提现页.md 第4.2节 - 限制提示区
 */
export function WithdrawLimits({
  timeRange,
  inTimeRange,
  todayCount,
  dailyLimit,
  minAmount,
  maxAmount,
  className,
  ...props
}: WithdrawLimitsProps) {
  const { config } = useGlobalConfig();
  const t = useText();

  // 剩余次数
  const remainingCount = Math.max(0, dailyLimit - todayCount);

  // 格式化金额
  const minFormatted = formatCurrency(minAmount, config, { decimals: 0 });
  const maxFormatted = formatCurrency(maxAmount, config, { decimals: 0 });

  return (
    <div
      className={cn(
        'glass shadow-soft rounded-2xl p-4 space-y-3',
        className
      )}
      {...props}
    >
      {/* 提现时间 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <RiTimeFill className="w-4 h-4" />
          <span>{t('biz.withdraw_time')}</span>
        </div>
        <span className={cn(
          'text-sm font-medium',
          inTimeRange ? 'text-success' : 'text-error'
        )}>
          {timeRange}
        </span>
      </div>

      {/* 每日次数 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <RiRepeatLine className="w-4 h-4" />
          <span>{t('biz.withdraw_limit')}</span>
        </div>
        <span className={cn(
          'text-sm font-medium',
          remainingCount > 0 ? 'text-neutral-600' : 'text-error'
        )}>
          {todayCount}/{dailyLimit} ({t('biz.withdraw_remaining')}: {remainingCount})
        </span>
      </div>

      {/* 金额范围 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <RiMoneyDollarCircleFill className="w-4 h-4" />
          <span>{t('biz.withdraw_range')}</span>
        </div>
        <span className="text-sm font-medium text-neutral-600">
          {minFormatted} - {maxFormatted}
        </span>
      </div>
    </div>
  );
}

WithdrawLimits.displayName = 'WithdrawLimits';
