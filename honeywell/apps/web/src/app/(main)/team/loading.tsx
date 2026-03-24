/**
 * @file 团队页路由级骨架屏
 * @description Next.js 路由级加载状态组件
 * @reference 开发文档/03.10.1-我的团队页.md
 */

import { Skeleton } from '@/components/ui/skeleton';

/**
 * 统计卡片骨架屏
 */
function StatsCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-xl shadow-soft">
      {/* 返佣统计区 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      
      {/* 层级人数圆形卡片 */}
      <div className="flex items-center justify-around gap-3">
        <Skeleton circle width={80} height={80} />
        <Skeleton circle width={80} height={80} />
        <Skeleton circle width={80} height={80} />
      </div>
      
      {/* 底部统计信息 */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-neutral-200/50">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-28" />
      </div>
    </div>
  );
}

/**
 * 邀请卡片骨架屏
 */
function InviteCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-xl shadow-soft">
      {/* 标题 */}
      <Skeleton className="h-6 w-32 mb-4" />
      
      {/* 邀请码区域 */}
      <div className="mb-4">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-14 w-full" />
      </div>
      
      {/* 邀请链接区域 */}
      <div className="mb-5">
        <Skeleton className="h-4 w-28 mb-2" />
        <Skeleton className="h-11 w-full" />
      </div>
      
      {/* 按钮区域 */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    </div>
  );
}

/**
 * 成员列表骨架屏
 */
function MemberListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-soft">
          <Skeleton circle width={48} height={48} />
          <div className="flex-1">
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Tab 骨架屏
 */
function TabsSkeleton() {
  return (
    <div className="flex items-center gap-6 px-4 py-3 border-b border-neutral-100">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-5 w-24" />
    </div>
  );
}

/**
 * 团队页路由级骨架屏组件
 */
export default function TeamLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* 页面标题 */}
      <div className="px-4 pt-4 pb-2">
        <Skeleton className="h-8 w-32" />
      </div>
      
      {/* 移动端布局骨架 */}
      <div className="md:hidden flex flex-col">
        {/* 头部区域 */}
        <div className="px-4 pb-4 space-y-4">
          <StatsCardSkeleton />
          <InviteCardSkeleton />
        </div>
        
        {/* Tab 区域 */}
        <TabsSkeleton />
        
        {/* 列表区域 */}
        <div className="px-4 pt-3">
          <MemberListSkeleton />
        </div>
      </div>
      
      {/* 桌面端布局骨架 */}
      <div className="hidden md:block max-w-6xl mx-auto px-6 pb-8">
        <div className="grid grid-cols-12 gap-6">
          {/* 左侧 */}
          <div className="col-span-4 space-y-4">
            <StatsCardSkeleton />
            <InviteCardSkeleton />
          </div>
          
          {/* 右侧 */}
          <div className="col-span-8">
            <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
              <TabsSkeleton />
              <div className="p-4">
                <MemberListSkeleton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
