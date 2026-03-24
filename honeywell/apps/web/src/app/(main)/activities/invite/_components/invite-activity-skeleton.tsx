/**
 * @file 拉新裂变活动页骨架屏 - 重构版
 * @description 匹配全宽深色 Hero + 时间线布局的骨架屏
 * @depends 活动邀请.md 第十二节 - 骨架屏改造
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * 活动页骨架屏 - 匹配深色沉浸式 Hero + 时间线新布局
 */
export function InviteActivitySkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* 全宽深色 Hero 骨架 */}
      <div
        className="relative overflow-hidden noise-texture"
        style={{
          background: 'linear-gradient(170deg, var(--color-dark-950) 0%, var(--color-dark-900) 55%, var(--color-primary-800) 100%)',
        }}
      >
        <div className="px-5 pt-10 pb-12 flex flex-col items-center">
          {/* 活动标题骨架 */}
          <div className="self-start mb-6 space-y-2">
            <Skeleton className="h-6 w-48 !bg-white/8" />
            <Skeleton className="h-4 w-64 !bg-white/8" />
          </div>

          {/* 环形进度骨架 */}
          <Skeleton className="w-[140px] h-[140px] rounded-full !bg-white/8 mb-2" />
          <Skeleton className="h-3 w-28 !bg-white/8 mb-4" />

          {/* 里程碑点阵骨架 */}
          <div className="flex items-center gap-2 mb-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="w-2.5 h-2.5 rounded-full !bg-white/8" />
            ))}
          </div>

          {/* 三栏统计骨架 */}
          <div className="w-full bg-white/6 rounded-2xl p-4 backdrop-blur-sm mx-5">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Skeleton className="h-5 w-10 !bg-white/8" />
                  <Skeleton className="h-3 w-14 !bg-white/8" />
                </div>
              ))}
            </div>
          </div>

          {/* CTA 按钮骨架 */}
          <Skeleton className="h-12 w-full rounded-xl !bg-white/8 mt-5 mx-5" />
        </div>

        {/* 金色分割线 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[1px] z-20"
          style={{
            background: 'linear-gradient(90deg, transparent 5%, rgba(var(--color-gold-rgb), 0.25) 30%, rgba(var(--color-gold-rgb), 0.35) 50%, rgba(var(--color-gold-rgb), 0.25) 70%, transparent 95%)',
          }}
        />
      </div>

      {/* 内容区骨架 */}
      <div className="px-4 pt-8 max-w-2xl mx-auto space-y-8">
        {/* SectionTitle + 时间线骨架 */}
        <div>
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-[0.5px] flex-1" />
          </div>
          <div className="pl-10 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <Skeleton className={`h-${i <= 2 ? '5' : '12'} flex-1 rounded-xl`} />
              </div>
            ))}
          </div>
        </div>

        {/* 规则区骨架 */}
        <div>
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-[0.5px] flex-1" />
          </div>
          <div className="card-metallic rounded-2xl p-4">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-7 h-7 rounded-lg" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
