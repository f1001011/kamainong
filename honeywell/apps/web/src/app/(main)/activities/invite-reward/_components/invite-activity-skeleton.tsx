/**
 * @file 拉新裂变活动页骨架屏
 * @description 活动页面加载状态占位组件
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.3-拉新裂变活动页.md
 */

'use client';

import { cn } from '@/lib/utils';
import { RewardTiersSkeleton } from '@/components/business/reward-tiers';
import { InviteListSkeleton } from '@/components/activities/invite-list';

/**
 * InviteActivitySkeleton 活动页骨架屏
 * @description 活动页面加载时的占位组件
 */
export function InviteActivitySkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-6 space-y-4">
      {/* 头部骨架 */}
      <div className="rounded-2xl bg-gradient-to-br from-primary-50/50 via-white to-primary-50/50 border border-primary-100/30 p-5 animate-pulse">
        <div className="h-6 w-48 rounded bg-neutral-200 mb-2" />
        <div className="h-4 w-64 rounded bg-neutral-200 mb-4" />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/80 rounded-xl px-4 py-2.5">
            <div className="size-10 rounded-full bg-neutral-200" />
            <div>
              <div className="h-3 w-20 rounded bg-neutral-200 mb-1" />
              <div className="h-7 w-12 rounded bg-neutral-200" />
            </div>
          </div>
        </div>
      </div>

      {/* 进度条骨架 */}
      <div className="rounded-xl bg-white border border-neutral-100 p-4 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-32 rounded bg-neutral-200" />
          <div className="h-5 w-16 rounded bg-neutral-200" />
        </div>
        <div className="h-2 w-full rounded-full bg-neutral-200 mb-2" />
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-neutral-200" />
          <div className="h-4 w-16 rounded bg-neutral-200" />
        </div>
      </div>

      {/* 阶梯骨架 */}
      <div>
        <div className="h-5 w-32 rounded bg-neutral-200 mb-3" />
        <RewardTiersSkeleton count={3} />
      </div>

      {/* 邀请列表骨架 */}
      <InviteListSkeleton count={3} />
    </div>
  );
}
