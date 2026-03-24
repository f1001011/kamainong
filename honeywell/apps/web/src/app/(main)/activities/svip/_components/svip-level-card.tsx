/**
 * @file SVIP 等级卡片
 * @description 单个 SVIP 等级展示卡片，三种状态：已达标/未达标/已锁定
 */

'use client';

import { m } from 'motion/react';
import { RiVipCrownFill, RiCheckboxCircleFill, RiCheckDoubleLine, RiLockLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { formatCurrency } from '@/lib/format';
import { PulseWrapper } from '@/components/effects/pulse-wrapper';
import { SPRINGS } from '@/lib/animation';
import type { SvipQualification } from '@/types';

interface SvipLevelCardProps {
  level: number;
  productCode: string;
  requiredCount: number;
  dailyReward: string;
  qualification?: SvipQualification;
  index: number;
}

type CardStatus = 'claimed' | 'qualified' | 'partial' | 'locked';

export function SvipLevelCard({
  level,
  productCode,
  requiredCount,
  dailyReward,
  qualification,
  index,
}: SvipLevelCardProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();

  const activeCount = qualification?.activeCount ?? 0;
  const isQualified = activeCount >= requiredCount;
  const hasPartial = activeCount > 0 && !isQualified;
  const claimedToday = qualification?.claimedToday ?? false;

  const status: CardStatus = isQualified
    ? (claimedToday ? 'claimed' : 'qualified')
    : hasPartial ? 'partial' : 'locked';

  const statusStyles = {
    claimed: {
      border: 'border-emerald-500/30',
      bg: 'bg-gradient-to-br from-emerald-500/5 via-violet-500/5 to-emerald-600/5',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-violet-500',
      iconText: 'text-white',
      levelText: 'text-emerald-600 font-black',
      rewardText: 'text-emerald-600 font-bold',
    },
    qualified: {
      border: 'border-violet-500/40',
      bg: 'bg-gradient-to-br from-violet-500/8 via-amber-500/5 to-violet-600/8',
      iconBg: 'bg-gradient-to-br from-violet-500 to-amber-500',
      iconText: 'text-white',
      levelText: 'text-violet-600 font-black',
      rewardText: 'text-amber-600 font-bold',
    },
    partial: {
      border: 'border-neutral-200',
      bg: 'bg-white',
      iconBg: 'bg-neutral-100',
      iconText: 'text-neutral-400',
      levelText: 'text-neutral-700 font-bold',
      rewardText: 'text-neutral-500 font-semibold',
    },
    locked: {
      border: 'border-neutral-100',
      bg: 'bg-neutral-50/50',
      iconBg: 'bg-neutral-100',
      iconText: 'text-neutral-300',
      levelText: 'text-neutral-400 font-bold',
      rewardText: 'text-neutral-400 font-semibold',
    },
  };

  const s = statusStyles[status];

  const card = (
    <m.div
      className={cn('relative rounded-2xl border p-4 overflow-hidden transition-shadow', s.border, s.bg,
        status === 'qualified' && 'shadow-[0_4px_20px_rgba(139,92,246,0.12)]'
      )}
      initial={isAnimationEnabled ? { opacity: 0, y: 15 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRINGS.gentle, delay: index * 0.04 }}
    >
      <div className="flex items-center gap-3">
        {/* 图标 */}
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', s.iconBg)}>
          {status === 'qualified' ? (
            <RiVipCrownFill className={cn('w-6 h-6', s.iconText)} />
          ) : status === 'locked' ? (
            <RiLockLine className={cn('w-5 h-5', s.iconText)} />
          ) : (
            <RiVipCrownFill className={cn('w-6 h-6', s.iconText)} />
          )}
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-base', s.levelText)}>SVIP{level}</span>
            {status === 'claimed' && (
              <RiCheckDoubleLine className="w-4 h-4 text-emerald-500" />
            )}
            {status === 'qualified' && (
              <RiCheckboxCircleFill className="w-4 h-4 text-violet-500" />
            )}
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            {productCode} × {requiredCount}
          </p>
        </div>

        {/* 右侧：奖励 + 领取状态 */}
        <div className="text-left flex-shrink-0">
          <p className={cn('text-lg tabular-nums', s.rewardText)}>
            {formatCurrency(parseFloat(dailyReward), config)}
          </p>
          <p className={cn('text-[10px]', status === 'claimed' ? 'text-emerald-500 font-medium' : 'text-neutral-400')}>
            {status === 'claimed'
              ? t('svip.claimed', 'تم المطالبة')
              : status === 'qualified'
                ? t('svip.unclaimed', 'متاح للمطالبة')
                : t('svip.per_day', '/ يومياً')
            }
          </p>
        </div>
      </div>

      {/* 进度条（仅未达标时显示） */}
      {!isQualified && (
        <div className="mt-3 pt-3 border-t border-neutral-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-neutral-400">
              {t('svip.progress', 'التقدم')}
            </span>
            <span className={cn('tabular-nums', hasPartial ? 'text-violet-500 font-medium' : 'text-neutral-400')}>
              {activeCount} / {requiredCount}
            </span>
          </div>
          <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <m.div
              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (activeCount / requiredCount) * 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.04 + 0.3 }}
            />
          </div>
        </div>
      )}
    </m.div>
  );

  if (status === 'qualified') {
    return (
      <PulseWrapper type="border" color="custom" customColor="rgba(139,92,246,0.3)" enabled>
        {card}
      </PulseWrapper>
    );
  }

  if (status === 'claimed') {
    return (
      <PulseWrapper type="border" color="custom" customColor="rgba(16,185,129,0.2)" enabled={false}>
        {card}
      </PulseWrapper>
    );
  }

  return card;
}
