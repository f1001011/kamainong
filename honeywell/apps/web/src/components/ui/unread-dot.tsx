/**
 * @file 未读红点组件
 * @description 通用未读红点组件，支持脉冲动画，供消息列表、通知等场景复用
 * @depends 开发文档.md 第12.3节 - 消息入口未读红点
 * @depends 01.2-动画系统.md 第九节 - 脉冲呼吸动画
 */

'use client';

import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';

/**
 * 未读红点组件属性
 */
export interface UnreadDotProps {
  /** 未读数量，0 或 undefined 时不显示 */
  count?: number;
  /** 最大显示数字，超过后显示 max+ */
  max?: number;
  /** 是否显示脉冲动画，默认 false */
  pulse?: boolean;
  /** 尺寸：sm=不显示数字的小圆点，md=显示数字，lg=更大 */
  size?: 'sm' | 'md' | 'lg';
  /** 自定义类名 */
  className?: string;
}

/**
 * 未读红点组件
 * @description 依据：开发文档.md 第12.3节 - 未读数超过99显示99+
 *
 * @example
 * ```tsx
 * // 基础用法 - 显示数字
 * <UnreadDot count={5} />
 *
 * // 超过最大值
 * <UnreadDot count={100} max={99} />  // 显示 99+
 *
 * // 小圆点（无数字）
 * <UnreadDot count={3} size="sm" />
 *
 * // 带脉冲动画
 * <UnreadDot count={1} pulse />
 * ```
 */
export function UnreadDot({
  count,
  max = 99,
  pulse = false,
  size = 'md',
  className,
}: UnreadDotProps) {
  const { isAnimationEnabled } = useAnimationConfig();

  // 无未读时不显示
  if (!count || count <= 0) return null;

  // 依据：开发文档.md 第12.3节 - 超过max显示 max+
  const displayText = count > max ? `${max}+` : count.toString();

  // 尺寸配置
  const sizeConfig = {
    sm: 'w-2 h-2', // 小圆点，不显示数字
    md: 'min-w-4 h-4 px-1 text-xs',
    lg: 'min-w-5 h-5 px-1.5 text-xs',
  };

  // 依据：01.2-动画系统.md 第九节 - 脉冲呼吸动画
  const pulseAnimation =
    pulse && isAnimationEnabled
      ? {
          scale: [1, 1.2, 1],
          opacity: [1, 0.8, 1],
        }
      : undefined;

  const pulseTransition = {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  };

  // 小圆点模式
  if (size === 'sm') {
    return (
      <m.span
        animate={pulseAnimation}
        transition={pulseTransition}
        className={cn('rounded-full bg-red-500', sizeConfig[size], className)}
      />
    );
  }

  // 带数字的红点
  return (
    <m.span
      initial={{ scale: 0 }}
      animate={
        pulseAnimation
          ? { ...pulseAnimation, scale: pulseAnimation.scale }
          : { scale: 1 }
      }
      transition={pulse ? pulseTransition : { type: 'spring', stiffness: 500, damping: 25 }}
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        'bg-red-500 text-white font-medium',
        sizeConfig[size],
        className
      )}
    >
      {displayText}
    </m.span>
  );
}
