/**
 * @file SVIP 专属页面
 * @description 展示 SVIP 12 等级资格详情、手动领取每日奖励、奖励历史
 * @route /activities/svip
 *
 * 设计要点：
 * - 紫金色调深色 Hero 头部（皇冠 + 等级 + 领取按钮）
 * - 12 等级资格卡片（已领取绿色、可领取紫金高亮、未达标灰色进度条）
 * - 可折叠奖励历史区
 */

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LazyMotion, domAnimation, m } from 'motion/react';
import { RiArrowLeftSLine, RiVipCrownFill } from '@remixicon/react';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useSvipStatus, useClaimSvipReward, SVIP_LEVELS } from '@/hooks/use-svip';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { FloatingOrbs } from '@/components/effects/floating-orbs';
import { SPRINGS } from '@/lib/animation';

import {
  SvipHero,
  SvipLevelCard,
  SvipRewardHistory,
  SvipPageSkeleton,
} from './_components';

export default function SvipPage() {
  const router = useRouter();
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();

  const { data, isLoading, refetch } = useSvipStatus();
  const claimMutation = useClaimSvipReward();

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleClaim = useCallback(() => {
    claimMutation.mutate(undefined, {
      onSuccess: (result) => {
        const amountStr = formatCurrency(parseFloat(result.totalAmount) || 0, config);
        toast.success(`${t('svip.claim_success', 'تمت المطالبة بنجاح')} +${amountStr}`);
      },
      onError: (error) => {
        toast.error(error.message || t('error.claim_failed', 'فشل في المطالبة'));
      },
    });
  }, [claimMutation, config, t]);

  if (isLoading || !data) return <SvipPageSkeleton />;

  const qualificationMap = new Map(
    data.qualifications.map(q => [q.svipLevel, q])
  );

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative min-h-screen bg-gradient-to-b from-violet-50/60 via-white to-neutral-50 overflow-hidden">
        <FloatingOrbs variant="activities" />

        {/* 顶部导航 */}
        <header className="fixed top-0 left-0 right-0 z-30">
          <div
            style={{
              background: 'rgba(26,10,46,0.85)',
              backdropFilter: 'blur(20px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto">
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all"
                aria-label={t('btn.back', 'رجوع')}
              >
                <RiArrowLeftSLine className="w-6 h-6 text-white/70" />
              </button>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <RiVipCrownFill className="w-5 h-5 text-amber-400" />
                {t('svip.page_title', 'مكافأة SVIP اليومية')}
              </h1>
              <div className="w-10" />
            </div>
          </div>
        </header>

        <PullToRefresh onRefresh={handleRefresh}>
          {/* Hero + 领取按钮 */}
          <SvipHero
            currentMaxLevel={data.currentMaxLevel}
            totalDailyReward={data.totalDailyReward}
            qualifiedCount={data.qualifications.length}
            canClaimToday={data.canClaimToday}
            todayUnclaimedAmount={data.todayUnclaimedAmount}
            todayClaimedAmount={data.todayClaimedAmount}
            onClaim={handleClaim}
            isClaiming={claimMutation.isPending}
          />

          {/* 等级列表 */}
          <main className="relative z-10 px-4 -mt-1 max-w-2xl mx-auto space-y-5 pb-28">
            {/* 标题 */}
            <m.div
              className="flex items-center gap-2"
              initial={isAnimationEnabled ? { opacity: 0, y: 10 } : undefined}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRINGS.gentle, delay: 0.1 }}
            >
              <RiVipCrownFill className="w-5 h-5 text-violet-500" />
              <h2 className="text-base font-bold text-neutral-800">
                {t('svip.all_levels', 'جميع المستويات')}
              </h2>
            </m.div>

            {/* 12 等级卡片 */}
            <div className="space-y-3">
              {SVIP_LEVELS.map((lvl, index) => (
                <SvipLevelCard
                  key={lvl.level}
                  level={lvl.level}
                  productCode={lvl.product}
                  requiredCount={lvl.requiredCount}
                  dailyReward={lvl.dailyReward}
                  qualification={qualificationMap.get(lvl.level)}
                  index={index}
                />
              ))}
            </div>

            {/* 奖励历史 */}
            <m.div
              initial={isAnimationEnabled ? { opacity: 0, y: 15 } : undefined}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRINGS.gentle, delay: 0.3 }}
            >
              <SvipRewardHistory />
            </m.div>
          </main>
        </PullToRefresh>
      </div>
    </LazyMotion>
  );
}
