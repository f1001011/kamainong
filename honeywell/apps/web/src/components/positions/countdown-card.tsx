/**
 * @file 倒计时独立卡片组件
 * @description 下次收益倒计时独立卡片，大字体展示，强化期待感
 * @depends 开发文档/03-前端用户端/03.8.2-持仓详情页.md 第3.3节
 * @depends 开发文档/01-设计系统/01.1-设计Token.md - 渐变背景
 */

'use client';

import { useMemo } from 'react';
import { m } from 'motion/react';
import { RiTimeFill } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { formatCurrency } from '@/lib/format';
import { formatSystemTime, DEFAULT_SYSTEM_TIMEZONE } from '@/lib/timezone';
import { CountdownTimer, calculateNextIncomeTime } from '@/components/ui/countdown-timer';
import { SPRINGS } from '@/lib/animation/constants';

/**
 * CountdownCard 组件属性
 */
export interface CountdownCardProps {
  /** 下次发放时间（ISO 8601） */
  nextSettleAt: string;
  /** 日收益金额 */
  dailyIncome: string;
  /** 倒计时完成回调 */
  onComplete?: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * CountdownCard 倒计时独立卡片组件
 * @description 2026高端美学设计，核心特性：
 * - 独立卡片展示，强化视觉焦点
 * - 5xl 大字体倒计时，秒数跳动动画
 * - 渐变背景，增强期待感
 * - 显示预计发放时间和预计收益
 * 
 * 依据：03.8.2-持仓详情页.md 第3.3节 - 大字倒计时独立卡片
 * 
 * @example
 * ```tsx
 * <CountdownCard
 *   nextSettleAt="2026-02-04T10:30:00.000Z"
 *   dailyIncome="5.00"
 *   onComplete={() => refetch()}
 * />
 * ```
 */
export function CountdownCard({
  nextSettleAt,
  dailyIncome,
  onComplete,
  className,
}: CountdownCardProps) {
  const t = useText();
  const { config } = useGlobalConfig();

  // 计算下次收益时间
  const nextIncomeTime = useMemo(() => {
    return calculateNextIncomeTime(nextSettleAt);
  }, [nextSettleAt]);

  // 格式化日收益
  const displayDailyIncome = useMemo(() => {
    return formatCurrency(dailyIncome, config);
  }, [dailyIncome, config]);

  // 格式化发放时间
  const displaySettleTime = useMemo(() => {
    return formatSystemTime(nextSettleAt, config.systemTimezone || DEFAULT_SYSTEM_TIMEZONE, 'yyyy-MM-dd HH:mm');
  }, [nextSettleAt, config.systemTimezone]);

  // 如果没有下次收益时间，不渲染
  if (!nextIncomeTime) {
    return null;
  }

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.8, ...SPRINGS.gentle }}
      className={cn(
        // 依据：03.8.2-持仓详情页.md - 圆角 rounded-2xl · 阴影 shadow-soft · 渐变背景
        'p-6 rounded-2xl',
        'bg-gradient-to-br from-primary-50/50 via-white to-gold-50/30',
        'shadow-[0_4px_20px_rgba(0,0,0,0.04),0_0_32px_rgba(var(--color-gold-rgb),0.08)]',
        'border border-primary-100/50',
        'text-center',
        className
      )}
    >
      {/* 标题 */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <RiTimeFill className="h-5 w-5 text-primary-500" />
        <h3 className="text-sm font-medium text-neutral-600">
          {t('label.next_income_countdown')}
        </h3>
      </div>

      {/* 倒计时 - 大字体 */}
      {/* 依据：03.8.2-持仓详情页.md - text-5xl 大字体，font-mono 等宽 */}
      <div className="mb-4">
        <CountdownTimer
          targetTime={nextIncomeTime}
          onComplete={onComplete}
          variant="minimal"
          size="lg"
          animated
          className="!text-5xl !font-bold !text-primary-500 !font-mono !tracking-wider"
        />
      </div>

      {/* 发放时间说明 */}
      <div className="pt-4 border-t border-neutral-100 space-y-2">
        <p className="text-sm text-neutral-500">
          {t('label.settle_time')}: {displaySettleTime}
        </p>
        <p className="text-sm text-neutral-600">
          {t('label.expected_income')}:
          <span className="ml-2 font-mono text-success font-semibold">
            +{displayDailyIncome}
          </span>
        </p>
      </div>
    </m.div>
  );
}

/**
 * CountdownCardSkeleton 倒计时卡片骨架屏
 */
export function CountdownCardSkeleton() {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-soft animate-pulse">
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="h-5 w-5 bg-neutral-100 rounded" />
        <div className="h-4 w-24 bg-neutral-100 rounded" />
      </div>
      <div className="h-12 w-48 bg-neutral-100 rounded mx-auto mb-4" />
      <div className="pt-4 border-t border-neutral-100 space-y-2">
        <div className="h-4 w-40 bg-neutral-100 rounded mx-auto" />
        <div className="h-4 w-32 bg-neutral-100 rounded mx-auto" />
      </div>
    </div>
  );
}

export default CountdownCard;
