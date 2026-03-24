/**
 * @file 实时倒计时组件
 * @description 显示实时跳动的倒计时，用于下次收益时间等场景
 * @depends 开发文档/01-设计系统/01.2-动画系统.md
 * @depends 开发文档/03-页面开发/03.8.1-我的持仓页.md
 * 
 * 复用说明：本组件被以下页面复用
 * - FE-15 我的持仓页（下次收益倒计时）
 * - 其他限时功能页面
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { RiTimeFill, RiTimerLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS } from '@/lib/animation/constants';

/**
 * 倒计时时间单位
 */
interface TimeUnits {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

/**
 * CountdownTimer 组件属性
 */
export interface CountdownTimerProps {
  /** 目标时间（ISO8601字符串或Date对象） */
  targetTime: string | Date;
  /** 倒计时归零回调 */
  onComplete?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 显示变体：inline=行内 | block=块级 | card=卡片 | minimal=极简 */
  variant?: 'inline' | 'block' | 'card' | 'minimal';
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 是否显示标签文案 */
  showLabel?: boolean;
  /** 自定义标签文案 */
  label?: string;
  /** 是否启用数字跳动动画 */
  animated?: boolean;
  /** 紧急时间阈值（秒），低于该值显示警告色 */
  urgentThreshold?: number;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 计算剩余时间
 * @param targetTime - 目标时间
 * @returns 时间单位对象
 */
function calculateRemaining(targetTime: string | Date): TimeUnits {
  const target = typeof targetTime === 'string' ? new Date(targetTime) : targetTime;
  const diff = target.getTime() - Date.now();
  
  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds, totalSeconds };
}

/**
 * 格式化数字为两位
 */
function padNumber(num: number): string {
  return num.toString().padStart(2, '0');
}

/**
 * 尺寸映射
 */
const sizeMap = {
  sm: {
    text: 'text-sm',
    icon: 'h-3.5 w-3.5',
    label: 'text-xs',
    number: 'text-sm',
    separator: 'text-sm',
  },
  md: {
    text: 'text-base',
    icon: 'h-4 w-4',
    label: 'text-sm',
    number: 'text-base',
    separator: 'text-base',
  },
  lg: {
    text: 'text-lg',
    icon: 'h-5 w-5',
    label: 'text-base',
    number: 'text-lg',
    separator: 'text-lg',
  },
};

/**
 * 单个数字动画组件
 */
function AnimatedDigit({
  value,
  size,
  className,
}: {
  value: string;
  size: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const { isAnimationEnabled } = useAnimationConfig();

  if (!isAnimationEnabled) {
    return <span className={cn('tabular-nums', className)}>{value}</span>;
  }

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <m.span
        key={value}
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 8, opacity: 0 }}
        transition={SPRINGS.snappy}
        className={cn('tabular-nums inline-block', sizeMap[size].number, className)}
      >
        {value}
      </m.span>
    </AnimatePresence>
  );
}

/**
 * CountdownTimer 实时倒计时组件
 * @description 显示实时跳动的倒计时，支持多种显示变体
 * 依据：03.8.1-我的持仓页.md - 下次收益时间 HH:MM:SS 格式
 * 
 * @example
 * ```tsx
 * // 基础用法
 * <CountdownTimer 
 *   targetTime="2026-02-04T10:30:00.000Z"
 *   onComplete={() => refetch()}
 * />
 * 
 * // 带标签和图标
 * <CountdownTimer
 *   targetTime={nextSettleAt}
 *   showIcon
 *   showLabel
 *   label="下次收益"
 *   variant="block"
 * />
 * 
 * // 卡片样式
 * <CountdownTimer
 *   targetTime={expireAt}
 *   variant="card"
 *   animated
 *   urgentThreshold={300}
 * />
 * ```
 */
