/**
 * @file 首页主组件
 * @description 建筑精度（Architectural Precision）布局：
 * 深邃英雄区（问候语+衬线余额+金色分割线）→ 编辑式投资面板 → Bento不等宽网格（签到62%+团队38%）
 * → 地产画廊横向滑动 → Banner → 公告弹窗
 */

'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { m, LazyMotion, domAnimation, MotionConfig, useScroll, useTransform } from 'motion/react';
import api from '@/lib/api';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useUserStore } from '@/stores/user';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';

import { signinQueryKeys } from '@/hooks/use-signin';
import { SectionTitle } from '@/components/ui/section-title';
import { HomeHeader, type HeaderUserInfo } from '@/components/home/home-header';
import { HomeBanner, type BannerItem } from '@/components/home/home-banner';
import { HomeBalanceCard, type BalanceData } from '@/components/home/home-balance-card';
import { HomeInvestmentCard, type PositionSummary } from '@/components/home/home-investment-card';
import { HomeSigninCard } from '@/components/home/home-signin-card';
import { HomeTeamCard, type TeamStats } from '@/components/home/home-team-card';
import { HomePropertyGallery } from '@/components/home/home-property-gallery';
import { HomeAnnouncementModal, isAnnouncementDismissed, type AnnouncementData } from '@/components/home/home-announcement-modal';
import type { ProductCardData } from '@/components/business/product-card-row';
import type { SignInStatusResponse } from '@/types/signin';
import type { QuickEntryItem } from '@/components/home/home-quick-nav';

interface HomeConfigResponse {
  quickEntries: QuickEntryItem[];
  recommendProducts: ProductCardData[];
  bannerVisible?: boolean;
  todayIncomeVisible?: boolean;
  signInEntryVisible?: boolean;
  marqueeVisible?: boolean;
  recommendEnabled?: boolean;
  recommendTitle?: string;
}

interface UserProfileResponse extends HeaderUserInfo {
  availableBalance: string;
  frozenBalance: string;
  todayIncome: string;
  totalIncome: string;
  teamCount: number;
  canWithdraw: boolean;
}

interface AnnouncementsResponse { list: AnnouncementData[]; }
interface PositionsResponse { list: unknown[]; summary: PositionSummary; pagination: unknown; }

