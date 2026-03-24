/**
 * @file 消息列表头部组件
 * @description 粘性定位、毛玻璃效果、显示未读数量、提供全部已读操作入口
 * @depends 开发文档/03-前端用户端/03.12-消息模块/03.12.1-消息列表页.md 第4.1节
 */

'use client';

import { m } from 'motion/react';
import { RiCheckDoubleFill } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';

/**
 * MessageHeader 组件属性
 */
export interface MessageHeaderProps {
  /** 未读数量 */
  unreadCount: number;
  /** 全部已读点击回调 */
  onMarkAllRead: () => void;
  /** 是否正在标记 */
  isMarking?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * MessageHeader 消息列表头部组件
 * @description 依据：03.12.1-消息列表页.md 第4.1节 - 消息头部 MessageHeader
 *
 * 功能：粘性定位、显示未读数量、提供全部已读操作入口
 * 样式：毛玻璃背景 bg-white/80 backdrop-blur-xl
 *
 * @example
 * ```tsx
 * <MessageHeader
 *   unreadCount={5}
 *   onMarkAllRead={() => markAllRead()}
 *   isMarking={isPending}
 * />
 * ```
 */
export function MessageHeader({
  unreadCount,
  onMarkAllRead,
  isMarking = false,
  className,
}: MessageHeaderProps) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();

  return (
    <div
      className={cn(
        // 粘性定位
        'sticky top-0 z-30',
        // 内边距
        'px-4 py-3',
        // 毛玻璃效果
        'bg-white/80 backdrop-blur-xl',
        // 底部边框
        'border-b border-neutral-100',
        className
      )}
    >
      <div className="flex items-center justify-between">
        {/* 标题与未读角标 */}
        <div className="flex items-center gap-2">
          <span className="text-base font-medium text-neutral-800">
            {t('messages.title', 'الرسائل')}
          </span>
          {/* 未读数量角标 - 弹性出现动画 */}
          {unreadCount > 0 && (
            <m.span
              initial={isAnimationEnabled ? { scale: 0 } : undefined}
              animate={isAnimationEnabled ? { scale: 1 } : undefined}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className={cn(
                'inline-flex items-center justify-center',
                'min-w-[20px] h-5 px-1.5',
                'text-xs font-medium text-white',
                'bg-red-500 rounded-full'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </m.span>
          )}
        </div>

        {/* 全部已读按钮 */}
        {unreadCount > 0 && (
          <m.button
            onClick={onMarkAllRead}
            disabled={isMarking}
            whileTap={isAnimationEnabled ? { scale: 0.95 } : undefined}
            className={cn(
              'flex items-center gap-1',
              'px-3 py-1.5 rounded-full',
              'text-sm text-primary-500',
              'bg-primary-50 hover:bg-primary-100',
              'transition-colors duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <RiCheckDoubleFill className="w-4 h-4" />
            <span>{t('messages.mark_all_read', 'تحديد الكل كمقروء')}</span>
          </m.button>
        )}
      </div>
    </div>
  );
}
