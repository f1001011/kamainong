/**
 * @file 奖池活动页面
 * @description 每日邀请奖池活动，根据邀请人数领取不同档次奖励
 * @route /activities/prize-pool
 *
 * 设计要点：
 * - 环形进度展示奖池剩余额度
 * - 3个阶梯卡片：所需邀请人数/奖励金额/领取状态
 * - 当前有效邀请人数展示
 * - 倒计时至次日重置
 */

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LazyMotion, domAnimation, m } from 'motion/react';
import {
  RiArrowLeftSLine,
  RiGroupFill,
  RiCheckboxCircleFill,
  RiLockFill,
  RiTrophyFill,
  RiTimeLine,
  RiUserAddFill,
  RiCoinsFill,
  RiInformationLine,
} from '@remixicon/react';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS, STAGGER } from '@/lib/animation';
import { formatCurrency } from '@/lib/format';
import { CircularProgress } from '@/components/ui/circular-progress';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { FloatingOrbs } from '@/components/effects/floating-orbs';
import { Button } from '@/components/ui/button';
import { useConfetti } from '@/components/effects/confetti';
import api from '@/lib/api';

/** 奖池阶梯 */
interface PoolTier {
  id: number;
  requiredInvites: number;
  reward: number;
  status: 'LOCKED' | 'UNLOCKED' | 'CLAIMED';
}

/** 奖池状态 */
interface PrizePoolStatus {
  poolTotal: number;
  poolRemaining: number;
  validInviteCount: number;
  tiers: PoolTier[];
  nextResetTime: string;
}

/**
 * 奖池活动页面
 */
