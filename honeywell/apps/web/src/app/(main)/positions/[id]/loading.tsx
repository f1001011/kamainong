/**
 * @file 持仓详情页加载状态
 * @description Next.js 自动加载组件
 */

import { PositionDetailSkeleton } from '@/components/positions/position-detail';

export default function PositionDetailLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* 顶部导航栏骨架 */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="flex items-center h-14 px-4">
          <div className="w-9 h-9 rounded-lg bg-neutral-100 animate-pulse" />
          <div className="flex-1 flex justify-center">
            <div className="h-5 w-36 bg-neutral-100 rounded animate-pulse" />
          </div>
          <div className="w-9 h-9 rounded-lg bg-neutral-100 animate-pulse" />
        </div>
      </header>

      {/* 内容骨架 */}
      <main className="px-4 py-4 md:px-6">
        <PositionDetailSkeleton />
      </main>
    </div>
  );
}
