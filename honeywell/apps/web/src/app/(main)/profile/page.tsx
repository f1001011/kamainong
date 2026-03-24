/**
 * @file 个人中心页
 * @description "Obsidian Aurora 3.0" - 深空英雄头部 + 浮动卡片布局
 * 深色渐变头部区域融入余额展示，白色内容区浮在上方
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { m, LazyMotion, domAnimation, MotionConfig } from 'motion/react';
import { RiLogoutBoxRLine, RiSmartphoneLine, RiArrowRightSLine } from '@remixicon/react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { isNativeApp } from '@/lib/capacitor';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useUserStore } from '@/stores/user';
import { listContainerVariants, listItemVariants } from '@/lib/animation/variants';
import { cn } from '@/lib/utils';

import { BalanceDisplay } from '@/components/business/balance-display';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import { InfoTooltip } from '@/components/ui/tooltip';

import {
  UserInfoCard,
  MenuList,
  EditNicknameModal,
  EditAvatarModal,
  type MenuItem,
} from '@/components/profile';

/**
 * 用户资料响应类型
 */
interface UserProfileResponse {
  id: number;
  phone: string;
  nickname: string | null;
  avatar: string | null;
  inviteCode: string;
  vipLevel: number;
  svipLevel: number;
  availableBalance: string;
  frozenBalance: string;
  todayIncome: string;
  totalIncome: string;
  teamCount: number;
}

interface ProfileConfigResponse {
  menuItems: MenuItem[];
}

interface UpdateProfileRequest {
  nickname?: string;
  avatar?: string;
}

interface UpdateProfileResponse {
  id: number;
  nickname: string | null;
  avatar: string | null;
}

interface UploadResponse {
  url: string;
}

/**
 * 个人中心页面
 */
