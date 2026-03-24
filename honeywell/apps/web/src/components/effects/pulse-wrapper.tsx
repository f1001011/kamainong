/**
 * @file 脉冲动画包装器
 * @description 为子元素添加脉冲/呼吸动画效果
 * @depends 开发文档/01-设计系统/01.2-动画系统.md
 * @depends 开发文档/03-页面开发/03.8.1-我的持仓页.md
 * 
 * 复用说明：本组件被以下场景复用
 * - FE-15 我的持仓页（收益脉冲动画）
 * - 签到入口红点动画
 * - 未读消息红点动画
 */

'use client';

import { ReactNode, useMemo } from 'react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';

/**
 * 脉冲类型预设
 */
export type PulseType = 
  | 'breathe'     // 呼吸效果（缓慢透明度变化）
  | 'glow'        // 光晕效果（带模糊的发光）
  | 'scale'       // 缩放脉冲（大小变化）
  | 'heartbeat'   // 心跳效果（快速缩放）
  | 'ring';       // 环形扩散

/**
 * 脉冲颜色预设
 */
export type PulseColor = 
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral'
  | 'custom';

/**
 * PulseWrapper 组件属性
 */
export interface PulseWrapperProps {
  /** 子内容 */
  children: ReactNode;
  /** 脉冲类型 */
  type?: PulseType;
  /** 脉冲颜色 */
  color?: PulseColor;
  /** 自定义颜色值（color="custom" 时使用） */
  customColor?: string;
  /** 动画持续时间（秒） */
  duration?: number;
  /** 动画延迟（秒） */
  delay?: number;
  /** 是否启用动画 */
  enabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 包装元素类型 */
  as?: 'div' | 'span';
}

/**
 * 颜色映射
 */
const colorMap: Record<Exclude<PulseColor, 'custom'>, { glow: string; ring: string }> = {
  primary: {
    glow: 'text-primary-500 drop-shadow-[0_0_8px_rgba(var(--color-gold-rgb),0.5)]',
    ring: 'bg-primary-400',
  },
  success: {
    glow: 'text-success drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]',
    ring: 'bg-success',
  },
  warning: {
    glow: 'text-warning drop-shadow-[0_0_8px_rgba(var(--color-gold-rgb),0.5)]',
    ring: 'bg-warning',
  },
  error: {
    glow: 'text-error drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]',
    ring: 'bg-error',
  },
  neutral: {
    glow: 'text-neutral-500 drop-shadow-[0_0_6px_rgba(163,163,163,0.4)]',
    ring: 'bg-neutral-400',
  },
};

/**
 * 获取动画变体
 */
function getAnimationVariants(type: PulseType, duration: number) {
  switch (type) {
    case 'breathe':
      return {
        animate: {
          opacity: [1, 0.7, 1],
          transition: {
            duration,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          },
        },
      };

    case 'glow':
      return {
        animate: {
          filter: [
            'drop-shadow(0 0 4px currentColor)',
            'drop-shadow(0 0 12px currentColor)',
            'drop-shadow(0 0 4px currentColor)',
          ],
          transition: {
            duration,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          },
        },
      };

    case 'scale':
      return {
        animate: {
          scale: [1, 1.05, 1],
          transition: {
            duration,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          },
        },
      };

    case 'heartbeat':
      return {
        animate: {
          scale: [1, 1.1, 1, 1.1, 1],
          transition: {
            duration,
            repeat: Infinity,
            ease: 'easeInOut' as const,
            times: [0, 0.14, 0.28, 0.42, 1],
          },
        },
      };

    case 'ring':
      // Ring 效果需要特殊处理，返回 null 表示使用独立的环形动画
      return null;

    default:
      return {
        animate: {
          opacity: [1, 0.7, 1],
          transition: {
            duration,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          },
        },
      };
  }
}

/**
 * PulseWrapper 脉冲动画包装器
 * @description 为子元素添加脉冲/呼吸动画效果
 * 依据：03.8.1-我的持仓页.md - 收益脉冲动画（绿色微光）
 * 
 * @example
 * ```tsx
 * // 收益呼吸脉冲
 * <PulseWrapper type="breathe" color="success">
 *   <span className="text-success font-bold">+$ 150.00</span>
 * </PulseWrapper>
 * 
 * // 光晕效果
 * <PulseWrapper type="glow" color="primary">
 *   <AnimatedNumber value={1234.56} />
 * </PulseWrapper>
 * 
 * // 红点心跳
 * <PulseWrapper type="heartbeat" color="error">
 *   <span className="w-2 h-2 rounded-full bg-error" />
 * </PulseWrapper>
 * 
 * // 环形扩散
 * <PulseWrapper type="ring" color="primary">
 *   <button>签到</button>
 * </PulseWrapper>
 * ```
 */
