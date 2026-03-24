/**
 * @file 产品详情页（建筑精度设计语言）
 * @description 沉浸式英雄图（16:10）+ 编辑式收益排版 + 毛玻璃购买栏
 * 保持所有业务逻辑不变：购买流程、VIP校验、余额校验、分享功能
 *
 * 重构变化：
 * - ROI 环 → 编辑式收益计算（日收益 × 周期 = 总收益）
 * - 占位图统一为翡翠深色渐变 + RiBuilding2Fill
 * - 英雄图比例 4:3 → 16:10
 * - 三栏指标字体改为 font-heading font-financial
 * - 底部购买栏价格改为 font-heading font-financial
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { m } from 'motion/react';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  RiArrowLeftLine,
  RiShoppingCartLine,
  RiShareLine,
  RiErrorWarningLine,
  RiRefreshLine,
  RiVipCrownFill,
  RiVipDiamondFill,
  RiBuilding2Fill,
  RiCheckLine,
  RiLockLine,
  RiTimeLine,
  RiInboxUnarchiveLine,
} from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PurchaseConfirmModal } from '@/components/products';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { get } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useUserStore } from '@/stores/user';
import { sanitizeHtml } from '@/lib/sanitize';
import type { Product } from '@/types';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();
  const { user, isAuthenticated, token } = useUserStore();
  const queryClient = useQueryClient();
  const productId = params.id as string;

  // 进入产品详情页时刷新用户余额，避免充值后余额陈旧导致无法购买
  useEffect(() => {
    if (token) {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    }
  }, [token, queryClient]);

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 180);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await get<Product>(`/products/${productId}`);
      setProduct(data);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || t('error.load_failed'));
    } finally {
      setIsLoading(false);
    }
  }, [productId, t]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  const handleBack = useCallback(() => { router.back(); }, [router]);

  const handleBuyClick = useCallback(() => {
    if (!isAuthenticated && !token) {
      toast.error(t('error.login_required'));
      router.push('/login');
      return;
    }
    setIsPurchaseModalOpen(true);
  }, [isAuthenticated, token, router, t]);

  const handleShare = useCallback(async () => {
    if (!product) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success(t('share.link_copied'));
      }
    } catch {}
  }, [product, t]);

  if (isLoading) return <ProductDetailSkeleton />;

  if (error || !product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <m.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <RiErrorWarningLine className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="mb-2 text-lg font-semibold">{t('error.load_failed')}</h2>
          <p className="mb-6 text-sm text-neutral-400">{error || t('error.product_not_found')}</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleBack}><RiArrowLeftLine className="mr-2 h-4 w-4" />{t('btn.back')}</Button>
            <Button onClick={fetchProduct}><RiRefreshLine className="mr-2 h-4 w-4" />{t('btn.retry')}</Button>
          </div>
        </m.div>
      </div>
    );
  }

  const isVip = product.series === 'VIP';
  const userVipLevel = user?.vipLevel || 0;
  const requiredVipLevel = product.requireVipLevel ?? 0;
  const isVipLevelMet = userVipLevel >= requiredVipLevel;
  const currentBalance = user?.availableBalance ? parseFloat(user.availableBalance) : 0;
  const productPrice = parseFloat(product.price);
  const isBalanceSufficient = currentBalance >= productPrice;
  const isPurchased = product.purchased;
  const isVipLocked = product.lockReason === 'VIP_REQUIRED';
  const isStockExhausted = product.lockReason === 'STOCK_EXHAUSTED';
  const isComingSoon = product.productStatus === 'COMING_SOON';
  const isLocked = isVipLocked || isStockExhausted || isComingSoon;
  const isUserLoggedIn = isAuthenticated || !!token;

  const dailyIncome = parseFloat(product.dailyIncome || '0');
  const totalIncome = parseFloat(product.totalIncome || '0');
  const productImage = product.mainImage;

  const hasGrantVip = product.grantVipLevel > 0;
  const hasGrantSvip = product.grantSvipLevel > 0;
  const hasAnyGrant = hasGrantVip || hasGrantSvip;

  return (
    <m.div
      className="flex min-h-screen flex-col bg-neutral-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* ======== 透明/毛玻璃导航栏 ======== */}
      <header className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-neutral-50/88 backdrop-blur-xl border-b border-neutral-200/50 shadow-[0_1px_8px_rgba(0,0,0,0.04)]'
          : 'bg-transparent',
      )}>
        <div className="flex h-14 items-center justify-between px-4 max-w-lg mx-auto">
          <button
            onClick={handleBack}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full transition-all',
              scrolled
                ? 'hover:bg-neutral-100 text-neutral-600'
                : 'bg-black/15 backdrop-blur-sm text-white hover:bg-black/25',
            )}
          >
            <RiArrowLeftLine className="h-5 w-5" />
          </button>

          <h1 className={cn(
            'text-base font-semibold transition-all duration-300',
            scrolled ? 'opacity-100 text-neutral-800' : 'opacity-0',
          )}>
            {product.name}
          </h1>

          <button
            onClick={handleShare}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full transition-all',
              scrolled
                ? 'hover:bg-neutral-100 text-neutral-600'
                : 'bg-black/15 backdrop-blur-sm text-white hover:bg-black/25',
            )}
          >
            <RiShareLine className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ======== 沉浸式英雄图（16:10 宽屏） ======== */}
      <div className="relative w-full aspect-[16/10] overflow-hidden">
        {productImage ? (
          <Image
            src={productImage}
            alt={product.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: isVip
                ? 'linear-gradient(160deg, var(--color-dark-950) 0%, var(--color-primary-800) 100%)'
                : 'linear-gradient(160deg, var(--color-primary-800) 0%, var(--color-dark-950) 100%)',
            }}
          >
            <RiBuilding2Fill className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 text-white/8" />
          </div>
        )}

        {/* 底部渐变遮罩 + 名称叠加 */}
        <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-neutral-50 via-neutral-50/70 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5">
          <div className="flex items-center gap-2 mb-1">
            {product.type === 'TRIAL' && (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary-500 text-white">
                {t('tag.trial')}
              </span>
            )}
            {product.showRecommendBadge && (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary-500 text-white">
                {product.customBadgeText || t('tag.recommend')}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-neutral-800">{product.name}</h1>
        </div>
      </div>

      {/* ======== 主内容区 ======== */}
      <main className="flex-1 px-4 pb-44 md:pb-32 -mt-1">
        <div className="mx-auto max-w-lg space-y-4">

          {/* 三栏核心指标（衬线体 + 等宽数字） */}
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              'rounded-2xl border shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden',
              isVip
                ? 'bg-gradient-to-r from-gold-50/50 to-gold-50/30 border-gold-200/40'
                : 'bg-white border-neutral-100/80',
            )}
          >
            <div className="grid grid-cols-3 divide-x divide-neutral-100/80">
              <div className="py-4 px-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold mb-1">
                  {t('product.price')}
                </p>
                <p className={cn('text-lg font-bold font-heading font-financial', isVip ? 'text-gold-600' : 'text-primary-500')}>
                  {formatCurrency(productPrice, config)}
                </p>
              </div>
              <div className="py-4 px-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold mb-1">
                  {t('biz.daily_income')}
                </p>
                <p className="text-lg font-bold font-heading font-financial text-primary-500">
                  +{formatCurrency(dailyIncome, config)}
                </p>
              </div>
              <div className="py-4 px-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold mb-1">
                  {t('product.cycle')}
                </p>
                <p className="text-lg font-bold font-heading font-financial text-neutral-800">
                  {product.cycleDays} {t('unit.days')}
                </p>
              </div>
            </div>
          </m.div>

          {/* 编辑式收益排版（替代 ROI 环） */}
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
              'rounded-2xl border p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]',
              isVip
                ? 'bg-gradient-to-b from-gold-50/40 to-white border-gold-200/40'
                : 'bg-white border-neutral-100/80',
            )}
          >
            {/* 编辑式标题 + 金色线 */}
            <div className="flex items-center gap-3 mb-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 whitespace-nowrap">
                {t('product.roi_title')}
              </h3>
              <div className="flex-1 divider-gradient" />
            </div>

            {/* 日收益 */}
            <div className="mb-3">
              <p className="text-2xl font-heading font-financial text-neutral-800">
                {formatCurrency(dailyIncome, config)}
              </p>
              <p className="text-xs text-neutral-400">{t('biz.daily_income')}</p>
            </div>

            {/* × 周期 */}
            <p className="text-sm text-neutral-600 mb-3">
              &times; {product.cycleDays} {t('unit.days')}
            </p>

            {/* 金色分割线 */}
            <div className="divider-gradient mb-3" />

            {/* 总收益 */}
            <div>
              <p className={cn(
                'text-[28px] font-heading font-financial',
                isVip ? 'text-gold-600' : 'text-primary-500',
              )}>
                {formatCurrency(totalIncome, config)}
              </p>
              <p className="text-xs text-neutral-400">{t('biz.total_return')}</p>
            </div>

            {/* 限购信息（使用 displayUserLimit 展示，null 表示无限购） */}
            {product.displayUserLimit != null && product.displayUserLimit > 0 && (
              <div className="mt-4 pt-3 border-t border-neutral-100/60">
                <p className="text-xs text-neutral-400">
                  {t('product.limit')}: {product.displayUserLimit} {t('product.per_user')}
                </p>
              </div>
            )}

            <p className="mt-4 text-xs text-neutral-400 text-center leading-relaxed">
              {t('product.income_tip')}
            </p>
          </m.div>

          {/* VIP 权益卡片（保持不变） */}
          {hasAnyGrant && (
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn(
                'flex items-center gap-3 rounded-2xl p-4 border',
                isVip
                  ? 'bg-gold-50/50 border-gold-200/40'
                  : 'bg-primary-50/50 border-primary-100/60',
              )}
            >
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                isVip
                  ? 'bg-gradient-to-br from-gold-400 to-gold-500'
                  : 'bg-gradient-to-br from-primary-400 to-primary-500',
              )}>
                {hasGrantSvip
                  ? <RiVipDiamondFill className="h-5 w-5 text-white" />
                  : <RiVipCrownFill className="h-5 w-5 text-white" />
                }
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-800">
                  {hasGrantSvip
                    ? t('tag.svip_upgrade').replace('{level}', String(product.grantSvipLevel))
                    : t('tag.vip_upgrade').replace('{level}', String(product.grantVipLevel))
                  }
                </p>
                <p className="text-xs text-neutral-500">
                  {t('product.grant_vip_desc')}
                </p>
              </div>
            </m.div>
          )}

          {/* 产品详情描述 */}
          {product.detailContent && (
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-2xl bg-white border border-neutral-100/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-sm font-bold text-neutral-800">{t('product.detail')}</h3>
                <div className="flex-1 h-px bg-neutral-100" />
              </div>
              <div
                className="prose prose-sm prose-neutral max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.detailContent) }}
              />
            </m.div>
          )}

          {/* 详情图片列表 */}
          {product.detailImages && product.detailImages.length > 0 && (
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              {product.detailImages.map((image: string, index: number) => (
                <div key={index} className="overflow-hidden rounded-xl">
                  <img src={image} alt={`${product.name} - ${index + 1}`} className="w-full" loading="lazy" />
                </div>
              ))}
            </m.div>
          )}
        </div>
      </main>

      {/* ======== 底部毛玻璃购买栏（衬线体价格） ======== */}
      <div className="fixed bottom-14 md:bottom-0 inset-x-0 z-50 safe-area-bottom md:pl-60"
        style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(20px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
          borderTop: '1px solid rgba(0,0,0,0.04)',
        }}
      >
        <div className="mx-auto max-w-lg px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-[10px] text-neutral-400 uppercase tracking-wide mb-0.5">
                {t('product.price')}
              </p>
              <p className={cn('text-xl font-bold font-heading font-financial', isVip ? 'text-gold-600' : 'text-primary-500')}>
                {formatCurrency(productPrice, config)}
              </p>
            </div>

            <Button
              size="lg"
              disabled={isStockExhausted || isComingSoon}
              onClick={
                !isUserLoggedIn ? handleBuyClick
                  : isPurchased ? () => router.push('/positions')
                  : isVipLocked || !isVipLevelMet ? () => router.push('/products?tab=1')
                  : !isBalanceSufficient ? () => router.push('/recharge')
                  : handleBuyClick
              }
              className={cn(
                'h-13 flex-1 rounded-xl text-base font-semibold transition-all duration-200 active:scale-[0.98]',
                isPurchased
                  ? 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                  : isStockExhausted || isComingSoon
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                  : isVipLocked || !isVipLevelMet
                    ? 'bg-gold-50 text-gold-600 border border-gold-200 hover:bg-gold-100'
                    : !isBalanceSufficient
                      ? 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                      : cn(
                          'text-white',
                          isVip
                            ? 'bg-gradient-to-r from-gold-500 to-gold-600 shadow-[0_4px_16px_rgba(var(--color-gold-rgb),0.25)]'
                            : 'bg-gradient-to-r from-primary-600 to-primary-700 shadow-[0_4px_16px_rgba(var(--color-primary-rgb),0.25)]',
                        ),
              )}
            >
              {!isUserLoggedIn ? (
                <span className="flex items-center gap-2"><RiShoppingCartLine className="h-5 w-5" />{t('btn.login_to_buy')}</span>
              ) : isPurchased ? (
                <span className="flex items-center gap-2"><RiCheckLine className="h-5 w-5" />{t('btn.bought')}</span>
              ) : isStockExhausted ? (
                <span className="flex items-center gap-2"><RiInboxUnarchiveLine className="h-5 w-5" />{t('btn.stock_exhausted')}</span>
              ) : isComingSoon ? (
                <span className="flex items-center gap-2"><RiTimeLine className="h-5 w-5" />{t('btn.coming_soon')}</span>
              ) : isVipLocked || !isVipLevelMet ? (
                <span className="flex items-center gap-2"><RiLockLine className="h-5 w-5" />{t('btn.vip_required')} {requiredVipLevel}</span>
              ) : !isBalanceSufficient ? (
                <span>{t('btn.insufficient_balance')}</span>
              ) : (
                <span className="flex items-center gap-2"><RiShoppingCartLine className="h-5 w-5" />{t('btn.buy_now')}</span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {product && (
        <PurchaseConfirmModal open={isPurchaseModalOpen} onOpenChange={setIsPurchaseModalOpen} product={product} />
      )}
    </m.div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <div className="aspect-[16/10] w-full bg-neutral-100 animate-pulse" />
      <main className="flex-1 px-4 pb-44 md:pb-32 -mt-1">
        <div className="mx-auto max-w-lg space-y-4 pt-4">
          <Skeleton className="h-5 w-1/3 mb-1" />
          <Skeleton className="h-8 w-2/3" />
          <div className="grid grid-cols-3 gap-0 rounded-2xl overflow-hidden border border-neutral-100/80">
            {[1, 2, 3].map(i => (
              <div key={i} className="py-4 px-3 flex flex-col items-center gap-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-neutral-100/80 p-5 space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-20" />
            <div className="divider-gradient" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </main>
      <div className="fixed bottom-14 md:bottom-0 inset-x-0 bg-white border-t border-neutral-100 safe-area-bottom md:pl-60">
        <div className="mx-auto max-w-lg px-4 py-3 flex items-center gap-4">
          <div className="flex-1"><Skeleton className="h-3 w-12 mb-1" /><Skeleton className="h-7 w-20" /></div>
          <Skeleton className="h-13 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
