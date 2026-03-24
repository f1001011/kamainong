/**
 * @file 动画勾选标记组件
 * @description SVG 路径动画实现的高端勾选效果，用于成功状态展示
 * @depends 开发文档/01-设计系统/01.2-动画系统.md - 第九节 特殊效果动画
 */

'use client';

import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS } from '@/lib/animation/constants';

/**
 * 勾选标记尺寸配置
 */
const sizeConfig = {
  sm: { wrapper: 'size-12', circle: 44, check: 'stroke-[3]' },
  md: { wrapper: 'size-20', circle: 72, check: 'stroke-[3.5]' },
  lg: { wrapper: 'size-28', circle: 100, check: 'stroke-[4]' },
  xl: { wrapper: 'size-36', circle: 128, check: 'stroke-[4.5]' },
} as const;

/**
 * 颜色主题配置
 */
const themeConfig = {
  success: {
    gradient: ['#22c55e', '#16a34a'],
    glow: 'rgba(34, 197, 94, 0.3)',
    ring: 'rgba(34, 197, 94, 0.15)',
  },
  primary: {
    gradient: ['var(--color-primary-500)', 'var(--color-primary-600)'],
    glow: 'rgba(var(--color-primary-rgb), 0.3)',
    ring: 'rgba(var(--color-primary-rgb), 0.15)',
  },
  gold: {
    gradient: ['var(--color-gold-600)', 'var(--color-gold-700)'],
    glow: 'rgba(var(--color-gold-rgb), 0.3)',
    ring: 'rgba(var(--color-gold-rgb), 0.15)',
  },
} as const;

/**
 * AnimatedCheckmark 属性
 */
export interface AnimatedCheckmarkProps {
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 颜色主题 */
  theme?: 'success' | 'primary' | 'gold';
  /** 动画延迟（秒） */
  delay?: number;
  /** 是否显示外圈光环 */
  showRing?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * AnimatedCheckmark 高端勾选动画组件
 * @description SVG 路径渐进绘制 + 缩放弹跳 + 光环扩散，打造高端成功反馈
 *
 * @example
 * ```tsx
 * <AnimatedCheckmark size="lg" theme="success" showRing />
 * ```
 */
export function AnimatedCheckmark({
  size = 'md',
  theme = 'success',
  delay = 0,
  showRing = true,
  className,
}: AnimatedCheckmarkProps) {
  const { isAnimationEnabled, getDuration } = useAnimationConfig();
  const sizeStyle = sizeConfig[size];
  const themeStyle = themeConfig[theme];
  const gradientId = `checkmark-gradient-${theme}`;

  // 圆形 SVG 参数
  const circleSize = sizeStyle.circle;
  const center = circleSize / 2;
  const radius = center - 4;
  const circumference = 2 * Math.PI * radius;

  // 勾选路径 - 基于圆形大小动态计算
  const checkPath = `M${center * 0.55} ${center} L${center * 0.85} ${center * 1.25} L${center * 1.45} ${center * 0.7}`;

  // 无动画时直接展示静态勾选
  if (!isAnimationEnabled) {
    return (
      <div className={cn('relative flex items-center justify-center', sizeStyle.wrapper, className)}>
        <svg width={circleSize} height={circleSize} viewBox={`0 0 ${circleSize} ${circleSize}`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={themeStyle.gradient[0]}
            strokeWidth="3"
          />
          <path
            d={checkPath}
            fill="none"
            stroke={themeStyle.gradient[0]}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <m.div
      className={cn('relative flex items-center justify-center', sizeStyle.wrapper, className)}
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        ...SPRINGS.bouncy,
        delay: getDuration(delay),
      }}
    >
      {/* 外圈光环扩散 */}
      {showRing && (
        <>
          <m.div
            className="absolute inset-0 rounded-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 2.2, opacity: [0, 0.4, 0] }}
            transition={{
              duration: getDuration(1.2),
              delay: getDuration(delay + 0.3),
              ease: 'easeOut',
            }}
            style={{ background: `radial-gradient(circle, ${themeStyle.ring}, transparent 70%)` }}
          />
          <m.div
            className="absolute inset-0 rounded-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.8, opacity: [0, 0.3, 0] }}
            transition={{
              duration: getDuration(1),
              delay: getDuration(delay + 0.5),
              ease: 'easeOut',
            }}
            style={{ background: `radial-gradient(circle, ${themeStyle.ring}, transparent 70%)` }}
          />
        </>
      )}

      {/* 底部发光效果 */}
      <m.div
        className="absolute inset-0 rounded-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0.3] }}
        transition={{
          duration: getDuration(0.8),
          delay: getDuration(delay + 0.2),
        }}
        style={{ boxShadow: `0 0 40px ${themeStyle.glow}, 0 0 80px ${themeStyle.glow}` }}
      />

      {/* SVG 勾选动画 */}
      <svg
        width={circleSize}
        height={circleSize}
        viewBox={`0 0 ${circleSize} ${circleSize}`}
        className="relative z-10"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={themeStyle.gradient[0]} />
            <stop offset="100%" stopColor={themeStyle.gradient[1]} />
          </linearGradient>
        </defs>

        {/* 圆圈 - 路径绘制动画 */}
        <m.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: 0 }}
          transition={{
            duration: getDuration(0.8),
            delay: getDuration(delay),
            ease: [0.65, 0, 0.35, 1],
          }}
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />

        {/* 圆圈内填充（微弱） */}
        <m.circle
          cx={center}
          cy={center}
          r={radius - 2}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.08 }}
          transition={{
            duration: getDuration(0.4),
            delay: getDuration(delay + 0.6),
          }}
          fill={`url(#${gradientId})`}
        />

        {/* 勾选 - 路径绘制动画 */}
        <m.path
          d={checkPath}
          fill="none"
          stroke={`url(#${gradientId})`}
          className={sizeStyle.check}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: {
              duration: getDuration(0.5),
              delay: getDuration(delay + 0.5),
              ease: [0.65, 0, 0.35, 1],
            },
            opacity: {
              duration: getDuration(0.1),
              delay: getDuration(delay + 0.5),
            },
          }}
        />
      </svg>
    </m.div>
  );
}
