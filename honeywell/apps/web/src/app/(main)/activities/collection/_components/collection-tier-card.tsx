/**
 * @file 连单奖励阶梯卡片组件 - 2026高端美学升级版
 * @description 单个阶梯的卡片展示，毛玻璃风格 + 发光边框
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.4-连单奖励活动页.md 第4.6节
 */

'use client';

import { useCallback, useMemo } from 'react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { PulseWrapper } from '@/components/effects/pulse-wrapper';
import { RequiredProductTag } from './required-product-tag';
import { RiLockLine, RiStarFill, RiCheckLine } from '@remixicon/react';
import { SPRINGS } from '@/lib/animation';
import type { CollectionTier, TierStatus } from '@/types/activity';

/**
 * 阶梯卡片组件属性
 */
interface CollectionTierCardProps {
  /** 阶梯数据 */
  tier: CollectionTier;
  /** 前置条件是否满足 */
  prerequisiteMet: boolean;
  /** 领取回调 */
  onClaim: (tier: number, event: React.MouseEvent) => void;
  /** 是否正在领取 */
  isClaiming?: boolean;
}

/**
 * 状态样式映射 - 2026高端美学版
 * @description 依据：03.11.4-连单奖励活动页.md 第4.6节
 * - LOCKED: 毛玻璃白色卡片，柔和阴影
 * - CLAIMABLE: 橙色发光边框，闪光效果
 * - CLAIMED: 成功绿色毛玻璃
 */
const STATUS_STYLES: Record<TierStatus, {
  cardClass: string;
  iconBg: string;
  Icon: typeof RiLockLine;
  iconColor: string;
  amountClass: string;
  titleColor: string;
}> = {
  LOCKED: {
    cardClass: 'bg-white border border-neutral-100 shadow-soft-sm',
    iconBg: 'bg-neutral-50 border border-neutral-100',
    Icon: RiLockLine,
    iconColor: 'text-neutral-300',
    amountClass: 'text-neutral-300 font-bold',
    titleColor: 'text-neutral-500',
  },
  CLAIMABLE: {
    cardClass: 'bg-white border-2 border-primary-300 shadow-primary ring-4 ring-primary-100/50',
    iconBg: 'bg-gradient-to-br from-primary-100 to-primary-200',
    Icon: RiStarFill,
    iconColor: 'text-primary-500',
    amountClass: 'text-gradient-primary font-extrabold',
    titleColor: 'text-neutral-800',
  },
  CLAIMED: {
    cardClass: 'bg-success-50/50 border border-success-200/50 shadow-soft-sm',
    iconBg: 'bg-success-100',
    Icon: RiCheckLine,
    iconColor: 'text-success-500',
    amountClass: 'text-success-600 font-bold line-through decoration-success-300/50',
    titleColor: 'text-neutral-500',
  },
};

/**
 * 连单奖励阶梯卡片组件 - 2026高端美学版
 * @description 依据：03.11.4-连单奖励活动页.md 第5.8节
 */
export function CollectionTierCard({
  tier,
  prerequisiteMet,
  onClaim,
  isClaiming = false,
}: CollectionTierCardProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();

  const statusConfig = STATUS_STYLES[tier.status];
  const canClaim = tier.status === 'CLAIMABLE' && prerequisiteMet;

  // 格式化奖励金额
  const formattedReward = useMemo(
    () => formatCurrency(parseFloat(tier.reward), config),
    [tier.reward, config]
  );

  // 处理领取点击
  const handleClaim = useCallback((e: React.MouseEvent) => {
    if (canClaim) {
      onClaim(tier.tier, e);
    }
  }, [onClaim, tier.tier, canClaim]);

  return (
    <m.div
      layout
      whileHover={isAnimationEnabled ? { y: -1 } : undefined}
      className={cn(
        'relative rounded-2xl p-4 transition-all overflow-hidden',
        statusConfig.cardClass,
      )}
    >
      {/* CLAIMABLE 状态闪光效果 */}
      {tier.status === 'CLAIMABLE' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(var(--color-primary-rgb),0.4) 50%, transparent 100%)',
              animation: 'shimmer-flow 3s ease-in-out infinite',
            }}
          />
        </div>
      )}

      <div className="relative z-10 flex items-start gap-3.5">
        {/* 状态图标 */}
        <div className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
          statusConfig.iconBg
        )}>
          <statusConfig.Icon className={cn('w-5 h-5', statusConfig.iconColor)} />
        </div>

        {/* 内容区 */}
        <div className="flex-1 min-w-0">
          {/* 标题行 - 名称 + 金额 */}
          <div className="flex items-baseline justify-between mb-2">
            <span className={cn('font-semibold text-[15px]', statusConfig.titleColor)}>
              {tier.name}
            </span>
            <span className={cn('text-xl tracking-tight', statusConfig.amountClass)}>
              {formattedReward}
            </span>
          </div>

          {/* 所需产品标签列表 + 状态操作 在同一行 */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              {tier.requiredProducts.map((product) => (
                <RequiredProductTag
                  key={product.id}
                  product={product}
                />
              ))}
            </div>

            {/* 状态/操作 */}
            {tier.status === 'LOCKED' && (
              <span className="text-[11px] text-neutral-400 flex-shrink-0 ml-2">
                {t('collection.status_locked', 'غير مكتمل')}
              </span>
            )}
            
            {tier.status === 'CLAIMABLE' && (
              <PulseWrapper enabled={isAnimationEnabled && canClaim} type="scale">
                <Button
                  size="sm"
                  onClick={handleClaim}
                  isLoading={isClaiming}
                  disabled={isClaiming || !prerequisiteMet}
                  className="shadow-glow-sm flex-shrink-0 ml-2"
                >
                  {t('collection.status_claimable', 'المطالبة')}
                </Button>
              </PulseWrapper>
            )}
            
            {tier.status === 'CLAIMED' && (
              <span className="text-xs text-success-600 font-medium bg-success-50 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 ml-2">
                <RiCheckLine className="w-3 h-3" />
                {t('collection.status_claimed', 'تم المطالبة')}
              </span>
            )}
          </div>
        </div>
      </div>
    </m.div>
  );
}
