/**
 * @file 活动卡片组件（成就画廊版）
 * @description 白底卡片 + 迷你里程碑时间线 + 紧迫感文案 + 已领计数 + hasClaimable 高亮
 * 数据来自活动列表API + 详情API（进度+tiers）
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { m } from 'motion/react';
import {
  RiArrowRightSLine,
  RiGiftFill,
  RiGroupFill,
  RiTrophyFill,
  RiCheckLine,
  RiLockFill,
  RiCalendarCheckFill,
  RiTreasureMapFill,
  RiGamepadFill,
  RiChat3Fill,
  RiVipCrownFill,
} from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { formatCurrency } from '@/lib/format';
import { SPRINGS } from '@/lib/animation';
import type { Activity } from '@/types';
import type { TierStatus } from '@/types/activity';

/**
 * 通用的 tier 里程碑数据（从 InviteTier 或 CollectionTier 映射）
 */
export interface MilestoneTier {
  reward: string;
  status: TierStatus;
}

/**
 * 活动卡片进度数据（从详情API获取）
 */
export interface ActivityProgressData {
  /** 当前完成数 */
  current: number;
  /** 下一级需要的数 */
  nextRequired?: number;
  /** 进度单位文案 */
  unit: string;
  /** 里程碑列表 */
  tiers: MilestoneTier[];
}

interface ActivityCardProps {
  activity: Activity;
  progress?: ActivityProgressData | null;
  index?: number;
}

const ACTIVITY_ROUTES: Record<string, string> = {
  INVITE_REWARD: '/activities/invite',
  COLLECTION_BONUS: '/activities/collection',
  WEEKLY_SALARY: '/activities/weekly-salary',
  PRIZE_POOL: '/activities/prize-pool',
  SPIN_WHEEL: '/activities/spin-wheel',
  COMMUNITY: '/community',
  SVIP: '/activities/svip',
};

const ACTIVITY_ICONS: Record<string, typeof RiGiftFill> = {
  INVITE_REWARD: RiGroupFill,
  COLLECTION_BONUS: RiTrophyFill,
  WEEKLY_SALARY: RiCalendarCheckFill,
  PRIZE_POOL: RiTreasureMapFill,
  SPIN_WHEEL: RiGamepadFill,
  COMMUNITY: RiChat3Fill,
  SVIP: RiVipCrownFill,
};

const ACTIVITY_ICON_COLORS: Record<string, string> = {
  INVITE_REWARD: 'bg-gradient-to-br from-primary-400 to-primary-500',
  COLLECTION_BONUS: 'bg-gradient-to-br from-blue-400 to-blue-500',
  WEEKLY_SALARY: 'bg-gradient-to-br from-primary-400 to-primary-500',
  PRIZE_POOL: 'bg-gradient-to-br from-gold-400 to-gold-500',
  SPIN_WHEEL: 'bg-gradient-to-br from-violet-400 to-violet-500',
  COMMUNITY: 'bg-gradient-to-br from-rose-400 to-rose-500',
  SVIP: 'bg-gradient-to-br from-amber-400 to-violet-500',
};

