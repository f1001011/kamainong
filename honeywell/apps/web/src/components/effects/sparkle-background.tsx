/**
 * @file 星光闪烁背景组件
 * @description 弹窗/卡片内的星光粒子动画效果，增添高端感
 * @depends 开发文档/01-设计系统/01.2-动画系统.md - 第九节 特殊效果动画
 */

'use client';

import { useMemo } from 'react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';

/**
 * 单个星光粒子配置
 */
interface Sparkle {
  id: number;
  x: string;
  y: string;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

/**
 * SparkleBackground 属性
 */
export interface SparkleBackgroundProps {
  /** 粒子数量 */
  count?: number;
  /** 颜色 */
  color?: 'gold' | 'primary' | 'white' | 'mixed';
  /** 粒子大小范围 */
  sizeRange?: [number, number];
  /** 自定义类名 */
  className?: string;
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 颜色映射
 */
const colorMap = {
  gold: ['var(--color-gold-600)', 'var(--color-gold-400)', 'var(--color-gold-300)'],
  primary: ['var(--color-primary-500)', 'var(--color-primary-400)', 'var(--color-primary-300)'],
  white: ['#ffffff', '#f5f5f5', '#e5e5e5'],
  mixed: ['var(--color-gold-600)', 'var(--color-primary-500)', '#ffffff', 'var(--color-gold-400)', 'var(--color-primary-300)'],
} as const;

/**
 * 生成随机星光粒子
 */
function generateSparkles(count: number, sizeRange: [number, number]): Sparkle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: `${Math.random() * 100}%`,
    y: `${Math.random() * 100}%`,
    size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
    delay: Math.random() * 3,
    duration: 1.5 + Math.random() * 2,
    opacity: 0.3 + Math.random() * 0.7,
  }));
}

/**
 * SparkleBackground 星光闪烁背景
 * @description 在容器内创建闪烁的星光粒子效果，适用于庆祝弹窗、奖励卡片等场景
 *
 * @example
 * ```tsx
 * <div className="relative">
 *   <SparkleBackground count={20} color="gold" />
 *   {/\* 内容 *\/}
 * </div>
 * ```
 */
export function SparkleBackground({
  count = 15,
  color = 'gold',
  sizeRange = [2, 6],
  className,
  enabled = true,
}: SparkleBackgroundProps) {
  const { isAnimationEnabled, getDuration } = useAnimationConfig();

  // 预生成粒子配置（避免重渲染时重新计算）
  const sparkles = useMemo(() => generateSparkles(count, sizeRange), [count, sizeRange]);
  const colors = colorMap[color];

  // 动画禁用时不渲染
  if (!enabled || !isAnimationEnabled) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute inset-0 overflow-hidden pointer-events-none z-0',
        className
      )}
      aria-hidden="true"
    >
      {sparkles.map((sparkle) => {
        const sparkleColor = colors[Math.floor(Math.random() * colors.length)];

        return (
          <m.div
            key={sparkle.id}
            className="absolute rounded-full"
            style={{
              left: sparkle.x,
              top: sparkle.y,
              width: sparkle.size,
              height: sparkle.size,
              backgroundColor: sparkleColor,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, sparkle.opacity, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: getDuration(sparkle.duration),
              delay: sparkle.delay,
              repeat: Infinity,
              repeatDelay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          >
            {/* 十字光芒效果（大粒子才有） */}
            {sparkle.size > 4 && (
              <>
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    width: sparkle.size * 3,
                    height: 1,
                    background: `linear-gradient(90deg, transparent, ${sparkleColor}, transparent)`,
                    opacity: 0.5,
                  }}
                />
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    width: 1,
                    height: sparkle.size * 3,
                    background: `linear-gradient(180deg, transparent, ${sparkleColor}, transparent)`,
                    opacity: 0.5,
                  }}
                />
              </>
            )}
          </m.div>
        );
      })}
    </div>
  );
}

/**
 * 光线射线组件
 * @description 从中心向外扩散的光线效果，用于强调庆祝时刻
 */
export interface LightRaysProps {
  /** 射线数量 */
  rayCount?: number;
  /** 颜色 */
  color?: string;
  /** 自定义类名 */
  className?: string;
}

export function LightRays({
  rayCount = 8,
  color = 'rgba(var(--color-primary-rgb), 0.08)',
  className,
}: LightRaysProps) {
  const { isAnimationEnabled, getDuration } = useAnimationConfig();

  if (!isAnimationEnabled) return null;

  return (
    <m.div
      className={cn('absolute inset-0 overflow-hidden pointer-events-none z-0', className)}
      initial={{ opacity: 0, rotate: 0 }}
      animate={{ opacity: 1, rotate: 360 }}
      transition={{
        opacity: { duration: getDuration(0.5) },
        rotate: { duration: getDuration(60), repeat: Infinity, ease: 'linear' },
      }}
      aria-hidden="true"
    >
      {Array.from({ length: rayCount }, (_, i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2 origin-bottom-left"
          style={{
            width: '150%',
            height: 2,
            background: `linear-gradient(90deg, ${color}, transparent 70%)`,
            transform: `rotate(${(360 / rayCount) * i}deg)`,
            transformOrigin: '0 50%',
          }}
        />
      ))}
    </m.div>
  );
}
