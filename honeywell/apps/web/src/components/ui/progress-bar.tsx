/**
 * @file 通用进度条组件
 * @description 支持渐变背景、动画效果的进度条
 * @depends 开发文档/01-设计系统/01.2-动画系统.md
 * @depends 开发文档/03-页面开发/03.8.1-我的持仓页.md
 * 
 * 复用说明：本组件被以下页面复用
 * - FE-15 我的持仓页（收益进度）
 * - FE-19/20/21 活动页
 */

'use client';

import { useMemo } from 'react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS } from '@/lib/animation/constants';

/**
 * 渐变预设类型
 */
export type ProgressGradient = 
  | 'primary'   // 主色渐变（金色调）
  | 'success'   // 成功色渐变（绿色调）
  | 'warning'   // 警告色渐变（橙色调）
  | 'error'     // 错误色渐变（红色调）
  | 'neutral';  // 中性色渐变（灰色调）

/**
 * 进度条组件属性
 */
export interface ProgressBarProps {
  /** 当前进度值（0-100） */
  value: number;
  /** 最大值，默认 100 */
  max?: number;
  /** 进度条高度，默认 8px */
  height?: 'sm' | 'md' | 'lg';
  /** 渐变预设 */
  gradient?: ProgressGradient;
  /** 自定义渐变色（覆盖预设） */
  customGradient?: string;
  /** 是否显示进度百分比 */
  showPercent?: boolean;
  /** 是否启用动画 */
  animated?: boolean;
  /** 是否显示背景光晕效果 */
  showGlow?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 轨道自定义类名 */
  trackClassName?: string;
  /** 填充条自定义类名 */
  barClassName?: string;
  /** 子内容（显示在进度条上方） */
  children?: React.ReactNode;
}

/**
 * 高度映射
 */
const heightMap = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

/**
 * 渐变预设
 * 依据：01.1-设计Token.md - 2026高端美学配色
 */
const gradientPresets: Record<ProgressGradient, string> = {
  primary: 'bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600',
  success: 'bg-gradient-to-r from-success/80 via-success to-primary-500',
  warning: 'bg-gradient-to-r from-warning/80 via-warning to-primary-500',
  error: 'bg-gradient-to-r from-error/80 via-error to-red-500',
  neutral: 'bg-gradient-to-r from-neutral-300 via-neutral-400 to-neutral-500',
};

/**
 * 光晕预设
 */
const glowPresets: Record<ProgressGradient, string> = {
  primary: 'shadow-[0_0_12px_rgba(var(--color-primary-rgb),0.4)]',
  success: 'shadow-[0_0_12px_rgba(34,197,94,0.4)]',
  warning: 'shadow-[0_0_12px_rgba(var(--color-gold-rgb),0.4)]',
  error: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]',
  neutral: 'shadow-[0_0_12px_rgba(163,163,163,0.3)]',
};

/**
 * ProgressBar 通用进度条组件
 * @description 支持渐变背景、动画效果的可复用进度条
 * 依据：03.8.1-我的持仓页.md - 收益进度渐变背景
 * 
 * @example
 * ```tsx
 * // 基础用法
 * <ProgressBar value={75} />
 * 
 * // 带渐变和光晕
 * <ProgressBar
 *   value={65}
 *   gradient="success"
 *   showGlow
 *   showPercent
 * />
 * 
 * // 自定义渐变
 * <ProgressBar
 *   value={50}
 *   customGradient="bg-gradient-to-r from-blue-400 to-purple-500"
 * />
 * ```
 */
export function ProgressBar({
  value,
  max = 100,
  height = 'md',
  gradient = 'primary',
  customGradient,
  showPercent = false,
  animated = true,
  showGlow = false,
  className,
  trackClassName,
  barClassName,
  children,
}: ProgressBarProps) {
  const { isAnimationEnabled } = useAnimationConfig();

  // 计算百分比（限制在 0-100）
  const percent = useMemo(() => {
    const p = (value / max) * 100;
    return Math.max(0, Math.min(100, p));
  }, [value, max]);

  // 是否使用动画
  const useMotion = animated && isAnimationEnabled;

  // 渐变样式
  const gradientStyle = customGradient || gradientPresets[gradient];
  const glowStyle = showGlow ? glowPresets[gradient] : '';

  return (
    <div className={cn('relative', className)}>
      {/* 子内容（显示在进度条上方） */}
      {children && (
        <div className="mb-1.5 flex items-center justify-between">
          {children}
        </div>
      )}

      {/* 进度条容器 */}
      <div className="relative">
        {/* 轨道背景 */}
        <div
          className={cn(
            'w-full rounded-full overflow-hidden',
            'bg-neutral-100',
            heightMap[height],
            trackClassName
          )}
        >
          {/* 填充条 */}
          {useMotion ? (
            <m.div
              className={cn(
                'h-full rounded-full',
                gradientStyle,
                glowStyle,
                barClassName
              )}
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={SPRINGS.gentle}
            />
          ) : (
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                gradientStyle,
                glowStyle,
                barClassName
              )}
              style={{ width: `${percent}%` }}
            />
          )}
        </div>

        {/* 进度条末端光点（可选，增强视觉） */}
        {showGlow && percent > 0 && percent < 100 && (
          <m.div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full',
              'bg-white/80',
              glowPresets[gradient]
            )}
            style={{ left: `calc(${percent}% - 4px)` }}
            animate={{
              opacity: [0.6, 1, 0.6],
              scale: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </div>

      {/* 进度百分比 */}
      {showPercent && (
        <div className="mt-1 text-right">
          <span className="text-xs font-medium text-neutral-500 tabular-nums">
            {percent.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * 收益进度条组件
 * @description 专门用于持仓收益进度的预设组件
 */
export interface IncomeProgressBarProps {
  /** 当前已发放天数 */
  paidDays: number;
  /** 总周期天数 */
  cycleDays: number;
  /** 是否显示天数标签 */
  showDays?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * IncomeProgressBar 收益进度条
 * @description 用于持仓卡片的收益进度展示
 * 依据：03.8.1-我的持仓页.md - 收益进度渐变背景
 * 
 * @example
 * ```tsx
 * <IncomeProgressBar
 *   paidDays={30}
 *   cycleDays={365}
 *   showDays
 * />
 * ```
 */
export function IncomeProgressBar({
  paidDays,
  cycleDays,
  showDays = false,
  className,
}: IncomeProgressBarProps) {
  // 计算进度百分比
  const percent = (paidDays / cycleDays) * 100;

  // 根据进度选择渐变色
  const gradient: ProgressGradient = useMemo(() => {
    if (percent >= 100) return 'success';
    if (percent >= 75) return 'primary';
    if (percent >= 50) return 'warning';
    return 'primary';
  }, [percent]);

  return (
    <ProgressBar
      value={paidDays}
      max={cycleDays}
      height="sm"
      gradient={gradient}
      showGlow
      className={className}
    >
      {showDays && (
        <>
          <span className="text-xs text-neutral-400">
            {paidDays} / {cycleDays}
          </span>
          <span className="text-xs font-medium text-primary-500 tabular-nums">
            {percent.toFixed(1)}%
          </span>
        </>
      )}
    </ProgressBar>
  );
}
