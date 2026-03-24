/**
 * @file 消息卡片组件
 * @description 消息列表项卡片，支持未读状态高亮和动画
 * @depends 开发文档/03-前端用户端/03.12-消息模块/03.12.1-消息列表页.md 第4.3节
 */

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { formatMessageTime } from '@/lib/format';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useMarkAsRead } from '@/hooks/use-notifications';
import { NotificationTypeIcon } from './notification-type-icon';
import type { NotificationItem } from '@/types/notification';

/**
 * MessageCard 组件属性
 */
export interface MessageCardProps {
  /** 消息数据 */
  message: NotificationItem;
  /** 自定义类名 */
  className?: string;
}

/**
 * MessageCard 消息卡片组件
 * @description 依据：03.12.1-消息列表页.md 第4.3节 - 消息卡片设计
 *
 * 视觉规范：
 * - 未读消息：左侧脉冲圆点 + 微高亮背景（bg-primary-50/30）
 * - 已读消息：无圆点 + 正常白底背景
 * - 类型图标：渐变背景圆角图标
 *
 * 样式规范表：
 * | 元素 | 未读状态 | 已读状态 |
 * |-----|---------|---------|
 * | 卡片背景 | bg-primary-50/30 | bg-white |
 * | 标题文字 | text-neutral-900 font-medium | text-neutral-700 font-medium |
 * | 内容文字 | text-neutral-500 | text-neutral-400 |
 * | 指示圆点 | 显示，带脉冲动画 | 隐藏 |
 *
 * @example
 * ```tsx
 * <MessageCard message={notificationItem} />
 * ```
 */
export function MessageCard({ message, className }: MessageCardProps) {
  const router = useRouter();
  const { isAnimationEnabled } = useAnimationConfig();
  const { mutate: markAsRead } = useMarkAsRead();

  // 点击处理：若未读先标记已读，然后跳转详情页
  const handleClick = useCallback(() => {
    // 若未读，先标记已读
    if (!message.isRead) {
      markAsRead(message.id);
    }
    // 跳转详情页
    router.push(`/messages/${message.id}`);
  }, [message.id, message.isRead, markAsRead, router]);

  return (
    <m.div
      onClick={handleClick}
      whileHover={isAnimationEnabled ? { scale: 1.01, y: -2 } : undefined}
      whileTap={isAnimationEnabled ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        // 基础布局
        'relative flex gap-4 p-5 rounded-2xl cursor-pointer',
        // 阴影与过渡
        'bg-white shadow-soft',
        'hover:shadow-soft-lg',
        'transition-shadow duration-300',
        // 未读状态背景略微高亮
        !message.isRead && 'bg-primary-50/30',
        className
      )}
    >
      {/* 未读指示器 - 左侧脉冲圆点 */}
      {!message.isRead && (
        <m.div
          className={cn(
            'absolute left-2 top-1/2 -translate-y-1/2',
            'w-2 h-2 rounded-full',
            'bg-primary-500'
          )}
          animate={
            isAnimationEnabled
              ? {
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.7, 1],
                }
              : undefined
          }
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* 类型图标 */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-xl',
          'flex items-center justify-center',
          'bg-neutral-50'
        )}
      >
        <NotificationTypeIcon type={message.type} size="small" />
      </div>

      {/* 内容区域 */}
      <div className="flex-1 min-w-0">
        {/* 标题行 */}
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              'text-base font-medium truncate',
              message.isRead ? 'text-neutral-700' : 'text-neutral-900'
            )}
          >
            {message.title}
          </span>
          <span className="flex-shrink-0 text-xs text-neutral-400">
            {formatMessageTime(message.createdAt)}
          </span>
        </div>

        {/* 内容预览 */}
        <p
          className={cn(
            'mt-1.5 text-sm line-clamp-2',
            message.isRead ? 'text-neutral-400' : 'text-neutral-500'
          )}
        >
          {message.content}
        </p>
      </div>
    </m.div>
  );
}
