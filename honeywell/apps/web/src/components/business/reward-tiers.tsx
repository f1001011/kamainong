/**
 * @file 通用奖励阶梯组件
 * @description 可复用的奖励阶梯展示组件，支持进度显示、状态管理、领取动画
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.3-拉新裂变活动页.md
 * @depends 开发文档/01-设计系统/01.1-设计Token.md
 * 
 * 复用说明：本组件被以下页面复用
 * - FE-20 拉新裂变活动页
 * - FE-21 连单奖励活动页
 */

'use client';

import { useMemo, useCallback } from 'react';
import { m, AnimatePresence, LazyMotion, domAnimation } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useGlobalConfigStore } from '@/stores';
import { useText } from '@/hooks/use-text';
import { formatCurrency } from '@/lib/format';
import { SPRINGS, STAGGER } from '@/lib/animation/constants';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { PulseWrapper } from '@/components/effects/pulse-wrapper';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { 
  RiCheckboxCircleFill, 
  RiLockLine, 
  RiGiftLine 
} from '@remixicon/react';
import type { RewardTier, TierStatus, RewardTiersProps } from '@/types/activity';

/**
 * 阶梯状态样式配置
 * 依据：03.11.3-拉新裂变活动页.md 第3节 - 状态样式
 */
const tierStatusStyles: Record<TierStatus, {
  containerClass: string;
  iconClass: string;
  textClass: string;
  bgClass: string;
}> = {
  LOCKED: {
    containerClass: 'border-neutral-200 bg-neutral-50/50',
    iconClass: 'text-neutral-300',
    textClass: 'text-neutral-400',
    bgClass: 'bg-neutral-100',
  },
  CLAIMABLE: {
    containerClass: 'border-primary-300 bg-primary-50/30 shadow-glow-sm',
    iconClass: 'text-primary-500',
    textClass: 'text-primary-600',
    bgClass: 'bg-primary-100',
  },
  CLAIMED: {
    containerClass: 'border-success/30 bg-success/5',
    iconClass: 'text-success',
    textClass: 'text-success',
    bgClass: 'bg-success/10',
  },
};

/**
 * 单个阶梯项组件属性
 */
interface TierItemProps {
  tier: RewardTier;
  currentProgress: number;
  onClaim: (tier: number, event: React.MouseEvent) => void;
  isClaimingThis: boolean;
  disabled: boolean;
  index: number;
  progressUnit?: string;
  tierTitleTemplate?: string;
  requirementTemplate?: string;
}

/**
 * 单个阶梯项组件
 * @description 展示单个奖励阶梯的状态和信息
 */
function TierItem({
  tier,
  currentProgress,
  onClaim,
  isClaimingThis,
  disabled,
  index,
  progressUnit,
  tierTitleTemplate,
  requirementTemplate,
}: TierItemProps) {
  const t = useText();
  const { config } = useGlobalConfigStore();
  const { isAnimationEnabled } = useAnimationConfig();

  // 获取状态样式
  const styles = tierStatusStyles[tier.status];

  // 计算进度百分比
  const progressPercent = useMemo(() => {
    if (tier.status === 'CLAIMED') return 100;
    return Math.min(100, (currentProgress / tier.requiredCount) * 100);
  }, [tier.status, currentProgress, tier.requiredCount]);

  // 格式化奖励金额
  const formattedReward = formatCurrency(tier.reward, { currencySymbol: config?.currencySymbol || 'د.م.' });

  // 渲染阶梯标题
  const tierTitle = tierTitleTemplate 
    ? tierTitleTemplate.replace('{n}', String(tier.tier))
    : tier.name || `${t('activity.tier.level')} ${tier.tier}`;

  // 渲染需求文案
  const requirementText = requirementTemplate
    ? requirementTemplate.replace('{n}', String(tier.requiredCount))
    : `${tier.requiredCount} ${progressUnit || t('activity.tier.unit')}`;

  // 渲染状态图标
  const renderStatusIcon = () => {
    switch (tier.status) {
      case 'LOCKED':
        return <RiLockLine className={cn('size-5', styles.iconClass)} />;
      case 'CLAIMED':
        return <RiCheckboxCircleFill className={cn('size-5', styles.iconClass)} />;
      case 'CLAIMABLE':
        return (
          <PulseWrapper type="glow" color="primary" duration={2}>
            <RiGiftLine className={cn('size-5', styles.iconClass)} />
          </PulseWrapper>
        );
      default:
        return null;
    }
  };

  // 渲染操作区域
  const renderAction = () => {
    if (tier.status === 'CLAIMED') {
      return (
        <span className={cn('text-sm font-medium', styles.textClass)}>
          {t('activity.tier.claimed')}
        </span>
      );
    }

    if (tier.status === 'CLAIMABLE') {
      return (
        <PulseWrapper type="scale" color="primary" duration={1.5} enabled={!disabled}>
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => onClaim(tier.tier, e)}
            isLoading={isClaimingThis}
            loadingText={t('activity.tier.claiming')}
            disabled={disabled}
            className="min-w-[80px]"
          >
            {t('activity.tier.claim')}
          </Button>
        </PulseWrapper>
      );
    }

    // LOCKED 状态显示进度
    return (
      <div className="flex items-center gap-2">
        <span className={cn('text-xs tabular-nums', styles.textClass)}>
          {currentProgress}/{tier.requiredCount}
        </span>
      </div>
    );
  };

  // 阶梯卡片容器
  const cardContent = (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-4',
        'transition-all duration-200',
        styles.containerClass
      )}
    >
      {/* 顶部区域：图标 + 标题 + 奖励 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {renderStatusIcon()}
          <span className={cn('font-medium', styles.textClass)}>
            {tierTitle}
          </span>
        </div>
        
        {/* 奖励金额 */}
        <div className="flex items-center gap-1">
          <span className={cn(
            'text-lg font-bold tabular-nums',
            tier.status === 'LOCKED' ? 'text-neutral-400' : 'text-primary-600'
          )}>
            {tier.status === 'CLAIMABLE' ? (
              <AnimatedNumber 
                value={parseFloat(tier.reward)} 
                prefix={(config?.currencySymbol || 'د.م.') + ' '} 
                decimals={config?.currencyDecimals ?? 0}
              />
            ) : (
              formattedReward
            )}
          </span>
        </div>
      </div>

      {/* 进度条（仅未完成状态显示） */}
      {tier.status !== 'CLAIMED' && (
        <div className="mb-3">
          <ProgressBar
            value={currentProgress}
            max={tier.requiredCount}
            height="sm"
            gradient={tier.status === 'CLAIMABLE' ? 'primary' : 'neutral'}
            showGlow={tier.status === 'CLAIMABLE'}
            animated={isAnimationEnabled}
          />
        </div>
      )}

      {/* 底部区域：需求说明 + 操作 */}
      <div className="flex items-center justify-between">
        <span className={cn('text-sm', styles.textClass)}>
          {requirementText}
        </span>
        {renderAction()}
      </div>

      {/* 已领取状态的装饰性对勾 */}
      {tier.status === 'CLAIMED' && (
        <div className="absolute top-2 right-2 opacity-10">
          <RiCheckboxCircleFill className="size-16 text-success" />
        </div>
      )}
    </div>
  );

  // 根据动画配置包装
  if (isAnimationEnabled) {
    return (
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          ...SPRINGS.gentle,
          delay: index * STAGGER.fast,
        }}
      >
        {cardContent}
      </m.div>
    );
  }

  return <div>{cardContent}</div>;
}

