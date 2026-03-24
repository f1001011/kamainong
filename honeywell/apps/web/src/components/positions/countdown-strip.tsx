/**
 * @file 倒计时条组件
 * @description 紧凑的倒计时条，显示下次收益时间和预计收益
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

interface CountdownStripProps {
  nextSettleAt: string;
  dailyIncome: string;
  onComplete?: () => void;
  className?: string;
}

export function CountdownStrip({
  nextSettleAt,
  dailyIncome,
  onComplete,
  className,
}: CountdownStripProps) {
  const t = useText();
  const { config } = useGlobalConfig();

  const nextIncomeTime = useMemo(() => calculateNextIncomeTime(nextSettleAt), [nextSettleAt]);
  const displayDailyIncome = useMemo(() => formatCurrency(dailyIncome, config), [dailyIncome, config]);
  const displaySettleTime = useMemo(() =>
    formatSystemTime(nextSettleAt, config.systemTimezone || DEFAULT_SYSTEM_TIMEZONE, 'yyyy-MM-dd HH:mm'),
    [nextSettleAt, config.systemTimezone]
  );

  if (!nextIncomeTime) return null;

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ...SPRINGS.gentle }}
      className={cn(
        'mx-4 p-4 rounded-2xl',
        'bg-gradient-to-r from-primary-50/80 via-gold-50/50 to-primary-50/80',
        'border border-primary-100/30',
        className
      )}
    >
      {/* 顶部行 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <RiTimeFill className="h-4 w-4 text-primary-400" />
          <span className="text-sm text-neutral-600">{t('label.next_income_countdown')}</span>
        </div>
        <CountdownTimer
          targetTime={nextIncomeTime}
          onComplete={onComplete}
          variant="minimal"
          size="md"
          animated
          className="!font-bold !text-neutral-800"
        />
      </div>

      {/* 底部行 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400">
          {t('label.estimated')}: {displaySettleTime}
        </span>
        <span className="text-sm font-bold font-mono text-success">
          +{displayDailyIncome}
        </span>
      </div>
    </m.div>
  );
}
