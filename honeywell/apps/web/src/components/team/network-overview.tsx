/**
 * @file 网络概览卡
 * @description 总人数 + L1/L2/L3 各级水平贡献条（人数+占比+金额三维度）
 * 数据来源：stats.levelXCount + commissions.summary.levelXTotal
 */

'use client';

import { m } from 'motion/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useText } from '@/hooks/use-text';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface CommissionSummary {
  totalCommission: string;
  level1Total: string;
  level2Total: string;
  level3Total: string;
}

interface NetworkOverviewProps {
  totalMembers: number;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  commissionSummary?: CommissionSummary | null;
  isLoading?: boolean;
  className?: string;
}

const LEVELS = [
  { key: 'L1', field: 'level1Total' as const, countField: 'level1Count' as const, color: 'bg-primary-400' },
  { key: 'L2', field: 'level2Total' as const, countField: 'level2Count' as const, color: 'bg-gold-400' },
  { key: 'L3', field: 'level3Total' as const, countField: 'level3Count' as const, color: 'bg-primary-400' },
] as const;

const LABEL_COLORS: Record<string, string> = {
  L1: 'text-primary-500',
  L2: 'text-gold-500',
  L3: 'text-primary-500',
};

export function NetworkOverview({
  totalMembers,
  level1Count,
  level2Count,
  level3Count,
  commissionSummary,
  isLoading,
  className,
}: NetworkOverviewProps) {
  const { config } = useGlobalConfig();
  const t = useText();

  if (isLoading) {
    return (
      <div className={cn('rounded-2xl bg-white border border-neutral-100/80 p-5', className)}>
        <Skeleton className="h-7 w-32 mb-4" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <Skeleton className="w-6 h-4" />
            <Skeleton className="w-6 h-4" />
            <Skeleton className="flex-1 h-2.5 rounded-full" />
            <Skeleton className="w-16 h-4" />
          </div>
        ))}
      </div>
    );
  }

  const counts = { level1Count, level2Count, level3Count };
  const totalComm = parseFloat(commissionSummary?.totalCommission || '0');

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cn(
        'rounded-2xl bg-white border border-neutral-100/80',
        'shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5',
        className,
      )}
    >
      {/* 总人数 */}
      <div className="flex items-baseline gap-1.5 mb-4">
        <span className="text-2xl font-bold text-neutral-800">{totalMembers}</span>
        <span className="text-sm text-neutral-400">{t('team.members')}</span>
      </div>

      {/* L1/L2/L3 贡献条 */}
      <div className="space-y-3">
        {LEVELS.map((level) => {
          const count = counts[level.countField];
          const amount = parseFloat(commissionSummary?.[level.field] || '0');
          const percentage = totalComm > 0 ? (amount / totalComm) * 100 : 0;

          return (
            <div key={level.key} className="flex items-center gap-3">
              <span className={cn('w-6 text-[10px] font-bold', LABEL_COLORS[level.key])}>
                {level.key}
              </span>
              <span className="w-5 text-sm font-bold text-neutral-800 text-center">
                {count}
              </span>
              <div className="flex-1 h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                <m.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(percentage, count > 0 ? 5 : 0)}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
                  className={cn('h-full rounded-full', level.color)}
                />
              </div>
              <span className="w-20 text-xs font-semibold text-neutral-500 font-mono text-right">
                {formatCurrency(amount, config)}
              </span>
            </div>
          );
        })}
      </div>
    </m.div>
  );
}
