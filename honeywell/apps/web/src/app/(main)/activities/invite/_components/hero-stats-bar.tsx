/**
 * @file Hero 统计条组件
 * @description 拉新裂变活动 Hero 区的毛玻璃统计条，展示有效邀请数、已赚金额、下一目标
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.3-拉新裂变活动页.md
 */

'use client';

import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfigStore } from '@/stores';
import { formatCurrency } from '@/lib/format';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { RiUserAddLine, RiTrophyLine, RiTargetLine } from '@remixicon/react';
import type { InviteTier } from '@/types/activity';

/**
 * Hero 统计条组件属性
 */
export interface HeroStatsBarProps {
  /** 有效邀请人数 */
  validInviteCount: number;
  /** 阶梯配置列表 */
  tiers: InviteTier[];
}

/**
 * Hero 统计条组件 - 毛玻璃风格
 * @description 三列展示：有效邀请数、已赚金额、下一目标所需邀请数
 */
export function HeroStatsBar({ validInviteCount, tiers }: HeroStatsBarProps) {
  const t = useText();
  const { config } = useGlobalConfigStore();
  const currencySymbol = config?.currencySymbol || 'د.م.';

  // 本地计算：已领取阶梯的奖励总和
  const totalClaimed = tiers
    .filter((tier) => tier.status === 'CLAIMED')
    .reduce((sum, tier) => sum + parseFloat(tier.reward), 0);

  // 下一目标阶梯：优先 CLAIMABLE，否则取第一个 LOCKED
  const nextTier =
    tiers.find((tier) => tier.status === 'CLAIMABLE') || tiers.find((tier) => tier.status === 'LOCKED') || null;

  // 距离下一目标还需邀请人数
  const invitesNeeded = nextTier ? Math.max(0, nextTier.requiredCount - validInviteCount) : 0;

  // 是否全部阶梯已领取
  const allClaimed = tiers.length > 0 && tiers.every((tier) => tier.status === 'CLAIMED');

  return (
    <div
      className={cn(
        'bg-white/6 backdrop-blur-sm rounded-2xl border border-white/8 mx-5',
        'grid grid-cols-3'
      )}
    >
      {/* 有效邀请数 */}
      <div className="flex flex-col items-center py-3 gap-1">
        <RiUserAddLine className="w-4 h-4 text-gold-on-dark" />
        <span className="font-heading text-lg text-white">
          <AnimatedNumber value={validInviteCount} />
        </span>
        <span className="text-[10px] tracking-[0.15em] uppercase text-white/30">
          {t('invite.stat_valid', 'صالحة')}
        </span>
      </div>

      {/* 已赚金额 */}
      <div className="flex flex-col items-center py-3 gap-1 border-l border-white/8">
        <RiTrophyLine className="w-4 h-4 text-gold-on-dark" />
        <span className="font-heading text-lg text-white">
          {formatCurrency(totalClaimed, { currencySymbol })}
        </span>
        <span className="text-[10px] tracking-[0.15em] uppercase text-white/30">
          {t('invite.stat_earned', 'مكتسب')}
        </span>
      </div>

      {/* 下一目标 */}
      <div className="flex flex-col items-center py-3 gap-1 border-l border-white/8">
        <RiTargetLine className="w-4 h-4 text-gold-on-dark" />
        <span className="font-heading text-lg text-white">
          {allClaimed ? '✓' : <AnimatedNumber value={invitesNeeded} />}
        </span>
        <span className="text-[10px] tracking-[0.15em] uppercase text-white/30">
          {t('invite.stat_next', 'التالي')}
        </span>
      </div>
    </div>
  );
}
