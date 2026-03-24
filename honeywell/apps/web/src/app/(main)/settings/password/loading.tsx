/**
 * @file 修改密码页加载状态
 * @description 修改密码页的骨架屏组件
 * @depends 开发文档/03-前端用户端/03.7.3-修改密码页.md
 */

import { Skeleton } from '@/components/ui/skeleton';

/**
 * 修改密码页骨架屏
 */
export default function ChangePasswordLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <main className="md:pl-60">
        <div className="px-4 py-6 space-y-5 max-w-lg mx-auto">
          {/* 页面标题区骨架屏 */}
          <div className="text-center mb-6">
            {/* 图标 */}
            <Skeleton className="w-16 h-16 mx-auto mb-4 rounded-2xl" />
            
            {/* 标题 */}
            <div className="flex items-center justify-center gap-2">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="h-6 w-40" />
            </div>
            
            {/* 描述 */}
            <Skeleton className="h-4 w-64 mx-auto mt-2" />
          </div>

          {/* 表单卡片骨架屏 */}
          <div className="bg-white rounded-2xl shadow-soft-md p-6 space-y-6">
            {/* 旧密码字段 */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>

            {/* 新密码字段 */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-11 w-full rounded-lg" />
              {/* 密码强度条 */}
              <Skeleton className="h-1 w-full rounded-full mt-2" />
              <Skeleton className="h-3 w-24 mt-1" />
            </div>

            {/* 确认密码字段 */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>

            {/* 提交按钮 */}
            <div className="pt-4">
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>

          {/* 安全提示骨架屏 */}
          <div className="bg-gold-50 rounded-xl p-4 border border-gold-200">
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>

          {/* 底部安全间距 */}
          <div className="h-20 md:h-4" />
        </div>
      </main>
    </div>
  );
}
