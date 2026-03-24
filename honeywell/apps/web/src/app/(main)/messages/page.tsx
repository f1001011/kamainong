/**
 * @file 消息列表页
 * @description 时间脉络流设计，展示用户所有通知消息
 * @depends 开发文档/03-前端用户端/03.12-消息模块/03.12.1-消息列表页.md
 */

'use client';

import { useCallback } from 'react';
import { m } from 'motion/react';
import { RiInboxFill } from '@remixicon/react';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import {
  useNotifications,
  useMarkAllRead,
} from '@/hooks/use-notifications';
import { PullToRefresh, InfiniteScroll } from '@/components/ui/pull-to-refresh';
import {
  MessageHeader,
  MessageDateGroup,
  MessageSkeleton,
} from '@/components/messages';

/**
 * 空状态组件
 * @description 依据：03.12.1-消息列表页.md 第七节 - 空状态设计
 */
function EmptyState() {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();

  const Wrapper = isAnimationEnabled ? m.div : 'div';
  const wrapperProps = isAnimationEnabled
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: 'easeOut' as const },
      }
    : {};

  return (
    <Wrapper
      className="flex flex-col items-center justify-center pt-20"
      {...wrapperProps}
    >
      {/* 图标容器 - 48x48 */}
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-neutral-100 mb-4">
        <RiInboxFill className="w-8 h-8 text-neutral-300" />
      </div>
      {/* 标题 */}
      <p className="text-base text-neutral-500">
        {t('messages.empty.title')}
      </p>
      {/* 描述 */}
      <p className="mt-1 text-sm text-neutral-400">
        {t('messages.empty.description')}
      </p>
    </Wrapper>
  );
}

/**
 * MessagesPage 消息列表页
 * @description 依据：03.12.1-消息列表页.md 完整规范
 *
 * 布局规范：
 * - 移动端：全宽布局，底部预留导航空间 pb-24
 * - 电脑端：左侧偏移侧边栏 md:pl-60，内容限宽 max-w-2xl
 * - 背景：bg-immersive
 */
export default function MessagesPage() {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();

  // 获取消息列表 - 依据：02.3-前端API接口清单.md 第14.1节
  const {
    groupedMessages,
    unreadCount,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useNotifications();

  // 全部标记已读
  const markAllRead = useMarkAllRead();

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // 加载更多
  const handleLoadMore = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 全部已读
  const handleMarkAllRead = useCallback(() => {
    if (unreadCount > 0) {
      markAllRead.mutate();
    }
  }, [unreadCount, markAllRead]);

  // 加载中状态 - 显示骨架屏
  if (isLoading) {
    return (
      <div className="min-h-screen bg-immersive pb-24 md:pl-60">
        <MessageHeader
          unreadCount={0}
          onMarkAllRead={() => {}}
          isMarking={false}
        />
        <div className="px-4 pt-6 space-y-4">
          <MessageSkeleton count={5} />
        </div>
      </div>
    );
  }

  // 空状态
  if (!groupedMessages || groupedMessages.length === 0) {
    return (
      <div className="min-h-screen bg-immersive pb-24 md:pl-60">
        <MessageHeader
          unreadCount={0}
          onMarkAllRead={() => {}}
          isMarking={false}
        />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-immersive pb-24 md:pl-60">
      {/* 粘性头部 */}
      <MessageHeader
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllRead}
        isMarking={markAllRead.isPending}
      />

      {/* 下拉刷新包裹 */}
      <PullToRefresh onRefresh={handleRefresh}>
        {/* 消息列表区域 */}
        <div className="px-4 pt-6">
          <InfiniteScroll
            onLoadMore={handleLoadMore}
            hasMore={hasNextPage ?? false}
            loading={isFetchingNextPage}
          >
            {/* 日期分组 - gap-8 保持呼吸感 */}
            <div className="space-y-8">
              {groupedMessages.map((group, groupIndex) => (
                <m.div
                  key={group.date}
                  initial={isAnimationEnabled ? { opacity: 0, y: 20 } : undefined}
                  animate={isAnimationEnabled ? { opacity: 1, y: 0 } : undefined}
                  transition={{
                    delay: groupIndex * 0.1,
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                  }}
                >
                  <MessageDateGroup
                    date={group.date}
                    messages={group.messages}
                    groupIndex={groupIndex}
                  />
                </m.div>
              ))}
            </div>
          </InfiniteScroll>
        </div>
      </PullToRefresh>
    </div>
  );
}
