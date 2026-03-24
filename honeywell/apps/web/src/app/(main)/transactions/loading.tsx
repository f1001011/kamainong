/**
 * @file 资金明细页加载状态
 * @description Next.js 自动加载组件
 */

import { Skeleton } from '@/components/ui/skeleton';
import { TransactionListSkeleton } from '@/components/transactions';

export default function TransactionsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* 顶部导航栏骨架 */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="flex items-center h-14 px-4">
          <div className="w-9 h-9 rounded-lg bg-neutral-100 animate-pulse" />
          <div className="flex-1 flex justify-center">
            <div className="h-5 w-24 bg-neutral-100 rounded animate-pulse" />
          </div>
          <div className="w-9 h-9 rounded-lg bg-neutral-100 animate-pulse" />
        </div>

        {/* 筛选区域骨架 */}
        <div className="px-4 pb-3 space-y-3">
          {/* 类型筛选骨架 */}
          <div className="flex gap-2 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton
                key={i}
                className="h-9 w-16 rounded-full flex-shrink-0"
              />
            ))}
          </div>
        </div>
      </header>

      {/* 内容骨架 */}
      <main className="px-4 py-4 md:px-6">
        <TransactionListSkeleton count={8} />
      </main>
    </div>
  );
}
