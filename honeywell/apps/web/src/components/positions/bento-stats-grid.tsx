/**
 * @file Bento 指标网格组件
 * @description Apple 风格不等比网格，展示投资核心指标
 */

'use client';

import { useMemo } from 'react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { formatCurrency } from '@/lib/format';
import { SPRINGS, STAGGER } from '@/lib/animation/constants';

interface BentoStatsGridProps {
  purchaseAmount: string;
  dailyIncome: string;
  cycleDays: number;
  paidDays: number;
  totalIncome: string;
  isActive: boolean;
  className?: string;
}

export function BentoStatsGrid({
  purchaseAmount,
  dailyIncome,
  cycleDays,
  paidDays,
  totalIncome,
  isActive,
  className,
}: BentoStatsGridProps) {
  const t = useText();
  const { config } = useGlobalConfig();

  const displayPurchase = useMemo(() => formatCurrency(purchaseAmount, config), [purchaseAmount, config]);
  const displayDaily = useMemo(() => formatCurrency(dailyIncome, config), [dailyIncome, config]);
  const displayTotal = useMemo(() => formatCurrency(totalIncome, config), [totalIncome, config]);
  const progressPercent = cycleDays > 0 ? Math.min((paidDays / cycleDays) * 100, 100) : 0;

  const cardBase = 'bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-neutral-100/60 p-4';

  return (
    <div className={cn('px-4', className)}>
      {/* 第一行：投资额(大) + 日收益(小) */}
      <div className="grid grid-cols-5 gap-3 mb-3">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ...SPRINGS.gentle }}
          className={cn(cardBase, 'col-span-3')}
        >
          <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-2">
            {t('label.purchase_amount', 'مبلغ الاستثمار')}
          </p>
          <p className="text-xl font-bold font-mono tabular-nums text-neutral-800">{displayPurchase}</p>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ...SPRINGS.gentle }}
          className={cn(cardBase, 'col-span-2')}
        >
          <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-2">
            {t('label.daily_income', 'الدخل اليومي')}
          </p>
          <p className="text-xl font-bold font-mono tabular-nums text-success">+{displayDaily}</p>
        </m.div>
      </div>

      {/* 第二行：周期 + 已完成天数 + 总收益 */}
      <div className="grid grid-cols-3 gap-3">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ...SPRINGS.gentle }}
          className={cardBase}
        >
          <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-2">
            {t('label.cycle_days', 'المدة')}
          </p>
          <p className="text-lg font-bold text-neutral-800">
            {cycleDays} <span className="text-xs font-normal text-neutral-400">{t('label.days', 'أيام')}</span>
          </p>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ...SPRINGS.gentle }}
          className={cardBase}
        >
          <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-2">
            {t('label.completed_days', 'مكتمل')}
          </p>
          <p className="text-lg font-bold text-neutral-800 font-mono tabular-nums">
            {paidDays} <span className="text-xs font-normal text-neutral-400">/ {cycleDays}</span>
          </p>
          {/* 迷你进度条 */}
          <div className="mt-2 h-1 bg-neutral-100 rounded-full overflow-hidden">
            <m.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-500"
            />
          </div>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25, ...SPRINGS.gentle }}
          className={cardBase}
        >
          <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-2">
            {t('label.total_income', 'إجمالي الأرباح')}
          </p>
          <p className={cn(
            'text-lg font-bold font-mono tabular-nums',
            !isActive ? 'text-success' : 'text-neutral-800'
          )}>
            {displayTotal}
          </p>
        </m.div>
      </div>
    </div>
  );
}

export function BentoStatsGridSkeleton() {
  return (
    <div className="px-4 animate-pulse">
      <div className="grid grid-cols-5 gap-3 mb-3">
        <div className="col-span-3 bg-white rounded-2xl shadow-soft-sm p-4">
          <div className="h-3 w-24 bg-neutral-100 rounded mb-3" />
          <div className="h-6 w-28 bg-neutral-100 rounded" />
        </div>
        <div className="col-span-2 bg-white rounded-2xl shadow-soft-sm p-4">
          <div className="h-3 w-16 bg-neutral-100 rounded mb-3" />
          <div className="h-6 w-20 bg-neutral-100 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl shadow-soft-sm p-4">
            <div className="h-3 w-14 bg-neutral-100 rounded mb-3" />
            <div className="h-5 w-16 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