export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useText();
  const { config } = useGlobalConfig();
  const { getSpring, isAnimationEnabled } = useAnimationConfig();
  const { logout: logoutStore, token } = useUserStore();

  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isInApp, setIsInApp] = useState(false);

  useEffect(() => {
    setIsInApp(isNativeApp());
  }, []);

  const {
    data: userProfile,
    isLoading: isProfileLoading,
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => api.get<UserProfileResponse>('/user/profile'),
    enabled: !!token,
    staleTime: 30 * 1000,
  });

  const {
    data: profileConfig,
    isLoading: isConfigLoading,
  } = useQuery({
    queryKey: ['profileConfig'],
    queryFn: () => api.get<ProfileConfigResponse>('/config/profile'),
    staleTime: 5 * 60 * 1000,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) =>
      api.put<UpdateProfileResponse>('/user/profile', data as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success(t('toast.update_success'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.update_failed'));
    },
  });

  const handleUploadAvatar = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'avatar');
    const response = await api.request<UploadResponse>('/upload', {
      method: 'POST',
      body: formData,
    });
    return response.url;
  };

  const logoutMutation = useMutation({
    mutationFn: () => api.post<void>('/auth/logout'),
    onSuccess: () => {
      logoutStore();
      queryClient.clear();
      router.replace('/login');
      toast.success(t('toast.logout_success'));
    },
    onError: () => {
      logoutStore();
      queryClient.clear();
      router.replace('/login');
    },
  });

  const handleUpdateNickname = async (nickname: string) => {
    await updateProfileMutation.mutateAsync({ nickname });
  };

  const handleSaveAvatar = async (avatarUrl: string) => {
    await updateProfileMutation.mutateAsync({ avatar: avatarUrl });
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig
        transition={{ ...getSpring('gentle') }}
        reducedMotion={isAnimationEnabled ? 'never' : 'always'}
      >
        <div className="relative min-h-screen">
          {/* 翡翠绿英雄背景 */}
          <div className="absolute top-0 inset-x-0 h-72 overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-dark-800)]/95 via-[var(--color-primary-700)]/85 via-[var(--color-primary-600)]/75 to-[var(--color-primary-400)]/65" />
            {/* 白色装饰光晕 */}
            <m.div
              animate={isAnimationEnabled ? { scale: [1, 1.15, 1], opacity: [0.12, 0.2, 0.12] } : {}}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-12 -right-12 w-56 h-56 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)' }}
            />
            <m.div
              animate={isAnimationEnabled ? { scale: [1.1, 1, 1.1], opacity: [0.1, 0.18, 0.1] } : {}}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-24 -left-12 w-44 h-44 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(var(--color-gold-rgb),0.25) 0%, transparent 70%)' }}
            />
            {/* 光线效果 */}
            <div className="absolute top-0 left-0 right-0 h-full opacity-[0.06]"
              style={{ background: 'radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.5) 0%, transparent 50%)' }}
            />
          </div>

          {/* 渐变过渡区域 */}
          <div className="absolute top-48 inset-x-0 h-36 bg-gradient-to-b from-transparent via-[#fafaf9]/60 to-[#fafaf9] pointer-events-none" />
          <div className="absolute top-[340px] inset-x-0 bottom-0 bg-[#fafaf9] pointer-events-none" />

          {/* 主内容区 */}
          <main className="relative z-10 md:pl-60">
            <m.div
              variants={listContainerVariants}
              initial="hidden"
              animate="visible"
              className="px-4 py-6 space-y-5 max-w-3xl mx-auto"
            >
              {/* 用户信息卡片 */}
              <m.section variants={listItemVariants}>
                <UserInfoCard
                  nickname={userProfile?.nickname ?? null}
                  avatar={userProfile?.avatar ?? null}
                  phone={userProfile?.phone ?? ''}
                  vipLevel={userProfile?.vipLevel ?? 0}
                  svipLevel={userProfile?.svipLevel ?? 0}
                  inviteCode={userProfile?.inviteCode ?? ''}
                  isLoading={isProfileLoading}
                  onEditNickname={() => setShowNicknameModal(true)}
                  onEditAvatar={() => setShowAvatarModal(true)}
                />
              </m.section>

              {/* 余额卡片 - 浮动玻璃效果 */}
              <m.section variants={listItemVariants}>
                <div className="card-floating p-5">
                  <BalanceDisplay
                    balance={userProfile?.availableBalance ?? '0.00'}
                    label={t('label.available_balance')}
                    showToggle
                    balanceClassName="text-3xl"
                  />
                  <div className="mt-4 pt-4 flex justify-between items-center"
                    style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-neutral-400 font-medium">
                        {t('label.frozen_balance')}
                      </span>
                      <InfoTooltip
                        content={t('tip.frozen_balance')}
                        size="sm"
                      />
                    </div>
                    <span className="text-sm font-bold text-neutral-600">
                      {formatCurrency(userProfile?.frozenBalance ?? '0.00', config)}
                    </span>
                  </div>
                </div>
              </m.section>

              {/* 下载 App 卡片 - 仅浏览器端显示，APK 内不显示 */}
              {!isInApp && (
                <m.section variants={listItemVariants}>
                  <button
                    onClick={() => router.push('/profile/app-download')}
                    className="w-full card-hero-warm rounded-2xl p-4 flex items-center gap-4 text-left relative overflow-hidden"
                  >
                    <div className="absolute inset-0 opacity-[0.06]" style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(255,255,255,0.5) 0%, transparent 60%)' }} />
                    <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 relative z-10">
                      <RiSmartphoneLine className="w-5 h-5 text-gold-400" />
                    </div>
                    <div className="flex-1 min-w-0 relative z-10">
                      <p className="text-sm font-bold text-white">
                        {t('profile.download_app')}
                      </p>
                      <p className="text-xs text-white/50 mt-0.5">
                        {t('profile.download_desc')}
                      </p>
                    </div>
                    <RiArrowRightSLine className="w-5 h-5 text-white/30 flex-shrink-0 relative z-10" />
                  </button>
                </m.section>
              )}

              {/* 功能菜单 */}
              <m.section variants={listItemVariants}>
                <MenuList
                  items={profileConfig?.menuItems ?? []}
                  isLoading={isConfigLoading}
                />
              </m.section>

              {/* 退出按钮 */}
              <m.section variants={listItemVariants} className="pt-4">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowLogoutDialog(true)}
                  className={cn(
                    'card-floating border-neutral-200/40',
                    'text-error hover:bg-red-50/80 hover:border-red-200/50',
                    'h-12 rounded-2xl'
                  )}
                >
                  <RiLogoutBoxRLine className="w-5 h-5 mr-2" />
                  {t('btn.logout')}
                </Button>
              </m.section>

              <div className="h-20 md:h-4" />
            </m.div>
          </main>
        </div>

        <EditNicknameModal
          open={showNicknameModal}
          onOpenChange={setShowNicknameModal}
          currentNickname={userProfile?.nickname ?? null}
          onSubmit={handleUpdateNickname}
          isSubmitting={updateProfileMutation.isPending}
        />

        <EditAvatarModal
          open={showAvatarModal}
          onOpenChange={setShowAvatarModal}
          currentAvatar={userProfile?.avatar ?? null}
          onUpload={handleUploadAvatar}
          onSave={handleSaveAvatar}
          isSubmitting={updateProfileMutation.isPending}
        />

        <ConfirmDialog
          open={showLogoutDialog}
          onOpenChange={setShowLogoutDialog}
          type="warning"
          title={t('dialog.logout_title')}
          description={t('dialog.logout_desc')}
          confirmText={t('btn.confirm')}
          cancelText={t('btn.cancel')}
          onConfirm={handleLogout}
          isLoading={logoutMutation.isPending}
        />
      </MotionConfig>
    </LazyMotion>
  );
}
