/**
 * @file 连单奖励活动页加载状态
 * @description Next.js App Router 自动渲染的 loading UI
 */

import { CollectionSkeleton } from './_components/collection-skeleton';

export default function CollectionBonusLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* 顶部导航栏骨架 */}
      <header className="sticky top-0 z-10 bg-white border-b border-neutral-100">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 animate-pulse" />
          <div className="h-6 w-32 rounded bg-neutral-100 animate-pulse" />
        </div>
      </header>

      <main className="p-4">
        <CollectionSkeleton />
      </main>
    </div>
  );
}
