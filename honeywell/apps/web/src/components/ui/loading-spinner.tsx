/**
 * @file 加载指示器组件
 * @description 精美的加载动画组件，支持多种尺寸和样式变体
 * @depends 开发文档/01-设计系统/01.2-动画系统.md
 * @depends 开发文档/01-设计系统/01.1-设计Token.md
 * 
 * 2026高端美学设计要点：
 * - 多种尺寸变体（xs/sm/md/lg/xl）
 * - 精美的旋转动画
 * - 可选的渐变颜色
 * - 支持全屏覆盖模式
 */

'use client';

import { m, LazyMotion, domAnimation } from 'motion/react';
import { type HTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { RiLoader4Line } from '@remixicon/react';

/**
 * LoadingSpinner 变体样式
 */
const loadingSpinnerVariants = cva(
  // 基础样式
  'inline-flex items-center justify-center',
  {
    variants: {
      /** 尺寸变体 */
      size: {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12',
      },
      /** 颜色变体 */
      variant: {
        /** 主色 - 橙色 */
        primary: 'text-primary-500',
        /** 白色 - 用于深色背景 */
        white: 'text-white',
        /** 灰色 - 低调模式 */
        muted: 'text-neutral-400',
        /** 成功色 - 绿色 */
        success: 'text-success',
        /** 当前色 - 继承父元素颜色 */
        current: 'text-current',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'primary',
    },
  }
);

/**
 * LoadingSpinner 组件属性
 */
export interface LoadingSpinnerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof loadingSpinnerVariants> {
  /** 是否显示加载文案 */
  showText?: boolean;
  /** 自定义加载文案 */
  text?: string;
  /** 文案位置 */
  textPosition?: 'bottom' | 'right';
}

/**
 * LoadingSpinner 加载指示器组件
 * @description 精美的旋转加载动画，支持多种尺寸和颜色
 * 
 * @example
 * ```tsx
 * // 基础用法
 * <LoadingSpinner />
 * 
 * // 不同尺寸
 * <LoadingSpinner size="xs" />
 * <LoadingSpinner size="lg" />
 * 
 * // 带文案
 * <LoadingSpinner showText text="加载中..." />
 * 
 * // 白色（深色背景）
 * <LoadingSpinner variant="white" />
 * ```
 */
export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  (
    {
      className,
      size,
      variant,
      showText = false,
      text,
      textPosition = 'bottom',
      ...props
    },
    ref
  ) => {
    const t = useText();
    const { isAnimationEnabled } = useAnimationConfig();

    // 默认加载文案
    const loadingText = text || t('tip.loading', 'جارٍ التحميل...');

    // 文案尺寸映射
    const textSizeMap: Record<string, string> = {
      xs: 'text-[10px]',
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-lg',
    };

    // 容器布局
    const containerLayout = textPosition === 'right' 
      ? 'flex-row gap-2' 
      : 'flex-col gap-1.5';

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center',
          showText && containerLayout,
          className
        )}
        role="status"
        aria-label={loadingText}
        {...props}
      >
        {/* 旋转图标 */}
        <RiLoader4Line
          className={cn(
            loadingSpinnerVariants({ size, variant }),
            isAnimationEnabled && 'animate-spin'
          )}
        />

        {/* 加载文案 */}
        {showText && (
          <span
            className={cn(
              'text-neutral-500',
              textSizeMap[size || 'md']
            )}
          >
            {loadingText}
          </span>
        )}
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * 全屏加载覆盖层属性
 */
export interface FullScreenLoaderProps extends LoadingSpinnerProps {
  /** 是否显示 */
  visible?: boolean;
  /** 背景透明度 */
  backdrop?: 'transparent' | 'light' | 'dark';
  /** 是否固定定位 */
  fixed?: boolean;
}

/**
 * FullScreenLoader 全屏加载覆盖层
 * @description 覆盖整个页面的加载指示器
 * 
 * @example
 * ```tsx
 * <FullScreenLoader visible={isLoading} />
 * 
 * // 深色背景
 * <FullScreenLoader visible={isLoading} backdrop="dark" />
 * ```
 */
export function FullScreenLoader({
  visible = true,
  backdrop = 'light',
  fixed = true,
  size = 'lg',
  showText = true,
  ...props
}: FullScreenLoaderProps) {
  const { isAnimationEnabled } = useAnimationConfig();

  if (!visible) return null;

  // 背景样式
  const backdropStyles = {
    transparent: 'bg-transparent',
    light: 'bg-white/80 backdrop-blur-sm',
    dark: 'bg-black/50 backdrop-blur-sm',
  };

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={isAnimationEnabled ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        exit={isAnimationEnabled ? { opacity: 0 } : undefined}
        transition={{ duration: 0.2 }}
        className={cn(
          'inset-0 z-50 flex items-center justify-center',
          fixed ? 'fixed' : 'absolute',
          backdropStyles[backdrop]
        )}
      >
        <LoadingSpinner size={size} showText={showText} {...props} />
      </m.div>
    </LazyMotion>
  );
}

/**
 * 按钮内加载指示器
 * @description 专门用于按钮内部的小尺寸加载动画
 */
export function ButtonSpinner({ className }: { className?: string }) {
  return (
    <LoadingSpinner
      size="sm"
      variant="current"
      className={cn('mr-2', className)}
    />
  );
}

/**
 * 页面骨架加载占位
 * @description 页面级别的加载状态，居中显示
 */
export function PageLoader({ text }: { text?: string }) {
  const t = useText();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] py-12">
      <LoadingSpinner size="lg" showText text={text || t('tip.loading', 'جارٍ التحميل...')} />
    </div>
  );
}

/**
 * 内联加载指示器
 * @description 用于文字旁边的小型加载动画
 */
export function InlineSpinner({ className }: { className?: string }) {
  return (
    <LoadingSpinner
      size="xs"
      variant="muted"
      className={cn('inline-block ml-1', className)}
    />
  );
}

export { loadingSpinnerVariants };
