/**
 * @file 阶梯列表组件 - 2026高端美学升级版
 * @description 展示所有奖励阶梯的列表，带交错入场动画
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.3-拉新裂变活动页.md 第5.6节
 */

'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, m, LazyMotion, domAnimation } from 'motion/react';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useClaimInviteReward } from '@/hooks/use-invite-activity';
import { useCoinFly } from '@/components/effects/coin-fly';
import { useConfetti } from '@/components/effects/confetti';
import { SPRINGS, STAGGER } from '@/lib/animation/constants';
import { TierCard } from './tier-card';
import { RiTrophyFill } from '@remixicon/react';
import type { InviteTier } from '@/types/activity';

/**
 * 阶梯列表组件属性
 */
interface TierListProps {
  /** 阶梯列表 */
  tiers: InviteTier[];
  /** 当前有效邀请数 */
  currentCount: number;
}

/**
 * TierList 阶梯列表组件 - 2026高端美学版
 * @description 展示奖励阶梯列表，处理领取逻辑和动画
 * 依据：03.11.3-拉新裂变活动页.md 第5.6节
 */
export function TierList({ tiers, currentCount }: TierListProps) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();
  const { mutate: claim, isPending } = useClaimInviteReward();
  const { triggerCoinFly, CoinFlyPortal } = useCoinFly({
    count: 6,
    targetSelector: '.balance-display',
  });
  const { triggerBurst: triggerConfetti } = useConfetti();
  
  const [claimingTier, setClaimingTier] = useState<number | null>(null);

  /**
   * 处理领取奖励
   * 依据：5.6节 - 领取成功触发金币飞入+撒花
   */
  const handleClaim = useCallback((tier: number, event: React.MouseEvent) => {
    setClaimingTier(tier);
    
    claim(
      { tier },
      {
        onSuccess: () => {
          // 触发庆祝动画
          if (isAnimationEnabled) {
            triggerCoinFly(event.currentTarget as HTMLElement);
            triggerConfetti();
          }
          setClaimingTier(null);
        },
        onError: () => {
          setClaimingTier(null);
        },
      }
    );
  }, [claim, isAnimationEnabled, triggerCoinFly, triggerConfetti]);

  return (
    <LazyMotion features={domAnimation}>
      {/* 区块标题 - 带装饰线 */}
      <m.div
        initial={isAnimationEnabled ? { opacity: 0, x: -10 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={SPRINGS.gentle}
        className="flex items-center gap-3 mb-4"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-soft-sm">
          <RiTrophyFill className="w-4.5 h-4.5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-neutral-800">
            {t('invite.tier_title')}
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {t('invite.tier_subtitle')}
          </p>
        </div>
      </m.div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {tiers.map((tier, index) => (
            <m.div
              key={tier.tier}
              initial={isAnimationEnabled ? { opacity: 0, y: 20, scale: 0.97 } : false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                ...SPRINGS.gentle,
                delay: index * STAGGER.fast,
              }}
            >
              <TierCard
                tier={tier}
                currentCount={currentCount}
                onClaim={handleClaim}
                isClaiming={isPending && claimingTier === tier.tier}
              />
            </m.div>
          ))}
        </AnimatePresence>
      </div>

      <CoinFlyPortal />
    </LazyMotion>
  );
}
