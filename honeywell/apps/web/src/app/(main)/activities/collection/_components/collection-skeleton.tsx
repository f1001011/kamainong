/**
 * @file 连单奖励活动页骨架屏
 * @description 页面加载时的占位UI
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.4-连单奖励活动页.md 第4.8节
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * 连单奖励活动页骨架屏
 * @description 依据：03.11.4-连单奖励活动页.md 第4.8节 - 加载状态设计
 * 
 * 布局结构：
 * - 前置条件卡片骨架
 * - 已购产品收藏区骨架
 * - 阶梯卡片骨架 x3
 * - 活动规则区骨架
 * 
 * @example
 * ```tsx
 * <CollectionSkeleton />
 * ```
 */
export function CollectionSkeleton() {
  return (
    <div className="space-y-5">
      {/* 前置条件卡片骨架 - 毛玻璃风格 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-neutral-100/80 shadow-soft-sm flex items-start gap-3">
        <Skeleton className="w-11 h-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* 已购产品收藏区骨架 - 毛玻璃风格 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-neutral-100/80 shadow-soft">
        <div className="flex items-center justify-center gap-2 mb-5">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <div className="flex flex-col items-center py-8 mb-4">
          <Skeleton className="w-16 h-16 rounded-2xl mb-3" />
          <Skeleton className="h-4 w-44" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      {/* 区块标题骨架 */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>

      {/* 阶梯卡片骨架 x3 - 毛玻璃风格 */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-neutral-100/80 shadow-soft-sm">
          <div className="flex items-start gap-3.5">
            <Skeleton className="w-11 h-11 rounded-xl" />
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {Array.from({ length: i + 2 }).map((_, j) => (
                  <Skeleton key={j} className="h-6 w-14 rounded-lg" />
                ))}
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* 活动规则区骨架 - 毛玻璃风格 */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-neutral-100/80 shadow-soft-sm p-4">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-7 h-7 rounded-lg" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}
