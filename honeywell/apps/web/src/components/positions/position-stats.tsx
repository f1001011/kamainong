/**
 * @file 持仓统计组件
 * @description 持仓概览统计卡片，显示持仓数量、总金额、已获收益等
 * @depends 开发文档/03-页面开发/03.8.1-我的持仓页.md
 * @depends 开发文档/01-设计系统/01.1-设计Token.md - 2026高端美学配色
 */

'use client';

import { useMemo } from 'react';
import { m } from 'motion/react';
import { RiLineChartFill, RiWalletFill, RiCalendarCheckFill, RiFireFill } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { formatCurrency } from '@/lib/format';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { SPRINGS, slideUpVariants } from '@/lib/animation';

/**
 * 持仓统计数据
 * 依据：02.3-前端API接口清单.md 第8.1节 - summary 字段
 */
export interface PositionSummary {
  /** 进行中持仓数量 */
  activeCount: number;
  /** 已完成持仓数量 */
  completedCount: number;
  /** 总持仓金额 */
  totalPurchaseAmount: string;
  /** 已获总收益 */
  totalEarned: string;
  /** 今日收益 */
  todayIncome: string;
}

/**
 * PositionStats 组件属性
 */
export interface PositionStatsProps {
  /** 统计数据 */
  summary: PositionSummary;
  /** 自定义类名 */
  className?: string;
  /** 是否显示详细信息 */
  detailed?: boolean;
}

/**
 * 单个统计项组件
 */
interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent?: boolean;
  className?: string;
}

function StatItem({ icon, label, value, accent = false, className }: StatItemProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-neutral-400">{label}</span>
      </div>
      <div className={cn(
        'text-lg font-bold font-mono tabular-nums',
        accent ? 'text-success' : 'text-neutral-800'
      )}>
        {value}
      </div>
    </div>
  );
}

/**
 * PositionStats 持仓统计概览组件
 * @description 显示持仓整体统计信息，包括：
 * - 进行中/已完成持仓数量
 * - 总持仓金额
 * - 已获总收益
 * - 今日收益
 * 
 * 依据：03.8.1-我的持仓页.md - 持仓统计概览
 * 
 * @example
 * ```tsx
 * <PositionStats
 *   summary={{
 *     activeCount: 5,
 *     completedCount: 12,
 *     totalPurchaseAmount: "600.00",
 *     totalEarned: "3000.00",
 *     todayIncome: "50.00",
 *   }}
 * />
 * ```
 */
