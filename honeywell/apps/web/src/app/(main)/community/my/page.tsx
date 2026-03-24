/**
 * @file 我的帖子页面
 * @description 展示当前用户发布的所有帖子，包括待审核、已通过、已拒绝状态
 * @route /community/my
 *
 * 设计要点：
 * - 展示用户自己的帖子列表（含待审核帖子）
 * - 状态标签：Pendiente / Aprobado / Rechazado
 * - 卡片布局与广场首页一致
 */

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { LazyMotion, domAnimation, m } from 'motion/react';
import {
  RiArrowLeftSLine,
  RiTimeLine,
  RiHeartFill,
  RiChat3Line,
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiTimeFill,
  RiFileList3Line,
} from '@remixicon/react';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS, STAGGER } from '@/lib/animation';
import { formatCurrency } from '@/lib/format';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { InfiniteScrollTrigger } from '@/components/ui/infinite-scroll-trigger';
import { EmptyState } from '@/components/business/empty-state';
import api from '@/lib/api';

/** 帖子状态 */
type PostStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** 我的帖子数据类型 */
interface MyPost {
  id: number;
  withdrawAmount: number;
  platformScreenshot: string;
  receiptScreenshot: string;
  content: string | null;
  likeCount: number;
  commentCount: number;
  status: PostStatus;
  rejectReason: string | null;
  createdAt: string;
}

