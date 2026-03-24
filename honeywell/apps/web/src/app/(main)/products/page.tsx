/**
 * @file 产品列表页（建筑精度设计语言）
 * @description 衬线体大标题 + 极简下划线 Tab（仅 Tab 吸顶） + 英雄卡 + 双列网格
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RiArrowLeftSLine } from '@remixicon/react';
import { useText } from '@/hooks/use-text';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { ProductCardSkeleton, HeroProductCardSkeleton } from '@/components/business/product-card';
import {
  ProductTabs,
  ProductList,
  getSeriesFromTab,
  type ProductsConfig,
} from './_components';
import type { ProductData } from '@/components/business/product-card';
import api from '@/lib/api';

interface ProductsResponse { list: ProductData[]; }
interface ConfigResponse extends ProductsConfig {}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const t = useText();
  const headerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const { data: config, isLoading: configLoading } = useQuery<ConfigResponse>({
    queryKey: ['products-config'],
    queryFn: () => api.get('/config/products'),
    staleTime: 5 * 60 * 1000,
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    const tabFromUrl = searchParams.get('tab');
    return tabFromUrl || '1';
  });

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) { setActiveTab(tabFromUrl); }
    else if (config) { setActiveTab(String(config.defaultTab)); }
  }, [config, searchParams]);

  /** 监听滚动，标题区消失后 Tab 吸顶 + 显示金色装饰线 */
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentSeries = config ? getSeriesFromTab(activeTab, config) : 'PO';

  const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = useQuery<ProductsResponse>({
    queryKey: ['products', currentSeries],
    queryFn: () => api.get(`/products?series=${currentSeries}`),
    enabled: !!config,
    staleTime: 2 * 60 * 1000,
  });

  const products = productsData?.list || [];

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/products?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['products', currentSeries] });
    await refetchProducts();
  }, [queryClient, currentSeries, refetchProducts]);

  if (configLoading || !config) {
    return <div className="min-h-screen bg-neutral-50"><ProductsPageSkeleton /></div>;
  }

  return (
    <div className="relative min-h-screen bg-neutral-50">
      {/* 返回按钮（固定在左上角） */}
      <div className="fixed top-0 left-0 z-40 p-3 safe-area-top">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-neutral-100/80 active:scale-95 transition-all"
          aria-label={t('btn.back')}
          style={{
            background: 'rgba(250,250,248,0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <RiArrowLeftSLine className="w-6 h-6 text-neutral-600" />
        </button>
      </div>

      {/* 标题区（不吸顶，滚动时消失） */}
      <div ref={headerRef} className="px-5 pt-16 pb-4">
        <h1 className="font-heading text-[28px] leading-tight text-neutral-800">
          {t('products.title_line1')}
        </h1>
        <h1 className="font-heading text-[28px] leading-tight text-neutral-800">
          {t('products.title_line2')}
        </h1>
      </div>

      {/* Tab 栏（吸顶 + 毛玻璃 + 金色装饰线） */}
      <div
        className="sticky top-0 z-30"
        style={{
          background: isScrolled
            ? 'rgba(250,250,248,0.88)'
            : 'transparent',
          backdropFilter: isScrolled ? 'blur(20px) saturate(1.4)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(20px) saturate(1.4)' : 'none',
          transition: 'background 0.3s, backdrop-filter 0.3s',
        }}
      >
        {/* 金色装饰线（吸顶后显示） */}
        <div
          className="h-px transition-opacity duration-300"
          style={{
            opacity: isScrolled ? 1 : 0,
            background: 'linear-gradient(90deg, transparent, rgba(var(--color-gold-rgb),0.15) 50%, transparent)',
          }}
        />
        <ProductTabs
          config={config}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          className="px-5"
        />
      </div>

      {/* 产品列表 */}
      <PullToRefresh onRefresh={handleRefresh}>
        <main className="relative z-10 px-4 py-4 pb-28">
          <ProductList
            products={products}
            loading={productsLoading}
            hasMore={false}
            onLoadMore={() => {}}
          />
        </main>
      </PullToRefresh>
    </div>
  );
}

function ProductsPageSkeleton() {
  return (
    <>
      {/* 标题骨架 */}
      <div className="px-5 pt-16 pb-4 space-y-2">
        <div className="h-8 w-48 bg-neutral-200/60 rounded animate-pulse" />
        <div className="h-8 w-40 bg-neutral-200/60 rounded animate-pulse" />
      </div>
      {/* Tab 骨架 */}
      <div className="flex gap-6 px-5 pb-3 border-b border-neutral-100">
        <div className="h-5 w-20 bg-neutral-200/60 rounded animate-pulse" />
        <div className="h-5 w-20 bg-neutral-200/60 rounded animate-pulse" />
      </div>
      {/* 产品骨架 */}
      <main className="px-4 py-4 space-y-4">
        <HeroProductCardSkeleton />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (<ProductCardSkeleton key={i} />))}
        </div>
      </main>
    </>
  );
}
