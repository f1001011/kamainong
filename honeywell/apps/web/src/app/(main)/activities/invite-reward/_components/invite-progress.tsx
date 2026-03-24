/**
 * @file 邀请进度组件
 * @description 展示当前邀请进度到下一阶梯的可视化进度条
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.3-拉新裂变活动页.md 第3.2节
 */

'use client';

import { useMemo } from 'react';
import { m, LazyMotion, domAnimation } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useGlobalConfigStore } from '@/stores';
import { useText } from '@/hooks/use-text';
import { formatCurrency } from '@/lib/format';
import { SPRINGS } from '@/lib/animation/constants';
import { ProgressBar } from '@/components/ui/progress-bar';
import { RiGiftFill } from '@remixicon/react';
import type { InviteTier } from '@/types/activity';

/**
 * 进度组件属性
 */
interface InviteProgressProps {
  /** 当前有效邀请人数 */
  validInviteCount: number;
  /** 阶梯配置列表 */
  tiers: InviteTier[];
  /** 自定义类名 */
  className?: string;
}

/**
 * InviteProgress 邀请进度
 * @description 展示当前邀请进度和下一个目标
 * 依据：03.11.3-拉新裂变活动页.md 第3.2节
 * 
 * @example
 * ```tsx
 * <InviteProgress
 *   validInviteCount={3}
 *   tiers={inviteData.tiers}
 * />
 * ```
 */
export function InviteProgress({
  validInviteCount,
  tiers,
  className,
}: InviteProgressProps) {
  const t = useText();
  const { config } = useGlobalConfigStore();
  const currencySymbol = config?.currencySymbol || 'د.م.';
  const { isAnimationEnabled } = useAnimationConfig();

  // 计算下一个目标阶梯
  const { nextTier, currentTierIndex, progressPercent, invitesNeeded } = useMemo(() => {
    // 找到第一个未完成的阶梯
    const nextIdx = tiers.findIndex(tier => tier.status !== 'CLAIMED');
    const next = nextIdx >= 0 ? tiers[nextIdx] : null;
    
    // 计算进度百分比
    let percent = 0;
    let needed = 0;
    
    if (next) {
      // 上一个阶梯的要求（基准）
      const prevRequired = nextIdx > 0 ? tiers[nextIdx - 1].requiredCount : 0;
      const currentRequired = next.requiredCount;
      const range = currentRequired - prevRequired;
      const progress = validInviteCount - prevRequired;
      
      percent = range > 0 ? Math.min(100, Math.max(0, (progress / range) * 100)) : 0;
      needed = Math.max(0, currentRequired - validInviteCount);
    } else if (tiers.length > 0) {
      // 所有阶梯都已完成
      percent = 100;
    }
    
    return {
      nextTier: next,
      currentTierIndex: nextIdx,
      progressPercent: percent,
      invitesNeeded: needed,
    };
  }, [tiers, validInviteCount]);

  // 所有阶梯已完成
  if (!nextTier) {
    return (
      <div
        className={cn(
          'rounded-xl bg-success/10 border border-success/20 p-4',
          'flex items-center gap-3',
          className
        )}
      >
        <div className="size-10 rounded-full bg-success/20 flex items-center justify-center">
          <RiGiftFill className="size-5 text-success" />
        </div>
        <div>
          <p className="font-medium text-success">
            {t('activity.invite.allCompleted', 'لقد أكملت جميع الأهداف')}
          </p>
          <p className="text-sm text-neutral-500">
            {t('activity.invite.allCompletedDesc', 'استمر في الدعوة للمكافآت المستقبلية')}
          </p>
        </div>
      </div>
    );
  }

  const nextReward = formatCurrency(nextTier.reward, { currencySymbol });

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={isAnimationEnabled ? { opacity: 0, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRINGS.gentle, delay: 0.1 }}
        className={cn(
          'rounded-xl bg-white border border-neutral-100 p-4 shadow-soft',
          className
        )}
      >
        {/* 标题行 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <RiGiftFill className="size-5 text-primary-500" />
            <span className="font-medium text-neutral-700">
              {t('activity.invite.nextGoal', 'الهدف التالي')}
            </span>
          </div>
          <span className="text-lg font-bold text-primary-600">
            {nextReward}
          </span>
        </div>

        {/* 进度条 */}
        <ProgressBar
          value={validInviteCount}
          max={nextTier.requiredCount}
          height="md"
          gradient="primary"
          showGlow
          animated={isAnimationEnabled}
          className="mb-2"
        />

        {/* 进度文字 */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">
            {validInviteCount} / {nextTier.requiredCount} {t('activity.invite.unit', 'دعوات')}
          </span>
          
          {invitesNeeded > 0 ? (
            <span className="text-primary-600 font-medium">
              {t('activity.invite.needMore', 'المتبقي {n}')
                .replace('{n}', String(invitesNeeded))}
            </span>
          ) : (
            <span className="text-success font-medium">
              {t('activity.invite.canClaim', 'يمكنك المطالبة')}
            </span>
          )}
        </div>
      </m.div>
    </LazyMotion>
  );
}
