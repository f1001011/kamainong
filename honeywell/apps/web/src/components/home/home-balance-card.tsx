/**
 * @file 首页余额卡片组件
 * @description 建筑精度设计 — 衬线体数字、光学对齐货币符号、金色分割线
 *   - immersive: 沉浸式，融入英雄区深色渐变
 *   - card: 独立深色卡片
 */

'use client';

import { useState, type ReactNode } from 'react';
import { m } from 'motion/react';
import Link from 'next/link';
import {
  RiEyeLine,
  RiEyeOffLine,
  RiAddFill,
  RiArrowUpLine,
} from '@remixicon/react';
import { fadeVariants, slideUpVariants } from '@/lib/animation/variants';
import { STAGGER } from '@/lib/animation/constants';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useText } from '@/hooks/use-text';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface BalanceData {
  availableBalance: string;
  frozenBalance: string;
  todayIncome: string;
  totalIncome: string;
}

export interface HomeBalanceCardProps {
  balance?: BalanceData;
  isLoading?: boolean;
  signinSlot?: ReactNode;
  variant?: 'card' | 'immersive';
  todayIncomeVisible?: boolean;
  className?: string;
}

const staggerContainerVariants = {
  initial: {},
  animate: {
    transition: { staggerChildren: STAGGER.normal },
  },
};

function parseAmount(val: string | undefined | null): number {
  return val ? parseFloat(val) || 0 : 0;
}