export function ActivityCard({ activity, progress, index = 0 }: ActivityCardProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();

  const Icon = ACTIVITY_ICONS[activity.code] || RiGiftFill;
  const iconColor = ACTIVITY_ICON_COLORS[activity.code] || 'bg-gradient-to-br from-primary-400 to-primary-500';
  const hasClaimable = activity.hasClaimable;
  const route = ACTIVITY_ROUTES[activity.code] || '/activities';

  const claimedCount = progress?.tiers.filter(t => t.status === 'CLAIMED').length ?? 0;
  const nextTier = progress?.tiers.find(t => t.status !== 'CLAIMED');
  const remainingSteps = nextTier && progress ? (progress.nextRequired ?? 0) - progress.current : null;
  const showUrgency = remainingSteps !== null && remainingSteps > 0 && remainingSteps <= 2;

  return (
    <Link href={route} className="block relative z-[1]">
      <m.div
        whileHover={isAnimationEnabled ? { y: -3 } : undefined}
        whileTap={isAnimationEnabled ? { scale: 0.98 } : undefined}
        transition={SPRINGS.gentle}
        className={cn(
          'relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200',
          hasClaimable
            ? 'bg-gradient-to-b from-primary-50/30 to-white border-2 border-primary-400/50 shadow-[0_4px_20px_rgba(var(--color-primary-rgb),0.1)]'
            : 'bg-white border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.05)]',
          'p-5',
        )}
      >
      {/* 可领取醒目标签 */}
      {hasClaimable && (
        <m.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-primary-400 to-primary-500 text-white text-[10px] font-bold shadow-sm"
        >
          <RiGiftFill className="w-3 h-3" />
          {t('tag.new', 'جديد')}
        </m.div>
      )}

      {/* 头部：图标 + 名称 + 已领计数 */}
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconColor)}>
          <ActivityIconImage activity={activity} FallbackIcon={Icon} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-neutral-800 truncate">{activity.name}</h3>
            {claimedCount > 0 && (
              <span className="text-[10px] font-medium text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                {claimedCount} {t('activities.obtained', 'تم الحصول عليها')}
              </span>
            )}
          </div>
        </div>
        <RiArrowRightSLine className="w-5 h-5 text-neutral-300 flex-shrink-0" />
      </div>

      {/* 描述 */}
      <p className="text-sm text-neutral-500 mb-4 line-clamp-2 leading-relaxed">
        {activity.description}
      </p>

      {/* 迷你里程碑时间线 */}
      {progress && progress.tiers.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 mb-3 scrollbar-hide">
          {progress.tiers.map((tier, i) => (
            <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
              {i > 0 && (
                <div className={cn(
                  'w-3 h-px flex-shrink-0',
                  tier.status === 'CLAIMED' ? 'bg-primary-300' : 'bg-neutral-200',
                )} />
              )}
              <MilestoneNode tier={tier} config={config} />
            </div>
          ))}
        </div>
      )}

      {/* 紧迫感文案 */}
      {showUrgency && nextTier && (
        <m.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-gold-50/60 border border-gold-200/40 px-3 py-2 mb-3"
        >
          <p className="text-xs font-semibold text-gold-700">
            {t('activities.almost_there', 'فقط {count} {unit} أخرى للفوز بـ {amount}!')
              .replace('{count}', String(remainingSteps))
              .replace('{unit}', progress?.unit || '')
              .replace('{amount}', formatCurrency(nextTier.reward, config))
            }
          </p>
        </m.div>
      )}

      {/* CTA 按钮（视觉样式，导航由外层 Link 处理） */}
      <div
        className={cn(
          'w-full h-11 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center',
          hasClaimable
            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-[0_4px_12px_rgba(var(--color-primary-rgb),0.2)]'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
        )}
      >
        {hasClaimable
          ? t('btn.claim_reward', 'المطالبة بالمكافأة')
          : t('btn.participate', 'المشاركة')
        }
      </div>
      </m.div>
    </Link>
  );
}

/**
 * 里程碑节点
 */
function MilestoneNode({ tier, config }: { tier: MilestoneTier; config: any }) {
  const amount = formatCurrency(tier.reward, config, { decimals: 0 });

  if (tier.status === 'CLAIMED') {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center">
          <RiCheckLine className="w-4 h-4 text-white" />
        </div>
        <span className="text-[9px] font-bold text-primary-600 font-mono">{amount}</span>
      </div>
    );
  }

  if (tier.status === 'CLAIMABLE') {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div className="w-7 h-7 rounded-full bg-primary-500 animate-pulse flex items-center justify-center">
          <RiGiftFill className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-[9px] font-bold text-primary-600 font-mono">{amount}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center">
        <RiLockFill className="w-3.5 h-3.5 text-neutral-300" />
      </div>
      <span className="text-[9px] text-neutral-300 font-mono">{amount}</span>
    </div>
  );
}

/**
 * 活动图标（支持后台图片URL，失败回退到 Remix Icon）
 */
function ActivityIconImage({ activity, FallbackIcon }: { activity: Activity; FallbackIcon: typeof RiGiftFill }) {
  const [imgError, setImgError] = useState(false);
  if (activity.icon && !imgError) {
    return <img src={activity.icon} alt="" className="w-5 h-5 object-contain" loading="lazy" onError={() => setImgError(true)} />;
  }
  return <FallbackIcon className="w-5 h-5 text-white" />;
}
