/**
 * @file 充值页加载状态
 * @description Next.js 自动加载骨架屏
 * @reference 开发文档/03-前端用户端/03.4-充值模块/03.4.1-充值页.md
 */

import { Skeleton } from '@/components/ui/skeleton';

/**
 * 充值页骨架屏
 * @description 页面加载时显示的骨架屏
 */
export default function RechargeLoading() {
  return (
    <div className="min-h-screen py-6 space-y-5">
      {/* 标题骨架 */}
      <Skeleton className="h-8 w-32" />

      {/* 提示卡片骨架 */}
      <Skeleton className="h-20 w-full rounded-2xl" />

      {/* 金额选择卡片骨架 */}
      <div className="bg-white shadow-soft rounded-2xl p-6 space-y-4">
        {/* 标签骨架 */}
        <Skeleton className="h-5 w-16" />

        {/* 档位网格骨架 */}
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>

        {/* 分割线骨架 */}
        <div className="flex items-center gap-4">
          <Skeleton className="flex-1 h-px" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="flex-1 h-px" />
        </div>

        {/* 输入框骨架 */}
        <Skeleton className="h-14 w-full rounded-xl" />

        {/* 范围提示骨架 */}
        <Skeleton className="h-4 w-40" />
      </div>

      {/* 按钮骨架 */}
      <Skeleton className="h-14 w-full rounded-xl" />

      {/* 记录入口骨架 */}
      <Skeleton className="h-14 w-full rounded-xl" />
    </div>
  );
}
