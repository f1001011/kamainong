/**
 * @file 安全设置页
 * @description 用户安全中心，展示账号安全相关设置
 * @depends 开发文档/03-前端用户端/03.7.2-安全设置页.md
 * @depends 01.1-设计Token.md - 2026高端美学配色
 * @depends 02.3-前端API接口清单.md - GET /api/user/profile
 * 
 * 2026高端美学设计要点：
 * - 银行APP级安全感设计
 * - 白色卡片 + 微妙阴影
 * - 绑定状态用绿色勾
 * - 手机号脱敏显示 ***-***-4321
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { m, LazyMotion, domAnimation, MotionConfig } from 'motion/react';
import {
  RiLockPasswordLine,
  RiPhoneLine,
  RiShieldCheckLine,
} from '@remixicon/react';

import api from '@/lib/api';
import { useUserStore } from '@/stores/user';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { cn } from '@/lib/utils';
import { listContainerVariants, listItemVariants } from '@/lib/animation/variants';

// 组件
import { SecurityItem } from '@/components/settings';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * 用户资料响应类型
 * 依据：02.3-前端API接口清单.md 第3.1节
 */
interface UserProfileResponse {
  id: number;
  phone: string;
  nickname: string | null;
  avatar: string | null;
  inviteCode: string;
  vipLevel: number;
  svipLevel: number;
}

/**
 * 格式化手机号脱敏显示
 * @description 格式：***-***-4321
 * @param phone 原始手机号
 * @returns 脱敏后的手机号
 */
function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) {
    return '***-***-****';
  }
  // 获取最后4位
  const lastFour = phone.slice(-4);
  return `***-***-${lastFour}`;
}

/**
 * 安全设置页骨架屏
 */
function SecurityPageSkeleton() {
  return (
    <div className="space-y-4">
      {/* 页面头部占位 */}
      <div className="h-6" />
      
      {/* 安全设置卡片骨架屏 */}
      <div className="bg-white rounded-2xl shadow-soft-md overflow-hidden">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-4 border-b border-neutral-50 last:border-b-0"
          >
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-5 flex-1 max-w-[200px]" />
            <Skeleton className="w-16 h-4" />
            <Skeleton className="w-5 h-5" />
          </div>
        ))}
      </div>

      {/* 账号安全提示骨架屏 */}
      <div className="bg-white rounded-2xl shadow-soft-md p-4">
        <Skeleton className="h-5 w-32 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

/**
 * 安全设置页面
 * @description 展示账号安全相关设置入口
 * - 修改密码
 * - 账号绑定状态（手机号）
 */
export default function SecuritySettingsPage() {
  const t = useText();
  const { getSpring, isAnimationEnabled } = useAnimationConfig();
  const { token } = useUserStore();

  // 获取用户资料
  // 依据：02.3-前端API接口清单.md 第3.1节 - GET /api/user/profile
  // 仅在有 token 时请求，避免未登录时 401 错误
  const {
    data: userProfile,
    isLoading,
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => api.get<UserProfileResponse>('/user/profile'),
    enabled: !!token,
    staleTime: 30 * 1000, // 30秒缓存
  });

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <main className="md:pl-60">
          <div className="px-4 py-6 max-w-3xl mx-auto">
            <SecurityPageSkeleton />
          </div>
        </main>
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig
        transition={{ ...getSpring('gentle') }}
        reducedMotion={isAnimationEnabled ? 'never' : 'always'}
      >
        {/* 页面容器 */}
        <div className="min-h-screen bg-immersive">
          {/* 主内容区 */}
          <main className="md:pl-60">
            <m.div
              variants={listContainerVariants}
              initial="hidden"
              animate="visible"
              className="px-4 py-6 space-y-5 max-w-3xl mx-auto"
            >
              {/* 页面标题区 */}
              <m.div variants={listItemVariants} className="mb-2">
                <h1 className="text-xl font-bold tracking-tight text-neutral-800 flex items-center gap-2">
                  <RiShieldCheckLine className="w-6 h-6 text-primary-500" />
                  {t('security.title')}
                </h1>
                <p className="text-sm text-neutral-400 mt-1">
                  {t('security.subtitle')}
                </p>
              </m.div>

              {/* 安全设置列表 */}
              <m.section variants={listItemVariants}>
                <div className="bg-white rounded-2xl shadow-soft-md overflow-hidden">
                  {/* 修改密码 */}
                  <SecurityItem
                    icon={<RiLockPasswordLine className="w-5 h-5" />}
                    title={t('security.change_password')}
                    route="/settings/password"
                    className="border-b border-neutral-50"
                  />

                  {/* 手机号绑定状态 */}
                  <SecurityItem
                    icon={<RiPhoneLine className="w-5 h-5" />}
                    title={t('security.phone_binding')}
                    value={maskPhone(userProfile?.phone || '')}
                    status="bound"
                    showArrow={false}
                  />
                </div>
              </m.section>

              {/* 安全提示卡片 */}
              <m.section variants={listItemVariants}>
                <div className={cn(
                  'bg-white rounded-2xl shadow-soft-md p-5',
                  'border-l-4 border-l-primary-400'
                )}>
                  <h3 className="text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                    <RiShieldCheckLine className="w-4 h-4 text-primary-500" />
                    {t('security.tips_title')}
                  </h3>
                  <ul className="space-y-2 text-sm text-neutral-500">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                      {t('security.tip_1')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                      {t('security.tip_2')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                      {t('security.tip_3')}
                    </li>
                  </ul>
                </div>
              </m.section>

              {/* 底部安全间距（为底部导航预留空间） */}
              <div className="h-20 md:h-4" />
            </m.div>
          </main>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
