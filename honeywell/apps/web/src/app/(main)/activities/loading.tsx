/**
 * @file 活动中心页面加载状态
 * @description Next.js App Router 流式加载时显示的骨架屏
 */

import { ActivityListSkeleton } from '@/components/activities/activity-list-skeleton';

export default function ActivitiesLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-6">
      <ActivityListSkeleton count={3} />
    </div>
  );
}
