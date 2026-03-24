/**
 * @file 活动列表骨架屏组件
 * @description 活动中心页面加载状态的占位组件
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.1-活动中心页.md 第4.8节
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * 活动卡片骨架屏
 * @description 单个活动卡片的加载占位
 * 
 * 布局规范：
 * - 与 ActivityCard 保持一致的尺寸和间距
 * - 64x64 图标区 + 内容区
 */
function ActivityCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-5 border border-neutral-100 shadow-soft">
      <div className="flex items-center gap-4">
        {/* 图标占位 */}
        <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />

        {/* 内容占位 */}
        <div className="flex-1 min-w-0">
          {/* 标题占位 */}
          <Skeleton className="h-5 w-32 mb-2" />
          {/* 描述占位 */}
          <Skeleton className="h-4 w-48" />
        </div>

        {/* 箭头占位 */}
        <Skeleton className="w-5 h-5 rounded flex-shrink-0" />
      </div>
    </div>
  );
}

/**
 * 活动列表骨架屏组件
 * @description 依据：03.11.1-活动中心页.md 第4.8节 - 骨架屏设计
 * 
 * @param count - 骨架屏数量，默认 3 个
 * 
 * @example
 * ```tsx
 * <ActivityListSkeleton />
 * <ActivityListSkeleton count={5} />
 * ```
 */
export function ActivityListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <ActivityCardSkeleton key={index} />
      ))}
    </div>
  );
}

export { ActivityCardSkeleton };
