/**
 * @file 里程碑进度条组件
 * @description 线性进度条 + 25%/50%/75%/100% 里程碑节点
 */

'use client';

import { useMemo } from 'react';
import { m } from 'motion/react';
import { RiCheckLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { SPRINGS } from '@/lib/animation/constants';

interface MilestoneProgressProps {
  paidDays: number;
  cycleDays: number;
  milestones: {
    quarter: boolean;
    half: boolean;
    threeQuarter: boolean;
    complete: boolean;
  };
  productSeries: string;
  className?: string;
}

const MILESTONE_POINTS = [
  { key: 'quarter' as const, percent: 25, label: '25%' },
  { key: 'half' as const, percent: 50, label: '50%' },
  { key: 'threeQuarter' as const, percent: 75, label: '75%' },
  { key: 'complete' as const, percent: 100, label: '100%' },
];

export function MilestoneProgress({
  paidDays,
  cycleDays,
  milestones,
  productSeries,
  className,
}: MilestoneProgressProps) {
  const t = useText();
  const isVIP = productSeries === 'VIP';
  const progressPercent = useMemo(() => {
    return cycleDays > 0 ? Math.min((paidDays / cycleDays) * 100, 100) : 0;
  }, [paidDays, cycleDays]);

  const gradientColors = isVIP
    ? 'from-gold-400 via-gold-500 to-gold-600'
    : 'from-primary-400 via-primary-500 to-primary-600';

  return (
    <div className={cn(
      'mx-4 px-5 py-5 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-neutral-100/60',
      className
    )}>
      <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-5">
        {t('label.progress')}
      </p>

      <div className="relative">
        {/* 里程碑节点（在轨道上方） */}
        <div className="relative flex justify-between mb-3 px-0.5">
          {MILESTONE_POINTS.map((milestone, i) => {
            const reached = milestones[milestone.key];
            return (
              <div key={milestone.key} className="flex flex-col items-center" style={{ width: '24px' }}>
                <m.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.6 + i * 0.1, ...SPRINGS.bouncy }}
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center transition-colors',
                    reached
                      ? isVIP
                        ? 'bg-gold-500 shadow-[0_2px_8px_rgba(var(--color-gold-rgb),0.3)]'
                        : 'bg-primary-500 shadow-[0_2px_8px_rgba(var(--color-primary-rgb),0.3)]'
                      : 'bg-white border-2 border-neutral-200'
                  )}
                >
                  {reached && <RiCheckLine className="h-3 w-3 text-white" />}
                </m.div>
                <span className={cn(
                  'text-[10px] font-mono mt-1.5',
                  reached
                    ? isVIP ? 'text-gold-600 font-semibold' : 'text-primary-600 font-semibold'
                    : 'text-neutral-300'
                )}>
                  {milestone.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* 进度轨道 */}
        <div className="relative h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <m.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
            className={cn('h-full rounded-full bg-gradient-to-r', gradientColors)}
          />
        </div>

        {/* 当前位置指示 */}
        {progressPercent > 0 && progressPercent < 100 && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="mt-2"
            style={{ paddingLeft: `calc(${Math.min(progressPercent, 95)}% - 16px)` }}
          >
            <span className="text-[10px] text-neutral-500">
              ▲ {t('label.day_abbr')} {paidDays}
            </span>
          </m.div>
        )}
      </div>
    </div>
  );
}

export function MilestoneProgressSkeleton() {
  return (
    <div className="mx-4 px-5 py-5 bg-white rounded-2xl shadow-soft-sm animate-pulse">
      <div className="h-3 w-16 bg-neutral-100 rounded mb-5" />
      <div className="flex justify-between mb-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-5 h-5 rounded-full bg-neutral-100" />
            <div className="h-2 w-6 bg-neutral-100 rounded mt-1.5" />
          </div>
        ))}
      </div>
      <div className="h-1.5 bg-neutral-100 rounded-full" />
    </div>
  );
}
