/**
 * @file 闪耀边框组件
 * @description 灵感来自 Magic UI - 带动画渐变发光的边框效果
 * 用于卡片、容器等元素的高端视觉装饰
 *
 * 兼容性：iOS 13+ / Android 80+ / Chrome 60+
 * - 使用 radial-gradient + mask（iOS 13+ 支持）
 * - 不使用 oklch / color-mix
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * ShineBorder 组件属性
 */
interface ShineBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 边框宽度（像素），默认 1 */
  borderWidth?: number;
  /** 动画持续时间（秒），默认 14 */
  duration?: number;
  /** 闪耀颜色，支持单色或多色数组，默认使用香槟金强调色 */
  shineColor?: string | string[];
}

/**
 * 闪耀边框组件
 * @description 在元素上添加持续旋转的渐变发光边框
 * 使用绝对定位覆盖在父元素之上，需要父元素 `position: relative`
 *
 * @example
 * ```tsx
 * <div className="relative rounded-2xl">
 *   <ShineBorder shineColor={['var(--color-gold-400)', 'var(--color-gold-500)']} />
 *   <div className="p-4">内容</div>
 * </div>
 * ```
 */
export function ShineBorder({
  borderWidth = 1,
  duration = 14,
  shineColor = 'var(--color-gold-500)',
  className,
  style,
  ...props
}: ShineBorderProps) {
  const colorStr = Array.isArray(shineColor) ? shineColor.join(',') : shineColor;

  return (
    <div
      style={{
        padding: `${borderWidth}px`,
        backgroundImage: `radial-gradient(transparent, transparent, ${colorStr}, transparent, transparent)`,
        backgroundSize: '300% 300%',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        animation: `shine-border-rotate ${duration}s linear infinite`,
        ...style,
      }}
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit] will-change-[background-position]',
        className
      )}
      {...props}
    />
  );
}
