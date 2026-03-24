/**
 * @file 时间轴阶梯内容组件
 * @description 根据阶梯状态差异化渲染四种内容形态：已领取(紧凑)、可领取(深色卡片)、近锁(白色卡片)、远锁(极简)
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.3-拉新裂变活动页.md
 */

'use client';

import { useCallback } from 'react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useGlobalConfigStore } from '@/stores';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { PulseWrapper } from '@/components/effects/pulse-wrapper';
import { ProgressBar } from '@/components/ui/progress-bar';
import { RiCheckLine, RiUserAddLine } from '@remixicon/react';
import type { InviteTier } from '@/types/activity';

/**
 * 阶梯内容属性
 */
interface TimelineTierContentProps {
  /** 阶梯数据 */
  tier: InviteTier;
  /** 当前有效邀请数 */
  currentCount: number;
  /** 是否为下一个待解锁的阶梯 */
  isNextLocked: boolean;
  /** 领取回调 */
  onClaim: (tier: number, event: React.MouseEvent) => void;
  /** 是否正在领取 */
  isClaiming: boolean;
}

/**
 * TimelineTierContent 阶梯内容
 * @description 四种渲染模式：CLAIMED(紧凑单行)、CLAIMABLE(深色卡片)、LOCKED-近(白色卡片)、LOCKED-远(极简)
 */
export function TimelineTierContent({
  tier,
  currentCount,
  isNextLocked,
  onClaim,
  isClaiming,
}: TimelineTierContentProps) {
  const t = useText();
  const { config } = useGlobalConfigStore();
  const { isAnimationEnabled } = useAnimationConfig();

  const currencySymbol = config?.currencySymbol || 'د.م.';

  const handleClaim = useCallback(
    (e: React.MouseEvent) => {
      onClaim(tier.tier, e);
    },
    [onClaim, tier.tier],
  );

  const tierLabel = t('invite.tier_level').replace('{n}', String(tier.tier));
  const requirementLabel = t('invite.tier_requirement').replace(
    '{n}',
    String(tier.requiredCount),
  );
  const formattedReward = formatCurrency(tier.reward, { currencySymbol });

  // ── 已领取：紧凑单行 ──
  if (tier.status === 'CLAIMED') {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-neutral-400">
        <span className="font-medium">{tierLabel}</span>
        <span>·</span>
        <span className="font-financial">{formattedReward}</span>
        <span>·</span>
        <span className="flex items-center gap-1 text-gold-600">
          <RiCheckLine className="w-3.5 h-3.5" />
          {t('invite.status_claimed')}
        </span>
      </div>
    );
  }

  // ── 可领取：深色卡片 ──
  if (tier.status === 'CLAIMABLE') {
    return (
      <div className="card-hero-dark rounded-2xl p-4 shadow-dark-card border border-primary-500/30 shimmer-overlay relative overflow-hidden">
        <p className="font-heading text-base text-white/90">{tierLabel}</p>
        <p className="flex items-center gap-1.5 text-sm text-white/50 mt-1">
          <RiUserAddLine className="w-3.5 h-3.5" />
          {requirementLabel}
        </p>
        <p className="font-heading text-2xl text-gradient-gold mt-2">{formattedReward}</p>

        <ProgressBar
          value={currentCount}
          max={tier.requiredCount}
          gradient="primary"
          height="sm"
          showGlow
          animated
          className="mt-3"
        />

        <PulseWrapper type="scale" color="primary" enabled={isAnimationEnabled} as="div">
          <Button
            variant="primary"
            size="sm"
            className="mt-3 shadow-glow-sm"
            onClick={handleClaim}
            isLoading={isClaiming}
            disabled={isClaiming}
          >
            {t('invite.status_claimable')}
          </Button>
        </PulseWrapper>
      </div>
    );
  }

  // ── 锁定-近（下一个目标）：白色卡片 ──
  if (isNextLocked) {
    const remaining = Math.max(0, tier.requiredCount - currentCount);
    return (
      <div className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-soft">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[15px] text-neutral-800">{tierLabel}</span>
          <span className="font-semibold text-neutral-700">{formattedReward}</span>
        </div>

        <p className="flex items-center gap-1.5 text-sm text-neutral-500 mt-1">
          <RiUserAddLine className="w-3.5 h-3.5" />
          {requirementLabel}
        </p>

        <ProgressBar
          value={currentCount}
          max={tier.requiredCount}
          gradient="primary"
          height="sm"
          animated
          className="mt-3"
        />

        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-neutral-400">
            {currentCount}/{tier.requiredCount}
          </span>
          <span className="text-xs text-primary-600 font-medium">
            {t('invite.next_goal_need').replace('{n}', String(remaining))}
          </span>
        </div>
      </div>
    );
  }

  // ── 锁定-远（极简行） ──
  return (
    <div className="flex items-center justify-between py-2 text-sm text-neutral-400">
      <div className="flex items-center gap-2">
        <span>{tierLabel}</span>
        <span>·</span>
        <span>{requirementLabel}</span>
      </div>
      <span className="font-financial">{formattedReward}</span>
    </div>
  );
}
