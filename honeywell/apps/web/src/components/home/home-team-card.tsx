/**
 * @file 首页团队卡片 — Bento 网格右侧（38%宽）
 * @description 深色背景 + 金色返佣数字，与签到卡形成明暗对比
 * 数据来源：GET /api/team/stats + /api/user/profile → teamCount
 */

'use client';

import { m } from 'motion/react';
import Link from 'next/link';
import {
  RiTeamFill,
  RiArrowRightSLine,
} from '@remixicon/react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Skeleton } from '@/components/ui/skeleton';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useText } from '@/hooks/use-text';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface TeamStats {
  totalMembers: number;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  totalCommission: string;
  todayCommission: string;
  thisMonthCommission: string;
}

export interface HomeTeamCardProps {
  stats?: TeamStats | null;
  teamCount?: number;
  isLoading?: boolean;
  className?: string;
}

export function HomeTeamCard({
  stats,
  teamCount,
  isLoading = false,
  className,
}: HomeTeamCardProps) {
  const { config: globalConfig } = useGlobalConfig();
  const t = useText();

  if (isLoading) {
    return (
      <div className={cn(
        'rounded-[20px] bg-[var(--color-dark-950)] p-4',
        'border border-[rgba(var(--color-gold-rgb),0.08)]',
        'shadow-architectural-dark',
        'h-full',
        className,
      )}>
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="w-7 h-7 rounded-lg !bg-white/10" />
          <Skeleton width={70} height={16} className="!bg-white/10" />
        </div>
        <Skeleton width={50} height={32} className="mb-1 !bg-white/10" />
        <Skeleton width={70} height={14} className="mb-3 !bg-white/10" />
        <Skeleton width={90} height={12} className="mb-1 !bg-white/10" />
        <Skeleton width={70} height={16} className="!bg-white/10" />
      </div>
    );
  }

  const members = stats?.totalMembers ?? teamCount ?? 0;
  const totalCommission = parseFloat(stats?.totalCommission || '0');
  const hasTeam = members > 0;

  if (!hasTeam) {
    return (
      <Link href="/team?tab=invite" className="block h-full">
        <m.div
          whileTap={{ scale: 0.98 }}
          className={cn(
            'rounded-[20px] overflow-hidden noise-texture',
            'bg-[var(--color-dark-950)]',
            'border border-[rgba(var(--color-gold-rgb),0.08)]',
            'shadow-architectural-dark',
            'p-4 cursor-pointer transition-all duration-300',
            'h-full',
            className,
          )}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center">
                <RiTeamFill className="w-4 h-4 text-gold-on-dark" />
              </div>
              <span className="text-sm font-semibold text-white/60">
                {t('home.myTeam', 'فريقي')}
              </span>
            </div>
            <p className="text-sm font-semibold text-white/70 mb-1">
              {t('home.inviteAndEarn', 'ادعُ واربح')}
            </p>
            <p className="text-sm font-semibold text-white/70 mb-3">
              {t('home.commission', 'عمولة')}
            </p>
            <span className="text-xs text-gold-on-dark font-semibold">
              {t('home.inviteNow', 'ادعُ الآن')} →
            </span>
          </div>
        </m.div>
      </Link>
    );
  }

  return (
    <Link href="/team" className="block h-full">
      <m.div
        whileTap={{ scale: 0.98 }}
        className={cn(
          'rounded-[20px] overflow-hidden noise-texture',
          'bg-[var(--color-dark-950)]',
          'border border-[rgba(var(--color-gold-rgb),0.08)]',
          'shadow-architectural-dark',
          'p-4 cursor-pointer transition-all duration-300',
          'group/team',
          'h-full',
          className,
        )}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 80% 80%, rgba(var(--color-gold-rgb), 0.05) 0%, transparent 60%)',
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center">
                <RiTeamFill className="w-4 h-4 text-gold-on-dark" />
              </div>
              <span className="text-sm font-semibold text-white/60">
                {t('home.myTeam', 'فريقي')}
              </span>
            </div>
            <RiArrowRightSLine className="w-4 h-4 text-white/20 transition-transform duration-200 group-hover/team:translate-x-0.5" />
          </div>
          <div className="flex items-baseline gap-1 mb-0.5">
            <AnimatedNumber value={members} decimals={0} className="text-[28px] font-heading text-white font-financial" />
          </div>
          <div className="text-xs text-white/35 mb-3">
            {t('home.members', 'أعضاء')}
          </div>
          <div className="text-[10px] font-medium text-white/25 uppercase tracking-[0.15em] mb-0.5">
            {t('home.totalCommission', 'إجمالي العمولة')}
          </div>
          <div className={cn(
            'text-base font-semibold font-financial',
            totalCommission > 0 ? 'text-gold-on-dark' : 'text-white/40',
          )}>
            {formatCurrency(totalCommission, globalConfig, { showSign: totalCommission > 0 })}
          </div>
        </div>
      </m.div>
    </Link>
  );
}
