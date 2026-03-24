/**
 * @file 按钮组件
 * @description "Luminous Depth 2.0" - 3D质感按钮，带高级光影效果和触感反馈
 * @depends 开发文档.md 第1.2.4节 - 交互动画规范
 * @depends 01.3-组件规范.md 第3.1节 - Button规范
 */

'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { m } from 'motion/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { RiLoader4Line } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS } from '@/lib/animation';

/**
 * 按钮变体样式
 * "Luminous Depth 2.0" 增强版：3D质感 + 内发光 + 高级交互反馈
 */
const buttonVariants = cva(
  // 基础样式 - 增强圆角和过渡
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        /** 主要按钮 - 翡翠绿填充，3D阴影 + 内发光 */
        primary: [
          'bg-primary-500 text-white',
          'shadow-[0_4px_16px_rgba(var(--color-primary-rgb),0.3),0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.15)]',
          'hover:shadow-[0_8px_24px_rgba(var(--color-primary-rgb),0.4),0_4px_8px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.2)]',
          'hover:bg-primary-400 hover:brightness-105',
          'active:shadow-[0_2px_8px_rgba(var(--color-primary-rgb),0.3),inset_0_2px_4px_rgba(0,0,0,0.1)]',
          'active:brightness-[0.97]',
        ].join(' '),
        /** 渐变按钮 - 高端渐变填充 + 微光扫过效果 */
        gradient: 'btn-gradient rounded-xl',
        /** 次要按钮 - 精致边框 + 微妙渐变背景 */
        secondary: [
          'bg-gradient-to-b from-white to-neutral-50/80',
          'border border-primary-200/60',
          'text-primary-600',
          'shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)]',
          'hover:border-primary-300 hover:shadow-[0_4px_16px_rgba(var(--color-primary-rgb),0.1),inset_0_1px_0_rgba(255,255,255,0.9)]',
          'hover:from-white hover:to-primary-50/50',
        ].join(' '),
        /** 幽灵按钮 - 透明背景 */
        ghost: 'bg-transparent text-primary-600 hover:bg-primary-50/80 active:bg-primary-100/60',
        /** 危险按钮 - 红色，带深度 */
        destructive: [
          'bg-error text-white',
          'shadow-[0_4px_12px_rgba(220,38,38,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]',
          'hover:shadow-[0_8px_20px_rgba(220,38,38,0.3)] hover:brightness-105',
        ].join(' '),
        /** 链接样式 */
        link: 'text-primary-500 underline-offset-4 hover:underline',
        /** 香槟金按钮 - 高端金色渐变 */
        gold: [
          'bg-gradient-to-r from-gold-600 to-gold-700 text-white',
          'shadow-[0_4px_16px_rgba(var(--color-gold-rgb),0.3)]',
          'hover:from-gold-500 hover:to-gold-600 hover:brightness-105',
          'hover:shadow-[0_6px_20px_rgba(var(--color-gold-rgb),0.4)]',
          'active:brightness-[0.97]',
        ].join(' '),
        /** 深色透明按钮 - 用于深色背景上，增强质感 */
        'glass-light': [
          'bg-white/15 backdrop-blur-xl text-white',
          'border border-white/20',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]',
          'hover:bg-white/25 hover:border-white/30',
          'hover:shadow-[0_4px_16px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.15)]',
        ].join(' '),
      },
      size: {
        /** 小尺寸 - 32px */
        sm: 'h-8 px-3 text-sm rounded-lg',
        /** 默认尺寸 - 44px（增加到更舒适的高度） */
        md: 'h-11 px-6 text-base',
        /** 大尺寸 - 52px（更大更有冲击力） */
        lg: 'h-[52px] px-8 text-base rounded-2xl font-bold tracking-wide',
        /** 图标按钮 */
        icon: 'h-10 w-10',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

/**
 * 按钮组件属性
 * 依据：使用 Omit 移除与 Motion 冲突的事件属性
 */
export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'>,
    VariantProps<typeof buttonVariants> {
  /** 是否正在加载 */
  isLoading?: boolean;
  /** 加载时的文案 */
  loadingText?: string;
  /** 左侧图标 */
  leftIcon?: ReactNode;
  /** 右侧图标 */
  rightIcon?: ReactNode;
}

/**
 * 按钮组件
 * @description "Luminous Depth 2.0" - 带3D质感和高级交互反馈的按钮
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // 依据：01.2-动画系统.md - 使用动画配置
    const { isAnimationEnabled } = useAnimationConfig();
    const isDisabled = disabled || isLoading;

    // 依据：开发文档.md 第1.2.4节 - 按钮动画配置
    const getAnimationProps = () => {
      if (!isAnimationEnabled || isDisabled) return {};

      switch (variant) {
        case 'primary':
        case 'gradient':
        case 'gold':
          // 主按钮/渐变按钮/金色按钮：hover放大 + 3D提升感
          return { 
            whileHover: { scale: 1.03, y: -1 }, 
            whileTap: { scale: 0.96, y: 1 } 
          };
        case 'secondary':
          // 次按钮：hover放大1.02，tap缩小0.97
          return { 
            whileHover: { scale: 1.02, y: -1 }, 
            whileTap: { scale: 0.97 } 
          };
        case 'ghost':
        case 'destructive':
        case 'glass-light':
          // 幽灵/危险/玻璃按钮：仅tap缩小
          return { whileTap: { scale: 0.97 } };
        default:
          return {};
      }
    };

    return (
      <m.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={isDisabled}
        {...getAnimationProps()}
        transition={SPRINGS.snappy}
        {...props}
      >
        {/* 加载状态 */}
        {isLoading && (
          <RiLoader4Line className="h-4 w-4 animate-spin" />
        )}

        {/* 左侧图标 */}
        {!isLoading && leftIcon && (
          <span className="shrink-0">{leftIcon}</span>
        )}

        {/* 按钮文本 */}
        {isLoading && loadingText ? loadingText : children}

        {/* 右侧图标 */}
        {!isLoading && rightIcon && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </m.button>
    );
  }
);

Button.displayName = 'Button';

export { buttonVariants };
