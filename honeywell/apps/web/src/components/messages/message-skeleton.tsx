/**
 * @file 消息列表骨架屏组件
 * @description 消息加载中的占位骨架
 * @depends 开发文档/03-前端用户端/03.12-消息模块/03.12.1-消息列表页.md 第五节
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * MessageSkeleton 组件属性
 */
export interface MessageSkeletonProps {
  /** 骨架项数量 */
  count?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * MessageCardSkeleton 单条消息骨架
 */
function MessageCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white shadow-soft">
      {/* 图标占位 */}
      <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />

      {/* 内容区域 */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* 标题 */}
        <Skeleton className="h-4 w-3/4" />
        {/* 内容预览 */}
        <Skeleton className="h-3 w-full" />
        {/* 时间 */}
        <Skeleton className="h-3 w-16" />
      </div>

      {/* 箭头占位 */}
      <Skeleton className="w-5 h-5 rounded flex-shrink-0" />
    </div>
  );
}

/**
 * MessageHeaderSkeleton 头部骨架
 */
export function MessageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between py-4">
      {/* 左侧 */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      {/* 右侧按钮 */}
      <Skeleton className="h-8 w-28 rounded-md" />
    </div>
  );
}

/**
 * MessageDateGroupSkeleton 日期分组骨架
 */
export function MessageDateGroupSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {/* 日期标签 */}
      <Skeleton className="h-4 w-16 ml-1" />
      {/* 消息卡片列表 */}
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, index) => (
          <MessageCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

/**
 * MessageSkeleton 消息列表完整骨架屏
 * @description 依据：03.12.1-消息列表页.md - 骨架屏设计
 *
 * @example
 * ```tsx
 * <MessageSkeleton count={5} />
 * ```
 */
export function MessageSkeleton({ count = 5, className }: MessageSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* 头部骨架 */}
      <MessageHeaderSkeleton />
      {/* 两组日期分组骨架 */}
      <MessageDateGroupSkeleton count={Math.ceil(count / 2)} />
      <MessageDateGroupSkeleton count={Math.floor(count / 2)} />
    </div>
  );
}

/**
 * NotificationDetailSkeleton 消息详情骨架屏
 * @description 依据：03.12.2-消息详情页.md - 骨架屏设计
 */
export function NotificationDetailSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {/* 返回按钮 */}
      <Skeleton className="h-6 w-16" />

      {/* 头部 */}
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* 分割线 */}
      <Skeleton className="h-px w-full" />

      {/* 内容区域 */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
