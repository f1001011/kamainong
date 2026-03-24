/**
 * @file 点赞按钮组件
 * @description 带心跳动画的点赞按钮，支持乐观更新
 */

'use client';

import { m } from 'motion/react';
import { RiHeartFill, RiHeartLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { SPRINGS } from '@/lib/animation/constants';

export interface LikeButtonProps {
  /** 是否已点赞 */
  liked: boolean;
  /** 点赞数 */
  count: number;
  /** 切换点赞回调 */
  onToggle: () => void;
  /** 自定义样式 */
  className?: string;
}

/**
 * 动画点赞按钮
 * @description 点赞时心跳缩放动画 + 颜色渐变过渡
 */
export function LikeButton({ liked, count, onToggle, className }: LikeButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn('flex items-center gap-1.5 group', className)}
    >
      <m.div
        animate={liked ? { scale: [1, 1.35, 1] } : { scale: 1 }}
        transition={SPRINGS.bouncy}
      >
        {liked ? (
          <RiHeartFill className="size-5 text-red-500" />
        ) : (
          <RiHeartLine className="size-5 text-neutral-400 group-hover:text-red-400 transition-colors" />
        )}
      </m.div>
      <span
        className={cn(
          'text-sm tabular-nums transition-colors',
          liked ? 'text-red-500 font-medium' : 'text-neutral-400'
        )}
      >
        {count}
      </span>
    </button>
  );
}
