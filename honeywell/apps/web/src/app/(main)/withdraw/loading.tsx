/**
 * @file 提现页加载骨架屏
 * @description Next.js 页面加载状态
 * @reference 开发文档/03-前端用户端/03.5-财务模块/03.5.1-提现页.md 第7.1-7.2节
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function WithdrawLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* 顶部导航骨架 */}
      <div className="h-14 flex items-center justify-between px-4">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="w-24 h-6" />
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>

      {/* 依据：03.5.1-提现页.md 第4.3节 - 电脑端两列布局 */}
      <div className="px-4 py-5">
        <div className="max-w-5xl mx-auto md:grid md:grid-cols-2 md:gap-6 space-y-5 md:space-y-0">
          {/* 左列骨架 */}
          <div className="space-y-5">
            {/* 余额卡片骨架 */}
            <div className="bg-white rounded-2xl p-6 shadow-soft space-y-3">
              <Skeleton className="w-32 h-4" />
              <Skeleton className="w-48 h-10" />
              <Skeleton className="w-40 h-4" />
            </div>

            {/* 提示卡片骨架 */}
            <Skeleton className="w-full h-16 rounded-2xl" />

            {/* 限制提示骨架 */}
            <Skeleton className="w-full h-28 rounded-2xl" />
          </div>

          {/* 右列骨架 */}
          <div className="space-y-5">
            {/* 金额输入区骨架 */}
            <div className="bg-white rounded-2xl p-6 shadow-soft space-y-4">
              <Skeleton className="w-24 h-5" />
              <div className="flex gap-3">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="flex-1 h-12 rounded-xl" />
                ))}
              </div>
              <Skeleton className="w-full h-12 rounded-lg" />
              <Skeleton className="w-full h-24 rounded-xl" />
            </div>

            {/* 银行卡骨架 */}
            <div className="bg-white rounded-2xl p-6 shadow-soft space-y-3">
              <Skeleton className="w-20 h-5" />
              <div className="flex gap-3 overflow-hidden">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="w-36 h-24 rounded-xl flex-shrink-0" />
                ))}
              </div>
            </div>

            {/* 按钮骨架 */}
            <Skeleton className="w-full h-14 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
