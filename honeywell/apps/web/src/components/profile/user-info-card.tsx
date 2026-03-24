/**
 * @file 用户信息卡片组件
 * @description 个人中心顶部用户信息展示卡片，包含头像、昵称、VIP角标、邀请码
 * @depends 开发文档/03-前端用户端/03.7.1-个人中心页.md
 * @depends 01.1-设计Token.md - 2026高端美学配色
 */

'use client';

import { m } from 'motion/react';
import { RiEditLine, RiCameraLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { VipBadge } from '@/components/business/vip-badge';
import { CopyButton } from '@/components/ui/copy-button';
import { Skeleton } from '@/components/ui/skeleton';
import { useText } from '@/hooks/use-text';
import { scaleVariants } from '@/lib/animation';

/**
 * 用户信息卡片属性
 */
export interface UserInfoCardProps {
  /** 用户昵称 */
  nickname: string | null;
  /** 用户头像URL */
  avatar: string | null;
  /** 手机号（用于显示默认昵称） */
  phone: string;
  /** VIP等级 */
  vipLevel: number;
  /** SVIP等级 */
  svipLevel: number;
  /** 邀请码 */
  inviteCode: string;
  /** 是否正在加载 */
  isLoading?: boolean;
  /** 点击编辑昵称回调 */
  onEditNickname?: () => void;
  /** 点击编辑头像回调 */
  onEditAvatar?: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 用户信息卡片组件
 * @description 依据：开发文档/03.7.1-个人中心页.md
 * 
 * 2026高端美学设计要点：
 * - 毛玻璃效果卡片
 * - 圆形头像带编辑按钮
 * - VIP/SVIP角标优雅展示
 * - 邀请码大字体展示带一键复制
 * 
 * @example
 * ```tsx
 * <UserInfoCard
 *   nickname="用户昵称"
 *   avatar="/uploads/avatar/xxx.png"
 *   phone="987654321"
 *   vipLevel={3}
 *   svipLevel={2}
 *   inviteCode="XYZ45678"
 *   onEditNickname={() => setShowNicknameModal(true)}
 *   onEditAvatar={() => setShowAvatarModal(true)}
 * />
 * ```
 */
export function UserInfoCard({
  nickname,
  avatar,
  phone,
  vipLevel,
  svipLevel,
  inviteCode,
  isLoading = false,
  onEditNickname,
  onEditAvatar,
  className,
}: UserInfoCardProps) {
  const t = useText();

  // 显示昵称：有昵称展示昵称，无昵称展示完整手机号
  const displayName = nickname || phone;

  // 默认头像
  const defaultAvatar = '/images/avatar-default.png';

  // 加载状态
  if (isLoading) {
    return (
      <div className={cn('glass shadow-soft-lg rounded-2xl p-6', className)}>
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-neutral-100">
          <Skeleton className="h-5 w-40 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <m.div
      variants={scaleVariants}
      initial="initial"
      animate="animate"
      className={cn(
        // 2026高端美学：增强毛玻璃效果和阴影
        'bg-white/90 backdrop-blur-xl shadow-soft-lg rounded-2xl p-6',
        'border border-white/60',
        'relative overflow-hidden',
        className
      )}
    >
      {/* 背景装饰渐变 - 更丰富的层次 */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary-100/60 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-primary-100/40 to-transparent rounded-full translate-y-1/2 -translate-x-1/2 blur-lg" />
      
      {/* 用户信息区 */}
      <div className="relative flex items-center gap-4">
        {/* 头像 */}
        <div className="relative group">
          <div 
            className={cn(
              'w-20 h-20 rounded-full overflow-hidden',
              'border-2 border-white shadow-soft-md',
              'cursor-pointer transition-all duration-200',
              'group-hover:border-primary-300 group-hover:shadow-primary-100'
            )}
            onClick={onEditAvatar}
            role="button"
            tabIndex={0}
            aria-label={t('action.edit_avatar')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onEditAvatar?.();
              }
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatar || defaultAvatar}
              alt={displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                // 图片加载失败时使用默认头像
                (e.target as HTMLImageElement).src = defaultAvatar;
              }}
            />
          </div>
          
          {/* 头像编辑按钮 */}
          <m.button
            type="button"
            onClick={onEditAvatar}
            className={cn(
              'absolute -bottom-1 -right-1',
              'w-7 h-7 rounded-full',
              'bg-primary-500 text-white',
              'flex items-center justify-center',
              'shadow-soft-md',
              'hover:bg-primary-600 active:scale-95',
              'transition-colors'
            )}
            whileTap={{ scale: 0.9 }}
            aria-label={t('action.edit_avatar')}
          >
            <RiCameraLine className="w-4 h-4" />
          </m.button>
        </div>

        {/* 用户名和VIP信息 */}
        <div className="flex-1 min-w-0">
          {/* 昵称行 */}
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-neutral-800 truncate">
              {displayName}
            </h2>
            <button
              type="button"
              onClick={onEditNickname}
              className={cn(
                'p-1 rounded-full',
                'text-neutral-400 hover:text-primary-500',
                'hover:bg-primary-50',
                'transition-colors'
              )}
              aria-label={t('action.edit_nickname')}
            >
              <RiEditLine className="w-4 h-4" />
            </button>
          </div>

          {/* 手机号展示 - 有昵称时在昵称下方额外展示手机号 */}
          {nickname && (
            <p className="text-sm text-neutral-500 mt-0.5 font-mono tracking-wide">
              {phone}
            </p>
          )}

          {/* VIP/SVIP 角标 - 依据：03.7.1-个人中心页.md SVIP优先级高于VIP，不同时显示 */}
          <div className="flex items-center gap-2 mt-1.5">
            {/* 优先级：SVIP > VIP > 无徽章 */}
            {svipLevel > 0 ? (
              <VipBadge type="svip" level={svipLevel} size="md" />
            ) : vipLevel > 0 ? (
              <VipBadge type="vip" level={vipLevel} size="md" />
            ) : (
              <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                {t('label.new_user')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 邀请码区域 - 高端设计 */}
      <div className="relative mt-6 pt-4 border-t border-neutral-100/80">
        <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-primary-50/50 via-white to-primary-50/50 rounded-xl py-3 px-4">
          <span className="text-sm text-neutral-500">
            {t('label.invite_code')}:
          </span>
          <span className="text-lg font-bold text-gradient-primary tracking-widest font-mono">
            {inviteCode}
          </span>
          <CopyButton text={inviteCode} iconSize="sm" />
        </div>
      </div>
    </m.div>
  );
}

UserInfoCard.displayName = 'UserInfoCard';
