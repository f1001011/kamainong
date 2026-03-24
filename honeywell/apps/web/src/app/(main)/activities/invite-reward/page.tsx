/**
 * @file 拉新裂变活动页面
 * @description 邀请好友获取阶梯奖励的活动页面
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.3-拉新裂变活动页.md
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第11.2节
 * @route /activities/invite-reward
 * 
 * 核心功能：
 * 1. 展示当前有效邀请人数和进度
 * 2. 展示奖励阶梯列表（LOCKED/CLAIMABLE/CLAIMED三种状态）
 * 3. 可领取状态带脉冲动画
 * 4. 领取成功触发礼花 + 金币飞入动画
 * 5. 展示邀请记录列表
 */

'use client';

import { useCallback, useRef } from 'react';
import { m, LazyMotion, domAnimation } from 'motion/react';
import { RiTrophyFill, RiShareLine } from '@remixicon/react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useGlobalConfigStore } from '@/stores';
import { formatCurrency } from '@/lib/format';
import { SPRINGS } from '@/lib/animation/constants';

// Hooks
import { useInviteActivity, useClaimInviteReward } from '@/hooks/use-invite-activity';

// Components
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { EmptyState } from '@/components/business/empty-state';
import { RewardTiers } from '@/components/business/reward-tiers';
import { InviteList } from '@/components/activities/invite-list';
import { Button } from '@/components/ui/button';
import { TipsCard } from '@/components/ui/tips-card';

// Page Components
import { 
  InviteActivityHeader, 
  InviteProgress,
  InviteActivitySkeleton 
} from './_components';

// Effects
import { useConfetti } from '@/components/effects/confetti';
import { useCoinFly } from '@/components/effects/coin-fly';

// Types
import type { ClaimRewardResult } from '@/types/activity';

/**
 * 拉新裂变活动页面
 * @description 依据：03.11.3-拉新裂变活动页.md
 * 
 * 设计理念：让用户感受到「我再邀请X人就能领XX元」的冲动
 * - 进度清晰可见
 * - 奖励诱人醒目
 * - 领取时有庆祝感
 */
export default function InviteRewardPage() {
  const t = useText();
  const router = useRouter();
  const { config } = useGlobalConfigStore();
  const currencySymbol = config?.currencySymbol || 'د.م.';
  const { isAnimationEnabled } = useAnimationConfig();
  
  // 记录领取按钮位置，用于金币飞入动画
  const claimButtonRef = useRef<HTMLButtonElement | null>(null);

  // 获取活动数据
  const { 
    data: activityData, 
    isLoading, 
    error,
    refetch,
    isFetching 
  } = useInviteActivity();

  // 领取奖励 mutation
  const { 
    mutate: claimReward, 
    isPending: isClaiming,
    variables: claimingVariables 
  } = useClaimInviteReward();

  // 礼花特效
  const { triggerBurst: triggerConfetti } = useConfetti();
  
  // 金币飞入特效
  const { triggerCoinFly, CoinFlyPortal } = useCoinFly({
    count: 6,
    targetSelector: '.balance-display',
  });

  /**
   * 处理领取奖励
   * @description 依据：03.11.3-拉新裂变活动页.md 第4节 - 领取交互
   */
  const handleClaim = useCallback((tier: number, event: React.MouseEvent) => {
    // 保存按钮元素引用
    claimButtonRef.current = event.currentTarget as HTMLButtonElement;
    
    claimReward(
      { tier },
      {
        onSuccess: (result: ClaimRewardResult) => {
          // 触发庆祝动画
          if (isAnimationEnabled) {
            // 礼花效果
            triggerConfetti();
            
            // 金币飞入效果（从按钮位置开始）
            setTimeout(() => {
              if (claimButtonRef.current) {
                triggerCoinFly(claimButtonRef.current);
              }
            }, 200);
          }
        },
      }
    );
  }, [claimReward, triggerConfetti, triggerCoinFly, isAnimationEnabled]);

  /**
   * 下拉刷新
   */
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  /**
   * 跳转到分享页面
   */
  const handleShare = useCallback(() => {
    router.push('/team');
  }, [router]);

  // 加载状态
  if (isLoading) {
    return <InviteActivitySkeleton />;
  }

  // 错误状态
  if (error || !activityData) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <EmptyState
          icon={<RiTrophyFill className="size-12 text-neutral-400" />}
          title={t('activity.invite.errorTitle')}
          description={t('activity.invite.errorDesc')}
          actionText={t('common.retry')}
          onAction={() => refetch()}
        />
      </div>
    );
  }

  const { activityName, activityDesc, validInviteCount, tiers, inviteList } = activityData;
  
  // 当前正在领取的阶梯
  const claimingTier = isClaiming ? claimingVariables?.tier : null;

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-neutral-50">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="px-4 py-6 space-y-4">
            {/* 活动头部 */}
            <InviteActivityHeader
              activityName={activityName}
              activityDesc={activityDesc}
              validInviteCount={validInviteCount}
            />

            {/* 下一个目标进度 */}
            <InviteProgress
              validInviteCount={validInviteCount}
              tiers={tiers}
            />

            {/* 奖励阶梯区域 */}
            <section>
              <m.h2
                initial={isAnimationEnabled ? { opacity: 0, x: -10 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...SPRINGS.gentle, delay: 0.2 }}
                className="text-base font-semibold text-neutral-800 mb-3"
              >
                {t('activity.invite.tiersTitle')}
              </m.h2>
              
              <RewardTiers
                tiers={tiers}
                currentProgress={validInviteCount}
                onClaim={handleClaim}
                claimingTier={claimingTier}
                progressUnit={t('activity.invite.unit')}
                tierTitleTemplate={t('activity.invite.tierTitle')}
                requirementTemplate={t('activity.invite.requirement')}
              />
            </section>

            {/* 规则说明 */}
            <TipsCard
              title={t('activity.invite.rulesTitle')}
              content={`• ${t('activity.invite.rule1')}\n• ${t('activity.invite.rule2')}\n• ${t('activity.invite.rule3')}`}
            />

            {/* 邀请记录 */}
            {inviteList && inviteList.length > 0 && (
              <section>
                <InviteList
                  records={inviteList}
                  showGroupTitle
                  maxShow={10}
                />
              </section>
            )}

            {/* 底部分享按钮 */}
            <m.div
              initial={isAnimationEnabled ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRINGS.gentle, delay: 0.3 }}
              className="pt-4 pb-safe"
            >
              <Button
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={<RiShareLine className="size-5" />}
                onClick={handleShare}
              >
                {t('activity.invite.shareNow')}
              </Button>
            </m.div>
          </div>
        </PullToRefresh>

        {/* 金币飞入特效 Portal */}
        <CoinFlyPortal />
      </div>
    </LazyMotion>
  );
}
