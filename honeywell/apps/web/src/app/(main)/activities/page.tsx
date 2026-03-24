/**
 * @file 活动中心页面（成就画廊版）
 * @description 简化头部 + 白底卡片 + 并行请求详情API获取进度数据
 * 传递里程碑tiers、进度计数到 ActivityCard
 */

'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { m, LazyMotion, domAnimation } from 'motion/react';
import { RiTrophyFill } from '@remixicon/react';
import api from '@/lib/api';
import { useText } from '@/hooks/use-text';
import { useStaggerInView } from '@/hooks/use-in-view-animation';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { EmptyState } from '@/components/business/empty-state';
import { ActivityCard, type ActivityProgressData, type MilestoneTier } from '@/components/activities/activity-card';
import { ActivityListSkeleton } from '@/components/activities/activity-list-skeleton';
import { SPRINGS } from '@/lib/animation';
import type { Activity, ActivitiesResponse, InviteActivityData, CollectionActivityData } from '@/types';

async function fetchActivities(): Promise<Activity[]> {
  const response = await api.get<ActivitiesResponse>('/activities');
  return response.list || [];
}

/**
 * 从邀请活动详情构造进度数据
 */
function buildInviteProgress(data: InviteActivityData): ActivityProgressData {
  const tiers: MilestoneTier[] = data.tiers.map(t => ({
    reward: t.reward,
    status: t.status,
  }));

  const nextTier = data.tiers.find(t => t.status !== 'CLAIMED');

  return {
    current: data.validInviteCount,
    nextRequired: nextTier?.requiredCount,
    unit: 'دعوة',
    tiers,
  };
}

/**
 * 从连单活动详情构造进度数据
 */
function buildCollectionProgress(data: CollectionActivityData): ActivityProgressData {
  const tiers: MilestoneTier[] = data.tiers.map(t => ({
    reward: t.reward,
    status: t.status,
  }));

  const currentCount = data.purchasedProducts?.length ?? 0;
  const nextTier = data.tiers.find(t => t.status !== 'CLAIMED');
  const nextRequired = nextTier?.requiredProducts?.length;

  return {
    current: currentCount,
    nextRequired,
    unit: 'منتج',
    tiers,
  };
}

function ActivityList({
  activities,
  progressMap,
}: {
  activities: Activity[];
  progressMap: Record<string, ActivityProgressData | null>;
}) {
  const { containerRef, containerProps, itemProps } = useStaggerInView({
    itemCount: activities.length,
    variant: 'fadeUp',
    staggerSpeed: 'normal',
  });

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        {...containerProps}
        className="space-y-4"
      >
        {activities.map((activity, index) => (
          <m.div key={activity.code} {...itemProps(index)}>
            <ActivityCard
              activity={activity}
              progress={progressMap[activity.code] || null}
              index={index}
            />
          </m.div>
        ))}
      </m.div>
    </LazyMotion>
  );
}

export default function ActivitiesPage() {
  const t = useText();

  const {
    data: activities = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['activities'],
    queryFn: fetchActivities,
    staleTime: 30 * 1000,
  });

  // 并行请求活动详情获取进度数据
  const hasInvite = activities.some(a => a.code === 'INVITE_REWARD');
  const hasCollection = activities.some(a => a.code === 'COLLECTION_BONUS');

  const { data: inviteData } = useQuery({
    queryKey: ['activity-invite-progress'],
    queryFn: () => api.get<InviteActivityData>('/activities/invite'),
    enabled: hasInvite && !isLoading,
    staleTime: 2 * 60 * 1000,
  });

  const { data: collectionData } = useQuery({
    queryKey: ['activity-collection-progress'],
    queryFn: () => api.get<CollectionActivityData>('/activities/collection'),
    enabled: hasCollection && !isLoading,
    staleTime: 2 * 60 * 1000,
  });

  // 构建活动进度映射
  const progressMap = useMemo<Record<string, ActivityProgressData | null>>(() => {
    const map: Record<string, ActivityProgressData | null> = {};
    if (inviteData) map['INVITE_REWARD'] = buildInviteProgress(inviteData);
    if (collectionData) map['COLLECTION_BONUS'] = buildCollectionProgress(collectionData);
    return map;
  }, [inviteData, collectionData]);

  const handleRefresh = async () => { await refetch(); };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="px-4 pt-6 pb-4">
          <div className="h-7 w-48 bg-neutral-200/40 rounded-lg animate-pulse mb-1.5" />
          <div className="h-4 w-64 bg-neutral-200/40 rounded animate-pulse" />
        </div>
        <div className="px-4">
          <ActivityListSkeleton count={2} />
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <ActivityHeader />
        <div className="flex items-center justify-center px-4 py-20">
          <EmptyState
            icon={<RiTrophyFill className="w-12 h-12 text-neutral-400" />}
            title={t('activities.empty_title')}
            description={t('activities.empty_description')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-neutral-50">
      <PullToRefresh onRefresh={handleRefresh}>
        <ActivityHeader />
        <div className="relative z-10 px-4 pb-24">
          <ActivityList activities={activities} progressMap={progressMap} />
        </div>
      </PullToRefresh>
    </div>
  );
}

/**
 * 简化页面头部（去掉 FloatingOrbs 和图标容器）
 */
function ActivityHeader() {
  const t = useText();

  return (
    <LazyMotion features={domAnimation}>
      <div className="px-4 pt-6 pb-4">
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={SPRINGS.gentle}>
          <h1 className="text-xl font-bold text-neutral-800 tracking-tight">
            {t('page.activities')}
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            {t('activities.subtitle')}
          </p>
        </m.div>
      </div>
    </LazyMotion>
  );
}
