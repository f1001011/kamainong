/**
 * @file 安全设置页加载状态
 * @description 安全设置页的骨架屏组件
 * @depends 开发文档/03-前端用户端/03.7.2-安全设置页.md
 * 
 * 说明：本页面为静态内容，无API请求，实际上不需要骨架屏
 * 但为了保持一致性，提供简单的加载状态
 */
import { Skeleton } from '@/components/ui/skeleton';

export default function SecurityLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* 标题栏骨架 */}
      <div className="h-14 flex items-center px-4 gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="w-48 h-6" />
      </div>

      {/* 内容区域骨架 */}
      <div className="px-4 md:px-6 md:max-w-2xl md:mx-auto pt-4 space-y-4">
        {/* 功能卡片骨架 */}
        <div className="bg-white rounded-2xl p-5 shadow-soft">
          <div className="flex items-start gap-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
