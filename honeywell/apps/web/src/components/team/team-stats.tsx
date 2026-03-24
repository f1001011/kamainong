/**
 * @file 团队英雄收益卡
 * @description 品牌渐变背景 + 大号累计返佣 + 内嵌三栏指标（今日/本月/累计）
 * 数据来源：GET /team/stats
 */

'use client';

import { m } from 'motion/react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Skeleton } from '@/components/ui/skeleton';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useText } from '@/hooks/use-text';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface TeamStats {
  todayCommission: string;
  totalCommission: string;
  thisMonthCommission?: string;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  totalMembers?: number;
  validInviteCount?: number;
  totalCount?: number;
}

interface TeamStatsCardProps {
  stats: TeamStats;
  isLoading?: boolean;
  className?: string;
}

export function TeamStatsCard({ stats, isLoading, className }: TeamStatsCardProps) {
  const { config } = useGlobalConfig();
  const t = useText();

  const totalCommission = parseFloat(stats?.totalCommission || '0');
  const todayCommission = parseFloat(stats?.todayCommission || '0');
  const monthCommission = parseFloat(stats?.thisMonthCommission || '0');

  if (isLoading) {
    return (
      <div className={cn('rounded-2xl bg-primary-500 p-5', className)}>
        <Skeleton className="h-4 w-32 !bg-white/20 mb-2" />
        <Skeleton className="h-9 w-40 !bg-white/20 mb-1" />
        <Skeleton className="h-3 w-20 !bg-white/20 mb-4" />
        <div className="grid grid-cols-3 gap-0 rounded-xl overflow-hidden bg-white/10">
          {[1, 2, 3].map(i => (
            <div key={i} className="py-3 px-2 text-center">
              <Skeleton className="h-3 w-10 mx-auto !bg-white/15 mb-1.5" />
              <Skeleton className="h-5 w-14 mx-auto !bg-white/15" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative rounded-2xl overflow-hidden p-5',
        'bg-gradient-to-br from-primary-500 to-primary-600',
        'shadow-[0_4px_20px_rgba(var(--color-primary-rgb),0.2)]',
        className,
      )}
    >
      {/* 右上角光晕装饰 */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }}
      />

      {/* 主内容 */}
      <p className="text-sm text-white/70 font-medium">
        {t('team.network_generated')}
      </p>
      <div className="mt-1 mb-1">
        <AnimatedNumber
          value={totalCommission}
          prefix={`${config.currencySymbol} `}
          decimals={config?.currencyDecimals ?? 0}
          className="text-3xl font-bold font-mono text-white"
        />
      </div>
      <p className="text-xs text-white/50">
        {t('team.in_commissions')}
      </p>

      {/* 内嵌三栏：今日 / 本月 / 累计 */}
      <div className="mt-4 grid grid-cols-3 divide-x divide-white/10 rounded-xl bg-white/10 overflow-hidden">
        <div className="py-3 px-2 text-center">
          <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold mb-1">
            {t('team.today')}
          </p>
          <p className="text-sm font-bold font-mono text-white">
            {formatCurrency(todayCommission, config)}
          </p>
        </div>
        <div className="py-3 px-2 text-center">
          <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold mb-1">
            {t('team.this_month')}
          </p>
          <p className="text-sm font-bold font-mono text-white">
            {formatCurrency(monthCommission, config)}
          </p>
        </div>
        <div className="py-3 px-2 text-center">
          <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold mb-1">
            {t('team.total')}
          </p>
          <p className="text-sm font-bold font-mono text-white">
            {formatCurrency(totalCommission, config)}
          </p>
        </div>
      </div>
    </m.div>
  );
}