interface MyPostsResponse {
  list: MyPost[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

/** 状态配色和文案映射 */
const statusConfig: Record<PostStatus, { icon: typeof RiTimeFill; color: string; bg: string; border: string }> = {
  PENDING: {
    icon: RiTimeFill,
    color: 'text-gold-600',
    bg: 'bg-gold-50',
    border: 'border-gold-200/50',
  },
  APPROVED: {
    icon: RiCheckboxCircleFill,
    color: 'text-primary-600',
    bg: 'bg-primary-50',
    border: 'border-primary-200/50',
  },
  REJECTED: {
    icon: RiCloseCircleFill,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200/50',
  },
};

const statusLabels: Record<PostStatus, string> = {
  PENDING: 'معلّق',
  APPROVED: 'تمت الموافقة',
  REJECTED: 'مرفوض',
};

/**
 * 我的帖子页面
 */
export default function MyPostsPage() {
  const router = useRouter();
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['my-community-posts'],
    queryFn: ({ pageParam = 1 }) =>
      api.get<MyPostsResponse>(`/community/my-posts?page=${pageParam}&pageSize=10`),
    getNextPageParam: (lastPage) => {
      const { page, pageSize, total } = lastPage.pagination;
      return page * pageSize < total ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const posts = data?.pages.flatMap((p) => p.list) ?? [];

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t('time.justNow');
    if (minutes < 60) return `${minutes} ${t('time.minutesAgo')}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${t('time.hoursAgo')}`;
    const days = Math.floor(hours / 24);
    return `${days} ${t('time.daysAgo')}`;
  };

  if (isLoading) return <MyPostsSkeleton />;

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-gradient-to-b from-primary-50/60 via-white to-neutral-50">
        {/* 顶部导航 */}
        <header className="sticky top-0 z-30">
          <div
            style={{
              background: 'rgba(250,250,248,0.88)',
              backdropFilter: 'blur(20px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
              borderBottom: '1px solid rgba(0,0,0,0.04)',
            }}
          >
            <div className="flex items-center justify-between h-14 px-4">
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 rounded-xl hover:bg-neutral-100/80 active:scale-95 transition-all"
                aria-label={t('btn.back')}
              >
                <RiArrowLeftSLine className="w-6 h-6 text-neutral-600" />
              </button>
              <h1 className="text-lg font-bold text-neutral-800 tracking-tight">
                {t('community.my_posts')}
              </h1>
              <div className="w-10" />
            </div>
          </div>
        </header>

        <PullToRefresh onRefresh={handleRefresh}>
          <div className="px-4 py-4 pb-28 space-y-4">
            {isError ? (
              <EmptyState
                icon={<RiChat3Line className="size-12 text-neutral-400" />}
                title={t('error.load_failed')}
                actionText={t('btn.retry')}
                onAction={() => refetch()}
              />
            ) : posts.length === 0 ? (
              <EmptyState
                icon={<RiFileList3Line className="size-12 text-neutral-400" />}
                title={t('community.my_empty')}
                description={t('community.my_empty_desc')}
                actionText={t('community.create_first')}
                onAction={() => router.push('/community/create')}
              />
            ) : (
              posts.map((post, index) => (
                <m.div
                  key={post.id}
                  initial={isAnimationEnabled ? { opacity: 0, y: 16 } : undefined}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SPRINGS.gentle, delay: index * STAGGER.fast }}
                  onClick={() => post.status === 'APPROVED' && router.push(`/community/${post.id}`)}
                  className={`bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-neutral-100/60 ${
                    post.status === 'APPROVED' ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''
                  }`}
                >
                  {/* 状态标签 + 金额 */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <StatusBadge status={post.status} t={t} />

                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200/50">
                      <span className="text-xs font-bold text-primary-600">
                        {formatCurrency(post.withdrawAmount, config)}
                      </span>
                    </div>
                  </div>

                  {/* 时间 */}
                  <div className="flex items-center gap-1 px-4 pb-2 text-xs text-neutral-400">
                    <RiTimeLine className="size-3" />
                    <span>{formatRelativeTime(post.createdAt)}</span>
                  </div>

                  {/* 双图预览 */}
                  <div className="grid grid-cols-2 gap-2 px-4 py-1">
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100">
                      <img
                        src={post.platformScreenshot}
                        alt={t('community.platform')}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100">
                      <img
                        src={post.receiptScreenshot}
                        alt={t('community.receipt')}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  {/* 文字内容 */}
                  {post.content && (
                    <p className="px-4 py-2 text-sm text-neutral-600 line-clamp-2">{post.content}</p>
                  )}

                  {/* 拒绝原因 */}
                  {post.status === 'REJECTED' && post.rejectReason && (
                    <div className="mx-4 mb-3 p-3 rounded-xl bg-red-50/50 border border-red-100/60">
                      <p className="text-xs text-red-600">
                        <span className="font-medium">{t('community.reject_reason')}: </span>
                        {post.rejectReason}
                      </p>
                    </div>
                  )}

                  {/* 互动数据 - 仅已通过的帖子显示 */}
                  {post.status === 'APPROVED' && (
                    <div className="flex items-center gap-5 px-4 py-3 border-t border-neutral-50">
                      <div className="flex items-center gap-1.5 text-neutral-400">
                        <RiHeartFill className="size-4" />
                        <span className="text-sm tabular-nums">{post.likeCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-400">
                        <RiChat3Line className="size-4" />
                        <span className="text-sm tabular-nums">{post.commentCount}</span>
                      </div>
                    </div>
                  )}
                </m.div>
              ))
            )}

            <InfiniteScrollTrigger
              hasMore={!!hasNextPage}
              isLoading={isFetchingNextPage}
              onLoadMore={() => fetchNextPage()}
            />
          </div>
        </PullToRefresh>
      </div>
    </LazyMotion>
  );
}

/** 状态标签组件 */
function StatusBadge({ status, t }: { status: PostStatus; t: ReturnType<typeof useText> }) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  const label = t(`community.status.${status.toLowerCase()}`, statusLabels[status]);

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${cfg.bg} border ${cfg.border}`}>
      <Icon className={`size-3.5 ${cfg.color}`} />
      <span className={`text-xs font-semibold ${cfg.color}`}>{label}</span>
    </div>
  );
}

/** 加载骨架屏 */
function MyPostsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/60 via-white to-neutral-50">
      <header className="sticky top-0 z-30" style={{ background: 'rgba(250,250,248,0.88)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center justify-between h-14 px-4">
          <div className="w-10 h-10 bg-neutral-200/60 rounded-lg animate-pulse" />
          <div className="w-36 h-5 bg-neutral-200/60 rounded animate-pulse" />
          <div className="w-10" />
        </div>
      </header>
      <div className="px-4 py-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-neutral-100/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-7 w-24 bg-neutral-200/60 rounded-full animate-pulse" />
              <div className="h-7 w-20 bg-neutral-200/60 rounded-full animate-pulse" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="aspect-[4/3] rounded-xl bg-neutral-100 animate-pulse" />
              <div className="aspect-[4/3] rounded-xl bg-neutral-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
