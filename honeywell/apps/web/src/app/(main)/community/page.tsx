/**
 * @file 社区广场首页
 * @description 社交信息流布局，展示用户提现成功分享帖子
 * @route /community
 *
 * 设计要点：
 * - 卡片式信息流，双图预览（平台截图+收据截图）
 * - 浮动创建按钮
 * - 下拉刷新 + 无限滚动分页
 * - 点赞/评论交互
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LazyMotion, domAnimation, m } from 'motion/react';
import {
  RiHeartFill,
  RiHeartLine,
  RiChat3Line,
  RiAddLine,
  RiArrowLeftSLine,
  RiTimeLine,
  RiShieldCheckFill,
  RiUserLine,
} from '@remixicon/react';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS, STAGGER } from '@/lib/animation';
import { formatCurrency } from '@/lib/format';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { InfiniteScrollTrigger } from '@/components/ui/infinite-scroll-trigger';
import { EmptyState } from '@/components/business/empty-state';
import { FloatingOrbs } from '@/components/effects/floating-orbs';
import api from '@/lib/api';

/** 帖子数据类型 */
interface Post {
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

interface PostsResponse {
  list: Post[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

/**
 * 社区广场首页
 */
export default function CommunityPage() {
  const router = useRouter();
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();
  const queryClient = useQueryClient();

  // 无限滚动获取帖子列表
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['community-posts'],
    queryFn: ({ pageParam = 1 }) =>
      api.get<PostsResponse>(`/community/posts?page=${pageParam}&pageSize=10`),
    getNextPageParam: (lastPage) => {
      const { page, pageSize, total } = lastPage.pagination;
      return page * pageSize < total ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const posts = data?.pages.flatMap((p) => p.list) ?? [];

  // 点赞/取消点赞
  const likeMutation = useMutation({
    mutationFn: (postId: number) =>
      api.post<{ liked: boolean; likeCount: number }>(`/community/posts/${postId}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // 加载骨架屏
  if (isLoading) {
    return <FeedSkeleton />;
  }

  // 错误状态
  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50/60 via-white to-neutral-50">
        <FeedHeader />
        <div className="px-4 py-20">
          <EmptyState
            icon={<RiChat3Line className="size-12 text-neutral-400" />}
            title={t('error.load_failed', 'خطأ في التحميل')}
            description={t('error.try_again', 'تعذر التحميل. حاول مرة أخرى.')}
            actionText={t('btn.retry', 'إعادة المحاولة')}
            onAction={() => refetch()}
          />
        </div>
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative min-h-screen bg-gradient-to-b from-primary-50/60 via-white to-neutral-50 overflow-hidden">
        <FloatingOrbs variant="activities" />
        <FeedHeader />

        <PullToRefresh onRefresh={handleRefresh}>
          {/* 页面标题区 */}
          <m.div
            initial={isAnimationEnabled ? { opacity: 0, y: -10 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRINGS.gentle}
            className="relative z-10 px-4 pt-4 pb-2"
          >
            <h2 className="text-xl font-bold text-neutral-800">
              {t('community.title', 'الساحة')}
            </h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              {t('community.subtitle', 'شارك نجاحك مع المجتمع')}
            </p>
          </m.div>

          {/* 帖子信息流 */}
          <div className="relative z-10 px-4 pb-28 space-y-4">
            {posts.length === 0 ? (
              <EmptyState
                icon={<RiChat3Line className="size-12 text-neutral-400" />}
                title={t('community.empty', 'لا توجد منشورات بعد')}
                description={t('community.empty_desc', 'كن أول من يشارك سحبه الناجح')}
              />
            ) : (
              posts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  config={config}
                  t={t}
                  index={index}
                  isAnimationEnabled={isAnimationEnabled}
                  onLike={() => likeMutation.mutate(post.id)}
                  onDetail={() => router.push(`/community/${post.id}`)}
                />
              ))
            )}

            <InfiniteScrollTrigger
              hasMore={!!hasNextPage}
              isLoading={isFetchingNextPage}
              onLoadMore={() => fetchNextPage()}
            />
          </div>
        </PullToRefresh>

        {/* 浮动创建按钮 */}
        <m.button
          onClick={() => router.push('/community/create')}
          className="fixed bottom-32 right-5 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-primary-500 text-white shadow-[0_6px_24px_rgba(var(--color-primary-rgb),0.4)]"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={SPRINGS.snappy}
        >
          <RiAddLine className="size-7" />
        </m.button>
      </div>
    </LazyMotion>
  );
}

/** 顶部导航栏 */
function FeedHeader() {
  const router = useRouter();
  const t = useText();

  return (
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
            aria-label={t('btn.back', 'رجوع')}
          >
            <RiArrowLeftSLine className="w-6 h-6 text-neutral-600" />
          </button>
          <h1 className="text-lg font-bold text-neutral-800 tracking-tight">
            {t('nav.community', 'المجتمع')}
          </h1>
          <button
            onClick={() => router.push('/community/my')}
            className="p-2 -mr-2 rounded-xl hover:bg-neutral-100/80 active:scale-95 transition-all"
            aria-label={t('community.my_posts', 'منشوراتي')}
          >
            <RiUserLine className="w-5 h-5 text-neutral-600" />
          </button>
        </div>
      </div>
    </header>
  );
}

/** 帖子卡片 */
function PostCard({
  post,
  config,
  t,
  index,
  isAnimationEnabled,
  onLike,
  onDetail,
}: {
  post: Post;
  config: ReturnType<typeof useGlobalConfig>['config'];
  t: ReturnType<typeof useText>;
  index: number;
  isAnimationEnabled: boolean;
  onLike: () => void;
  onDetail: () => void;
}) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    onLike();
  };

  // 格式化时间为相对时间
  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t('time.justNow', 'الآن');
    if (minutes < 60) return `${minutes} ${t('time.minutesAgo', 'د')}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${t('time.hoursAgo', 'س')}`;
    const days = Math.floor(hours / 24);
    return `${days} ${t('time.daysAgo', 'ي')}`;
  };

  return (
    <m.div
      initial={isAnimationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRINGS.gentle, delay: index * STAGGER.fast }}
      onClick={onDetail}
      className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-neutral-100/60 active:scale-[0.99] transition-transform cursor-pointer"
    >
      {/* 用户信息 + 金额标签 */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          {/* 头像 */}
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center overflow-hidden ring-2 ring-primary-100/50">
            {post.userAvatar ? (
              <img
                src={post.userAvatar}
                alt={post.userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-primary-600">
                {post.userName?.charAt(0)?.toUpperCase()}
              </span>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary-500 border-2 border-white flex items-center justify-center">
              <RiShieldCheckFill className="size-2.5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-800">{post.userName}</p>
            <div className="flex items-center gap-1 text-xs text-neutral-400">
              <RiTimeLine className="size-3" />
              <span>{formatRelativeTime(post.createdAt)}</span>
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
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 group"
        >
          <m.div
            animate={liked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={SPRINGS.bouncy}
          >
            {liked ? (
              <RiHeartFill className="size-5 text-red-500" />
            ) : (
              <RiHeartLine className="size-5 text-neutral-400 group-hover:text-red-400 transition-colors" />
            )}
          </m.div>
          <span className={`text-sm tabular-nums ${liked ? 'text-red-500 font-medium' : 'text-neutral-400'}`}>
            {likeCount}
          </span>
        </button>

        <div className="flex items-center gap-1.5 text-neutral-400">
          <RiChat3Line className="size-5" />
          <span className="text-sm tabular-nums">{post.commentCount}</span>
        </div>
      </div>
    </m.div>
  );
}

/** 加载骨架屏 */
function FeedSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/60 via-white to-neutral-50">
      <header className="sticky top-0 z-30" style={{ background: 'rgba(250,250,248,0.88)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center justify-between h-14 px-4">
          <div className="w-10 h-10 bg-neutral-200/60 rounded-lg animate-pulse" />
          <div className="w-24 h-5 bg-neutral-200/60 rounded animate-pulse" />
          <div className="w-10 h-10 bg-neutral-200/60 rounded-lg animate-pulse" />
        </div>
      </header>
      <div className="px-4 pt-4 space-y-4">
        <div className="h-7 w-20 bg-neutral-200/60 rounded animate-pulse" />
        <div className="h-4 w-48 bg-neutral-200/40 rounded animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden border border-neutral-100/60 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-200/60 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-24 bg-neutral-200/60 rounded animate-pulse" />
                <div className="h-2.5 w-16 bg-neutral-200/40 rounded animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="aspect-[4/3] rounded-xl bg-neutral-100 animate-pulse" />
              <div className="aspect-[4/3] rounded-xl bg-neutral-100 animate-pulse" />
            </div>
            <div className="h-4 w-3/4 bg-neutral-200/40 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
