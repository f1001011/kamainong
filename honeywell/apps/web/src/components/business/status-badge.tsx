/**
 * @file 状态角标组件
 * @description 用于显示各种状态的彩色标签
 * @reference 开发文档/01-设计系统/01.3-组件规范.md
 * @reference 开发文档/01-设计系统/01.2-动画系统.md
 * 
 * 2026高端美学设计要点：
 * - 多种颜色变体（成功-绿色、待处理-黄色、失败-红色、信息-蓝色）
 * - 可选脉冲动画（用于强调状态）
 * - 前置圆点指示器
 * - 支持2026趋势色
 */

'use client';

import { type HTMLAttributes } from 'react';
import { m, LazyMotion, domAnimation } from 'motion/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';

/**
 * 状态角标变体样式
 */
const statusBadgeVariants = cva(
  // 基础样式
  'inline-flex items-center justify-center rounded-full text-xs font-medium',
  {
    variants: {
      variant: {
        /** 成功状态 - 绿色 */
        /** 依据：03.4.2-充值记录页.md 第112行 - bg-success-50 text-success-600 */
        success: 'bg-success-50 text-success-600',
        /** 警告状态 - 橙色 */
        /** 依据：03.4.2-充值记录页.md 第113行 - bg-warning-50 text-warning-600 */
        warning: 'bg-warning-50 text-warning-600',
        /** 错误状态 - 红色 */
        /** 依据：03.4.2-充值记录页.md 第115行 - bg-error-50 text-error-600 */
        error: 'bg-error-50 text-error-600',
        /** 信息状态 - 蓝色 */
        info: 'bg-info-50 text-info-600',
        /** 待处理状态 - 灰色 */
        /** 依据：03.4.2-充值记录页.md 第116行 - bg-neutral-100 text-neutral-500 */
        pending: 'bg-neutral-100 text-neutral-500',
        /** 主题色状态 - 橙色 */
        primary: 'bg-primary-50 text-primary-600',
        /** 薰衣草色 - 2026趋势色 */
        lavender: 'bg-primary-100 text-primary-600',
        /** 薄荷色 - 2026趋势色 */
        mint: 'bg-primary-100 text-primary-600',
      },
      size: {
        /** 小尺寸 */
        sm: 'px-2 py-0.5 text-xs',
        /** 默认尺寸 */
        md: 'px-2.5 py-1 text-xs',
        /** 大尺寸 */
        lg: 'px-3 py-1.5 text-sm',
      },
      dot: {
        /** 带前置圆点 */
        true: 'gap-1.5',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'pending',
      size: 'md',
      dot: false,
    },
  }
);

/**
 * 状态角标组件属性
 */
export interface StatusBadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  /** 显示文本 */
  children: React.ReactNode;
  /** 是否启用脉冲动画（用于强调进行中状态） */
  pulse?: boolean;
}

/**
 * 圆点颜色映射
 * 依据：03.4.2-充值记录页.md - 使用与标签背景对应的实色
 */
const dotColorMap: Record<string, string> = {
  success: 'bg-success-600',
  warning: 'bg-warning-600',
  error: 'bg-error-600',
  info: 'bg-info-600',
  pending: 'bg-neutral-400',
  primary: 'bg-primary-500',
  lavender: 'bg-primary-500',
  mint: 'bg-primary-500',
};

/**
 * 状态角标组件
 * @description 用于展示各种状态的彩色标签
 * 
 * @example
 * ```tsx
 * <StatusBadge variant="success">已完成</StatusBadge>
 * <StatusBadge variant="pending" dot>处理中</StatusBadge>
 * <StatusBadge variant="error" size="lg">已失败</StatusBadge>
 * <StatusBadge variant="warning" pulse>进行中</StatusBadge>
 * ```
 */
export function StatusBadge({
  className,
  variant,
  size,
  dot,
  pulse = false,
  children,
  // 排除与 motion 冲突的属性
  onAnimationStart: _onAnimationStart,
  onAnimationEnd: _onAnimationEnd,
  onAnimationIteration: _onAnimationIteration,
  onDrag: _onDrag,
  onDragStart: _onDragStart,
  onDragEnd: _onDragEnd,
  ...props
}: StatusBadgeProps) {
  const { isAnimationEnabled } = useAnimationConfig();

  // 是否显示脉冲动画
  const showPulse = pulse && isAnimationEnabled;

  // 脉冲动画变体
  const pulseAnimation = showPulse ? {
    scale: [1, 1.02, 1],
    opacity: [1, 0.9, 1],
  } : undefined;

  const pulseTransition = showPulse ? {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  } : undefined;

  // 使用 Motion 组件包装以支持动画
  const BadgeContent = (
    <>
      {/* 前置圆点 - 带脉冲动画 */}
      {dot && (
        <LazyMotion features={domAnimation}>
          <m.span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              dotColorMap[variant || 'pending']
            )}
            animate={showPulse ? {
              scale: [1, 1.3, 1],
              opacity: [1, 0.7, 1],
            } : undefined}
            transition={showPulse ? {
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            } : undefined}
          />
        </LazyMotion>
      )}
      {children}
    </>
  );

  // 带动画的版本
  if (showPulse) {
    return (
      <LazyMotion features={domAnimation}>
        <m.span
          className={cn(statusBadgeVariants({ variant, size, dot }), className)}
          animate={pulseAnimation}
          transition={pulseTransition}
          {...props}
        >
          {BadgeContent}
        </m.span>
      </LazyMotion>
    );
  }

  // 无动画版本
  return (
    <span
      className={cn(statusBadgeVariants({ variant, size, dot }), className)}
      {...props}
    >
      {BadgeContent}
    </span>
  );
}

/**
 * 预设状态角标
 * @description 常用状态的预设组件
 */

/** 成功状态 */
export function SuccessBadge({ children = 'نجاح', ...props }: Omit<StatusBadgeProps, 'variant'>) {
  return <StatusBadge variant="success" {...props}>{children}</StatusBadge>;
}

/** 待处理状态 */
export function PendingBadge({ children = 'معلّق', ...props }: Omit<StatusBadgeProps, 'variant'>) {
  return <StatusBadge variant="pending" dot {...props}>{children}</StatusBadge>;
}

/** 失败状态 */
export function ErrorBadge({ children = 'فشل', ...props }: Omit<StatusBadgeProps, 'variant'>) {
  return <StatusBadge variant="error" {...props}>{children}</StatusBadge>;
}

/** 处理中状态 */
export function ProcessingBadge({ children = 'قيد المعالجة', ...props }: Omit<StatusBadgeProps, 'variant'>) {
  return <StatusBadge variant="info" dot {...props}>{children}</StatusBadge>;
}

export { statusBadgeVariants };