export function CountdownTimer({
  targetTime,
  onComplete,
  className,
  variant = 'inline',
  showIcon = false,
  showLabel = false,
  label,
  animated = true,
  urgentThreshold = 300, // 5分钟
  size = 'md',
}: CountdownTimerProps) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();

  // 计算初始剩余时间
  const [remaining, setRemaining] = useState(() => calculateRemaining(targetTime));
  const [hasCompleted, setHasCompleted] = useState(false);

  // 倒计时定时器
  useEffect(() => {
    // 初始化计算
    setRemaining(calculateRemaining(targetTime));
    setHasCompleted(false);

    const timer = setInterval(() => {
      const newRemaining = calculateRemaining(targetTime);
      setRemaining(newRemaining);

      // 倒计时归零
      if (newRemaining.totalSeconds <= 0 && !hasCompleted) {
        setHasCompleted(true);
        clearInterval(timer);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTime, onComplete, hasCompleted]);

  // 是否处于紧急状态
  const isUrgent = remaining.totalSeconds > 0 && remaining.totalSeconds < urgentThreshold;

  // 格式化后的时间字符串
  const formattedTime = useMemo(() => ({
    hours: padNumber(remaining.hours),
    minutes: padNumber(remaining.minutes),
    seconds: padNumber(remaining.seconds),
  }), [remaining]);

  // 标签文案
  const displayLabel = label || t('label.next_income', 'الدخل القادم');

  // 已完成不显示
  if (remaining.totalSeconds <= 0) {
    return null;
  }

  // 使用动画
  const useMotion = animated && isAnimationEnabled;

  // 时间显示内容
  const TimeDisplay = () => (
    <span className={cn(
      'font-mono font-semibold tabular-nums inline-flex items-baseline',
      sizeMap[size].number,
      isUrgent ? 'text-error' : 'text-primary-500'
    )}>
      {useMotion ? (
        <>
          <AnimatedDigit value={formattedTime.hours} size={size} />
          <span className={cn('mx-0.5', sizeMap[size].separator)}>:</span>
          <AnimatedDigit value={formattedTime.minutes} size={size} />
          <span className={cn('mx-0.5', sizeMap[size].separator)}>:</span>
          <AnimatedDigit value={formattedTime.seconds} size={size} />
        </>
      ) : (
        `${formattedTime.hours}:${formattedTime.minutes}:${formattedTime.seconds}`
      )}
    </span>
  );

  // 根据变体渲染不同样式
  switch (variant) {
    case 'block':
      return (
        <div className={cn(
          'flex items-center justify-between gap-3 p-3 rounded-lg',
          isUrgent ? 'bg-red-50' : 'bg-primary-50/50',
          className
        )}>
          <div className="flex items-center gap-2">
            {showIcon && (
              <RiTimerLine className={cn(
                sizeMap[size].icon,
                isUrgent ? 'text-error' : 'text-primary-500'
              )} />
            )}
            {showLabel && (
              <span className={cn(sizeMap[size].label, 'text-neutral-500')}>
                {displayLabel}
              </span>
            )}
          </div>
          <TimeDisplay />
        </div>
      );

    case 'card':
      return (
        <div className={cn(
          'flex flex-col items-center justify-center p-4 rounded-xl',
          'bg-gradient-to-br from-primary-50 to-gold-50/50',
          'border border-primary-100/50',
          className
        )}>
          {showLabel && (
            <span className={cn(sizeMap[size].label, 'text-neutral-500 mb-2')}>
              {displayLabel}
            </span>
          )}
          <div className="flex items-center gap-1">
            {showIcon && (
              <RiTimerLine className={cn(
                sizeMap[size].icon,
                isUrgent ? 'text-error' : 'text-primary-500',
                'mr-1'
              )} />
            )}
            <TimeDisplay />
          </div>
        </div>
      );

    case 'minimal':
      return (
        <span className={cn('inline-flex items-center', className)}>
          <TimeDisplay />
        </span>
      );

    case 'inline':
    default:
      return (
        <span className={cn('inline-flex items-center gap-1.5', className)}>
          {showIcon && (
            <RiTimeFill className={cn(
              sizeMap[size].icon,
              isUrgent ? 'text-error' : 'text-primary-500'
            )} />
          )}
          {showLabel && (
            <span className={cn(sizeMap[size].label, 'text-neutral-500')}>
              {displayLabel}:
            </span>
          )}
          <TimeDisplay />
        </span>
      );
  }
}

/**
 * 计算下次收益时间（辅助函数）
 * @description 用于持仓订单下次收益时间计算
 * @param nextSettleAt - 服务端返回的下次发放时间
 * @returns 下次收益时间的 Date 对象
 */
export function calculateNextIncomeTime(nextSettleAt: string | Date | null | undefined): Date | null {
  if (!nextSettleAt) return null;
  const target = typeof nextSettleAt === 'string' ? new Date(nextSettleAt) : nextSettleAt;
  return target.getTime() > Date.now() ? target : null;
}