export function PulseWrapper({
  children,
  type = 'breathe',
  color = 'success',
  customColor,
  duration = 2,
  delay = 0,
  enabled = true,
  className,
  as = 'span',
}: PulseWrapperProps) {
  const { isAnimationEnabled } = useAnimationConfig();

  // 是否启用动画
  const shouldAnimate = enabled && isAnimationEnabled;

  // 获取颜色样式
  const colorStyles = useMemo(() => {
    if (color === 'custom') {
      return {
        glow: customColor ? `drop-shadow-[0_0_8px_${customColor}]` : '',
        ring: customColor || 'bg-primary-400',
      };
    }
    return colorMap[color];
  }, [color, customColor]);

  // 获取动画变体
  const variants = useMemo(() => getAnimationVariants(type, duration), [type, duration]);

  // 不启用动画时直接返回子元素
  if (!shouldAnimate) {
    const Wrapper = as;
    return <Wrapper className={className}>{children}</Wrapper>;
  }

  // 环形扩散效果需要特殊处理
  if (type === 'ring') {
    return (
      <span className={cn('relative inline-flex', className)}>
        {/* 环形扩散动画层 */}
        <m.span
          className={cn(
            'absolute inset-0 rounded-full',
            colorStyles.ring,
            'opacity-75'
          )}
          animate={{
            scale: [1, 1.5, 2],
            opacity: [0.7, 0.3, 0],
          }}
          transition={{
            duration,
            repeat: Infinity,
            ease: 'easeOut',
            delay,
          }}
        />
        {/* 第二层环形（错开） */}
        <m.span
          className={cn(
            'absolute inset-0 rounded-full',
            colorStyles.ring,
            'opacity-75'
          )}
          animate={{
            scale: [1, 1.5, 2],
            opacity: [0.7, 0.3, 0],
          }}
          transition={{
            duration,
            repeat: Infinity,
            ease: 'easeOut',
            delay: delay + duration / 2,
          }}
        />
        {/* 内容层 */}
        <span className="relative z-10">{children}</span>
      </span>
    );
  }

  // 其他脉冲效果
  const MotionWrapper = as === 'div' ? m.div : m.span;

  return (
    <MotionWrapper
      className={cn(
        type === 'glow' && colorStyles.glow,
        className
      )}
      initial={{ opacity: 1 }}
      animate={variants?.animate}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </MotionWrapper>
  );
}

/**
 * IncomePulse 收益脉冲组件
 * @description 专门用于收益金额展示的脉冲效果预设
 * 依据：03.8.1-我的持仓页.md - 已获收益数字带呼吸脉冲（绿色微光）
 */
export interface IncomePulseProps {
  /** 子内容 */
  children: ReactNode;
  /** 是否启用 */
  enabled?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * IncomePulse 收益脉冲
 * @example
 * ```tsx
 * <IncomePulse>
 *   <span className="text-success font-bold">$ 150.00</span>
 * </IncomePulse>
 * ```
 */
export function IncomePulse({
  children,
  enabled = true,
  className,
}: IncomePulseProps) {
  return (
    <PulseWrapper
      type="glow"
      color="success"
      duration={2.5}
      enabled={enabled}
      className={className}
    >
      {children}
    </PulseWrapper>
  );
}

/**
 * NotificationDot 通知红点组件
 * @description 用于未读消息/签到等入口的红点动画
 */
export interface NotificationDotProps {
  /** 是否显示 */
  show?: boolean;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否启用动画 */
  animated?: boolean;
  /** 位置 */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** 自定义类名 */
  className?: string;
}

const dotSizeMap = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

const positionMap = {
  'top-right': '-top-0.5 -right-0.5',
  'top-left': '-top-0.5 -left-0.5',
  'bottom-right': '-bottom-0.5 -right-0.5',
  'bottom-left': '-bottom-0.5 -left-0.5',
};

/**
 * NotificationDot 通知红点
 * @example
 * ```tsx
 * <div className="relative">
 *   <RiBellLine />
 *   <NotificationDot show={hasUnread} animated />
 * </div>
 * ```
 */
export function NotificationDot({
  show = true,
  size = 'md',
  animated = true,
  position = 'top-right',
  className,
}: NotificationDotProps) {
  const { isAnimationEnabled } = useAnimationConfig();

  if (!show) return null;

  const shouldAnimate = animated && isAnimationEnabled;

  if (shouldAnimate) {
    return (
      <PulseWrapper
        type="heartbeat"
        color="error"
        duration={1.5}
        className={cn(
          'absolute',
          positionMap[position],
          className
        )}
      >
        <span className={cn('block rounded-full bg-error', dotSizeMap[size])} />
      </PulseWrapper>
    );
  }

  return (
    <span
      className={cn(
        'absolute block rounded-full bg-error',
        positionMap[position],
        dotSizeMap[size],
        className
      )}
    />
  );
}