export function PositionStats({
  summary,
  className,
  detailed = false,
}: PositionStatsProps) {
  const t = useText();
  const { config } = useGlobalConfig();

  // 格式化金额
  const displayTotalPurchase = useMemo(() => {
    return parseFloat(summary.totalPurchaseAmount || '0');
  }, [summary.totalPurchaseAmount]);

  const displayTotalEarned = useMemo(() => {
    return parseFloat(summary.totalEarned || '0');
  }, [summary.totalEarned]);

  const displayTodayIncome = useMemo(() => {
    return parseFloat(summary.todayIncome || '0');
  }, [summary.todayIncome]);

  return (
    <m.div
      className={cn(
        'rounded-2xl overflow-hidden',
        // 渐变背景 - 2026高端美学风格
        'bg-gradient-to-br from-primary-500 via-primary-600 to-gold-500',
        // 多层阴影
        'shadow-[0_4px_16px_rgba(var(--color-gold-rgb),0.25),0_8px_32px_rgba(0,0,0,0.1)]',
        className
      )}
      variants={slideUpVariants}
      initial="initial"
      animate="animate"
    >
      {/* 装饰性背景图案 */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 200 100" fill="none">
          <circle cx="180" cy="10" r="40" fill="currentColor" className="text-white" />
          <circle cx="-20" cy="80" r="60" fill="currentColor" className="text-white" />
        </svg>
      </div>

      <div className="relative p-5">
        {/* 上方：主统计 - 已获总收益 */}
        <div className="text-center mb-5">
          <p className="text-white/70 text-sm mb-1">
            {t('label.total_earned')}
          </p>
          <div className="text-white text-3xl font-bold">
            <AnimatedNumber
              value={displayTotalEarned}
              prefix={`${config.currencySymbol} `}
              decimals={config?.currencyDecimals ?? 0}
              duration={1}
            />
          </div>
        </div>

        {/* 分割线 */}
        <div className="h-px bg-white/20 mb-4" />

        {/* 下方：次要统计网格 */}
        <div className={cn(
          'grid gap-4',
          detailed ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'
        )}>
          {/* 进行中持仓 */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <RiLineChartFill className="h-3.5 w-3.5 text-white/60" />
              <span className="text-xs text-white/60">
                {t('label.active_positions')}
              </span>
            </div>
            <div className="text-white text-lg font-bold">
              {summary.activeCount}
            </div>
          </div>

          {/* 今日收益 */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <RiFireFill className="h-3.5 w-3.5 text-white/60" />
              <span className="text-xs text-white/60">
                {t('label.today_income')}
              </span>
            </div>
            <div className="text-white text-lg font-bold font-mono tabular-nums">
              +<AnimatedNumber
                value={displayTodayIncome}
                decimals={config?.currencyDecimals ?? 0}
                duration={0.8}
              />
            </div>
          </div>

          {/* 总持仓金额 */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <RiWalletFill className="h-3.5 w-3.5 text-white/60" />
              <span className="text-xs text-white/60">
                {t('label.total_invested')}
              </span>
            </div>
            <div className="text-white text-lg font-bold font-mono tabular-nums">
              <AnimatedNumber
                value={displayTotalPurchase}
                decimals={config?.currencyDecimals ?? 0}
                duration={0.8}
              />
            </div>
          </div>

          {/* 已完成持仓（仅详细模式显示） */}
          {detailed && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <RiCalendarCheckFill className="h-3.5 w-3.5 text-white/60" />
                <span className="text-xs text-white/60">
                  {t('label.completed_positions')}
                </span>
              </div>
              <div className="text-white text-lg font-bold">
                {summary.completedCount}
              </div>
            </div>
          )}
        </div>
      </div>
    </m.div>
  );
}

/**
 * PositionStatsSkeleton 持仓统计骨架屏
 */
export function PositionStatsSkeleton() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-neutral-200 via-neutral-300 to-neutral-200 animate-pulse overflow-hidden">
      <div className="p-5">
        {/* 上方主统计骨架 */}
        <div className="text-center mb-5">
          <div className="h-4 bg-white/30 rounded w-24 mx-auto mb-2" />
          <div className="h-8 bg-white/30 rounded w-32 mx-auto" />
        </div>
        
        {/* 分割线 */}
        <div className="h-px bg-white/20 mb-4" />
        
        {/* 下方统计网格骨架 */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className="h-3 bg-white/30 rounded w-12 mx-auto mb-2" />
              <div className="h-5 bg-white/30 rounded w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * PositionStatsCompact 紧凑版统计组件
 * @description 用于页面顶部的简洁统计显示
 */
export interface PositionStatsCompactProps {
  /** 统计数据 */
  summary: PositionSummary;
  /** 自定义类名 */
  className?: string;
}

export function PositionStatsCompact({
  summary,
  className,
}: PositionStatsCompactProps) {
  const t = useText();
  const { config } = useGlobalConfig();

  const displayTotalEarned = useMemo(() => {
    return parseFloat(summary.totalEarned || '0');
  }, [summary.totalEarned]);

  const displayTodayIncome = useMemo(() => {
    return parseFloat(summary.todayIncome || '0');
  }, [summary.todayIncome]);

  return (
    <div className={cn(
      'flex items-center justify-between p-4 rounded-xl',
      'bg-gradient-to-r from-primary-50 to-gold-50/50',
      'border border-primary-100/50',
      className
    )}>
      {/* 左侧：已获总收益 */}
      <div>
        <span className="text-xs text-neutral-500">
          {t('label.total_earned')}
        </span>
        <div className="text-xl font-bold text-success font-mono tabular-nums">
          +<AnimatedNumber
            value={displayTotalEarned}
            prefix={`${config.currencySymbol} `}
            decimals={config?.currencyDecimals ?? 0}
          />
        </div>
      </div>

      {/* 右侧：今日收益 */}
      <div className="text-right">
        <span className="text-xs text-neutral-500">
          {t('label.today_income')}
        </span>
        <div className="text-lg font-bold text-primary-500 font-mono tabular-nums">
          +<AnimatedNumber
            value={displayTodayIncome}
            prefix={`${config.currencySymbol} `}
            decimals={config?.currencyDecimals ?? 0}
          />
        </div>
      </div>
    </div>
  );
}
