/**
 * @file 连单奖励阶梯列表组件
 * @description 展示所有阶梯卡片，带交错入场动画
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.4-连单奖励活动页.md 第5.9节
 */

'use client';

import { useState, useCallback } from 'react';
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useClaimCollectionReward } from '@/hooks/use-collection-activity';
import { useCoinFly } from '@/components/effects/coin-fly';
import { useConfetti } from '@/components/effects/confetti';
import { toast } from 'sonner';
import { CollectionTierCard } from './collection-tier-card';
import { RiMedalFill } from '@remixicon/react';
import type { CollectionTier } from '@/types/activity';

/**
 * 阶梯列表组件属性
 */
interface CollectionTierListProps {
  /** 阶梯配置列表 */
  tiers: CollectionTier[];
  /** 前置条件是否满足 */
  prerequisiteMet: boolean;
}

/**
 * 连单奖励阶梯列表组件
 * @description 依据：03.11.4-连单奖励活动页.md 第5.9节 - 阶梯列表组件
 * 
 * 功能特性：
 * - 使用 AnimatedList 实现交错入场动画（stagger: 0.06s）
 * - 内部处理领取逻辑和庆祝动画
 * - 可领取阶梯优先排列
 */
export function CollectionTierList({ tiers, prerequisiteMet }: CollectionTierListProps) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();
  const { mutate: claim, isPending } = useClaimCollectionReward();
  const { triggerCoinFly, CoinFlyPortal } = useCoinFly();
  const { triggerConfetti } = useConfetti();
  
  const [claimingTier, setClaimingTier] = useState<number | null>(null);

  /**
   * 处理领取奖励
   * @description 依据：03.11.4-连单奖励活动页.md 第5节 - 领取成功触发金币飞入+撒花
   */
  const handleClaim = useCallback((tier: number, event: React.MouseEvent) => {
    setClaimingTier(tier);
    
    claim(tier, {
      onSuccess: () => {
        // 触发庆祝动画
        if (isAnimationEnabled) {
          triggerCoinFly(event.target as HTMLElement);
          triggerConfetti();
        }
        
        toast.success(t('toast.claim_success'));
        setClaimingTier(null);
      },
      onError: (error) => {
        toast.error(error.message || t('error.claim_failed'));
        setClaimingTier(null);
      },
    });
  }, [claim, isAnimationEnabled, triggerCoinFly, triggerConfetti, t]);

  return (
    <>
      {/* 阶梯区标题 - 带装饰图标 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-soft-sm">
          <RiMedalFill className="w-4.5 h-4.5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-neutral-800">
            {t('collection.tier_title')}
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {t('collection.tier_subtitle')}
          </p>
        </div>
      </div>

      {/* 阶梯卡片列表 - 使用 AnimatedList 实现交错动画 */}
      <AnimatedList stagger="fast" layout="single" gap="small" className="space-y-3">
        {tiers.map((tier) => (
          <AnimatedListItem key={tier.tier}>
            <CollectionTierCard
              tier={tier}
              prerequisiteMet={prerequisiteMet}
              onClaim={handleClaim}
              isClaiming={isPending && claimingTier === tier.tier}
            />
          </AnimatedListItem>
        ))}
      </AnimatedList>

      {/* 金币飞入动画容器 */}
      <CoinFlyPortal />
    </>
  );
}
