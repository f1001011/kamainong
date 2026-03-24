/**
 * @file 奖池阶梯卡片组件
 * @description 可复用的奖池阶梯卡片，展示所需邀请数、奖励金额、领取状态
 */

'use client';

import { m } from 'motion/react';
import {
  RiGroupFill,
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
export type PoolTierStatus = 'LOCKED' | 'UNLOCKED' | 'CLAIMED';

/** 奖池阶梯数据 */
export interface PoolTierData {
  id: number;
  requiredInvites: number;
  reward: number;
  status: PoolTierStatus;
}

export interface PrizePoolCardProps {
  /** 阶梯数据 */
  tier: PoolTierData;
  /** 用户当前有效邀请数 */
  userInvites: number;
  /** 列表索引 */
  index?: number;
  /** 自定义样式 */
  className?: string;
}

/**
 * 奖池阶梯卡片
 */
export function PrizePoolCard({
  tier,
  userInvites,
  index = 0,
  className,
}: PrizePoolCardProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();

  const isLocked = tier.status === 'LOCKED';
  const isClaimed = tier.status === 'CLAIMED';
  const isClaimable = tier.status === 'UNLOCKED';

  return (
    <m.div
      initial={isAnimationEnabled ? { opacity: 0, x: -16 } : undefined}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...SPRINGS.gentle, delay: index * STAGGER.normal }}
      className={cn(
        'relative rounded-2xl overflow-hidden border transition-all',
        isClaimable
          ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-300/60 shadow-[0_4px_20px_rgba(168,85,247,0.15)]'
          : isClaimed
            ? 'bg-primary-50/30 border-primary-200/40'
            : 'bg-neutral-50/50 border-neutral-200/40 opacity-60',
        className,
      )}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* 左侧：邀请要求 */}
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              isClaimable
                ? 'bg-gradient-to-br from-purple-500 to-indigo-500 shadow-[0_4px_12px_rgba(168,85,247,0.3)]'
                : isClaimed
                  ? 'bg-primary-100'
                  : 'bg-neutral-100',
            )}>
              {isClaimed ? (
                <RiCheckboxCircleFill className="size-6 text-primary-500" />
              ) : isLocked ? (
                <RiLockFill className="size-6 text-neutral-300" />
              ) : (
                <RiGroupFill className={cn('size-6', isClaimable ? 'text-white' : 'text-purple-500')} />
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  'text-sm font-semibold',
                  isLocked ? 'text-neutral-400' : 'text-neutral-700',
                )}>
                  {tier.requiredInvites} {t('pool.invites')}
                </span>
                {!isLocked && !isClaimed && (
                  <span className="text-xs text-neutral-400 tabular-nums">
                    ({userInvites}/{tier.requiredInvites})
                  </span>
                )}
              </div>
              {isClaimed && (
                <span className="text-xs text-primary-600 font-medium">
                  {t('pool.claimed')}
                </span>
              )}
            </div>
          </div>

          {/* 右侧：奖励金额 */}
          <div className="text-right">
            <p className={cn(
              'text-xl font-black tabular-nums',
              isClaimable ? 'text-purple-600'
                : isClaimed ? 'text-primary-600'
                  : isLocked ? 'text-neutral-400'
                    : 'text-neutral-700',
            )}>
              {formatCurrency(tier.reward, config)}
            </p>
          </div>
        </div>

        {/* 进度条（仅锁定状态显示） */}
        {isLocked && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-300 to-purple-400 rounded-full transition-all"
                style={{ width: `${Math.min((userInvites / tier.requiredInvites) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs text-neutral-400 tabular-nums">
              {Math.round(Math.min((userInvites / tier.requiredInvites) * 100, 100))}%
            </span>
          </div>
        )}
      </div>
    </m.div>
  );
}