export default function PrizePoolPage() {
  const router = useRouter();
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();
  const queryClient = useQueryClient();
  const { triggerConfetti } = useConfetti();

  // 获取奖池状态
  const { data, isLoading, refetch } = useQuery<PrizePoolStatus>({
    queryKey: ['prize-pool-status'],
    queryFn: () => api.get('/prize-pool/status'),
  });

  // 领取奖励
  const claimMutation = useMutation({
    mutationFn: (tierId: number) =>
      api.post('/prize-pool/claim', { tierId }),
    onSuccess: () => {
      triggerConfetti();
      queryClient.invalidateQueries({ queryKey: ['prize-pool-status'] });
    },
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  if (isLoading || !data) return <PrizePoolSkeleton />;

  // 奖池使用百分比
  const poolUsedPercent = data.poolTotal > 0
    ? ((data.poolTotal - data.poolRemaining) / data.poolTotal) * 100
    : 0;

  // 可领取的阶梯
  const claimableTier = [...data.tiers]
    .reverse()
    .find((tier) => tier.status === 'UNLOCKED');

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative min-h-screen bg-gradient-to-b from-purple-50/60 via-white to-neutral-50 overflow-hidden">
        <FloatingOrbs variant="activities" />

        {/* 顶部导航 */}
        <header className="sticky top-0 z-30">
          <div
            style={{
              background: 'rgba(250,245,255,0.88)',
              backdropFilter: 'blur(20px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
              borderBottom: '1px solid rgba(0,0,0,0.04)',
            }}
          >
            <div className="flex items-center justify-between h-14 px-4">
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 rounded-xl hover:bg-purple-100/80 active:scale-95 transition-all"
                aria-label={t('btn.back', 'رجوع')}
              >
                <RiArrowLeftSLine className="w-6 h-6 text-neutral-600" />
              </button>
              <h1 className="text-lg font-bold text-neutral-800 tracking-tight">
                {t('pool.title', 'صندوق الجوائز اليومي')}
              </h1>
              <div className="w-10" />
            </div>
          </div>
        </header>

        <PullToRefresh onRefresh={handleRefresh}>
          <div className="relative z-10 px-4 pt-6 pb-28 space-y-6">
            {/* 奖池环形进度 */}
            <m.div
              initial={isAnimationEnabled ? { opacity: 0, scale: 0.9 } : undefined}
              animate={{ opacity: 1, scale: 1 }}
              transition={SPRINGS.bouncy}
              className="flex flex-col items-center"
            >
              <CircularProgress
                current={data.poolRemaining}
                total={data.poolTotal}
                size={220}
                strokeWidth={14}
                showGlow
                gradientFrom="#a855f7"
                gradientTo="#7c3aed"
              >
                <div className="text-center">
                  <p className="text-xs text-neutral-400 mb-0.5">
                    {t('pool.remaining', 'المتبقي')}
                  </p>
                  <p className="text-2xl font-black text-purple-600 tabular-nums">
                    {formatCurrency(data.poolRemaining, config)}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    / {formatCurrency(data.poolTotal, config)}
                  </p>
                </div>
              </CircularProgress>

              {/* 倒计时 */}
              <div className="flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-purple-200/50 shadow-[0_2px_8px_rgba(168,85,247,0.1)]">
                <RiTimeLine className="size-4 text-purple-500" />
                <span className="text-xs text-neutral-500">
                  {t('pool.next_reset', 'إعادة التعيين التالية')}:
                </span>
                <CountdownTimer
                  targetTime={data.nextResetTime}
                  variant="minimal"
                  size="sm"
                  onComplete={() => refetch()}
                />
              </div>
            </m.div>

            {/* 当前邀请人数 */}
            <m.div
              initial={isAnimationEnabled ? { opacity: 0, y: 10 } : undefined}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRINGS.gentle, delay: 0.1 }}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-4 text-white shadow-[0_4px_20px_rgba(168,85,247,0.25)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RiUserAddFill className="size-5 text-purple-200" />
                  <span className="text-sm text-purple-100">
                    {t('pool.your_invites', 'دعواتك الصالحة اليوم')}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black tabular-nums">
                    {data.validInviteCount}
                  </span>
                  <span className="text-sm text-purple-200">
                    {t('pool.people', 'أشخاص')}
                  </span>
                </div>
              </div>
            </m.div>

            {/* 阶梯卡片 */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-neutral-800 flex items-center gap-2">
                <RiTrophyFill className="size-5 text-purple-500" />
                {t('pool.reward_tiers', 'مستويات المكافآت')}
              </h3>

              {data.tiers.map((tier, index) => (
                <PoolTierCard
                  key={tier.id}
                  tier={tier}
                  config={config}
                  t={t}
                  index={index}
                  isAnimationEnabled={isAnimationEnabled}
                  isClaimable={claimableTier?.id === tier.id}
                  onClaim={() => claimMutation.mutate(tier.id)}
                  isClaiming={claimMutation.isPending}
                  currentInvites={data.validInviteCount}
                />
              ))}
            </div>

            {/* 领取按钮 */}
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
                  leftIcon={<RiCoinsFill className="size-5" />}
                >
                  {t('pool.claim_reward', 'المطالبة')} {formatCurrency(claimableTier.reward, config)}
                </Button>
              </m.div>
            )}

            {/* 规则说明 */}
            <m.div
              initial={isAnimationEnabled ? { opacity: 0, y: 16 } : undefined}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRINGS.gentle, delay: 0.3 }}
              className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-neutral-100/60"
            >
              <div className="flex items-center gap-2 mb-3">
                <RiInformationLine className="size-5 text-neutral-500" />
                <h3 className="text-base font-semibold text-neutral-800">
                  {t('pool.rules', 'القواعد')}
                </h3>
              </div>
              <ul className="space-y-2">
                {[
                  t('pool.rule_1', 'يتم إعادة تعيين الصندوق يومياً عند الساعة 00:00'),
                  t('pool.rule_2', 'تُحسب فقط الدعوات الصالحة لهذا اليوم'),
                  t('pool.rule_3', 'يمكن المطالبة فقط بأعلى مستوى تم بلوغه'),
                  t('pool.rule_4', 'يتم إضافة المكافآت فوراً'),
                ].map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-500">
                    <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-600">{i + 1}</span>
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </m.div>
          </div>
        </PullToRefresh>
      </div>
    </LazyMotion>
  );
}

