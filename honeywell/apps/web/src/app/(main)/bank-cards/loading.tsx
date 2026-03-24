/**
 * @file 银行卡列表页加载状态
 * @description 使用骨架屏展示银行卡列表页的加载状态
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function BankCardsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* 顶部导航骨架 */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-neutral-100 bg-white">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="w-32 h-6" />
        <div className="w-10" />
      </div>

      {/* 内容骨架 */}
      <div className="px-4 py-5">
        <div className="max-w-2xl mx-auto space-y-5">
          {/* 安全提示骨架 */}
          <Skeleton className="w-full h-20 rounded-xl" />

          {/* 数量提示骨架 */}
          <div className="flex justify-between">
            <Skeleton className="w-32 h-5" />
          </div>

          {/* 银行卡骨架 */}
          {[1, 2].map((i) => (
            <div key={i} className="w-full aspect-[1.586/1] max-w-[360px] mx-auto">
              <Skeleton className="w-full h-full rounded-2xl" />
            </div>
          ))}

          {/* 添加按钮骨架 */}
          <div className="w-full aspect-[1.586/1] max-w-[360px] mx-auto">
            <div className="w-full h-full rounded-2xl border-2 border-dashed border-neutral-200 flex items-center justify-center">
              <Skeleton className="w-14 h-14 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
