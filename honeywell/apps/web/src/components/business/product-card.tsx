/**
 * @file 产品卡片组件（建筑精度设计语言）
 * @description 双列精致卡片。普通产品白底浅色卡 / VIP 产品深色卡（dark-950 + 金色强调）
 * 信息精简为 4 项：名称、价格、日收益、周期
 * 占位图统一为翡翠深色渐变 + RiBuilding2Fill
 * 已购产品用 ✓ 标记代替 opacity-60
 *
 * VIP 判断使用 series 字段（series === 'VIP'），符合开发规范
 */

'use client';

import { m, useAnimation } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { formatCurrency } from '@/lib/format';
import {
  RiVipCrownFill,
  RiCheckLine,
  RiBuilding2Fill,
  RiTimeLine,
} from '@remixicon/react';
import { SPRINGS } from '@/lib/animation/constants';
import { shakeVariants } from '@/lib/animation/variants';

export interface ProductData {
  id: number;
  code: string;
  name: string;
  type: 'TRIAL' | 'PAID' | 'FINANCIAL';
  series: 'PO' | 'VIP' | 'VIC' | 'NWS' | 'QLD' | 'FINANCIAL';
  price: string;
  dailyIncome: string;
  cycleDays: number;
  totalIncome: string;
  grantVipLevel: number;
  grantSvipLevel: number;
  requireVipLevel: number;
  purchaseLimit: number;
  userPurchaseLimit?: number;
  globalStock?: number;
  globalStockRemaining?: number;
  mainImage: string | null;
  showRecommendBadge: boolean;
  customBadgeText: string | null;
  status: string;
  purchased: boolean;
  purchaseCount?: number;
  canPurchase: boolean;
  lockReason: 'ALREADY_PURCHASED' | 'STOCK_EXHAUSTED' | null;
}

export interface ProductCardProps {
  product: ProductData;
  onClick?: (product: ProductData) => void;
  className?: string;
}

export function ProductCard({ product, onClick, className }: ProductCardProps) {
  const t = useText();
  const { config: globalConfig } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();
  const controls = useAnimation();
  const isDark = product.series === 'VIP';
  const isComingSoon = product.status === 'COMING_SOON';
  const isPurchased = product.purchased;

  const handleClick = async () => {
    if (isComingSoon) return;
    onClick?.(product);
  };

  return (
    <m.div
      variants={shakeVariants}
      animate={controls}
      whileTap={isAnimationEnabled && !isComingSoon ? { scale: 0.97 } : {}}
      transition={SPRINGS.snappy}
      onClick={handleClick}
      className={cn(
        'relative rounded-[16px] overflow-hidden cursor-pointer',
        isDark
          ? 'noise-texture shadow-architectural-dark'
          : 'bg-white shadow-architectural',
        isDark && 'border border-[rgba(var(--color-gold-rgb),0.08)]',
        isComingSoon && 'opacity-50 cursor-not-allowed',
        className,
      )}
      style={isDark ? { background: 'var(--color-dark-950)' } : undefined}
    >
      {/* 产品图片区 */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {product.mainImage ? (
          <Image
            src={product.mainImage}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: isDark
                ? 'linear-gradient(160deg, var(--color-dark-950) 0%, var(--color-primary-800) 100%)'
                : 'linear-gradient(160deg, var(--color-primary-800) 0%, var(--color-dark-950) 100%)',
            }}
          >
            <RiBuilding2Fill className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-white/8" />
          </div>
        )}

        {/* 底部渐变遮罩 + 名称 */}
        <div
          className="absolute bottom-0 inset-x-0 h-14"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)' }}
        />
        <div className="absolute bottom-2 left-3 right-3">
          <h3 className="text-sm font-bold text-white truncate drop-shadow-sm">
            {product.name}
          </h3>
        </div>

        {/* 已购标记（右上角绿色 ✓） */}
        {isPurchased && (
          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center z-10">
            <RiCheckLine className="w-3.5 h-3.5 text-white" />
          </div>
        )}

        {/* VIP 角标 */}
        {!isPurchased && product.grantVipLevel > 0 && (
          <m.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="absolute top-2 left-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r from-gold-400 to-gold-500 text-white backdrop-blur-sm shadow-sm z-10"
          >
            <RiVipCrownFill className="w-2.5 h-2.5" />
            <span>VIP{product.grantVipLevel}</span>
          </m.div>
        )}

        {/* 推荐角标 */}
        {!isPurchased && !product.grantVipLevel && product.showRecommendBadge && (
          <m.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r from-primary-400 to-primary-500 text-white backdrop-blur-sm shadow-sm z-10"
          >
            {t('product.recommend')}
          </m.div>
        )}

        {/* 自定义角标 */}
        {!isPurchased && product.customBadgeText && !product.grantVipLevel && !product.showRecommendBadge && (
          <m.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary-100 text-primary-600 backdrop-blur-sm shadow-sm z-10"
          >
            {product.customBadgeText}
          </m.div>
        )}

        {/* 即将推出遮罩 */}
        {isComingSoon && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center z-20"
          >
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mb-1.5 shadow-sm">
              <RiTimeLine className="w-5 h-5 text-neutral-400" />
            </div>
            <p className="text-xs text-neutral-500 font-medium">
              {t('product.coming_soon')}
            </p>
          </m.div>
        )}
      </div>

      {/* 信息区：价格 + 日收益 + 周期（精简 4 项） */}
      <div className={cn('p-3 space-y-1.5', isDark ? 'text-white' : '')}>
        {/* 价格 — 衬线体大号 */}
        <div className={cn(
          'text-xl font-heading font-financial',
          isDark ? 'text-white' : 'text-neutral-800',
        )}>
          {formatCurrency(product.price, globalConfig)}
        </div>

        {/* 日收益 — 金色/主色强调 */}
        <div className={cn(
          'text-xs font-financial font-semibold',
          isDark ? 'text-gold-on-dark' : 'text-primary-500',
        )}>
          +{formatCurrency(product.dailyIncome, globalConfig)}/{t('unit.day')}
        </div>

        {/* 周期 */}
        <div className={cn(
          'text-xs',
          isDark ? 'text-white/40' : 'text-neutral-400',
        )}>
          {product.cycleDays}{t('unit.days')}
        </div>
      </div>
    </m.div>
  );
}

