/**
 * @file 充值订单详情页骨架屏
 * @description 订单详情页加载时显示的骨架屏
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function RechargeOrderDetailLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* 顶部导航栏骨架 */}
      <header className="sticky top-0 z-20 bg-white border-b border-neutral-100">
        <div className="flex items-center h-14 px-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1 flex justify-center">
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="w-9" />
        </div>
      </header>

      {/* 内容区域骨架 */}
      <main className="px-4 py-4 space-y-4">
        {/* 订单号卡片骨架 */}
        <div className="bg-white rounded-xl shadow-soft p-4">
          <Skeleton className="h-4 w-24 mb-2" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>

        {/* 金额信息卡片骨架 */}
        <div className="bg-white rounded-xl shadow-soft p-4 space-y-4">
          <div className="flex justify-between py-3 border-b border-neutral-100">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-28" />
          </div>
          <div className="flex justify-between py-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* 状态与通道卡片骨架 */}
        <div className="bg-white rounded-xl shadow-soft p-4 space-y-4">
          <div className="flex justify-between py-3 border-b border-neutral-100">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="flex justify-between py-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* 时间信息卡片骨架 */}
        <div className="bg-white rounded-xl shadow-soft p-4 space-y-4">
          <div className="flex justify-between py-3 border-b border-neutral-100">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="flex justify-between py-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>

        {/* 按钮骨架 */}
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 flex-1 rounded-xl" />
        </div>
      </main>
    </div>
  );
}
