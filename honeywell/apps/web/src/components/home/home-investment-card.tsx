/**
 * @file 首页投资组合面板
 * @description 深色仪表板风格，天际线迷你图，金色收益数字
 * 数据来源：GET /api/positions → summary
 */

'use client';

import { m } from 'motion/react';
import Link from 'next/link';
import {
  RiArrowRightSLine,
  RiLineChartLine,
} from '@remixicon/react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Skeleton } from '@/components/ui/skeleton';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useText } from '@/hooks/use-text';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface PositionSummary {
  activeCount: number;
  completedCount: number;
  totalPurchaseAmount: string;
  totalEarned: string;
  todayIncome: string;
}

export interface HomeInvestmentCardProps {
  summary?: PositionSummary | null;
  isLoading?: boolean;
  className?: string;
}

/** 天际线迷你图：不等宽柱子模拟城市轮廓 */
function SkylineChart() {
  const bars = [
    { h: 30, w: 6 }, { h: 55, w: 8 }, { h: 35, w: 5 },
    { h: 70, w: 10 }, { h: 45, w: 7 }, { h: 85, w: 12 }, { h: 60, w: 8 },
  ];
  return (
    <div className="flex items-end gap-[2px] h-14 w-20">
      {bars.map((bar, i) => (
        <m.div
          key={i}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.3 + i * 0.06, duration: 0.4, ease: 'easeOut' }}
          className={cn(
            'rounded-t-sm origin-bottom',
            i === bars.length - 2 ? 'bg-primary-400' : 'bg-white/15',
          )}
          style={{ height: `${bar.h}%`, width: bar.w }}
        />
      ))}
    </div>
  );
}

export function HomeInvestmentCard({
  summary,
  isLoading = false,
  className,
}: HomeInvestmentCardProps) {
  const { config: globalConfig } = useGlobalConfig();
  const t = useText();

  if (isLoading) {
    return (
      <div className={cn(
        'rounded-[20px] bg-[var(--color-dark-950)] p-5',
        'border border-[rgba(var(--color-gold-rgb),0.08)]',
        'shadow-architectural-dark',
        className,
      )}>
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-8 h-8 rounded-xl !bg-white/10" />
          <Skeleton width={120} height={18} className="!bg-white/10" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="w-20 h-14 rounded-lg !bg-white/10" />
          <div className="flex-1 space-y-3">
            <Skeleton width={100} height={28} className="!bg-white/10" />
            <div className="flex gap-6">
              <Skeleton width={80} height={16} className="!bg-white/10" />
              <Skeleton width={80} height={16} className="!bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeCount = summary?.activeCount ?? 0;
  const todayIncome = parseFloat(summary?.todayIncome || '0');
  const totalEarned = parseFloat(summary?.totalEarned || '0');
  const totalInvested = parseFloat(summary?.totalPurchaseAmount || '0');
  const hasPositions = activeCount > 0 || (summary?.completedCount ?? 0) > 0;

  if (!hasPositions) {
    return (
      <Link href="/products" className="block">
        <m.div
          whileTap={{ scale: 0.98 }}
          className={cn(
            'relative rounded-[20px] overflow-hidden',
            'bg-ivory-50',
            'border border-gold-100',
            'p-6 cursor-pointer transition-all duration-300',
            'shadow-architectural',
            'hover:shadow-architectural-hover',
            className,
          )}
        >
          <p className="font-heading text-[22px] text-neutral-800 leading-snug mb-1">
            {t('home.discoverNext')}
          </p>
          <p className="font-heading text-[22px] text-neutral-800 leading-snug mb-5">
            {t('home.realEstateInvestment')}
          </p>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-500">
            {t('home.exploreProducts')}
            <RiArrowRightSLine className="w-4 h-4" />
          </span>
        </m.div>
      </Link>
    );
  }

  return (
    <Link href="/positions" className="block">
      <m.div
        whileTap={{ scale: 0.98 }}
        className={cn(
          'relative rounded-[20px] overflow-hidden noise-texture',
          'bg-[var(--color-dark-950)]',
          'border border-[rgba(var(--color-gold-rgb),0.08)]',
          'p-5 cursor-pointer transition-all duration-300',
          'shadow-architectural-dark',
          'group/invest',
          className,
        )}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 80% 20%, rgba(var(--color-primary-rgb), 0.08) 0%, transparent 60%)',
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center">
                <RiLineChartLine className="w-4.5 h-4.5 text-primary-400" />
              </div>
              <span className="text-sm font-semibold text-white/70">
                {t('home.myInvestments')}
              </span>
            </div>
            <RiArrowRightSLine className="w-5 h-5 text-white/20 transition-transform duration-200 group-hover/invest:translate-x-0.5" />
          </div>

          <div className="flex gap-5 items-center">
            <SkylineChart />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 mb-1">
                <AnimatedNumber
                  value={activeCount}
                  decimals={0}
                  className="text-2xl font-heading text-white font-financial"
                />
                <span className="text-sm text-white/40">
                  {t('home.activePositions')}
                </span>
              </div>
              <div className="text-xs text-white/30 mb-3 font-financial">
                {formatCurrency(totalInvested, globalConfig)} {t('home.invested')}
              </div>
              <div className="flex gap-6">
                <div>
                  <div className="text-[10px] font-medium text-white/25 uppercase tracking-[0.15em] mb-0.5">
                    {t('home.todayLabel')}
                  </div>
                  <AnimatedNumber
                    value={todayIncome}
                    prefix={todayIncome > 0 ? '+' : ''}
                    decimals={0}
                    className={cn(
                      'text-sm font-semibold font-financial',
                      todayIncome > 0 ? 'text-gold-on-dark' : 'text-white/40',
                    )}
                  />
                </div>
                <div>
                  <div className="text-[10px] font-medium text-white/25 uppercase tracking-[0.15em] mb-0.5">
                    {t('home.totalLabel')}
                  </div>
                  <AnimatedNumber
                    value={totalEarned}
                    prefix={totalEarned > 0 ? '+' : ''}
                    decimals={0}
                    className={cn(
                      'text-sm font-semibold font-financial',
                      totalEarned > 0 ? 'text-gold-on-dark' : 'text-white/40',
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </m.div>
    </Link>
  );
}
