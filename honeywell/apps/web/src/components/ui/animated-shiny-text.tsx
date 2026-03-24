/**
 * @file 闪耀文字动画组件
 * @description 灵感来自 Magic UI - 文字上光泽滑过的闪耀效果
 * 用于标题、按钮文案等需要视觉吸引力的文字装饰
 *
 * 兼容性：iOS 13+ / Android 80+ / Chrome 60+
 * - 使用 linear-gradient + background-clip: text
 * - background-clip: text iOS 14+ / Chrome 4+ 支持
 */

'use client';

import { cn } from '@/lib/utils';
import type { CSSProperties, ReactNode } from 'react';

/**
 * AnimatedShinyText 组件属性
 */
interface AnimatedShinyTextProps {
  /** 子元素（文字内容） */
  children: ReactNode;
  /** 闪光宽度（像素），默认 100 */
  shimmerWidth?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 闪耀文字动画组件
 * @description 在文字上施加持续的光泽滑动效果
 *
 * @example
 * ```tsx
 * <AnimatedShinyText className="text-lg font-bold">
 *   {t('home.recommendProducts')}
 * </AnimatedShinyText>
 * ```
 */
export function AnimatedShinyText({
  children,
  shimmerWidth = 100,
  className,
}: AnimatedShinyTextProps) {
  return (
    <span
      style={
        {
          '--shiny-width': `${shimmerWidth}px`,
        } as CSSProperties
      }
      className={cn(
        /* 基础文字样式 */
        'inline-block',
        /* 闪耀动画 - 渐变滑过文字 */
        'animate-shiny-text',
        'bg-clip-text bg-no-repeat',
        '[background-size:var(--shiny-width)_100%]',
        '[background-position:0_0]',
        /* 品牌色系渐变 */
        'bg-gradient-to-r from-transparent via-primary-600/90 via-50% to-transparent',
        className
      )}
    >
      {children}
    </span>
  );
}
