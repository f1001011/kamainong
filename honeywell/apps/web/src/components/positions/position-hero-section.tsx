/**
 * @file 持仓详情 Hero 区组件
 * @description 暖色渐变 Hero 区：产品胶囊 + 大字收益数字 + 收益率 Chip
 */

'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { m } from 'motion/react';
import { RiGiftFill, RiArrowUpSLine, RiCheckboxCircleFill } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { formatCurrency } from '@/lib/format';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { SPRINGS } from '@/lib/animation/constants';

interface PositionHeroSectionProps {
  productName: string;
  productImage: string | null;
  productSeries: string;
  cycleDays: number;
  status: 'ACTIVE' | 'COMPLETED';
  isGift: boolean;
  earnedIncome: string;
  totalIncome: string;
  dailyRate: string;
  className?: string;
}

export function PositionHeroSection({
  productName,
  productImage,
  productSeries,
  cycleDays,
  status,
  isGift,
  earnedIncome,
  totalIncome,
  dailyRate,
  className,
}: PositionHeroSectionProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  const isActive = status === 'ACTIVE';
  const isVIP = productSeries === 'VIP';

  const displayEarned = useMemo(() => formatCurrency(earnedIncome, config), [earnedIncome, config]);
  const displayTotal = useMemo(() => formatCurrency(totalIncome, config), [totalIncome, config]);

  // 根据产品系列决定渐变色（翡翠绿+香槟金主题）
  const heroGradient = isVIP
    ? 'linear-gradient(180deg, var(--color-gold-50) 0%, var(--color-gold-100) 40%, var(--color-gold-100) 70%, #fff 100%)'
    : 'linear-gradient(180deg, var(--color-primary-50) 0%, var(--color-gold-100) 40%, var(--color-primary-50) 70%, #fff 100%)';

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ background: heroGradient }}>
      {/* 装饰光斑 */}
      <div
        className="absolute -top-10 -right-5 w-40 h-40 rounded-full pointer-events-none animate-glow-breathe"
        style={{ background: 'radial-gradient(circle, rgba(var(--color-primary-rgb), 0.08) 0%, transparent 70%)', filter: 'blur(40px)' }}
      />

      <div className="relative z-10 pt-6 pb-8 px-5">
        {/* 产品胶囊 */}
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ...SPRINGS.gentle }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-2.5 bg-white/70 backdrop-blur-xl rounded-full px-4 py-2 shadow-soft-sm border border-white/60">
            {/* 产品图 */}
            <div className="relative shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm bg-neutral-100">
              {productImage ? (
                <Image src={productImage} alt={productName} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-gold-100">
                  <span className="text-sm font-bold text-primary-500">{productName.charAt(0)}</span>
                </div>
              )}
            </div>
            {/* 产品名 */}
            <span className="text-sm font-semibold text-neutral-800">{productName}</span>
            <span className="text-neutral-300">·</span>
            <span className="text-xs text-neutral-500">{cycleDays} {t('unit.day', 'يوم')}</span>
            <span className="text-neutral-300">·</span>
            {/* 状态 */}
            {isActive ? (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-success font-medium">{t('status.active', 'نشط')}</span>
              </span>
            ) : (
              <span className="text-xs text-neutral-500">{t('status.completed', 'مكتمل')}</span>
            )}
            {/* 赠送标记 */}
            {isGift && <RiGiftFill className="h-4 w-4 text-gold-500" />}
          </div>
        </m.div>

        {/* Hero 大数字 */}
        <m.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ...SPRINGS.gentle }}
          className="text-center"
        >
          <p className="text-xs text-neutral-500 tracking-wider uppercase mb-2">
            {t('label.earned_income', 'الأرباح المحققة')}
          </p>
          <p className="text-[40px] font-extrabold text-neutral-900 font-mono tabular-nums tracking-tight leading-none">
            {displayEarned}
          </p>
          <p className="text-sm text-neutral-400 font-mono mt-2">
            {t('label.of_total', 'من')} {displayTotal}
          </p>
        </m.div>

        {/* 日收益率 Chip */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="flex justify-center mt-3"
        >
          {isActive ? (
            <span className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1',
              isVIP ? 'bg-gold-50 text-gold-600' : 'bg-success/10 text-success'
            )}>
              <RiArrowUpSLine className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">{dailyRate}% / {t('label.day_abbr', 'يوم')}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-success/10 rounded-full px-4 py-1.5">
              <RiCheckboxCircleFill className="h-4 w-4 text-success" />
              <span className="text-sm font-semibold text-success">{t('status.completed', 'مكتمل')}</span>
            </span>
          )}
        </m.div>
      </div>

      {/* 底部波浪过渡 */}
      <svg className="absolute bottom-0 left-0 w-full h-6" viewBox="0 0 1440 48" preserveAspectRatio="none" fill="none" aria-hidden="true">
        <path d="M0,32 C360,8 540,0 720,16 C900,32 1080,48 1440,20 L1440,48 L0,48 Z" className="fill-white" />
      </svg>
    </div>
  );
}

export function PositionHeroSectionSkeleton() {
  return (
    <div className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, var(--color-primary-50) 0%, var(--color-gold-100) 40%, var(--color-primary-50) 70%, #fff 100%)' }}>
      <div className="relative z-10 pt-6 pb-8 px-5 animate-pulse">
        <div className="flex justify-center mb-8">
          <div className="h-10 w-48 bg-white/60 rounded-full" />
        </div>
        <div className="text-center">
          <div className="h-3 w-28 bg-neutral-200/60 rounded mx-auto mb-3" />
          <div className="h-12 w-44 bg-neutral-200/60 rounded mx-auto" />
          <div className="h-4 w-32 bg-neutral-200/60 rounded mx-auto mt-3" />
        </div>
        <div className="flex justify-center mt-3">
          <div className="h-7 w-24 bg-neutral-200/60 rounded-full" />
        </div>
      </div>
      <svg className="absolute bottom-0 left-0 w-full h-6" viewBox="0 0 1440 48" preserveAspectRatio="none" fill="none">
        <path d="M0,32 C360,8 540,0 720,16 C900,32 1080,48 1440,20 L1440,48 L0,48 Z" className="fill-white" />
      </svg>
    </div>
  );
}
