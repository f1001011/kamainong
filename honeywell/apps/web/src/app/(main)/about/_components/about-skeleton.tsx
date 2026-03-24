/**
 * @file 关于我们页骨架屏
 * @description 页面加载时的占位UI - 匹配高端沉浸式设计
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * 关于我们页骨架屏
 */
export function AboutSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Hero区域骨架 - 渐变背景 */}
      <div
        className="relative pt-16 pb-24 md:pt-20 md:pb-32 px-6"
        style={{
          background: 'linear-gradient(160deg, var(--color-dark-900) 0%, var(--color-dark-800) 15%, var(--color-primary-700) 35%, var(--color-primary-600) 55%, var(--color-primary-500) 75%, var(--color-primary-400) 100%)',
        }}
      >
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <Skeleton className="h-10 md:h-14 w-72 mx-auto bg-white/15 rounded-lg" />
          <Skeleton className="h-5 w-56 mx-auto bg-white/10 rounded-lg" />
          <Skeleton className="h-[2px] w-12 mx-auto bg-white/15 rounded-full mt-6" />
        </div>
      </div>

      {/* 内容区域骨架 */}
      <div className="max-w-4xl mx-auto">
        <div className="py-10 md:py-14 px-5 md:px-8">
          <div className="max-w-3xl mx-auto space-y-4">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
            <Skeleton className="h-4 w-full rounded mt-6" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
        </div>

        <div className="py-10 md:py-14 px-5 md:px-8">
          <div className="max-w-3xl mx-auto">
            <Skeleton className="aspect-video rounded-2xl" />
          </div>
        </div>

        <div className="py-10 md:py-14 px-5 md:px-8">
          <div className="max-w-3xl mx-auto space-y-4">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
