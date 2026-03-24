/**
 * @file 社区帖子卡片组件
 * @description 可复用的帖子信息流卡片，展示用户信息、提现金额、双图预览、文案、互动栏
 */

'use client';

import { useState } from 'react';
import { m } from 'motion/react';
import {
  RiTimeLine,
  RiShieldCheckFill,
  RiChat3Line,
} from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { formatCurrency } from '@/lib/format';
import { SPRINGS, STAGGER } from '@/lib/animation';
import { LikeButton } from './like-button';

/** 帖子数据结构 */
export interface PostData {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string | null;
  withdrawAmount: number;
  platformScreenshot: string;
  receiptScreenshot: string;
  content: string | null;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface PostCardProps {
  /** 帖子数据 */
  post: PostData;
  /** 点赞回调 */
  onLike?: (postId: number) => void;
  /** 点击详情回调 */
  onClick?: (postId: number) => void;
  /** 列表中的索引（控制入场动画延迟） */
  index?: number;
  /** 自定义样式 */
  className?: string;
}

/** 格式化相对时间 */
function formatRelativeTime(dateStr: string, t: ReturnType<typeof useText>) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t('time.justNow', 'الآن');
  if (minutes < 60) return `${minutes}${t('time.minutesAgo', 'د')}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}${t('time.hoursAgo', 'س')}`;
  const days = Math.floor(hours / 24);
  return `${days}${t('time.daysAgo', 'ي')}`;
}

/**
 * 社区帖子卡片
 * @description 卡片式信息流：用户信息 + 金额标签 + 双图预览 + 文案 + 互动栏
 */
export function PostCard({ post, onLike, onClick, index = 0, className }: PostCardProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();

  // 乐观更新的点赞状态
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    onLike?.(post.id);
  };

  return (
    <m.div
      initial={isAnimationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRINGS.gentle, delay: index * STAGGER.fast }}
      onClick={() => onClick?.(post.id)}
      className={cn(
        'bg-white rounded-2xl overflow-hidden',
        'shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-neutral-100/60',
        'active:scale-[0.99] transition-transform cursor-pointer',
        className,
      )}
    >
      {/* 用户信息 + 金额标签 */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          {/* 头像 */}
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center overflow-hidden ring-2 ring-primary-100/50">
            {post.userAvatar ? (
              <img src={post.userAvatar} alt={post.userName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-primary-600">
                {post.userName?.charAt(0)?.toUpperCase()}
              </span>
            )}
            {/* 认证标识 */}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary-500 border-2 border-white flex items-center justify-center">
              <RiShieldCheckFill className="size-2.5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-800">{post.userName}</p>
            <div className="flex items-center gap-1 text-xs text-neutral-400">
              <RiTimeLine className="size-3" />
              <span>{formatRelativeTime(post.createdAt, t)}</span>
            </div>
          </div>
        </div>

        {/* 提现金额标签 */}
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200/50">
          <span className="text-xs font-bold text-primary-600">
            {formatCurrency(post.withdrawAmount, config)}
          </span>
        </div>
      </div>

      {/* 双图预览 */}
      <div className="grid grid-cols-2 gap-2 px-4 py-2">
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100">
          <img
            src={post.platformScreenshot}
            alt={t('community.platform_screenshot', 'لقطة شاشة المنصة')}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm">
            <span className="text-[10px] text-white font-medium">
              {t('community.platform', 'المنصة')}
            </span>
          </div>
        </div>
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100">
          <img
            src={post.receiptScreenshot}
            alt={t('community.receipt_screenshot', 'لقطة شاشة الإيصال')}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm">
            <span className="text-[10px] text-white font-medium">
              {t('community.receipt', 'الإيصال')}
            </span>
          </div>
        </div>
      </div>

      {/* 文本内容 */}
      {post.content && (
        <p className="px-4 pb-2 text-sm text-neutral-600 line-clamp-2">
          {post.content}
        </p>
      )}

      {/* 互动栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-50">
        <LikeButton liked={liked} count={likeCount} onToggle={handleLike} />
        <div className="flex items-center gap-1.5 text-neutral-400">
          <RiChat3Line className="size-5" />
          <span className="text-sm tabular-nums">{post.commentCount}</span>
        </div>
      </div>
    </m.div>
  );
}
