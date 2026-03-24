/**
 * @file 首页产品画廊 — 地产风格横向滑动
 * @description 全出血建筑图片 + 底部渐变遮罩 + 收益率金色高亮
 * 数据来源：GET /api/config/home → recommendProducts
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { m } from 'motion/react';
import { RiBuilding2Fill } from '@remixicon/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useText } from '@/hooks/use-text';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ProductCardData } from '@/components/business/product-card-row';

export interface HomePropertyGalleryProps {
  products?: ProductCardData[];
  isLoading?: boolean;
  className?: string;
}

export function HomePropertyGallery({
  products = [],
  isLoading = false,
  className,
}: HomePropertyGalleryProps) {
  const { config } = useGlobalConfig();
  const t = useText();

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex-shrink-0" style={{ width: '78vw', maxWidth: 340 }}>
              <Skeleton className="w-full aspect-[4/3] rounded-2xl" />
              <Skeleton width={140} height={20} className="mt-3" />
              <Skeleton width={100} height={16} className="mt-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className={cn('py-8 text-center text-neutral-400', className)}>
        <p className="text-sm">{t('home.noProducts')}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* 横向滚动画廊 */}
      <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4">
        <div className="flex gap-4 px-4" style={{ paddingRight: 'calc(22vw - 16px)' }}>
          {products.map((product, index) => {
            const price = parseFloat(String(product.price)) || 0;
            const dailyIncome = parseFloat(String(product.dailyIncome)) || 0;

            return (
              <m.div
                key={product.id}
                className="snap-start flex-shrink-0"
                style={{ width: '78vw', maxWidth: 340 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Link href={`/products/${product.id}`} className="block">
                  <m.div whileTap={{ scale: 0.98 }} className="cursor-pointer">
                    {/* 图片区 */}
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[var(--color-dark-950)]">
                      {product.mainImage ? (
                        <Image
                          src={product.mainImage}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 78vw, 340px"
                        />
                      ) : (
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{
                            background: 'linear-gradient(135deg, var(--color-primary-800) 0%, var(--color-dark-950) 100%)',
                          }}
                        >
                          <RiBuilding2Fill className="w-12 h-12 text-white/10" />
                        </div>
                      )}

                      {/* 底部渐变遮罩 + 文字 */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 40%, transparent 60%)',
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-base font-bold text-white truncate">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-semibold text-gold-on-dark font-financial">
                            {formatCurrency(dailyIncome, config)}/{t('unit.day')}
                          </span>
                          <span className="text-xs text-white/40">·</span>
                          <span className="text-xs text-white/50">
                            {product.cycleDays} {t('unit.days')}
                          </span>
                        </div>
                      </div>

                      {/* 推荐角标 */}
                      {product.showRecommendBadge && (
                        <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-gold-500/90 text-white text-[10px] font-semibold tracking-wide">
                          {product.customBadgeText || t('product.recommend')}
                        </div>
                      )}
                    </div>

                    {/* 价格信息 */}
                    <div className="mt-3 px-1">
                      <div className="font-heading text-xl text-neutral-800 font-financial">
                        {formatCurrency(price, config)}
                      </div>
                    </div>
                  </m.div>
                </Link>
              </m.div>
            );
          })}
        </div>
      </div>

      {/* 指示器 */}
      {products.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {products.map((_, i) => (
            <div
              key={i}
              className={cn(
                'rounded-full transition-all duration-300',
                i === 0 ? 'w-5 h-[4px] bg-neutral-800' : 'w-[4px] h-[4px] bg-neutral-300',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
