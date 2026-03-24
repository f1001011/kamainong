/**
 * @file 个人中心页加载骨架
 * @description 页面加载时显示的骨架屏
 */

import { Skeleton } from '@/components/ui/skeleton';

/**
 * 个人中心加载骨架
 */
export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <main className="md:pl-60">
        <div className="px-4 py-6 space-y-5 max-w-3xl mx-auto">
          {/* 用户信息卡片骨架 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft-md p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-100">
              <Skeleton className="h-5 w-40 mx-auto" />
            </div>
          </div>

          {/* 余额卡片骨架 */}
          <div className="bg-white rounded-2xl shadow-soft-md p-5">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-100 flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>

          {/* 菜单列表骨架 */}
          <div className="bg-white rounded-2xl shadow-soft-md overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-50 last:border-b-0"
              >
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="w-5 h-5" />
              </div>
            ))}
          </div>

          {/* 退出按钮骨架 */}
          <div className="pt-4">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>

          {/* 底部间距 */}
          <div className="h-20 md:h-4" />
        </div>
      </main>
    </div>
  );
}