export function HomeBalanceCard({
  balance,
  isLoading = false,
  signinSlot,
  variant = 'card',
  todayIncomeVisible = true,
  className,
}: HomeBalanceCardProps) {
  const { config } = useGlobalConfig();
  const t = useText();
  const [isHidden, setIsHidden] = useState(false);

  const isImmersive = variant === 'immersive';

  if (isLoading) {
    const skeletonBg = isImmersive ? '!bg-white/10' : '!bg-white/8';
    return (
      <div
        className={cn(
          'relative overflow-hidden',
          !isImmersive && 'rounded-[20px] bg-[var(--color-dark-950)] shadow-architectural-dark',
          className
        )}
      >
        <div className={cn(isImmersive ? 'space-y-5' : 'p-6 space-y-5')}>
          <Skeleton width={100} height={14} className={skeletonBg} />
          <Skeleton width={220} height={48} className={skeletonBg} />
          <div className="flex gap-6 pt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton width={60} height={12} className={skeletonBg} />
                <Skeleton width={80} height={20} className={cn('mt-2', skeletonBg)} />
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-3">
            <Skeleton className={cn('flex-1 h-12 rounded-xl', skeletonBg)} />
            <Skeleton className={cn('flex-1 h-12 rounded-xl', skeletonBg)} />
          </div>
        </div>
      </div>
    );
  }

  const currencySymbol = config?.currencySymbol || 'د.م.';
  const availableBalance = parseAmount(balance?.availableBalance);
  const frozenBalance = parseAmount(balance?.frozenBalance);
  const todayIncome = parseAmount(balance?.todayIncome);
  const totalIncome = parseAmount(balance?.totalIncome);

  const content = (
    <m.div
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
      className={cn('relative z-10', !isImmersive && 'p-6')}
    >
      {/* 余额标签 + 隐藏切换 */}
      <m.div variants={slideUpVariants} className="flex items-center gap-2">
        <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-white/35">
          {t('home.availableBalance')}
        </span>
        <button
          onClick={() => setIsHidden(!isHidden)}
          className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-white/8 active:bg-white/12 transition-all duration-300"
          aria-label={t(isHidden ? 'home.showBalance' : 'home.hideBalance')}
        >
          {isHidden ? (
            <RiEyeOffLine className="w-3.5 h-3.5 text-white/30" />
          ) : (
            <RiEyeLine className="w-3.5 h-3.5 text-white/30" />
          )}
        </button>
      </m.div>

      {/* 主余额数字 — 衬线体 + 光学对齐货币符号 */}
      <m.div variants={slideUpVariants} className="mt-2 relative">
        {todayIncome > 0 && (
          <div
            className="absolute inset-0 -z-10 rounded-full opacity-[0.04]"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(var(--color-gold-rgb), 1) 0%, transparent 70%)',
              filter: 'blur(30px)',
            }}
          />
        )}
        {isHidden ? (
          <m.span
            initial={{ opacity: 0, filter: 'blur(8px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.3 }}
            className="font-heading text-white tracking-[-0.02em] text-[56px] font-normal font-financial"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.15)' }}
          >
            <span className="text-[80%] relative -top-[1px] mr-1 opacity-50 font-body">{currencySymbol}</span>
            ****
          </m.span>
        ) : (
          <div className="flex items-baseline">
            <span className="text-[80%] relative -top-[2px] mr-1 opacity-50 font-body text-white text-[44px]">
              {currencySymbol}
            </span>
            <AnimatedNumber
              value={availableBalance}
              decimals={config?.currencyDecimals ?? 0}
              className="font-heading text-white tracking-[-0.02em] text-[56px] font-normal font-financial"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.15)' }}
            />
          </div>
        )}
      </m.div>

      {/* 三栏统计 */}
      <m.div variants={slideUpVariants} className="flex gap-8 mt-5">
        <div>
          <div className="text-[10px] font-medium tracking-[0.18em] uppercase mb-1 text-white/30">
            {t('home.frozenBalance')}
          </div>
          {isHidden ? (
            <span className="text-sm font-semibold text-white/50 font-financial">****</span>
          ) : (
            <AnimatedNumber
              value={frozenBalance}
              prefix={currencySymbol}
              decimals={config?.currencyDecimals ?? 0}
              className="text-sm font-semibold text-white/70 font-financial"
            />
          )}
        </div>

        {todayIncomeVisible && (
          <div>
            <div className="text-[10px] font-medium tracking-[0.18em] uppercase mb-1 text-white/30">
              {t('home.todayIncome')}
            </div>
            {isHidden ? (
              <span className="text-sm font-semibold text-gold-on-dark font-financial">****</span>
            ) : (
              <AnimatedNumber
                value={todayIncome}
                prefix={todayIncome > 0 ? '+' : ''}
                decimals={config?.currencyDecimals ?? 0}
                className={cn(
                  'text-sm font-semibold font-financial',
                  todayIncome > 0 ? 'text-gold-on-dark' : 'text-white/50'
                )}
              />
            )}
          </div>
        )}

        <div>
          <div className="text-[10px] font-medium tracking-[0.18em] uppercase mb-1 text-white/30">
            {t('home.totalIncome')}
          </div>
          {isHidden ? (
            <span className="text-sm font-semibold text-gold-on-dark font-financial">****</span>
          ) : (
            <AnimatedNumber
              value={totalIncome}
              prefix={totalIncome > 0 ? '+' : ''}
              decimals={config?.currencyDecimals ?? 0}
              className={cn(
                'text-sm font-semibold font-financial',
                totalIncome > 0 ? 'text-gold-on-dark' : 'text-white/50'
              )}
            />
          )}
        </div>
      </m.div>

      {/* 金色渐变分割线 */}
      <div
        className="mt-6 mb-4 h-[0.5px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(var(--color-gold-rgb), 0.15) 20%, rgba(var(--color-gold-rgb), 0.2) 50%, rgba(var(--color-gold-rgb), 0.15) 80%, transparent)',
        }}
      />

      {/* 充值/提现按钮 */}
      <m.div variants={slideUpVariants} className="flex gap-3">
        <Link
          href="/recharge"
          className={cn(
            'group/btn flex-1 rounded-xl font-semibold text-sm tracking-wide',
            'inline-flex items-center justify-center gap-2',
            'h-[50px]',
            'bg-gradient-to-r from-primary-600 to-primary-700 text-white',
            'shadow-[0_4px_16px_rgba(var(--color-primary-rgb),0.3)]',
            'hover:shadow-[0_6px_24px_rgba(var(--color-primary-rgb),0.4)] hover:brightness-110',
            'active:scale-[0.97] transition-all duration-200'
          )}
        >
          <RiAddFill className="w-4 h-4" />
          <span>{t('btn.recharge', 'إيداع')}</span>
        </Link>

        <Link
          href="/withdraw"
          className={cn(
            'flex-1 rounded-xl font-semibold text-sm tracking-wide',
            'inline-flex items-center justify-center gap-2',
            'h-[50px]',
            'bg-transparent text-gold-on-dark',
            'border border-[rgba(var(--color-gold-rgb),0.3)]',
            'hover:border-[rgba(var(--color-gold-rgb),0.5)] hover:bg-white/5',
            'active:scale-[0.97] transition-all duration-200'
          )}
        >
          <RiArrowUpLine className="w-4 h-4" />
          <span>{t('btn.withdraw', 'سحب')}</span>
        </Link>
      </m.div>
    </m.div>
  );

  return (
    <m.div variants={fadeVariants} initial="initial" animate="animate">
      {isImmersive ? (
        <div className={cn('relative', className)}>
          {content}
          {signinSlot && (
            <div className="absolute top-0 right-0 z-20">{signinSlot}</div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            'relative rounded-[20px] overflow-hidden',
            'bg-[var(--color-dark-950)] noise-texture',
            'shadow-architectural-dark',
            className
          )}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 50% 40% at 85% 15%, rgba(var(--color-primary-rgb), 0.12) 0%, transparent 50%)',
            }}
          />
          {content}
          {signinSlot && (
            <div className="absolute top-5 right-5 z-20">{signinSlot}</div>
          )}
        </div>
      )}
    </m.div>
  );
}
