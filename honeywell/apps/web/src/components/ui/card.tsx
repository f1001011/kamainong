/**
 * @file 卡片组件
 * @description "Luminous Depth 2.0" - 3D悬浮 + 光影层次 + 精致边框的高端卡片
 * @depends 开发文档.md 第1.1.3节 - 高级感设计元素
 * @depends 01.3-组件规范.md 第3.3节 - Card规范
 */

'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS } from '@/lib/animation';

/**
 * 卡片组件属性
 * "Luminous Depth 2.0" 增强：3D悬浮 + 极光玻璃 + 金属质感
 */
export interface CardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  /** 卡片变体 */
  variant?: 'default' | 'hero-dark' | 'glass-tinted' | 'glass-aurora' | 'metallic';
  /** 是否启用悬停动画（卡片上浮+阴影扩散） */
  hoverable?: boolean;
  /** 是否可点击 */
  clickable?: boolean;
  /** 是否使用毛玻璃效果 */
  glass?: boolean;
  /** 卡片内边距 */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * 内边距映射
 */
const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/**
 * 变体样式映射 - 2.0 增强版
 */
const variantStyles = {
  default: [
    'rounded-2xl bg-white',
    'shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_4px_rgba(0,0,0,0.03),0_0_1px_rgba(0,0,0,0.04)]',
    'border border-neutral-100/80',
    'backdrop-blur-sm',
  ].join(' '),
  'hero-dark': 'card-hero-dark shadow-dark-card text-white',
  'glass-tinted': 'rounded-2xl glass-tinted',
  'glass-aurora': 'rounded-2xl glass-aurora',
  'metallic': 'card-metallic',
};

/**
 * 卡片组件
 * @description "Luminous Depth 2.0" - 带3D悬浮和光影层次的高端卡片
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      hoverable = false,
      clickable = false,
      glass = false,
      padding = 'md',
      children,
      ...props
    },
    ref
  ) => {
    const { isAnimationEnabled } = useAnimationConfig();

    const baseStyles = cn(
      variantStyles[variant],
      paddingMap[padding],
      glass && variant === 'default' && 'glass',
      clickable && 'cursor-pointer',
      className
    );

    // 2.0增强：3D悬浮效果 + 光晕扩散
    if (hoverable && isAnimationEnabled) {
      return (
        <m.div
          ref={ref}
          className={baseStyles}
          whileHover={{
            y: -6,
            scale: 1.01,
            boxShadow: variant === 'hero-dark'
              ? '0 24px 64px rgba(0,0,0,0.3), 0 0 48px rgba(var(--color-gold-rgb),0.12), 0 0 1px rgba(var(--color-gold-rgb),0.3)'
              : '0 16px 40px rgba(0,0,0,0.08), 0 8px 20px rgba(var(--color-primary-rgb),0.06), 0 0 1px rgba(0,0,0,0.06)',
          }}
          whileTap={{ scale: 0.98, y: 0 }}
          transition={SPRINGS.gentle}
          {...props}
        >
          {children}
        </m.div>
      );
    }

    return (
      <div ref={ref} className={baseStyles} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * 卡片头部组件 - 增强排版
 */
export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-start justify-between', className)}
        {...props}
      >
        <div className="flex-1">
          {title && (
            <h3 className="text-lg font-bold text-foreground tracking-tight">{title}</h3>
          )}
          {subtitle && (
            <p className="mt-0.5 text-sm text-neutral-400">{subtitle}</p>
          )}
          {children}
        </div>
        {action && <div className="ml-4 shrink-0">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

/**
 * 卡片内容组件
 */
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('mt-4', className)}
        {...props}
      />
    );
  }
);

CardContent.displayName = 'CardContent';

/**
 * 卡片底部组件 - 渐变分割线
 */
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'mt-4 flex items-center justify-between gap-3 pt-4',
          'border-t border-gradient-to-r from-transparent via-neutral-100 to-transparent',
          className
        )}
        {...props}
      />
    );
  }
);

CardFooter.displayName = 'CardFooter';
