/**
 * @file SVIP Hero 头部
 * @description 紫金色调深色渐变，皇冠图标 + 等级数字 + 领取按钮
 */

'use client';

import { m } from 'motion/react';
import {
  RiVipCrownFill,
  RiStarFill,
  RiCheckDoubleLine,
  RiHandCoinLine,
} from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { formatCurrency } from '@/lib/format';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { PulseWrapper } from '@/components/effects/pulse-wrapper';
import { SPRINGS } from '@/lib/animation';

interface SvipHeroProps {
  currentMaxLevel: number;
  totalDailyReward: string;
  qualifiedCount: number;
  canClaimToday: boolean;
  todayUnclaimedAmount: string;
  todayClaimedAmount: string;
  onClaim: () => void;
  isClaiming: boolean;
}

export function SvipHero({
  currentMaxLevel,
  totalDailyReward,
  qualifiedCount,
  canClaimToday,
  todayUnclaimedAmount,
  todayClaimedAmount,
  onClaim,
  isClaiming,
}: SvipHeroProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();

  const allClaimed = !canClaimToday && qualifiedCount > 0;

  return (
    <div className="relative overflow-hidden">
      <div
        className="relative px-4 pt-14 pb-20"
        style={{
          background: 'linear-gradient(160deg, #1a0a2e 0%, #2d1b4e 30%, #1e1145 60%, #0f0a1a 100%)',
        }}
      >
        {/* 装饰光晕 */}
        <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full opacity-20 blur-[80px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.5) 0%, transparent 60%)' }}
        />
        <div className="absolute -bottom-8 -left-8 w-56 h-56 rounded-full opacity-15 blur-[60px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.6) 0%, transparent 60%)' }}
        />

        {/* 浮动星星装饰 */}
        {isAnimationEnabled && (
          <>
            <m.div className="absolute top-8 right-12 text-amber-400/30"
              animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
              <RiStarFill className="size-3" />
            </m.div>
            <m.div className="absolute top-20 right-6 text-violet-400/20"
              animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}>
              <RiStarFill className="size-2" />
            </m.div>
            <m.div className="absolute bottom-12 left-8 text-amber-400/20"
              animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}>
              <RiStarFill className="size-2.5" />
            </m.div>
          </>
        )}

        {/* 顶部渐变边框 */}
        <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(245,158,11,0.3) 50%, transparent 90%)' }}
        />

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* 皇冠图标 + 等级 */}
          <m.div
            className="flex flex-col items-center text-center"
            initial={isAnimationEnabled ? { opacity: 0, y: 20 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRINGS.gentle}
          >
            {/* 大型皇冠 */}
            <m.div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, rgba(167,139,250,0.2) 0%, rgba(245,158,11,0.15) 100%)',
                border: '1px solid rgba(167,139,250,0.25)',
                boxShadow: '0 0 40px rgba(167,139,250,0.15)',
              }}
              initial={isAnimationEnabled ? { scale: 0, rotate: -15 } : undefined}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...SPRINGS.bouncy, delay: 0.1 }}
            >
              <RiVipCrownFill className="w-10 h-10 text-amber-400" />
            </m.div>

            {/* 等级文字 */}
            {currentMaxLevel > 0 ? (
              <m.div
                initial={isAnimationEnabled ? { opacity: 0, y: 10 } : undefined}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRINGS.gentle, delay: 0.15 }}
              >
                <p className="text-sm text-violet-300/70 mb-1">
                  {t('svip.current_level', 'المستوى الحالي')}
                </p>
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-violet-300">
                  SVIP{currentMaxLevel}
                </p>
              </m.div>
            ) : (
              <m.div
                initial={isAnimationEnabled ? { opacity: 0 } : undefined}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <p className="text-lg font-bold text-white/80">
                  {t('svip.not_unlocked', 'لم يتم فتح SVIP بعد')}
                </p>
                <p className="text-sm text-violet-300/50 mt-1">
                  {t('svip.unlock_hint', 'اشترِ منتجين من نفس النوع لفتح المستوى')}
                </p>
              </m.div>
            )}
          </m.div>

          {/* 领取按钮区域（仅达标用户可见） */}
          {qualifiedCount > 0 && (
            <m.div
              className="mt-5"
              initial={isAnimationEnabled ? { opacity: 0, y: 15 } : undefined}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRINGS.gentle, delay: 0.2 }}
            >
              {canClaimToday ? (
                <PulseWrapper type="glow" color="custom" customColor="rgba(245,158,11,0.4)" enabled={!isClaiming}>
                  <button
                    onClick={onClaim}
                    disabled={isClaiming}
                    className={cn(
                      'w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl',
                      'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400',
                      'text-white font-bold text-base',
                      'shadow-[0_4px_24px_rgba(245,158,11,0.35)]',
                      'active:scale-[0.98] transition-all',
                      'disabled:opacity-60 disabled:cursor-not-allowed',
                    )}
                  >
                    <RiHandCoinLine className="size-5" />
                    <span>
                      {isClaiming
                        ? t('svip.claiming', 'جاري المطالبة...')
                        : `${t('svip.claim_btn', 'المطالبة بالمكافأة')} ${formatCurrency(parseFloat(todayUnclaimedAmount) || 0, config)}`
                      }
                    </span>
                  </button>
                </PulseWrapper>
              ) : allClaimed ? (
                <div className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <RiCheckDoubleLine className="size-5 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400/90">
                    {t('svip.claimed_today', 'تمت المطالبة اليوم')} · +{formatCurrency(parseFloat(todayClaimedAmount) || 0, config)}
                  </span>
                </div>
              ) : null}
            </m.div>
          )}

          {/* 统计条 */}
          <m.div
            className="grid grid-cols-2 gap-3 mt-5"
            initial={isAnimationEnabled ? { opacity: 0, y: 15 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRINGS.gentle, delay: 0.25 }}
          >
            {/* 每日总奖励 */}
            <div className="text-center py-3 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <p className="text-xs text-violet-300/60 mb-1">
                {t('svip.daily_total', 'المكافأة اليومية')}
              </p>
              <p className="text-xl font-bold text-amber-300 tabular-nums">
                {formatCurrency(parseFloat(totalDailyReward) || 0, config)}
              </p>
            </div>

            {/* 达标等级数 */}
            <div className="text-center py-3 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <p className="text-xs text-violet-300/60 mb-1">
                {t('svip.qualified_levels', 'المستويات المؤهلة')}
              </p>
              <p className="text-xl font-bold text-white">
                <AnimatedNumber value={qualifiedCount} decimals={0} />
                <span className="text-sm font-normal text-violet-300/50"> / 12</span>
              </p>
            </div>
          </m.div>
        </div>
      </div>

      {/* 底部弧形过渡 */}
      <div className="h-6 -mt-6 relative z-[1] rounded-t-3xl bg-gradient-to-b from-violet-50/60 via-white to-white" />
    </div>
  );
}
