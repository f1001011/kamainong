/**
 * @file 拉新裂变活动页面 - 重构版
 * @description 「投资旅程」设计：全宽沉浸式英雄区 + 奖励时间线 + 规则说明
 * @depends 活动邀请.md - 完整重构方案
 * @route /activities/invite
 *
 * 设计要点：
 * - 与首页一致的深色沉浸式 Hero（视差滚动 + 环形进度 + 金色分割线）
 * - 垂直时间线阶梯布局（差异化渲染：已领收缩/可领放大/远档压缩）
 * - MotionConfig 统一动画配置，getSpring 读取后台配置
 * - 所有文案 useText()，金额 formatCurrency()，零硬编码
 */

'use client';

import { useCallback } from 'react';
import { LazyMotion, domAnimation, MotionConfig, m, useScroll, useTransform } from 'motion/react';
import { RiTrophyFill } from '@remixicon/react';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useInviteActivity } from '@/hooks/use-invite-activity';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { EmptyState } from '@/components/business/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import {
  InviteHero,
  RewardTimeline,
  RulesSection,
  InviteActivitySkeleton,
} from './_components';

export default function InviteActivityPage() {
  const t = useText();
  const { getSpring, isAnimationEnabled } = useAnimationConfig();
  const { data: activityData, isLoading, isError, refetch } = useInviteActivity();

  // 视差滚动（与首页对齐）
  const { scrollY } = useScroll();
  const heroBackgroundY = useTransform(scrollY, [0, 300], [0, -60]);
  const heroContentY = useTransform(scrollY, [0, 300], [0, -20]);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  if (isError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <EmptyState
          icon={<RiTrophyFill className="size-12 text-neutral-400" />}
          title={t('error.load_failed')}
          description={t('error.try_again')}
          actionText={t('btn.retry')}
          onAction={() => refetch()}
        />
      </div>
    );
  }

  if (isLoading || !activityData) {
    return <InviteActivitySkeleton />;
  }

  const { activityName, activityDesc, validInviteCount, tiers } = activityData;

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig
        transition={{ ...getSpring('gentle') }}
        reducedMotion={isAnimationEnabled ? 'never' : 'always'}
      >
        <div className="relative min-h-screen bg-neutral-50">
          <PullToRefresh onRefresh={handleRefresh}>
            {/* 全宽沉浸式英雄区 */}
            <InviteHero
              activityName={activityName}
              activityDesc={activityDesc}
              validInviteCount={validInviteCount}
              tiers={tiers}
              heroBackgroundY={heroBackgroundY}
              heroContentY={heroContentY}
            />

            {/* 暖米白内容区（与首页一致的微翡翠光晕） */}
            <main
              className="relative z-10"
              style={{
                background: 'radial-gradient(ellipse at 50% 0%, rgba(var(--color-primary-rgb), 0.02) 0%, transparent 50%), var(--color-neutral-50)',
              }}
            >
              <div className="px-4 max-w-2xl mx-auto">
                {/* 奖励旅程时间线 */}
                <m.div
                  className="pt-8"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <SectionTitle
                    textKey="invite.section_levels"
                    fallback="مستويات المكافآت"
                  />
                  <div className="mt-4">
                    <RewardTimeline tiers={tiers} currentCount={validInviteCount} />
                  </div>
                </m.div>

                {/* 规则说明 */}
                <m.div
                  className="mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <SectionTitle
                    textKey="invite.section_rules"
                    fallback="القواعد"
                  />
                  <div className="mt-4">
                    <RulesSection />
                  </div>
                </m.div>

                <div className="h-28 md:h-4" />
              </div>
            </main>
          </PullToRefresh>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
