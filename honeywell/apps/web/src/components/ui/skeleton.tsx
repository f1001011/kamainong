/**
 * @file 骨架屏组件
 * @description 加载状态的占位组件，带有闪光动画
 * @reference 开发文档/01-设计系统/01.2-动画系统.md
 */

'use client';

import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * 骨架屏组件属性
 */
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** 是否使用圆形 */
  circle?: boolean;
  /** 宽度 */
  width?: string | number;
  /** 高度 */
  height?: string | number;
}

/**
 * 基础骨架屏组件
 * @description 带有闪光动画的加载占位
 * 
 * @example
 * ```tsx
 * <Skeleton className="h-12 w-full" />
 * <Skeleton circle width={40} height={40} />
 * ```
 */
export function Skeleton({
  className,
  circle = false,
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden animate-gold-shimmer',
        circle ? 'rounded-full' : 'rounded-lg',
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
      {...props}
    >
      {/* animate-gold-shimmer 提供香槟金闪光效果，与 Metropolitan Prestige 主题一致 */}
    </div>
  );
}

/**
 * 产品卡片骨架屏
 * @description 产品列表加载时的占位
 */
export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl bg-white p-4 shadow-soft">
      {/* 图片占位 */}
      <Skeleton className="h-32 w-full mb-3" />
      
      {/* 标题占位 */}
      <Skeleton className="h-5 w-3/4 mb-2" />
      
      {/* 描述占位 */}
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      
      {/* 价格和收益占位 */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

/**
 * 余额卡片骨架屏
 * @description 余额显示区域加载时的占位
 */
export function BalanceCardSkeleton() {
  return (
    <div className="rounded-xl bg-gradient-to-br from-primary-400 to-primary-500 p-6 text-white">
      {/* 标签占位 */}
      <Skeleton className="h-4 w-20 bg-white/20 mb-2" />
      
      {/* 金额占位 */}
      <Skeleton className="h-10 w-48 bg-white/20 mb-4" />
      
      {/* 小额信息占位 */}
      <div className="flex gap-6">
        <div>
          <Skeleton className="h-3 w-16 bg-white/20 mb-1" />
          <Skeleton className="h-5 w-24 bg-white/20" />
        </div>
        <div>
          <Skeleton className="h-3 w-16 bg-white/20 mb-1" />
          <Skeleton className="h-5 w-24 bg-white/20" />
        </div>
      </div>
    </div>
  );
}

/**
 * 列表项骨架屏
 * @description 通用列表项加载时的占位
 */
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      {/* 图标占位 */}
      <Skeleton circle width={40} height={40} />
      
      {/* 内容占位 */}
      <div className="flex-1">
        <Skeleton className="h-4 w-32 mb-1" />
        <Skeleton className="h-3 w-48" />
      </div>
      
      {/* 右侧内容占位 */}
      <Skeleton className="h-5 w-20" />
    </div>
  );
}

/**
 * 表单骨架屏
 * @description 表单加载时的占位
 */
export function FormSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index}>
          {/* 标签占位 */}
          <Skeleton className="h-4 w-20 mb-2" />
          {/* 输入框占位 */}
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      {/* 按钮占位 */}
      <Skeleton className="h-11 w-full mt-6" />
    </div>
  );
}
