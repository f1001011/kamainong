/**
 * @file 周薪奖励页面
 * @description LV1团队充值进度 + 阶梯奖励领取
 * @route /activities/weekly-salary
 *
 * 设计要点：
 * - 顶部进度条展示当周LV1团队充值进度
 * - 6个阶梯卡片：阈值/奖励/状态（达标高亮/未达标灰色/已领取）
 * - 领取按钮（最高可领阶梯）
 * - 倒计时至本周结束
 * - 历史记录区
 */

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LazyMotion, domAnimation, m } from 'motion/react';
import {
  RiArrowLeftSLine,
  RiMedalFill,
  RiCheckboxCircleFill,
  RiLockFill,
  RiTimeLine,
  RiHistoryLine,
  RiTrophyFill,
  RiTeamFill,
} from '@remixicon/react';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS, STAGGER } from '@/lib/animation';
import { formatCurrency } from '@/lib/format';
import { formatSystemTime } from '@/lib/timezone';
import { ProgressBar } from '@/components/ui/progress-bar';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { FloatingOrbs } from '@/components/effects/floating-orbs';
import { Button } from '@/components/ui/button';
import { useConfetti } from '@/components/effects/confetti';
import api from '@/lib/api';

/** 阶梯数据 */
interface SalaryTier {
  id: number;
  threshold: number;
  reward: number;
  status: 'LOCKED' | 'UNLOCKED' | 'CLAIMED';
}

/** 历史记录 */
interface SalaryHistory {
  id: number;
  weekLabel: string;
  amount: number;
  claimedAt: string;
}

/** 周薪状态数据 */
interface WeeklySalaryStatus {
  currentWeekRecharge: number;
  tiers: SalaryTier[];
  weekEndTime: string;
  history: SalaryHistory[];
}

/**
 * 周薪奖励页面
 */
