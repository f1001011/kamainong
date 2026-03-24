/**
 * @file 添加银行卡页加载状态
 * @description 使用骨架屏展示添加银行卡页的加载状态
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function AddBankCardLoading() {
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
        <div className="max-w-lg mx-auto space-y-5">
          {/* 安全提示骨架 */}
          <Skeleton className="w-full h-20 rounded-xl" />

          {/* 表单骨架 */}
          <div className="bg-white rounded-2xl p-6 shadow-soft space-y-6">
            {/* 银行选择器骨架 */}
            <div className="space-y-2">
              <Skeleton className="w-20 h-5" />
              <Skeleton className="w-full h-12 rounded-lg" />
            </div>

            {/* 账号骨架 */}
            <div className="space-y-2">
              <Skeleton className="w-32 h-5" />
              <Skeleton className="w-full h-11 rounded-lg" />
            </div>

            {/* 持卡人姓名骨架 */}
            <div className="space-y-2">
              <Skeleton className="w-28 h-5" />
              <Skeleton className="w-full h-11 rounded-lg" />
            </div>

            {/* 手机号骨架 */}
            <div className="space-y-2">
              <Skeleton className="w-32 h-5" />
              <Skeleton className="w-full h-11 rounded-lg" />
            </div>

            {/* 证件类型骨架 */}
            <div className="space-y-2">
              <Skeleton className="w-28 h-5" />
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-11 rounded-lg" />
                ))}
              </div>
            </div>

            {/* 证件号骨架 */}
            <div className="space-y-2">
              <Skeleton className="w-32 h-5" />
              <Skeleton className="w-full h-11 rounded-lg" />
            </div>

            {/* 账户类型骨架 */}
            <div className="space-y-2">
              <Skeleton className="w-24 h-5" />
              <div className="grid grid-cols-2 gap-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-11 rounded-lg" />
                ))}
              </div>
            </div>

            {/* 按钮骨架 */}
            <div className="pt-4 space-y-3">
              <Skeleton className="w-full h-14 rounded-xl" />
              <Skeleton className="w-full h-12 rounded-lg" />
            </div>
          </div>

          {/* 底部提示骨架 */}
          <div className="flex justify-center">
            <Skeleton className="w-48 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
