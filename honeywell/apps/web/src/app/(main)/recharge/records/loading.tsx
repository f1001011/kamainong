/**
 * @file 充值记录页骨架屏
 * @description 充值记录页加载时显示的骨架屏
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function RechargeRecordsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* 顶部导航栏骨架 */}
      <header className="sticky top-0 z-20 bg-white border-b border-neutral-100">
        <div className="flex items-center h-14 px-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1 flex justify-center">
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>

        {/* Tab 骨架 */}
        <div className="flex px-4 py-3 border-b border-neutral-200">
          <Skeleton className="h-8 flex-1 rounded-lg mx-1" />
          <Skeleton className="h-8 flex-1 rounded-lg mx-1" />
          <Skeleton className="h-8 flex-1 rounded-lg mx-1" />
          <Skeleton className="h-8 flex-1 rounded-lg mx-1" />
        </div>
      </header>

      {/* 内容区域骨架 */}
      <main className="px-4 py-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-soft p-4 flex"
          >
            <Skeleton className="w-1 h-20 mr-4 rounded-full" />
            <div className="flex-1 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-5 self-center" />
          </div>
        ))}
      </main>
    </div>
  );
}
