/**
 * @file SVIP 页面骨架屏
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function SvipPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/60 via-white to-neutral-50">
      {/* Hero 骨架 */}
      <div className="relative overflow-hidden px-4 pt-14 pb-20"
        style={{ background: 'linear-gradient(160deg, #1a0a2e 0%, #2d1b4e 30%, #1e1145 60%, #0f0a1a 100%)' }}
      >
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <Skeleton className="w-20 h-20 rounded-3xl mb-4 bg-white/10" />
          <Skeleton className="h-5 w-28 mb-2 bg-white/10" />
          <Skeleton className="h-10 w-36 bg-white/10" />
          <Skeleton className="h-12 w-full rounded-2xl mt-5 bg-white/8" />
          <div className="grid grid-cols-2 gap-3 mt-5 w-full">
            <Skeleton className="h-20 rounded-2xl bg-white/5" />
            <Skeleton className="h-20 rounded-2xl bg-white/5" />
          </div>
        </div>
      </div>
      <div className="h-6 -mt-6 relative z-[1] rounded-t-3xl bg-gradient-to-b from-violet-50/60 via-white to-white" />

      {/* 卡片骨架 */}
      <div className="px-4 -mt-1 space-y-3 pb-24">
        <Skeleton className="h-6 w-40 mb-2" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
