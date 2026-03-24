/**
 * @file SVIP 奖励历史
 * @description 可折叠的 SVIP 每日奖励发放记录
 */

'use client';

import { useState } from 'react';
import { m, AnimatePresence, LazyMotion, domAnimation } from 'motion/react';
import { RiHistoryLine, RiArrowDownSLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { formatCurrency } from '@/lib/format';
import { formatSystemTime } from '@/lib/timezone';
import { useSvipRewards } from '@/hooks/use-svip';
import { Skeleton } from '@/components/ui/skeleton';
import { SPRINGS } from '@/lib/animation';

export function SvipRewardHistory() {
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();
  const [isExpanded, setIsExpanded] = useState(false);

  const { data, isLoading } = useSvipRewards(1, 20);
  const rewards = data?.list ?? [];
  const total = data?.pagination.total ?? 0;

  if (total === 0 && !isLoading) return null;

  return (
    <LazyMotion features={domAnimation}>
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-neutral-100/80 overflow-hidden shadow-soft-sm">
        {/* 标题栏 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-neutral-50/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
              <RiHistoryLine className="w-4 h-4 text-violet-600" />
            </div>
            <span className="text-sm font-semibold text-neutral-700">
              {t('svip.reward_history', 'سجل المكافآت')}
            </span>
            {total > 0 && (
              <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                {total}
              </span>
            )}
          </div>
          <m.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={SPRINGS.snappy}
          >
            <RiArrowDownSLine className="w-5 h-5 text-neutral-400" />
          </m.div>
        </button>

        {/* 记录列表 */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <m.div
              initial={isAnimationEnabled ? { height: 0, opacity: 0 } : undefined}
              animate={isAnimationEnabled ? { height: 'auto', opacity: 1 } : undefined}
              exit={isAnimationEnabled ? { height: 0, opacity: 0 } : undefined}
              transition={SPRINGS.gentle}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 border-t border-neutral-100/80">
                {isLoading ? (
                  <div className="pt-4 space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pt-4 space-y-2.5">
                    {rewards.map((reward) => (
                      <div
                        key={reward.id}
                        className="flex items-center justify-between py-2 px-3 rounded-xl bg-neutral-50/80"
                      >
                        <div>
                          <p className="text-sm font-medium text-neutral-700">
                            SVIP{reward.svipLevel} · {reward.productCode}
                          </p>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {formatSystemTime(reward.createdAt, config.systemTimezone || 'Africa/Casablanca', 'yyyy-MM-dd')}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-violet-600 tabular-nums">
                          +{formatCurrency(parseFloat(reward.amount), config)}
                        </span>
                      </div>
                    ))}

                    {total > rewards.length && (
                      <p className="text-center text-xs text-neutral-400 pt-2">
                        {t('tip.no_more_data', 'لا مزيد من البيانات')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}
