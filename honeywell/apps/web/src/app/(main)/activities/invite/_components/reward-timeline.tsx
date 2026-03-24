/**
 * @file 奖励时间轴组件
 * @description 垂直时间轴：flex 行布局（节点 + 内容），金色连接线，CoinFly + Confetti
 */

'use client';

import { useState, useCallback } from 'react';
import { m, LazyMotion, domAnimation } from 'motion/react';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useClaimInviteReward } from '@/hooks/use-invite-activity';
import { useCoinFly } from '@/components/effects/coin-fly';
import { useConfetti } from '@/components/effects/confetti';
import { RiCheckboxCircleFill } from '@remixicon/react';
import { TimelineNode } from './timeline-node';
import { TimelineTierContent } from './timeline-tier-content';
import type { InviteTier } from '@/types/activity';

interface RewardTimelineProps {
  tiers: InviteTier[];
  currentCount: number;
}

export function RewardTimeline({ tiers, currentCount }: RewardTimelineProps) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();
  const { mutate: claim, isPending } = useClaimInviteReward();
  const { triggerCoinFly, CoinFlyPortal } = useCoinFly({
    count: 6,
    targetSelector: '.balance-display',
  });
  const { triggerBurst: triggerConfetti } = useConfetti();
  const [claimingTier, setClaimingTier] = useState<number | null>(null);

  const completedCount = tiers.filter((t) => t.status === 'CLAIMED').length;
  const completedPercent = tiers.length > 0 ? (completedCount / tiers.length) * 100 : 0;

  const lockedTiers = tiers.filter((t) => t.status === 'LOCKED');
  const nextLockedTierId = lockedTiers[0]?.tier;

  const handleClaim = useCallback(
    (tier: number, event: React.MouseEvent) => {
      setClaimingTier(tier);
      claim(
        { tier },
        {
          onSuccess: () => {
            if (isAnimationEnabled) {
              triggerConfetti();
              setTimeout(() => triggerCoinFly(event.currentTarget as HTMLElement), 200);
            }
            setClaimingTier(null);
          },
          onError: () => {
            setClaimingTier(null);
          },
        },
      );
    },
    [claim, isAnimationEnabled, triggerCoinFly, triggerConfetti],
  );

  return (
    <LazyMotion features={domAnimation}>
      {/* 外层容器，相对定位用于放置垂直线 */}
      <div className="relative">
        {/* 左侧垂直连接线（对齐节点中心 = 16px） */}
        <div className="absolute left-[15px] top-4 bottom-4 w-[2px] overflow-hidden">
          <m.div
            initial={{ height: 0 }}
            whileInView={{ height: `${completedPercent}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="bg-gradient-to-b from-gold-400 to-gold-500"
            style={{ width: '100%' }}
          />
          <div
            style={{ height: `${100 - completedPercent}%` }}
            className="border-l-2 border-dashed border-neutral-200"
          />
        </div>

        {/* 阶梯行列表 */}
        <div className="space-y-5">
          {tiers.map((tier, index) => (
            <m.div
              key={tier.tier}
              initial={isAnimationEnabled ? { opacity: 0, x: 10 } : false}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="flex items-start gap-3"
            >
              {/* 节点（flex-shrink-0，宽度固定 32px，左边距0使其对齐连接线） */}
              <TimelineNode
                status={tier.status}
                isNextLocked={tier.tier === nextLockedTierId}
              />
              {/* 内容（flex-1 占满剩余宽度） */}
              <div className="flex-1 min-w-0">
                <TimelineTierContent
                  tier={tier}
                  currentCount={currentCount}
                  isNextLocked={tier.tier === nextLockedTierId}
                  onClaim={handleClaim}
                  isClaiming={isPending && claimingTier === tier.tier}
                />
              </div>
            </m.div>
          ))}
        </div>

        {/* 全部完成状态 */}
        {tiers.length > 0 && tiers.every((t) => t.status === 'CLAIMED') && (
          <div className="flex items-center gap-2 mt-5 ml-[40px] text-sm text-gold-600 font-medium">
            <RiCheckboxCircleFill className="w-5 h-5" />
            {t('invite.all_completed', 'لقد أكملت جميع المستويات!')}
          </div>
        )}
      </div>

      <CoinFlyPortal />
    </LazyMotion>
  );
}
