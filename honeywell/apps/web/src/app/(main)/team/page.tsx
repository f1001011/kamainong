/**
 * @file 我的团队页（网络仪表盘版）
 * @description 英雄收益卡 + 网络概览卡 + 精致邀请卡 + 胶囊Tab
 * 新增 commissions summary API 调用获取各级贡献数据
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useDevice } from '@/hooks/use-media-query';
import api from '@/lib/api';

import { TeamStatsCard, type TeamStats } from '@/components/team/team-stats';
import { NetworkOverview, type CommissionSummary } from '@/components/team/network-overview';
import { InviteCard, type InviteInfo } from '@/components/team/invite-card';
import { MemberList } from '@/components/team/member-list';
import { CommissionList } from '@/components/team/commission-list';
import { SharePosterModal, type PosterData } from '@/components/team/share-poster-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { SPRINGS } from '@/lib/animation';

interface CommissionsResponse {
  list: unknown[];
  pagination: unknown;
  summary: CommissionSummary;
}

export default function TeamPage() {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();
  const { isMobile, isDesktop } = useDevice();

  const [activeTab, setActiveTab] = useState<string>('members');
  const [showPoster, setShowPoster] = useState(false);

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['team', 'stats'],
    queryFn: () => api.get<TeamStats>('/team/stats'),
  });

  const { data: inviteInfo, isLoading: isInviteLoading } = useQuery({
    queryKey: ['invite', 'info'],
    queryFn: () => api.get<InviteInfo>('/invite/info'),
  });

  // 新增：获取返佣汇总（用于网络概览卡的贡献条）
  const { data: commissionsData } = useQuery({
    queryKey: ['team', 'commissions-summary'],
    queryFn: () => api.get<CommissionsResponse>('/team/commissions?page=1&pageSize=1'),
    staleTime: 2 * 60 * 1000,
  });

  // posterData 从 inviteInfo 构造（/invite/info 返回 qrCodeUrl、inviteCode、inviteLink）
  // /invite/poster 只返回布局配置，不含实际二维码数据
  const posterData: PosterData | undefined = inviteInfo ? {
    qrCodeUrl: inviteInfo.qrCodeUrl || '',
    inviteCode: inviteInfo.inviteCode,
    inviteLink: inviteInfo.inviteLink,
  } : undefined;
  const isPosterLoading = isInviteLoading;

  const handleOpenPoster = useCallback(() => { setShowPoster(true); }, []);

  const isHeaderLoading = isStatsLoading || isInviteLoading;

  const totalMembers = stats?.totalMembers ?? stats?.totalCount ?? 0;

  // 胶囊 Tab
  const tabs = [
    { key: 'members', label: t('team.tabMembers') },
    { key: 'commissions', label: t('team.tabCommissions') },
  ];

  const headerContent = isHeaderLoading ? (
    <HeaderSkeleton />
  ) : (
    <div className="space-y-4">
      {stats && <TeamStatsCard stats={stats} />}

      <NetworkOverview
        totalMembers={totalMembers}
        level1Count={stats?.level1Count ?? 0}
        level2Count={stats?.level2Count ?? 0}
        level3Count={stats?.level3Count ?? 0}
        commissionSummary={commissionsData?.summary}
      />

      {inviteInfo && (
        <InviteCard inviteInfo={inviteInfo} onOpenPoster={handleOpenPoster} />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* 标题 */}
      <div className="px-4 pt-5 pb-2">
        <m.h1
          className="text-xl font-bold text-neutral-800 tracking-tight"
          initial={isAnimationEnabled ? { opacity: 0, y: -8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRINGS.gentle}
        >
          {t('team.pageTitle')}
        </m.h1>
      </div>

      {/* 移动端 */}
      {isMobile && (
        <div className="flex flex-col">
          <div className="px-4 pb-4">{headerContent}</div>

          {/* 胶囊 Segment Tab */}
          <div className="sticky top-0 z-20 px-4 py-2 bg-neutral-50/90 backdrop-blur-lg">
            <div className="relative flex rounded-xl bg-neutral-100/80 p-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'relative z-10 flex-1 h-10 rounded-lg text-sm font-medium transition-colors duration-200',
                      isActive ? 'text-neutral-800 font-semibold' : 'text-neutral-400',
                    )}
                  >
                    {isActive && (
                      <m.div
                        layoutId="team-tab-indicator"
                        className="absolute inset-0 rounded-lg bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1">
            {activeTab === 'members' ? <MemberList /> : <CommissionList />}
          </div>
        </div>
      )}

      {/* 桌面端 */}
      {isDesktop && (
        <div className="max-w-6xl mx-auto px-6 pb-8">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-4 space-y-4">{headerContent}</div>
            <div className="col-span-8">
              <div className="bg-white border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden">
                <div className="px-4 py-2">
                  <div className="relative flex rounded-xl bg-neutral-100/80 p-1">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={cn(
                            'relative z-10 flex-1 h-10 rounded-lg text-sm font-medium transition-colors duration-200',
                            isActive ? 'text-neutral-800 font-semibold' : 'text-neutral-400',
                          )}
                        >
                          {isActive && (
                            <m.div
                              layoutId="team-tab-desktop"
                              className="absolute inset-0 rounded-lg bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                          )}
                          <span className="relative z-10">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="min-h-[500px]">
                  {activeTab === 'members' ? <MemberList /> : <CommissionList />}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <SharePosterModal
        open={showPoster}
        onOpenChange={setShowPoster}
        posterData={posterData}
        isLoading={isPosterLoading}
      />
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-primary-500 p-5">
        <Skeleton className="h-4 w-32 !bg-white/20 mb-2" />
        <Skeleton className="h-9 w-40 !bg-white/20 mb-4" />
        <div className="grid grid-cols-3 gap-0 rounded-xl overflow-hidden bg-white/10">
          {[1, 2, 3].map(i => (
            <div key={i} className="py-3 px-2 text-center">
              <Skeleton className="h-3 w-10 mx-auto !bg-white/15 mb-1.5" />
              <Skeleton className="h-5 w-14 mx-auto !bg-white/15" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-white border border-neutral-100/80 p-5">
        <Skeleton className="h-7 w-24 mb-4" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <Skeleton className="w-6 h-4" />
            <Skeleton className="flex-1 h-2.5 rounded-full" />
            <Skeleton className="w-16 h-4" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-white border border-neutral-100/80 p-4">
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-12 w-full rounded-xl mb-3" />
        <div className="grid grid-cols-2 gap-2.5">
          <Skeleton className="h-11 rounded-xl" />
          <Skeleton className="h-11 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
