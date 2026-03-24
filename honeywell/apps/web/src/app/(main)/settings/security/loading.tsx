/**
 * @file 安全设置页加载状态
 * @description 安全设置页的骨架屏组件
 * @depends 开发文档/03-前端用户端/03.7.2-安全设置页.md
 */

import { Skeleton } from '@/components/ui/skeleton';

/**
 * 安全设置页骨架屏
 */
export default function SecuritySettingsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <main className="md:pl-60">
        <div className="px-4 py-6 space-y-5 max-w-3xl mx-auto">
          {/* 页面标题区骨架屏 */}
          <div className="mb-2">
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-lg" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-4 w-48 mt-2" />
          </div>

          {/* 安全设置卡片骨架屏 */}
          <div className="bg-white rounded-2xl shadow-soft-md overflow-hidden">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-4 border-b border-neutral-50 last:border-b-0"
              >
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="h-5 flex-1 max-w-[200px]" />
                <Skeleton className="w-16 h-4" />
                <Skeleton className="w-5 h-5" />
              </div>
            ))}
          </div>

          {/* 安全提示卡片骨架屏 */}
          <div className="bg-white rounded-2xl shadow-soft-md p-5">
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Skeleton className="w-1.5 h-1.5 rounded-full mt-1.5" />
                <Skeleton className="h-4 flex-1" />
              </div>
              <div className="flex items-start gap-2">
                <Skeleton className="w-1.5 h-1.5 rounded-full mt-1.5" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <div className="flex items-start gap-2">
                <Skeleton className="w-1.5 h-1.5 rounded-full mt-1.5" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>

          {/* 底部安全间距 */}
          <div className="h-20 md:h-4" />
        </div>
      </main>
    </div>
  );
}
