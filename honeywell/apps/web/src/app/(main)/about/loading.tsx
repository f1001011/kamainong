/**
 * @file 关于我们页 - 加载页面
 * @description Next.js 流式渲染时的加载UI
 */

import { cn } from '@/lib/utils';
import { AboutSkeleton } from './_components/about-skeleton';

export default function Loading() {
  return (
    <div className={cn('min-h-screen bg-white', 'md:pl-60')}>
      {/* 头部占位 */}
      <div
        className={cn(
          'sticky top-0 z-30',
          'px-4 h-14 flex items-center gap-3',
          'bg-white/70 backdrop-blur-2xl',
          'border-b border-neutral-100/60'
        )}
      >
        <div className="w-9 h-9 rounded-full bg-neutral-100" />
        <div className="h-5 w-24 bg-neutral-100 rounded" />
      </div>

      <AboutSkeleton />
    </div>
  );
}
