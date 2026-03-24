/**
 * @file 首页顶部状态栏
 * @description "Obsidian Aurora 3.0" - 透明融合式头部
 * 支持沉浸式模式（immersive），在翡翠绿渐变背景上使用白色文字图标
 * 非沉浸式模式保持原有透明融合样式
 */

'use client';

import { m } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import {
  RiNotification3Line,
  RiUserLine,
} from '@remixicon/react';
import { fadeVariants } from '@/lib/animation/variants';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useText } from '@/hooks/use-text';
import { VipBadge } from '@/components/business/vip-badge';
import { UnreadDot } from '@/components/ui/unread-dot';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * 用户信息类型
 */
export interface HeaderUserInfo {
  id: number;
  nickname: string;
  avatarUrl?: string | null;
  vipLevel: number;
  svipLevel: number;
}

/**
 * 首页顶部状态栏属性
 */
export interface HomeHeaderProps {
  user?: HeaderUserInfo | null;
  unreadCount?: number;
  isLoading?: boolean;
  /** 沉浸式模式 - 在翡翠绿渐变背景上使用白色文字图标，非粘性定位 */
  immersive?: boolean;
  className?: string;
}

/**
 * 首页顶部状态栏组件
 * @description "Obsidian Aurora 3.0" 透明融合式头部
 * immersive=true 时切换为白色图标/文字，适配深色渐变背景
 */
export function HomeHeader({
  user,
  unreadCount = 0,
  isLoading = false,
  immersive = false,
  className,
}: HomeHeaderProps) {
  const { config: globalConfig } = useGlobalConfig();
  const t = useText();

  // 加载状态
  if (isLoading) {
    return (
      <header className={cn(
        immersive ? 'relative z-10' : 'sticky top-0 z-40',
        'md:pl-60',
        className
      )}>
        <div className="flex items-center justify-between h-14 px-5">
          <Skeleton width={100} height={28} className={immersive ? '!bg-white/10' : undefined} />
          <div className="flex items-center gap-3">
            <Skeleton circle width={36} height={36} className={immersive ? '!bg-white/10' : undefined} />
            <Skeleton circle width={36} height={36} className={immersive ? '!bg-white/10' : undefined} />
          </div>
        </div>
      </header>
    );
  }

  return (
    <m.header
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        /* 沉浸式：不粘顶，融入英雄区；默认：粘顶透明头部 */
        immersive ? 'relative z-10' : 'sticky top-0 z-40',
        'md:pl-60',
        className
      )}
    >
      <div className="flex items-center justify-between h-14 px-5">
        {/* 左侧：Logo + 品牌名 */}
        <div className="flex items-center gap-2.5">
          {globalConfig.siteLogo ? (
            <Image
              src={globalConfig.siteLogo}
              alt={globalConfig.siteName || 'Logo'}
              width={100}
              height={28}
              className={cn('h-7 w-auto', immersive && 'brightness-0 invert')}
              priority
            />
          ) : (
            <span className={cn(
              'text-xl font-black tracking-tight',
              immersive ? 'text-white' : 'text-neutral-800'
            )}>
              {globalConfig.siteName || 'lendlease'}
            </span>
          )}
          {/* VIP 徽章 */}
          {user && (user.svipLevel > 0 || user.vipLevel > 0) && (
            <div className="ml-0.5">
              {user.svipLevel > 0 ? (
                <VipBadge type="svip" level={user.svipLevel} size="sm" />
              ) : (
                <VipBadge type="vip" level={user.vipLevel} size="sm" />
              )}
            </div>
          )}
        </div>

        {/* 右侧：消息 + 头像 */}
        <div className="flex items-center gap-2">
          {/* 消息入口 - 简洁圆形 */}
          <Link
            href="/messages"
            className={cn(
              'relative flex items-center justify-center w-9 h-9 rounded-full',
              immersive
                ? 'bg-white/10 hover:bg-white/20'
                : 'bg-neutral-100/70 hover:bg-neutral-200/70',
              'active:scale-95',
              'transition-all duration-200'
            )}
            aria-label={t('nav.notifications')}
          >
            <RiNotification3Line className={cn(
              'w-[18px] h-[18px]',
              immersive ? 'text-white/80' : 'text-neutral-500'
            )} />
            <span className="absolute -top-0.5 -right-0.5">
              <UnreadDot count={unreadCount} max={99} size="sm" pulse />
            </span>
          </Link>

          {/* 头像 - 带边框的圆形 */}
          <Link
            href="/profile"
            className={cn(
              'flex items-center justify-center w-9 h-9 rounded-full overflow-hidden',
              immersive
                ? 'bg-white/10 ring-2 ring-white/20 hover:ring-white/30'
                : 'bg-gradient-to-br from-neutral-100 to-neutral-50 ring-2 ring-transparent hover:ring-primary-300/50',
              'active:scale-95',
              'transition-all duration-200'
            )}
            aria-label={t('nav.profile')}
          >
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.nickname || t('nav.profile')}
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            ) : (
              <RiUserLine className={cn(
                'w-[18px] h-[18px]',
                immersive ? 'text-white/60' : 'text-neutral-400'
              )} />
            )}
          </Link>
        </div>
      </div>
    </m.header>
  );
}