function getGreeting(t: (key: string, fallback?: string) => string, timezone: string): string {
  const hour = parseInt(
    new Date().toLocaleString('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }),
    10
  );
  if (hour >= 5 && hour < 12) return t('greeting.morning');
  if (hour >= 12 && hour < 19) return t('greeting.afternoon');
  return t('greeting.evening');
}

export default function HomePage() {
  const { getSpring, isAnimationEnabled } = useAnimationConfig();
  const { token } = useUserStore();
  const t = useText();
  const { config } = useGlobalConfig();
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<AnnouncementData | null>(null);
  const [greeting, setGreeting] = useState('');

  const { scrollY } = useScroll();
  const heroBackgroundY = useTransform(scrollY, [0, 300], [0, -90]);
  const heroContentY = useTransform(scrollY, [0, 300], [0, -30]);

  const { data: homeConfig, isLoading: isConfigLoading } = useQuery({
    queryKey: ['homeConfig'],
    queryFn: () => api.get<HomeConfigResponse>('/config/home'),
    staleTime: 5 * 60 * 1000,
  });

  const { data: bannersData, isLoading: isBannersLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: () => api.get<{ list: BannerItem[] }>('/banners'),
    staleTime: 5 * 60 * 1000,
  });

  const { data: userProfile, isLoading: isUserLoading } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => api.get<UserProfileResponse>('/user/profile'),
    enabled: !!token,
    staleTime: 30 * 1000,
  });

  const { data: signinStatus, isLoading: isSigninLoading } = useQuery({
    queryKey: signinQueryKeys.status(),
    queryFn: () => api.get<SignInStatusResponse>('/signin/status'),
    enabled: !!token,
    staleTime: 60 * 1000,
  });

  const { data: unreadData } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => api.get<{ count: number }>('/notifications/unread-count'),
    enabled: !!token,
    staleTime: 30 * 1000,
  });

  const { data: announcementsData } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get<AnnouncementsResponse>('/announcements'),
    staleTime: 5 * 60 * 1000,
  });

  const { data: positionsData, isLoading: isPositionsLoading } = useQuery({
    queryKey: ['positionSummary'],
    queryFn: () => api.get<PositionsResponse>('/positions'),
    enabled: !!token,
    staleTime: 60 * 1000,
  });

  const { data: teamStats, isLoading: isTeamLoading } = useQuery({
    queryKey: ['teamStats'],
    queryFn: () => api.get<TeamStats>('/team/stats'),
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    setGreeting(getGreeting(t, config.systemTimezone));
  }, [t, config.systemTimezone]);

  useEffect(() => {
    const list = announcementsData?.list;
    if (list && list.length > 0) {
      const unreadAnnouncement = list.find(
        (a: AnnouncementData) => !isAnnouncementDismissed(a.id)
      );
      if (unreadAnnouncement) {
        setCurrentAnnouncement(unreadAnnouncement);
        setShowAnnouncement(true);
      }
    }
  }, [announcementsData]);

  const handleCloseAnnouncement = () => {
    setShowAnnouncement(false);
    setCurrentAnnouncement(null);
  };

  const headerUser: HeaderUserInfo | undefined = userProfile
    ? { id: userProfile.id, nickname: userProfile.nickname, avatarUrl: userProfile.avatarUrl, vipLevel: userProfile.vipLevel, svipLevel: userProfile.svipLevel }
    : undefined;

  const balanceData: BalanceData | undefined = userProfile
    ? { availableBalance: userProfile.availableBalance, frozenBalance: userProfile.frozenBalance, todayIncome: userProfile.todayIncome, totalIncome: userProfile.totalIncome }
    : undefined;

  const nickname = userProfile?.nickname;

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig transition={{ ...getSpring('gentle') }} reducedMotion={isAnimationEnabled ? 'never' : 'always'}>
        <div className="relative min-h-screen bg-neutral-50">

          {/* ━━━ 英雄区：深邃翡翠渐变 + 材质纹理 ━━━ */}
          <m.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden noise-texture"
          >
            {/* 多层渐变背景（玉石材质感） */}
            <m.div className="absolute inset-0" style={{ y: heroBackgroundY }}>
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(170deg, var(--color-dark-950) 0%, var(--color-dark-900) 55%, var(--color-primary-800) 100%)',
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(ellipse 60% 50% at 10% 90%, rgba(var(--color-gold-rgb), 0.08) 0%, transparent 60%)',
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(ellipse 50% 40% at 85% 15%, rgba(var(--color-primary-rgb), 0.15) 0%, transparent 50%)',
                }}
              />
            </m.div>

            {/* 极微小右上角翡翠光点 */}
            <div
              className="absolute -top-32 -right-32 w-64 h-64 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(var(--color-primary-rgb), 0.06) 0%, transparent 60%)',
              }}
            />

            {/* 金色细线分割（替代波浪线） */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[1px] z-20"
              style={{
                background: 'linear-gradient(90deg, transparent 5%, rgba(var(--color-gold-rgb), 0.25) 30%, rgba(var(--color-gold-rgb), 0.35) 50%, rgba(var(--color-gold-rgb), 0.25) 70%, transparent 95%)',
              }}
            />

            <m.div className="relative z-10 md:pl-60" style={{ y: heroContentY }}>
              <HomeHeader immersive user={headerUser} unreadCount={unreadData?.count || 0} isLoading={isUserLoading} />

              {/* 问候语 */}
              <div className="px-5 pt-3">
                <m.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="font-heading text-[26px] font-light text-white/40 leading-tight"
                >
                  {greeting}{nickname ? `, ${nickname}` : ''}
                </m.p>
              </div>

              <div className="px-5 pt-3 pb-10">
                <HomeBalanceCard
                  variant="immersive"
                  balance={balanceData}
                  isLoading={isUserLoading}
                  todayIncomeVisible={homeConfig?.todayIncomeVisible !== false}
                />
              </div>
            </m.div>
          </m.section>

          {/* ━━━ 内容区：暖米白背景 + 建筑节奏间距 ━━━ */}
          <main
            className="relative z-10 md:pl-60"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(var(--color-primary-rgb), 0.02) 0%, transparent 50%), var(--color-neutral-50)',
            }}
          >
            <div className="px-4 max-w-3xl mx-auto">

              {/* 投资组合 */}
              <div className="pt-8">
                <SectionTitle textKey="home.myPortfolio" fallback="محفظتي" />
                <m.div
                  className="mt-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <HomeInvestmentCard summary={positionsData?.summary} isLoading={isPositionsLoading || isUserLoading} />
                </m.div>
              </div>

              {/* 签到 + 团队（Bento 不等宽） */}
              <m.div
                className="mt-7 grid gap-3"
                style={{ gridTemplateColumns: '1.62fr 1fr' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <HomeSigninCard status={signinStatus} isLoading={isSigninLoading} />
                <HomeTeamCard stats={teamStats} teamCount={userProfile?.teamCount} isLoading={isTeamLoading || isUserLoading} />
              </m.div>

              {/* 产品画廊 */}
              {homeConfig?.recommendEnabled !== false && (
                <div className="mt-9">
                  <SectionTitle textKey="home.featuredProperties" fallback="عقارات مميزة" />
                  <m.div
                    className="mt-4"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                  >
                    <HomePropertyGallery
                      products={homeConfig?.recommendProducts}
                      isLoading={isConfigLoading}
                    />
                  </m.div>
                </div>
              )}

              {/* Banner */}
              {homeConfig?.bannerVisible !== false && (
                <m.div
                  className="mt-8"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <HomeBanner banners={bannersData?.list} isLoading={isBannersLoading} autoPlayInterval={5000} />
                </m.div>
              )}

              <div className="h-28 md:h-4" />
            </div>
          </main>

          <HomeAnnouncementModal announcement={currentAnnouncement} open={showAnnouncement} onClose={handleCloseAnnouncement} />
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
