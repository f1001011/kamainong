/**
 * @file 提现订单详情页骨架屏
 * @description 提现订单详情页加载时显示的骨架屏
 * @depends 开发文档/03-前端用户端/03.5-提现模块/03.5.3-提现订单详情页.md 第7.1节
 */

import { Skeleton } from '@/components/ui/skeleton';

/**
 * 提现订单详情页骨架屏
 */
export default function WithdrawOrderDetailLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* 顶部导航栏骨架 */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="flex items-center h-14 px-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1 flex justify-center">
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="w-9" />
        </div>
      </header>

      {/* 内容区域骨架 */}
      <main className="px-4 py-4 md:px-6">
        <div className="space-y-4">
          {/* 订单号卡片骨架 */}
          <div className="bg-white rounded-xl shadow-soft p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>

          {/* 金额信息卡片骨架 */}
          <div className="bg-white rounded-xl shadow-soft p-4">
            <div className="space-y-0">
              {/* 申请金额 */}
              <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-7 w-28" />
              </div>
              {/* 手续费 */}
              <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              {/* 实际到账 */}
              <div className="flex justify-between items-center py-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>

          {/* 银行卡信息卡片骨架 */}
          <div className="bg-white rounded-xl shadow-soft p-4">
            <div className="space-y-0">
              {/* 银行名称 */}
              <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-44" />
              </div>
              {/* 账号 */}
              <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
              </div>
              {/* 持卡人 */}
              <div className="flex justify-between items-center py-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </div>

          {/* 状态与时间卡片骨架 */}
          <div className="bg-white rounded-xl shadow-soft p-4">
            <div className="space-y-0">
              {/* 状态 */}
              <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              {/* 创建时间 */}
              <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-36" />
              </div>
              {/* 审核时间 */}
              <div className="flex justify-between items-center py-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
