/**
 * @file 完成庆祝组件
 * @description 持仓完成后的庆祝卡片，仅 COMPLETED 状态显示
 */

'use client';

import { useMemo } from 'react';
import { m } from 'motion/react';
import { RiTrophyFill } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { formatCurrency } from '@/lib/format';
import { SPRINGS } from '@/lib/animation/constants';

interface CompletionCelebrationProps {
  totalEarned: string;
  cycleDays: number;
  className?: string;
}

export function CompletionCelebration({
  totalEarned,
  cycleDays,
  className,
}: CompletionCelebrationProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  const displayEarned = useMemo(() => formatCurrency(totalEarned, config), [totalEarned, config]);

  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8, ...SPRINGS.gentle }}
      className={cn(
        'mx-4 mt-6 mb-8 p-6 rounded-2xl text-center',
        'bg-gradient-to-br from-success-50/50 via-white to-mint-50/30',
        'border border-success/10',
        className
      )}
    >
      <m.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 1, ...SPRINGS.bouncy }}
      >
        <RiTrophyFill className="h-10 w-10 text-gold-400 mx-auto mb-3" />
      </m.div>
      <h3 className="text-lg font-semibold text-neutral-800">
        {t('celebration.title', 'اكتمل الاستثمار')}
      </h3>
      <p className="text-sm text-neutral-500 mt-1">
        {t('celebration.subtitle', 'لقد حصلت على')} +{displayEarned} {t('celebration.in_days', 'خلال')} {cycleDays} {t('label.days', 'أيام')}
      </p>
    </m.div>
  );
}
