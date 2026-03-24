/**
 * @file 产品列表页加载骨架屏
 * @description Next.js 路由级加载状态，匹配重构后的衬线标题+下划线Tab布局
 */

import { ProductCardSkeleton, HeroProductCardSkeleton } from '@/components/business/product-card';

export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* 标题骨架 */}
      <div className="px-5 pt-16 pb-4 space-y-2">
        <div className="h-8 w-48 bg-neutral-200/60 rounded animate-pulse" />
        <div className="h-8 w-40 bg-neutral-200/60 rounded animate-pulse" />
      </div>

      {/* Tab 骨架（下划线式） */}
      <div className="flex gap-6 px-5 pb-3 border-b border-neutral-100">
        <div className="h-5 w-20 bg-neutral-200/60 rounded animate-pulse" />
        <div className="h-5 w-20 bg-neutral-200/60 rounded animate-pulse" />
      </div>

      {/* 产品列表骨架 */}
      <main className="px-4 py-4 space-y-4">
        <HeroProductCardSkeleton />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </main>
    </div>
  );
}