/**
 * 英雄产品卡片（全宽，用于列表首个/推荐产品）
 * @description 16:9 宽屏比例，底部渐变遮罩 + 三项核心信息
 */
export function HeroProductCard({ product }: { product: ProductData }) {
  const t = useText();
  const { config: globalConfig } = useGlobalConfig();
  const isPurchased = product.purchased;

  return (
    <Link href={`/products/${product.id}`}>
      <m.div
        whileTap={{ scale: 0.98 }}
        className="relative rounded-[20px] overflow-hidden shadow-architectural"
      >
        <div className="relative aspect-[16/9]">
          {product.mainImage ? (
            <Image
              src={product.mainImage}
              alt={product.name}
              fill
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(160deg, var(--color-dark-950) 0%, var(--color-primary-800) 100%)',
              }}
            >
              <RiBuilding2Fill className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-white/8" />
            </div>
          )}

          {/* 底部渐变遮罩 */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 40%, transparent 60%)',
            }}
          />

          {/* 底部信息区 */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h3 className="text-lg font-bold text-white mb-1">{product.name}</h3>
            <div className="flex items-center gap-3 text-sm text-white/70">
              <span className="font-heading font-financial text-white">
                {formatCurrency(product.price, globalConfig)}
              </span>
              <span className="text-white/30">&middot;</span>
              <span className="text-gold-on-dark font-financial">
                +{formatCurrency(product.dailyIncome, globalConfig)}/{t('unit.day')}
              </span>
              <span className="text-white/30">&middot;</span>
              <span>{product.cycleDays}{t('unit.days')}</span>
            </div>
          </div>

          {/* 已购标记 */}
          {isPurchased && (
            <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center z-10">
              <RiCheckLine className="w-4 h-4 text-white" />
            </div>
          )}

          {/* 推荐角标 */}
          {product.showRecommendBadge && !isPurchased && (
            <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-primary-400 to-primary-500 text-white backdrop-blur-sm shadow-sm">
              {t('product.recommend')}
            </div>
          )}

          {/* VIP 角标 */}
          {product.grantVipLevel > 0 && !isPurchased && (
            <div className="absolute top-4 left-4 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gold-400 to-gold-500 text-white backdrop-blur-sm shadow-sm">
              <RiVipCrownFill className="w-3 h-3" />
              <span>VIP{product.grantVipLevel}</span>
            </div>
          )}
        </div>
      </m.div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-[16px] overflow-hidden shadow-architectural">
      <div className="aspect-[4/3] bg-neutral-100 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-6 w-24 bg-neutral-100 rounded animate-pulse" />
        <div className="h-3.5 w-28 bg-neutral-100 rounded animate-pulse" />
        <div className="h-3 w-16 bg-neutral-100 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function HeroProductCardSkeleton() {
  return (
    <div className="rounded-[20px] overflow-hidden shadow-architectural">
      <div className="aspect-[16/9] bg-neutral-100 animate-pulse" />
    </div>
  );
}
