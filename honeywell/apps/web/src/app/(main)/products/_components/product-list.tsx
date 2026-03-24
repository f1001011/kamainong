/**
 * @file 产品列表组件
 * @description 英雄卡（首个/推荐产品全宽） + 双列网格 + whileInView 交错入场动画
 */

'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { m, AnimatePresence } from 'motion/react';
import { InfiniteScroll } from '@/components/ui/pull-to-refresh';
import { EmptyState } from '@/components/business/empty-state';
import {
  ProductCard,
  HeroProductCard,
  ProductCardSkeleton,
  HeroProductCardSkeleton,
  type ProductData,
} from '@/components/business/product-card';
import { FinancialProductCard, type FinancialProductData } from '@/components/business/financial-product-card';
import { useText } from '@/hooks/use-text';

export interface ProductListProps {
  products: ProductData[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  layout?: 'single' | 'double' | 'auto';
}

export function ProductList({
  products,
  loading,
  hasMore,
  onLoadMore,
}: ProductListProps) {
  const router = useRouter();
  const t = useText();

  const handleProductClick = (product: ProductData | FinancialProductData) => {
    router.push(`/products/${product.id}`);
  };

  /**
   * 分离英雄卡产品和普通产品
   * 优先选择带 showRecommendBadge 的产品，否则取第一个
   */
  const { heroProduct, gridProducts } = useMemo(() => {
    if (products.length === 0) return { heroProduct: null, gridProducts: [] };

    const isFinancialTab = products.every(p => p.series === 'FINANCIAL');
    if (isFinancialTab) {
      return { heroProduct: null, gridProducts: products };
    }

    const recommendIdx = products.findIndex(p => p.showRecommendBadge);
    const heroIdx = recommendIdx >= 0 ? recommendIdx : 0;
    const hero = products[heroIdx];
    const rest = products.filter((_, i) => i !== heroIdx);
    return { heroProduct: hero, gridProducts: rest };
  }, [products]);

  if (loading && products.length === 0) {
    return (
      <div className="space-y-4">
        <HeroProductCardSkeleton />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (!loading && products.length === 0) {
    return <EmptyState type="products" className="py-16" />;
  }

  const isFinancialTab = products.every(p => p.series === 'FINANCIAL');

  return (
    <InfiniteScroll hasMore={hasMore} loading={loading} onLoadMore={onLoadMore}>
      <AnimatePresence mode="wait">
        <m.div
          key={isFinancialTab ? 'financial' : 'products'}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* 英雄卡片 */}
          {heroProduct && (
            <m.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4 }}
            >
              <HeroProductCard product={heroProduct} />
            </m.div>
          )}

          {/* 理财产品：单列全宽布局 */}
          {isFinancialTab ? (
            <div className="space-y-3">
              {gridProducts.map((product, index) => (
                <m.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: index < 6 ? index * 0.05 : 0 }}
                >
                  <FinancialProductCard
                    product={{
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      dailyIncome: product.dailyIncome,
                      cycleDays: product.cycleDays,
                      totalIncome: product.totalIncome,
                      status: product.status === 'ACTIVE' ? 'ACTIVE' : 'COMING_SOON',
                      mainImage: product.mainImage,
                    }}
                    onBuy={() => handleProductClick(product)}
                    index={index}
                  />
                </m.div>
              ))}
            </div>
          ) : (
            /* 普通产品：双列网格 */
            <div className="grid grid-cols-2 gap-3">
              {gridProducts.map((product, index) => (
                <m.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: index < 6 ? index * 0.05 : 0 }}
                >
                  <ProductCard product={product} onClick={handleProductClick} />
                </m.div>
              ))}
            </div>
          )}
        </m.div>
      </AnimatePresence>
    </InfiniteScroll>
  );
}
