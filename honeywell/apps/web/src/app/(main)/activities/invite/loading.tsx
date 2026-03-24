/**
 * @file 拉新裂变活动页加载状态
 * @description Next.js App Router 流式加载时显示的骨架屏
 * @route /activities/invite
 */

import { InviteActivitySkeleton } from './_components/invite-activity-skeleton';

export default function InviteRewardLoading() {
  return <InviteActivitySkeleton />;
}
