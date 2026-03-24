/**
 * @file 消息日期分组组件
 * @description 按日期聚合消息，显示日期标签
 * @depends 开发文档/03-前端用户端/03.12-消息模块/03.12.1-消息列表页.md 第4.2节
 */

'use client';

import { m } from 'motion/react';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { formatMessageDate } from '@/lib/format';
import { MessageCard } from './message-card';
import type { NotificationItem } from '@/types/notification';

/**
 * MessageDateGroup 组件属性
 */
export interface MessageDateGroupProps {
  /** ISO日期字符串 */
  date: string;
  /** 该日期下的消息列表 */
  messages: NotificationItem[];
  /** 分组索引，用于交错动画延迟 */
  groupIndex: number;
}

/**
 * MessageDateGroup 消息日期分组组件
 * @description 依据：03.12.1-消息列表页.md 第4.2节 - 日期分组
 *
 * @example
 * ```tsx
 * <MessageDateGroup
 *   date="2026-02-04"
 *   messages={messagesForDate}
 *   groupIndex={0}
 * />
 * ```
 */
export function MessageDateGroup({
  date,
  messages,
  groupIndex,
}: MessageDateGroupProps) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();

  // 格式化日期显示（今天/昨天/具体日期）
  const displayDate = formatMessageDate(date, t);

  return (
    <div className="space-y-4">
      {/* 日期标签 */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
          {displayDate}
        </span>
        <div className="flex-1 h-px bg-neutral-100" />
      </div>

      {/* 该日期下的消息列表 */}
      <div className="space-y-4">
        {messages.map((message, index) => (
          <m.div
            key={message.id}
            initial={isAnimationEnabled ? { opacity: 0, x: -20 } : undefined}
            animate={isAnimationEnabled ? { opacity: 1, x: 0 } : undefined}
            transition={{
              delay: groupIndex * 0.05 + index * 0.03,
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
          >
            <MessageCard message={message} />
          </m.div>
        ))}
      </div>
    </div>
  );
}
