/**
 * @file 产品详情页加载状态
 * @description Next.js 路由加载时显示的骨架屏
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function ProductDetailLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      {/* 顶部导航骨架 */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-100">
        <div className="flex h-14 items-center justify-between px-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </header>

      {/* 内容骨架 */}
      <main className="flex-1 px-4 pb-32">
        <div className="mx-auto max-w-lg py-6 space-y-6">
          {/* 产品图片骨架 */}
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />

          {/* 产品名称骨架 */}
          <div className="space-y-2">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          {/* 价格卡片骨架 */}
          <Skeleton className="h-28 w-full rounded-2xl" />

          {/* 参数骨架 */}
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>

          {/* 收益计算骨架 */}
          <Skeleton className="h-44 w-full rounded-2xl" />

          {/* 详情内容骨架 */}
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </main>

      {/* 底部骨架 */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-neutral-100 safe-area-bottom">
        <div className="mx-auto max-w-lg px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Skeleton className="h-4 w-12 mb-1" />
              <Skeleton className="h-7 w-20" />
            </div>
            <Skeleton className="h-14 flex-1 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