/** 奖池阶梯卡片 */
function PoolTierCard({
  tier,
  config,
  t,
  index,
  isAnimationEnabled,
  isClaimable,
  onClaim,
  isClaiming,
  currentInvites,
}: {
  tier: PoolTier;
  config: ReturnType<typeof useGlobalConfig>['config'];
  t: ReturnType<typeof useText>;
  index: number;
  isAnimationEnabled: boolean;
  isClaimable: boolean;
  onClaim: () => void;
  isClaiming: boolean;
  currentInvites: number;
}) {
  const isLocked = tier.status === 'LOCKED';
  const isClaimed = tier.status === 'CLAIMED';

  return (
    <m.div
      initial={isAnimationEnabled ? { opacity: 0, x: -16 } : undefined}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...SPRINGS.gentle, delay: index * STAGGER.normal }}
      className={`relative rounded-2xl overflow-hidden border transition-all ${
        isClaimable
          ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-300/60 shadow-[0_4px_20px_rgba(168,85,247,0.15)]'
          : isClaimed
            ? 'bg-primary-50/30 border-primary-200/40'
            : isLocked
              ? 'bg-neutral-50/50 border-neutral-200/40 opacity-60'
              : 'bg-white border-neutral-200/60'
      }`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* 左侧：邀请要求 */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isClaimable
                ? 'bg-gradient-to-br from-purple-500 to-indigo-500 shadow-[0_4px_12px_rgba(168,85,247,0.3)]'
                : isClaimed
                  ? 'bg-primary-100'
                  : 'bg-neutral-100'
            }`}>
              {isClaimed ? (
                <RiCheckboxCircleFill className="size-6 text-primary-500" />
              ) : isLocked ? (
                <RiLockFill className="size-6 text-neutral-300" />
              ) : (
                <RiGroupFill className={`size-6 ${isClaimable ? 'text-white' : 'text-purple-500'}`} />
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-semibold ${isLocked ? 'text-neutral-400' : 'text-neutral-700'}`}>
                  {tier.requiredInvites} {t('pool.invites', 'دعوات')}
                </span>
                {!isLocked && !isClaimed && (
                  <span className="text-xs text-neutral-400 tabular-nums">
                    ({currentInvites}/{tier.requiredInvites})
                  </span>
                )}
              </div>
              {isClaimed && (
                <span className="text-xs text-primary-600 font-medium">
                  {t('pool.claimed', 'تم المطالبة')}
                </span>
              )}
            </div>
          </div>

          {/* 右侧：奖励金额 */}
          <div className="text-right">
            <p className={`text-xl font-black tabular-nums ${
              isClaimable ? 'text-purple-600' : isClaimed ? 'text-primary-600' : isLocked ? 'text-neutral-400' : 'text-neutral-700'
            }`}>
              {formatCurrency(tier.reward, config)}
            </p>
          </div>
        </div>

        {/* 进度指示 - 仅锁定状态显示 */}
        {isLocked && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-300 to-purple-400 rounded-full transition-all"
                style={{ width: `${Math.min((currentInvites / tier.requiredInvites) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs text-neutral-400 tabular-nums">
              {Math.round(Math.min((currentInvites / tier.requiredInvites) * 100, 100))}%
            </span>
          </div>
        )}
      </div>
    </m.div>
  );
}

/** 加载骨架屏 */
function PrizePoolSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/60 via-white to-neutral-50">
      <header className="sticky top-0 z-30" style={{ background: 'rgba(250,245,255,0.88)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center justify-between h-14 px-4">
          <div className="w-10 h-10 bg-purple-200/40 rounded-lg animate-pulse" />
          <div className="w-48 h-5 bg-purple-200/40 rounded animate-pulse" />
          <div className="w-10" />
        </div>
      </header>
      <div className="px-4 pt-6 flex flex-col items-center">
        <div className="w-52 h-52 rounded-full bg-purple-100/40 animate-pulse mb-6" />
        <div className="w-full h-16 bg-purple-100/30 rounded-2xl animate-pulse mb-6" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-full h-24 bg-white rounded-2xl border border-neutral-100/60 animate-pulse mb-3" />
        ))}
      </div>
    </div>
  );
}
