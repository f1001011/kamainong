/**
 * @file 周薪阶梯卡片组件
 * @description 可复用的周薪奖励阶梯卡片，展示阈值、奖励、状态（锁定/可领/已领）
 */

'use client';

import { m } from 'motion/react';
import {
  RiMedalFill,
  RiCheckboxCircleFill,
  RiLockFill,
} from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { formatCurrency } from '@/lib/format';
import { SPRINGS, STAGGER } from '@/lib/animation';

/** 阶梯状态 */
export type TierStatus = 'LOCKED' | 'UNLOCKED' | 'CLAIMED';

/** 阶梯数据 */
export interface SalaryTierData {
  id: number;
  threshold: number;
  reward: number;
  status: TierStatus;
}

export interface WeeklySalaryCardProps {
  /** 阶梯数据 */
  tier: SalaryTierData;
  /** 当前进度值（用于进度条） */
  currentProgress?: number;
  /** 列表索引 */
  index?: number;
  /** 自定义样式 */
  className?: string;
}

/**
 * 周薪阶梯卡片
 */
export function WeeklySalaryCard({
  tier,
  currentProgress = 0,
  index = 0,
  className,
}: WeeklySalaryCardProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();

  const isLocked = tier.status === 'LOCKED';
  const isClaimed = tier.status === 'CLAIMED';
  const isClaimable = tier.status === 'UNLOCKED';
  const progressPercent = Math.min((currentProgress / tier.threshold) * 100, 100);

  return (
    <m.div
      initial={isAnimationEnabled ? { opacity: 0, y: 12 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRINGS.gentle, delay: index * STAGGER.fast }}
      className={cn(
        'relative rounded-2xl overflow-hidden border transition-all',
        isClaimable
          ? 'bg-gradient-to-r from-gold-50 to-gold-100 border-gold-300/60 shadow-[0_4px_20px_rgba(var(--color-gold-rgb),0.15)]'
          : isClaimed
            ? 'bg-primary-50/30 border-primary-200/40'
            : 'bg-white border-neutral-200/60 opacity-60',
        className,
      )}
    >
      <div className="p-4">
        {/* 标题行 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isClaimed ? (
              <RiCheckboxCircleFill className="size-5 text-primary-500" />
            ) : isLocked ? (
              <RiLockFill className="size-5 text-neutral-300" />
            ) : (
              <RiMedalFill className="size-5 text-gold-500" />
            )}
            <span className={cn(
              'text-sm font-semibold',
              isLocked ? 'text-neutral-400' : 'text-neutral-700',
            )}>
              {t('weekly.tier_level')} {index + 1}
            </span>
          </div>

          {isClaimed && (
            <span className="text-xs font-semibold text-primary-600 px-2.5 py-1 rounded-full bg-primary-100/60">
              {t('weekly.claimed')}
            </span>
          )}
        </div>

        {/* 阈值 + 奖励 */}
        <div className="flex items-end justify-between">
          <div>
            <p className={cn('text-xs', isLocked ? 'text-neutral-400' : 'text-neutral-500')}>
              {t('weekly.threshold')}
            </p>
            <p className={cn(
              'text-base font-bold tabular-nums',
              isLocked ? 'text-neutral-400' : 'text-neutral-700',
            )}>
              {formatCurrency(tier.threshold, config)}
            </p>
          </div>
          <div className="text-right">
            <p className={cn('text-xs', isLocked ? 'text-neutral-400' : 'text-neutral-500')}>
              {t('weekly.reward')}
            </p>
            <p className={cn(
              'text-lg font-black tabular-nums',
              isClaimable ? 'text-gold-600'
                : isClaimed ? 'text-primary-600'
                  : isLocked ? 'text-neutral-400'
                    : 'text-primary-600',
            )}>
              {formatCurrency(tier.reward, config)}
            </p>
          </div>
        </div>

        {/* 进度条（未领取时显示） */}
        {!isClaimed && (
          <div className="mt-3">
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  isClaimable
                    ? 'bg-gradient-to-r from-gold-400 to-gold-500'
                    : 'bg-neutral-200',
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </m.div>
  );
}
