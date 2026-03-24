/**
 * @file 环形进度图组件
 * @description 呼吸式环形进度图，带外环光晕旋转动画
 * @depends 开发文档/03-前端用户端/03.8.2-持仓详情页.md 第3.2节
 * @depends 开发文档/01-设计系统/01.1-设计Token.md - 主色调渐变
 * @depends 开发文档/01-设计系统/01.2-动画系统.md - 自定义动画
 */

'use client';

import { useMemo } from 'react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS } from '@/lib/animation/constants';

/**
 * CircularProgress 组件属性
 */
export interface CircularProgressProps {
  /** 当前值 */
  current: number;
  /** 总值 */
  total: number;
  /** 尺寸（px），默认 200 */
  size?: number;
  /** 线宽，默认 12 */
  strokeWidth?: number;
  /** 中心内容 */
  children?: React.ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 是否显示外环光晕旋转动画 */
  showGlow?: boolean;
  /** 进度条渐变起始颜色 */
  gradientFrom?: string;
  /** 进度条渐变结束颜色 */
  gradientTo?: string;
}

/**
 * CircularProgress 环形进度图组件
 * @description 2026高端美学设计，核心特性：
 * - SVG 环形进度，渐变填充
 * - 外环光晕缓慢旋转（20秒一圈）
 * - 进度填充动画（1.2秒 easeOut）
 * 
 * 依据：03.8.2-持仓详情页.md 第3.2节 - 呼吸式环形进度
 * 
 * @example
 * ```tsx
 * <CircularProgress current={30} total={365} size={200}>
 *   <div className="text-center">
 *     <p className="text-4xl font-bold">30</p>
 *     <p className="text-2xl text-neutral-500">365</p>
 *   </div>
 * </CircularProgress>
 * ```
 */
export function CircularProgress({
  current,
  total,
  size = 200,
  strokeWidth = 12,
  children,
  className,
  showGlow = true,
  gradientFrom = 'var(--color-gold-400)',
  gradientTo = 'var(--color-gold-500)',
}: CircularProgressProps) {
  const { isAnimationEnabled } = useAnimationConfig();

  // 计算进度百分比
  const percentage = useMemo(() => {
    return total > 0 ? Math.min((current / total) * 100, 100) : 0;
  }, [current, total]);

  // SVG 参数计算
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // 生成唯一的渐变 ID（避免多个组件冲突）
  const gradientId = useMemo(() => `circular-progress-gradient-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {/* 外环光晕（缓慢旋转） */}
      {/* 依据：03.8.2-持仓详情页.md - 外环旋转光晕，20秒循环 */}
      {showGlow && (
        <m.div
          animate={isAnimationEnabled ? { rotate: 360 } : undefined}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(var(--color-gold-rgb),0.15) 0%, transparent 70%)',
            filter: 'blur(24px)',
          }}
        />
      )}

      {/* SVG 环形进度 */}
      <svg
        width={size}
        height={size}
        className="relative transform -rotate-90"
        aria-label={`${percentage.toFixed(1)}%`}
      >
        {/* 背景圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-neutral-100"
        />

        {/* 进度圆环 */}
        {/* 依据：03.8.2-持仓详情页.md - 圆环填充动画 1.2秒 easeOut */}
        <m.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration: 1.2,
            ease: 'easeOut',
            delay: 0.3,
          }}
        />

        {/* 渐变定义 */}
        {/* 依据：01.1-设计Token.md - primary-400 到 primary-500 渐变 */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>
      </svg>

      {/* 中心内容 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

/**
 * CircularProgressSkeleton 环形进度骨架屏
 */
export function CircularProgressSkeleton({ size = 200 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-neutral-100 animate-pulse"
      style={{ width: size, height: size }}
    />
  );
}

export default CircularProgress;
