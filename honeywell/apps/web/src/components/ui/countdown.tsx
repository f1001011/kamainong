/**
 * @file 倒计时组件
 * @description 订单超时倒计时显示，支持倒计时归零回调
 * @depends 开发文档/03-前端用户端/03.4-充值模块/03.4.2-充值记录页.md
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { RiTimeFill } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';

/**
 * Countdown 组件属性
 */
export interface CountdownProps {
  /** 过期时间（ISO8601字符串或Date对象） */
  expireAt: string | Date;
  /** 倒计时归零回调 */
  onExpire?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 显示变体：inline=行内 | block=块级 | badge=角标 */
  variant?: 'inline' | 'block' | 'badge';
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 是否显示提示文案 */
  showLabel?: boolean;
}

/**
 * 格式化剩余时间
 * @param milliseconds - 剩余毫秒数
 * @returns 格式化后的时间字符串（如：29:45 或 01:29:45）
 */
function formatRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return '00:00';

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  // 超过1小时时显示时:分:秒
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  
  // 不足1小时时显示分:秒
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Countdown 倒计时组件
 * @description 用于显示订单超时倒计时，支持多种显示变体
 * 
 * @example
 * ```tsx
 * // 基础用法
 * <Countdown 
 *   expireAt="2026-02-03T11:30:00.000Z" 
 *   onExpire={() => refetch()} 
 * />
 * 
 * // 带图标和文案
 * <Countdown 
 *   expireAt={order.expireAt} 
 *   showIcon 
 *   showLabel 
 *   variant="block"
 * />
 * 
 * // 角标样式
 * <Countdown expireAt={expireAt} variant="badge" />
 * ```
 */
export function Countdown({
  expireAt,
  onExpire,
  className,
  variant = 'inline',
  showIcon = false,
  showLabel = false,
}: CountdownProps) {
  const t = useText();
  
  // 计算初始剩余时间
  const calculateRemaining = useCallback(() => {
    const expireTime = typeof expireAt === 'string' ? new Date(expireAt) : expireAt;
    const diff = expireTime.getTime() - Date.now();
    return diff > 0 ? diff : 0;
  }, [expireAt]);

  const [remaining, setRemaining] = useState(calculateRemaining);
  const [hasExpired, setHasExpired] = useState(false);

  // 倒计时定时器
  useEffect(() => {
    // 初始计算
    setRemaining(calculateRemaining());

    const timer = setInterval(() => {
      const diff = calculateRemaining();
      setRemaining(diff);

      // 倒计时归零
      if (diff <= 0 && !hasExpired) {
        setHasExpired(true);
        clearInterval(timer);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateRemaining, onExpire, hasExpired]);

  // 格式化显示时间
  const displayTime = useMemo(() => formatRemaining(remaining), [remaining]);

  // 已过期不显示
  if (remaining <= 0) {
    return null;
  }

  // 警告状态（剩余时间少于5分钟）
  const isWarning = remaining < 5 * 60 * 1000;

  // 根据变体渲染不同样式
  const renderContent = () => {
    switch (variant) {
      case 'block':
        return (
          <div className={cn(
            'flex items-center gap-2 p-3 rounded-lg',
            isWarning ? 'bg-red-50' : 'bg-gold-50',
            className
          )}>
            {showIcon && (
              <RiTimeFill className={cn(
                'h-5 w-5',
                isWarning ? 'text-error' : 'text-warning'
              )} />
            )}
            <div className="flex flex-col">
              {showLabel && (
                <span className="text-xs text-neutral-500">
                  {t('tip.countdown_label')}
                </span>
              )}
              <span className={cn(
                'font-mono text-lg font-semibold tabular-nums',
                isWarning ? 'text-error' : 'text-warning-600'
              )}>
                {displayTime}
              </span>
            </div>
          </div>
        );

      case 'badge':
        return (
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
            isWarning ? 'bg-red-50 text-error' : 'bg-gold-50 text-warning-600',
            className
          )}>
            {showIcon && <RiTimeFill className="h-3.5 w-3.5" />}
            <span className="font-mono tabular-nums">{displayTime}</span>
          </span>
        );

      case 'inline':
      default:
        return (
          <span className={cn(
            'inline-flex items-center gap-1.5',
            isWarning ? 'text-error' : 'text-warning-600',
            className
          )}>
            {showIcon && <RiTimeFill className="h-4 w-4" />}
            {showLabel && (
              <span className="text-sm">
                {t.withVars('tip.countdown', { time: displayTime })}
              </span>
            )}
            {!showLabel && (
              <span className="font-mono text-sm font-medium tabular-nums">
                {displayTime}
              </span>
            )}
          </span>
        );
    }
  };

  return renderContent();
}

/**
 * 计算过期时间
 * @description 根据创建时间和超时时长计算过期时间
 * @param createdAt - 创建时间
 * @param timeoutMinutes - 超时分钟数
 * @returns 过期时间的Date对象
 */
export function calculateExpireTime(createdAt: string | Date, timeoutMinutes: number): Date {
  const createTime = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  return new Date(createTime.getTime() + timeoutMinutes * 60 * 1000);
}
