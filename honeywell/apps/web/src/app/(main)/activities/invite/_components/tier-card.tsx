/**
 * @file 阶梯卡片组件 - 2026高端美学升级版
 * @description 单个奖励阶梯的展示卡片，毛玻璃风格 + 发光边框
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.3-拉新裂变活动页.md 第4.5节
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
import { RiLockLine, RiStarFill, RiCheckLine, RiUserAddLine } from '@remixicon/react';
import { SPRINGS } from '@/lib/animation/constants';
import type { InviteTier, TierStatus } from '@/types/activity';

/**
 * 阶梯卡片组件属性
 */
interface TierCardProps {
  /** 阶梯数据 */
  tier: InviteTier;
  /** 当前有效邀请数 */
  currentCount: number;
  /** 领取回调 */
  onClaim: (tier: number, event: React.MouseEvent) => void;
  /** 是否正在领取此阶梯 */
  isClaiming: boolean;
}

/**
 * 状态样式配置 - 2026高端美学版
 * 依据：03.11.3-拉新裂变活动页.md 第4.5节 - 阶梯卡片设计
 */
const statusConfig: Record<TierStatus, {
  cardClass: string;
  iconBg: string;
  Icon: typeof RiLockLine;
  iconColor: string;
  amountColor: string;
  titleColor: string;
  progressBg: string;
  progressFill: string;
}> = {
  LOCKED: {
    cardClass: 'bg-white/80 backdrop-blur-sm border border-neutral-100/80 shadow-soft-sm',
    iconBg: 'bg-neutral-100',
    Icon: RiLockLine,
    iconColor: 'text-neutral-400',
    amountColor: 'text-neutral-400',
    titleColor: 'text-neutral-600',
    progressBg: 'bg-neutral-100',
    progressFill: 'bg-neutral-300',
  },
  CLAIMABLE: {
    cardClass: 'bg-white border-2 border-primary-300 shadow-primary ring-4 ring-primary-100/50',
    iconBg: 'bg-gradient-to-br from-primary-100 to-primary-200',
    Icon: RiStarFill,
    iconColor: 'text-primary-500',
    amountColor: 'text-gradient-primary font-bold',
    titleColor: 'text-neutral-800',
    progressBg: 'bg-primary-100',
    progressFill: 'bg-gradient-to-r from-primary-400 to-primary-500',
  },
  CLAIMED: {
    cardClass: 'bg-success-50/60 backdrop-blur-sm border border-success-200/60 shadow-soft-sm',
    iconBg: 'bg-success-100',
    Icon: RiCheckLine,
    iconColor: 'text-success-500',
    amountColor: 'text-success-600',
    titleColor: 'text-neutral-600',
    progressBg: 'bg-success-100',
    progressFill: 'bg-success-500',
  },
};

/**
 * TierCard 阶梯卡片组件 - 2026高端美学版
 * @description 展示单个奖励阶梯的状态和信息，毛玻璃风格
 * 依据：03.11.3-拉新裂变活动页.md 第4.5节
 */
export function TierCard({ tier, currentCount, onClaim, isClaiming }: TierCardProps) {
  const t = useText();
  const { config } = useGlobalConfigStore();
  const { isAnimationEnabled } = useAnimationConfig();

  const currencySymbol = config?.currencySymbol || 'د.م.';
  const cfg = statusConfig[tier.status];
  const progress = Math.min((currentCount / tier.requiredCount) * 100, 100);

  const handleClaim = useCallback((e: React.MouseEvent) => {
    onClaim(tier.tier, e);
  }, [onClaim, tier.tier]);

  return (
    <m.div
      layout
      whileHover={isAnimationEnabled ? { y: -1 } : undefined}
      className={cn(
        'relative rounded-2xl p-4 transition-all overflow-hidden',
        cfg.cardClass,
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
        {/* 状态图标 - 圆形，更精致 */}
        <div className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
          cfg.iconBg
        )}>
          <cfg.Icon className={cn('w-5 h-5', cfg.iconColor)} />
        </div>

        {/* 内容区 */}
        <div className="flex-1 min-w-0">
          {/* 标题行 */}
          <div className="flex items-center justify-between mb-1">
            <span className={cn('font-semibold text-[15px]', cfg.titleColor)}>
              {t('invite.tier_level', 'المستوى {n}').replace('{n}', String(tier.tier))}
            </span>
            <span className={cn('text-lg', cfg.amountColor)}>
              {formatCurrency(tier.reward, { currencySymbol })}
            </span>
          </div>

          {/* 要求说明 + 状态/操作 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <RiUserAddLine className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-sm text-neutral-500">
                {t('invite.tier_requirement', 'دعوة {n} أصدقاء').replace('{n}', String(tier.requiredCount))}
              </span>
              {tier.status !== 'LOCKED' && (
                <RiCheckLine className="w-4 h-4 text-success-500" />
              )}
            </div>

            {/* 状态/操作 */}
            {tier.status === 'LOCKED' && (
              <span className="text-xs text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-full">
                {t('invite.status_locked', 'لم يتم بلوغه')}
              </span>
            )}
            {tier.status === 'CLAIMABLE' && (
              <PulseWrapper type="scale" color="primary" enabled={isAnimationEnabled}>
                <Button
                  size="sm"
                  onClick={handleClaim}
                  isLoading={isClaiming}
                  disabled={isClaiming}
                  className="shadow-glow-sm"
                >
                  {t('invite.status_claimable', 'المطالبة')}
                </Button>
              </PulseWrapper>
            )}
            {tier.status === 'CLAIMED' && (
              <span className="text-xs text-success-600 font-medium bg-success-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <RiCheckLine className="w-3 h-3" />
                {t('invite.status_claimed', 'تم المطالبة')}
              </span>
            )}
          </div>

          {/* 进度条（仅锁定状态显示） - 依据：4.5节进度条规格 */}
          {tier.status === 'LOCKED' && (
            <div className="mt-3">
              <div className={cn('h-1.5 rounded-full overflow-hidden', cfg.progressBg)}>
                <m.div
                  className={cn('h-full rounded-full', cfg.progressFill)}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={SPRINGS.gentle}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-neutral-400">
                  {currentCount}/{tier.requiredCount}
                </p>
                <p className="text-xs text-neutral-400">
                  {Math.round(progress)}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </m.div>
  );
}
