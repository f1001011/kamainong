/**
 * @file 评论列表组件
 * @description 评论列表：头像 + 昵称 + 相对时间 + 内容
 */

'use client';

import { m } from 'motion/react';
import { RiTimeLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS, STAGGER } from '@/lib/animation';

/** 评论数据结构 */
export interface CommentData {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string | null;
  content: string;
  createdAt: string;
}

export interface CommentListProps {
  /** 评论列表 */
  comments: CommentData[];
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
 * 评论列表组件
 */
export function CommentList({ comments, className }: CommentListProps) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();

  if (comments.length === 0) {
    return (
      <div className={cn('text-center py-6', className)}>
        <p className="text-sm text-neutral-400">
          {t('community.no_comments', 'لا توجد تعليقات بعد')}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {comments.map((comment, index) => (
        <m.div
          key={comment.id}
          initial={isAnimationEnabled ? { opacity: 0, y: 8 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRINGS.gentle, delay: index * STAGGER.fast }}
          className="flex gap-3"
        >
          {/* 头像 */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {comment.userAvatar ? (
              <img
                src={comment.userAvatar}
                alt={comment.userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-primary-600">
                {comment.userName?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>

          {/* 内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-neutral-700 truncate">
                {comment.userName}
              </span>
              <span className="flex items-center gap-0.5 text-xs text-neutral-400 flex-shrink-0">
                <RiTimeLine className="size-3" />
                {formatRelativeTime(comment.createdAt, t)}
              </span>
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed break-words">
              {comment.content}
            </p>
          </div>
        </m.div>
      ))}
    </div>
  );
}
