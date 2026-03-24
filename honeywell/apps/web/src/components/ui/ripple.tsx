/**
 * @file 涟漪动画背景组件
 * @description 灵感来自 Magic UI - 多层同心圆扩散动画效果
 * 用作背景装饰，营造高端科技感视觉效果
 *
 * 兼容性：iOS 13+ / Android 80+ / Chrome 60+
 * - 使用 CSS animation + 绝对定位
 * - 不使用任何新特性
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Ripple 组件属性
 */
interface RippleProps {
  /** 主圆尺寸（像素），默认 210 */
  mainCircleSize?: number;
  /** 主圆透明度，默认 0.18 */
  mainCircleOpacity?: number;
  /** 圆圈数量，默认 6 */
  numCircles?: number;
  /** 自定义颜色，默认使用品牌橙 */
  color?: string;
  /** 自定义类名 */
  className?: string;
}

/**
 * 涟漪动画背景组件
 * @description 在容器中渲染多层同心圆扩散动画
 * 需要父元素设置 `position: relative` 和 `overflow: hidden`
 *
 * @example
 * ```tsx
 * <div className="relative overflow-hidden h-[400px]">
 *   <Ripple mainCircleSize={180} numCircles={5} />
 *   <div className="relative z-10">内容</div>
 * </div>
 * ```
 */
export const Ripple = React.memo(function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.18,
  numCircles = 6,
  color = 'rgba(255,255,255,0.15)',
  className,
}: RippleProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 select-none',
        className
      )}
      style={{
        WebkitMaskImage: 'linear-gradient(to bottom, white 40%, transparent 100%)',
        maskImage: 'linear-gradient(to bottom, white 40%, transparent 100%)',
      }}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 80;
        const opacity = mainCircleOpacity - i * 0.025;
        const animationDelay = `${i * 0.08}s`;

        return (
          <div
            key={i}
            className="absolute rounded-full animate-ripple-expand"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              opacity: Math.max(opacity, 0.02),
              animationDelay,
              border: `1px solid ${color}`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) scale(1)',
            }}
          />
        );
      })}
    </div>
  );
});

Ripple.displayName = 'Ripple';