export default function WeeklySalaryPage() {
  const router = useRouter();
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();
  const queryClient = useQueryClient();
  const { triggerConfetti } = useConfetti();

  // 获取周薪状态
  const { data, isLoading, refetch } = useQuery<WeeklySalaryStatus>({
    queryKey: ['weekly-salary-status'],
    queryFn: () => api.get('/weekly-salary/status'),
  });

  // 领取奖励
  const claimMutation = useMutation({
    mutationFn: (tierId: number) =>
      api.post('/weekly-salary/claim', { tierId }),
    onSuccess: () => {
      triggerConfetti();
      queryClient.invalidateQueries({ queryKey: ['weekly-salary-status'] });
    },
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  if (isLoading || !data) return <WeeklySalarySkeleton />;

  // 计算最大阈值用于进度条
  const maxThreshold = data.tiers.length > 0
    ? data.tiers[data.tiers.length - 1].threshold
    : 100;

  // 找到最高可领取阶梯
  const claimableTier = [...data.tiers]
    .reverse()
    .find((tier) => tier.status === 'UNLOCKED');

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative min-h-screen bg-gradient-to-b from-blue-50/60 via-white to-neutral-50 overflow-hidden">
        <FloatingOrbs variant="activities" />

        {/* 顶部导航 */}
        <header className="sticky top-0 z-30">
          <div
            style={{
              background: 'rgba(239,246,255,0.88)',
              backdropFilter: 'blur(20px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
              borderBottom: '1px solid rgba(0,0,0,0.04)',
            }}
          >
            <div className="flex items-center justify-between h-14 px-4">
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 rounded-xl hover:bg-blue-100/80 active:scale-95 transition-all"
                aria-label={t('btn.back', 'رجوع')}
              >
                <RiArrowLeftSLine className="w-6 h-6 text-neutral-600" />
              </button>
              <h1 className="text-lg font-bold text-neutral-800 tracking-tight">
                {t('weekly.title', 'الراتب الأسبوعي LV1')}
              </h1>
              <div className="w-10" />
            </div>
          </div>
        </header>

        <PullToRefresh onRefresh={handleRefresh}>
          <div className="relative z-10 px-4 pt-4 pb-28 space-y-5">
            {/* 进度概览卡片 */}
            <m.div
              initial={isAnimationEnabled ? { opacity: 0, y: -10 } : undefined}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRINGS.gentle}
              className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-5 text-white shadow-[0_8px_32px_rgba(59,130,246,0.3)]"
            >
              <div className="flex items-center gap-2 mb-3">
                <RiTeamFill className="size-5 text-blue-200" />
                <span className="text-sm text-blue-100">
                  {t('weekly.team_recharge', 'إيداعات فريق LV1 هذا الأسبوع')}
                </span>
              </div>

              <div className="flex items-end justify-between mb-3">
                <p className="text-3xl font-black tabular-nums">
                  {formatCurrency(data.currentWeekRecharge, config)}
                </p>
                <p className="text-sm text-blue-200 tabular-nums">
                  / {formatCurrency(maxThreshold, config)}
                </p>
              </div>

              <ProgressBar
                value={data.currentWeekRecharge}
                max={maxThreshold}
                height="lg"
                gradient="primary"
                showGlow
                trackClassName="bg-blue-800/40"
                barClassName="bg-gradient-to-r from-gold-400 via-yellow-400 to-gold-500"
              />

              {/* 倒计时 */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <span className="text-xs text-blue-200">
                  {t('weekly.time_remaining', 'الوقت المتبقي')}
                </span>
                <CountdownTimer
                  targetTime={data.weekEndTime}
                  variant="minimal"
                  size="sm"
                  onComplete={() => refetch()}
                />
              </div>
            </m.div>

            {/* 阶梯卡片列表 */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-neutral-800 flex items-center gap-2">
                <RiMedalFill className="size-5 text-gold-500" />
                {t('weekly.tiers', 'مستويات المكافآت')}
              </h3>

              {data.tiers.map((tier, index) => (
                <TierCard
                  key={tier.id}
                  tier={tier}
                  config={config}
                  t={t}
                  index={index}
                  isAnimationEnabled={isAnimationEnabled}
                  isClaimable={claimableTier?.id === tier.id}
                  onClaim={() => claimMutation.mutate(tier.id)}
                  isClaiming={claimMutation.isPending}
                  currentProgress={data.currentWeekRecharge}
                />
              ))}
            </div>

            {/* 领取按钮（全局） */}
            {claimableTier && (
              <m.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRINGS.bouncy}
              >
                <Button
                  variant="gradient"
                  size="lg"
                  fullWidth
                  isLoading={claimMutation.isPending}
                  loadingText={t('tip.claiming', 'جارٍ المطالبة...')}
                  onClick={() => claimMutation.mutate(claimableTier.id)}
                  leftIcon={<RiTrophyFill className="size-5" />}
                >
                  {t('weekly.claim_reward', 'المطالبة بالمكافأة')} - {formatCurrency(claimableTier.reward, config)}
                </Button>
              </m.div>
            )}

            {/* 历史记录 */}
            <m.div
              initial={isAnimationEnabled ? { opacity: 0, y: 16 } : undefined}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRINGS.gentle, delay: 0.3 }}
              className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-neutral-100/60"
            >
              <div className="flex items-center gap-2 mb-3">
                <RiHistoryLine className="size-5 text-neutral-500" />
                <h3 className="text-base font-semibold text-neutral-800">
                  {t('weekly.history', 'السجل')}
                </h3>
              </div>

              {data.history.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-4">
                  {t('weekly.no_history', 'لم تحصل على راتب أسبوعي بعد')}
                </p>
              ) : (
                <div className="space-y-2">
                  {data.history.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-neutral-50/50"
                    >
                      <div>
                        <p className="text-sm font-medium text-neutral-700">{record.weekLabel}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {formatSystemTime(record.claimedAt, config.systemTimezone, 'yyyy-MM-dd')}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-primary-600 tabular-nums">
                        +{formatCurrency(record.amount, config)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </m.div>
          </div>
        </PullToRefresh>
      </div>
    </LazyMotion>
  );
}

/** 阶梯卡片 */
function TierCard({
  tier,
  config,
  t,
  index,
  isAnimationEnabled,
  isClaimable,
  onClaim,
  isClaiming,
  currentProgress,
}: {
  tier: SalaryTier;
  config: ReturnType<typeof useGlobalConfig>['config'];
  t: ReturnType<typeof useText>;
  index: number;
  isAnimationEnabled: boolean;
  isClaimable: boolean;
  onClaim: () => void;
  isClaiming: boolean;
  currentProgress: number;
}) {
  const isLocked = tier.status === 'LOCKED';
  const isClaimed = tier.status === 'CLAIMED';
  const progressPercent = Math.min((currentProgress / tier.threshold) * 100, 100);

  return (
    <m.div
      initial={isAnimationEnabled ? { opacity: 0, y: 12 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRINGS.gentle, delay: index * STAGGER.fast }}
      className={`relative rounded-2xl overflow-hidden border transition-all ${
        isClaimable
          ? 'bg-gradient-to-r from-gold-50 to-primary-50 border-gold-300/60 shadow-[0_4px_20px_rgba(var(--color-gold-rgb),0.15)]'
          : isClaimed
            ? 'bg-primary-50/30 border-primary-200/40'
            : isLocked
              ? 'bg-white border-neutral-200/60 opacity-60'
              : 'bg-white border-neutral-200/60'
      }`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isClaimed ? (
              <RiCheckboxCircleFill className="size-5 text-primary-500" />
            ) : isLocked ? (
              <RiLockFill className="size-5 text-neutral-300" />
            ) : (
              <RiMedalFill className="size-5 text-gold-500" />
            )}
            <span className={`text-sm font-semibold ${isLocked ? 'text-neutral-400' : 'text-neutral-700'}`}>
              {t('weekly.tier_level', 'المستوى')} {index + 1}
            </span>
          </div>

          {isClaimed && (
            <span className="text-xs font-semibold text-primary-600 px-2.5 py-1 rounded-full bg-primary-100/60">
              {t('weekly.claimed', 'تم المطالبة')}
            </span>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className={`text-xs ${isLocked ? 'text-neutral-400' : 'text-neutral-500'}`}>
              {t('weekly.threshold', 'الهدف')}
            </p>
            <p className={`text-base font-bold tabular-nums ${isLocked ? 'text-neutral-400' : 'text-neutral-700'}`}>
              {formatCurrency(tier.threshold, config)}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-xs ${isLocked ? 'text-neutral-400' : 'text-neutral-500'}`}>
              {t('weekly.reward', 'المكافأة')}
            </p>
            <p className={`text-lg font-black tabular-nums ${
              isClaimable ? 'text-gold-600' : isClaimed ? 'text-primary-600' : isLocked ? 'text-neutral-400' : 'text-primary-600'
            }`}>
              {formatCurrency(tier.reward, config)}
            </p>
          </div>
        </div>

        {/* 进度条（仅未达标阶梯显示） */}
        {!isClaimed && (
          <div className="mt-3">
            <ProgressBar
              value={progressPercent}
              max={100}
              height="sm"
              gradient={isClaimable ? 'primary' : 'neutral'}
              showGlow={isClaimable}
            />
          </div>
        )}
      </div>
    </m.div>
  );
}

/** 加载骨架屏 */
function WeeklySalarySkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-white to-neutral-50">
      <header className="sticky top-0 z-30" style={{ background: 'rgba(239,246,255,0.88)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center justify-between h-14 px-4">
          <div className="w-10 h-10 bg-blue-200/40 rounded-lg animate-pulse" />
          <div className="w-40 h-5 bg-blue-200/40 rounded animate-pulse" />
          <div className="w-10" />
        </div>
      </header>
      <div className="px-4 pt-4 space-y-4">
        <div className="h-44 bg-blue-100/40 rounded-2xl animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-neutral-100/60 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
