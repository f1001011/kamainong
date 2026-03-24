/**
 * @file 首页产品推荐区组件
 * @description 展示推荐产品列表，编辑式排版标题栏 + 交错入场动画
 * 标题栏样式：h2 标题 + 水平延伸线 + "查看更多"链接
 * @depends 开发文档/03-前端/03.2-组件/03.2.4-首页组件.md
 */

'use client';

import Link from 'next/link';
import { m } from 'motion/react';
import { RiArrowRightLine, RiFileListFill } from '@remixicon/react';
import {
  ProductCardRow,
  type ProductCardData,
} from '@/components/business/product-card-row';
import { Skeleton } from '@/components/ui/skeleton';
import { useText } from '@/hooks/use-text';
import { useStaggerInView } from '@/hooks/use-in-view-animation';
import { cn } from '@/lib/utils';

/**
 * 首页产品推荐区属性
 */
export interface HomeProductRecommendProps {
  /** 产品列表 */
  products?: ProductCardData[];
  /** 是否加载中 */
  isLoading?: boolean;
  /** 标题文案 key，默认 'home.recommendProducts' */
  titleKey?: string;
  /** 是否显示"查看更多"链接 */
  showViewMore?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 首页产品推荐区组件
 * @description 依据：03.2.4-首页组件.md - 产品推荐区
 * 编辑式排版：标题文字 + flex-1 h-px 延伸线 + 查看更多
 * 交错入场动画由 useStaggerInView 驱动
 */
export function HomeProductRecommend({
  products = [],
  isLoading = false,
  titleKey = 'home.recommendProducts',
  showViewMore = true,
  className,
}: HomeProductRecommendProps) {
  const t = useText();
  const { containerRef, containerProps, itemProps } = useStaggerInView({
    itemCount: products.length || 3,
    variant: 'fadeUp',
    staggerSpeed: 'normal',
  });

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <Skeleton width={120} height={24} />
          <Skeleton width={60} height={20} />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="w-full h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (products.length) {
    return (
      <div className={cn('space-y-4', className)}>
        {/* 编辑式标题栏：标题 + 延伸线 + 查看更多 */}
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold tracking-tight text-neutral-800 whitespace-nowrap">
            {t(titleKey)}
          </h2>
          <div className="flex-1 h-px bg-neutral-100" />
          {showViewMore && (
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 transition-colors font-semibold whitespace-nowrap"
            >
              <span>{t('common.viewMore')}</span>
              <RiArrowRightLine className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* 产品卡片列表 - 交错入场 */}
        <m.div ref={containerRef as React.RefObject<HTMLDivElement>} {...containerProps} className="space-y-3">
          {products.map((product, index) => (
            <m.div
              key={product.id}
              {...itemProps(index)}
              className="transition-transform duration-300 hover:-translate-y-0.5"
            >
              <ProductCardRow product={product} />
            </m.div>
          ))}
        </m.div>
      </div>
    );
  }

  /* 空状态 - 浮动动画 */
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-800 tracking-tight">
          {t(titleKey)}
        </h2>
      </div>
      <m.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="flex flex-col items-center justify-center py-12 text-neutral-400"
      >
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-3 shadow-soft-sm">
          <RiFileListFill className="w-8 h-8 opacity-40" />
        </div>
        <p className="text-sm font-medium">{t('home.noProducts')}</p>
      </m.div>
    </div>
  );
}