/**
 * RewardTiers 通用奖励阶梯组件
 * @description 展示奖励阶梯列表，支持进度显示、状态管理、领取动画
 * 依据：03.11.3-拉新裂变活动页.md
 * 
 * @example
 * ```tsx
 * // 拉新裂变活动
 * <RewardTiers
 *   tiers={inviteData.tiers}
 *   currentProgress={inviteData.validInviteCount}
 *   onClaim={handleClaim}
 *   claimingTier={claimingTier}
 *   progressUnit="invitaciones"
 * />
 * 
 * // 连单奖励活动（FE-21 复用）
 * <RewardTiers
 *   tiers={collectionData.tiers}
 *   currentProgress={purchasedCount}
 *   onClaim={handleClaim}
 *   progressUnit="productos"
 * />
 * ```
 */
export function RewardTiers({
  tiers,
  currentProgress,
  onClaim,
  claimingTier,
  disabled = false,
  progressUnit,
  tierTitleTemplate,
  requirementTemplate,
  className,
}: RewardTiersProps) {
  const { isAnimationEnabled } = useAnimationConfig();

  // 处理领取点击
  const handleClaim = useCallback((tier: number, event: React.MouseEvent) => {
    if (disabled) return;
    onClaim(tier, event);
  }, [onClaim, disabled]);

  // 统计信息
  const stats = useMemo(() => {
    const claimable = tiers.filter(t => t.status === 'CLAIMABLE').length;
    const claimed = tiers.filter(t => t.status === 'CLAIMED').length;
    const locked = tiers.filter(t => t.status === 'LOCKED').length;
    return { claimable, claimed, locked, total: tiers.length };
  }, [tiers]);

  if (tiers.length === 0) {
    return null;
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className={cn('space-y-3', className)}>
        <AnimatePresence mode="popLayout">
          {tiers.map((tier, index) => (
            <TierItem
              key={tier.tier}
              tier={tier}
              currentProgress={currentProgress}
              onClaim={handleClaim}
              isClaimingThis={claimingTier === tier.tier}
              disabled={disabled || tier.status !== 'CLAIMABLE'}
              index={index}
              progressUnit={progressUnit}
              tierTitleTemplate={tierTitleTemplate}
              requirementTemplate={requirementTemplate}
            />
          ))}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}

/**
 * RewardTiersSkeleton 阶梯骨架屏
 * @description 加载状态下的占位组件
 */
export function RewardTiersSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 animate-pulse"
        >
          {/* 顶部 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="size-5 rounded bg-neutral-200" />
              <div className="h-4 w-20 rounded bg-neutral-200" />
            </div>
            <div className="h-5 w-16 rounded bg-neutral-200" />
          </div>
          
          {/* 进度条 */}
          <div className="h-1.5 w-full rounded-full bg-neutral-200 mb-3" />
          
          {/* 底部 */}
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 rounded bg-neutral-200" />
            <div className="h-8 w-20 rounded bg-neutral-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
