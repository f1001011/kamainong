/**
 * @file 拉新裂变活动 Hero 区
 * @description 全宽沉浸式深色 Hero，与首页风格完全一致
 * @depends 活动邀请.md 第4.1节 - 全宽沉浸式英雄区
 * @depends 开发文档/03.11.3-拉新裂变活动页.md
 */

'use client';

import { m } from 'motion/react';
import type { MotionValue } from 'motion/react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { CircularProgress } from '@/components/ui/circular-progress';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Button } from '@/components/ui/button';
import { RiShareLine } from '@remixicon/react';
import type { InviteTier } from '@/types/activity';
import { HeroStatsBar } from './hero-stats-bar';

/**
 * InviteHero 组件属性
 */
export interface InviteHeroProps {
  /** 活动名称（来自 API） */
  activityName: string;
  /** 活动描述（来自 API） */
  activityDesc: string;
  /** 有效邀请人数 */
  validInviteCount: number;
  /** 阶梯配置列表 */
  tiers: InviteTier[];
  /** 背景层视差 Y 偏移（来自 motion useTransform） */
  heroBackgroundY: MotionValue<number>;
  /** 内容层视差 Y 偏移（来自 motion useTransform） */
  heroContentY: MotionValue<number>;
}

/**
 * InviteHero 全宽沉浸式 Hero 区
 * @description 与首页 Hero 风格完全一致：深色渐变 + 噪点纹理 + 视差滚动 + 金色分割线
 */
export function InviteHero({
  activityName,
  activityDesc,
  validInviteCount,
  tiers,
  heroBackgroundY,
  heroContentY,
}: InviteHeroProps) {
  const router = useRouter();
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();

  // 环形进度最大值：取最后一个阶梯的 requiredCount
  const maxRequired = tiers.length > 0
    ? (tiers[tiers.length - 1]?.requiredCount ?? 1)
    : 1;

  return (
    <m.section className="relative overflow-hidden noise-texture">
      {/* 多层渐变背景（与首页完全一致，带视差） */}
      <m.div className="absolute inset-0" style={{ y: heroBackgroundY }}>
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(170deg, var(--color-dark-950) 0%, var(--color-dark-900) 55%, var(--color-primary-800) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 10% 90%, rgba(var(--color-gold-rgb), 0.08) 0%, transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 50% 40% at 85% 15%, rgba(var(--color-primary-rgb), 0.15) 0%, transparent 50%)',
          }}
        />
      </m.div>

      {/* 底部金色细线分割 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px] z-20"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, rgba(var(--color-gold-rgb), 0.25) 30%, rgba(var(--color-gold-rgb), 0.35) 50%, rgba(var(--color-gold-rgb), 0.25) 70%, transparent 95%)',
        }}
      />

      {/* 内容区（带视差） */}
      <m.div className="relative z-10" style={{ y: heroContentY }}>
        {/* 活动标题区 */}
        <div className="px-5 pt-8">
          <h1 className="font-heading text-xl text-white/80">{activityName}</h1>
          <p className="text-sm text-white/40 mt-1">{activityDesc}</p>
        </div>

        {/* 环形进度图 */}
        <div className="flex justify-center mt-6">
          <CircularProgress
            current={validInviteCount}
            total={maxRequired}
            size={168}
            strokeWidth={5}
            showGlow={isAnimationEnabled}
            gradientFrom="var(--color-gold-400)"
            gradientTo="var(--color-gold-500)"
          >
            <div className="flex flex-col items-center">
              <AnimatedNumber
                value={validInviteCount}
                decimals={0}
                className="font-heading text-[48px] text-gradient-gold tabular-nums leading-none"
              />
              <span className="text-[9px] tracking-[0.15em] uppercase text-white/35 mt-1.5 whitespace-nowrap">
                {t('invite.hero_count_label')}
              </span>
            </div>
          </CircularProgress>
        </div>

        {/* 里程碑点阵 */}
        <div className="flex justify-center gap-2 mt-4">
          {tiers.map((tier) => (
            <div
              key={tier.tier}
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all',
                tier.status === 'CLAIMED' &&
                  'bg-gold-400 shadow-[0_0_6px_rgba(var(--color-gold-rgb),0.5)]',
                tier.status === 'CLAIMABLE' &&
                  'bg-primary-400 animate-pulse-glow-emerald',
                tier.status === 'LOCKED' && 'bg-white/15'
              )}
            />
          ))}
        </div>

        {/* 毛玻璃三栏统计 */}
        <div className="mt-5 px-5">
          <HeroStatsBar validInviteCount={validInviteCount} tiers={tiers} />
        </div>

        {/* CTA 按钮 */}
        <div className="mt-5 px-5 pb-10">
          <Button
            variant="gold"
            size="lg"
            fullWidth
            leftIcon={<RiShareLine className="w-5 h-5" />}
            onClick={() => router.push('/team?tab=invite')}
          >
            {t('invite.hero_cta')}
          </Button>
        </div>
      </m.div>
    </m.section>
  );
}
