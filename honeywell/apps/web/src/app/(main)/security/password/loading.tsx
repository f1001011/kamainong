/**
 * @file 修改密码页加载状态
 * @description 修改密码页的骨架屏组件
 * @depends 开发文档/03-前端用户端/03.7.3-修改密码页.md 第7.2节
 */
import { Skeleton } from '@/components/ui/skeleton';

export default function PasswordLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* 标题栏骨架 */}
      <div className="h-14 flex items-center px-4 gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="w-40 h-6" />
      </div>

      {/* 内容区域骨架 */}
      <div className="px-4 pt-6 md:max-w-md md:mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-soft space-y-5">
          {/* 输入框骨架 x3 */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="w-32 h-4" />
              <Skeleton className="w-full h-12 rounded-xl" />
            </div>
          ))}

          {/* 强度条骨架 */}
          <Skeleton className="w-full h-1.5 rounded-full" />

          {/* 按钮骨架 */}
          <div className="pt-4">
            <Skeleton className="w-full h-12 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
