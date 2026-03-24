/**
 * @file 提现记录页骨架屏
 * @description 提现记录页面加载时显示的骨架屏
 * @depends 开发文档/03-前端用户端/03.5-提现模块/03.5.2-提现记录页.md 第7.1节
 */

import { Skeleton } from '@/components/ui/skeleton';

/**
 * 提现记录页骨架屏
 */
export default function WithdrawRecordsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* 顶部导航栏骨架 */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="flex items-center h-14 px-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1 flex justify-center">
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>

        {/* Tab 骨架 */}
        <div className="flex gap-2 overflow-hidden px-4 py-3 border-b border-neutral-100">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-full shrink-0" />
          ))}
        </div>
      </header>

      {/* 内容区域骨架 */}
      <main className="px-4 py-4 md:px-6">
        <div className="space-y-4">
          {/* 订单卡片骨架 */}
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-soft overflow-hidden flex"
            >
              {/* 左侧状态色条 */}
              <Skeleton className="w-1 shrink-0" />
              
              {/* 内容区域 */}
              <div className="flex-1 p-4 space-y-3">
                {/* 订单号 + 状态 */}
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                
                {/* 金额 */}
                <Skeleton className="h-6 w-28" />
                
                {/* 银行卡信息 */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-3.5 rounded" />
                  <Skeleton className="h-3 w-36" />
                </div>
                
                {/* 时间 */}
                <Skeleton className="h-3 w-28" />
              </div>

              {/* 右侧箭头 */}
              <div className="flex items-center pr-3">
                <Skeleton className="h-5 w-5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
