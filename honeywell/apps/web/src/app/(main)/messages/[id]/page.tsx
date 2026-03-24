/**
 * @file 消息详情页
 * @description 沉浸式阅读体验，自动标记已读
 * @depends 开发文档/03-前端用户端/03.12-消息模块/03.12.2-消息详情页.md
 */

'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { m } from 'motion/react';
import { RiArrowLeftLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { formatMessageTime } from '@/lib/format';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import {
  useNotificationDetail,
  useMarkAsRead,
} from '@/hooks/use-notifications';
import { RichText } from '@/components/ui/rich-text';
import {
  NotificationTypeIcon,
  NotificationDetailSkeleton,
} from '@/components/messages';

/**
 * 详情页头部组件
 * @description 依据：03.12.2-消息详情页.md 第3.3节 - DetailHeader
 */
interface DetailHeaderProps {
  onBack: () => void;
}

function DetailHeader({ onBack }: DetailHeaderProps) {
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
        'bg-white/65 backdrop-blur-2xl backdrop-saturate-150',
        // 底部边框
        'border-b border-neutral-100'
      )}
    >
      <div className="flex items-center gap-3">
        <m.button
          onClick={onBack}
          whileTap={isAnimationEnabled ? { scale: 0.9 } : undefined}
          className={cn(
            'flex items-center justify-center',
            'w-9 h-9 rounded-full',
            'bg-neutral-100 hover:bg-neutral-200',
            'transition-colors duration-200'
          )}
        >
          <RiArrowLeftLine className="w-5 h-5 text-neutral-600" />
        </m.button>
        <span className="text-base font-medium text-neutral-800">
          {t('messages.detail_title')}
        </span>
      </div>
    </div>
  );
}

/**
 * MessageDetailPage 消息详情页
 * @description 依据：03.12.2-消息详情页.md 完整规范
 *
 * 布局规范：
 * - 移动端：全宽布局 px-4，底部留白 pb-24
 * - 电脑端：左侧偏移 md:pl-60，内容限宽 max-w-xl mx-auto
 * - 背景：bg-immersive
 */
export default function MessageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();

  // 解析消息ID
  const id = Number(params.id);

  // 获取消息详情 - 依据：02.3-前端API接口清单.md 第14.2节
  const { data: notification, isLoading, error } = useNotificationDetail(id);

  // 标记已读
  const { mutate: markAsRead } = useMarkAsRead();

  // 进入页面自动标记已读 - 依据：02.3-前端API接口清单.md 第14节
  useEffect(() => {
    if (notification && !notification.isRead) {
      markAsRead(notification.id);
    }
  }, [notification, markAsRead]);

  // 返回上一页
  const handleBack = () => {
    router.back();
  };

  // 加载态 - 显示骨架屏
  if (isLoading) {
    return (
      <div className="min-h-screen bg-immersive pb-24 md:pl-60">
        <DetailHeader onBack={handleBack} />
        <NotificationDetailSkeleton />
      </div>
    );
  }

  // 错误态或空数据
  if (error || !notification) {
    return (
      <div className="min-h-screen bg-immersive pb-24 md:pl-60">
        <DetailHeader onBack={handleBack} />
        <div className="flex items-center justify-center pt-20">
          <p className="text-neutral-500">
            {t('messages.not_found')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-immersive pb-24 md:pl-60">
      {/* 顶部导航 */}
      <DetailHeader onBack={handleBack} />

      {/* 内容区域 - 居中限宽 */}
      <div className="px-4 pt-8 max-w-xl mx-auto">
        {/* 类型图标 - 弹性入场动画 */}
        <m.div
          className="flex justify-center"
          initial={isAnimationEnabled ? { opacity: 0, scale: 0.8 } : undefined}
          animate={isAnimationEnabled ? { opacity: 1, scale: 1 } : undefined}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 25,
            delay: 0,
          }}
        >
          <NotificationTypeIcon type={notification.type} size="large" />
        </m.div>

        {/* 标题 */}
        <m.h1
          className="mt-6 text-xl font-bold tracking-tight text-neutral-800 text-center"
          initial={isAnimationEnabled ? { opacity: 0, y: 10 } : undefined}
          animate={isAnimationEnabled ? { opacity: 1, y: 0 } : undefined}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
            delay: 0.1,
          }}
        >
          {notification.title}
        </m.h1>

        {/* 时间胶囊 */}
        <m.div
          className="mt-3 flex justify-center"
          initial={isAnimationEnabled ? { opacity: 0, y: 10 } : undefined}
          animate={isAnimationEnabled ? { opacity: 1, y: 0 } : undefined}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
            delay: 0.15,
          }}
        >
          <span
            className={cn(
              'inline-flex items-center',
              'px-3 py-1 rounded-full',
              'text-xs text-neutral-500',
              'bg-neutral-100'
            )}
          >
            {formatMessageTime(notification.createdAt)}
          </span>
        </m.div>

        {/* 内容卡片 */}
        <m.div
          className={cn('mt-8 p-6 rounded-2xl', 'bg-white/75 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.05)]')}
          initial={isAnimationEnabled ? { opacity: 0, y: 20 } : undefined}
          animate={isAnimationEnabled ? { opacity: 1, y: 0 } : undefined}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
            delay: 0.2,
          }}
        >
          <RichText
            content={notification.content}
            className="text-base leading-relaxed text-neutral-600"
          />
        </m.div>
      </div>
    </div>
  );
}
