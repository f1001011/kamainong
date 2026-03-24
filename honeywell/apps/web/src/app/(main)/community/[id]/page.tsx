/**
 * @file 帖子详情页
 * @description 完整展示帖子内容，包含大图查看、点赞动画、评论列表和评论输入
 * @route /community/:id
 *
 * 设计要点：
 * - 完整帖子内容展示，双图大图查看
 * - 点赞按钮带心跳动画
 * - 评论列表
 * - 底部固定评论输入框
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LazyMotion, domAnimation, m } from 'motion/react';
import {
  RiArrowLeftSLine,
  RiHeartFill,
  RiHeartLine,
  RiChat3Line,
  RiSendPlaneFill,
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
import { EmptyState } from '@/components/business/empty-state';
import api from '@/lib/api';

/** 帖子详情数据类型 */
interface PostDetail {
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

/** 评论数据类型 */
interface Comment {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string | null;
  content: string;
  createdAt: string;
}

interface PostDetailResponse {
  post: PostDetail;
  comments: Comment[];
}

/**
 * 帖子详情页面
 */
export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;
  const router = useRouter();
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();
  const queryClient = useQueryClient();
  const commentInputRef = useRef<HTMLInputElement>(null);

  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 获取帖子详情
  const { data, isLoading, isError, refetch } = useQuery<PostDetailResponse>({
    queryKey: ['community-post', postId],
    queryFn: () => api.get(`/community/posts/${postId}`),
    enabled: !!postId,
  });

  // 初始化点赞状态
  const post = data?.post;
  const comments = data?.comments ?? [];

  if (post && liked !== post.isLiked && likeCount === 0) {
    setLiked(post.isLiked);
    setLikeCount(post.likeCount);
  }

  // 点赞
  const likeMutation = useMutation({
    mutationFn: () => api.post(`/community/posts/${postId}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-post', postId] }),
  });

  // 发表评论
  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/community/posts/${postId}/comments`, { content }),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['community-post', postId] });
    },
  });

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    likeMutation.mutate();
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText.trim());
  };

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

  if (isLoading) return <DetailSkeleton />;

  if (isError || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50/60 via-white to-neutral-50">
        <DetailHeader />
        <div className="px-4 py-20">
          <EmptyState
            icon={<RiChat3Line className="size-12 text-neutral-400" />}
            title={t('error.load_failed')}
            actionText={t('btn.retry')}
            onAction={() => refetch()}
          />
        </div>
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative min-h-screen bg-gradient-to-b from-primary-50/60 via-white to-neutral-50">
        <DetailHeader />

        <PullToRefresh onRefresh={handleRefresh}>
          <div className="px-4 py-4 pb-48 space-y-5">
            {/* 用户信息 */}
            <m.div
              initial={isAnimationEnabled ? { opacity: 0, y: 10 } : undefined}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRINGS.gentle}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center overflow-hidden ring-2 ring-primary-100/50">
                  {post.userAvatar ? (
                    <img src={post.userAvatar} alt={post.userName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base font-bold text-primary-600">
                      {post.userName?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-primary-500 border-2 border-white flex items-center justify-center">
                    <RiShieldCheckFill className="size-2.5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-base font-semibold text-neutral-800">{post.userName}</p>
                  <div className="flex items-center gap-1 text-xs text-neutral-400">
                    <RiTimeLine className="size-3" />
                    <span>{formatRelativeTime(post.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 px-3.5 py-2 rounded-full bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200/50">
                <span className="text-sm font-bold text-primary-600">
                  {formatCurrency(post.withdrawAmount, config)}
                </span>
              </div>
            </m.div>

            {/* 大图展示 */}
            <m.div
              initial={isAnimationEnabled ? { opacity: 0, y: 12 } : undefined}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRINGS.gentle, delay: 0.05 }}
              className="space-y-3"
            >
              <button
                onClick={() => setPreviewImage(post.platformScreenshot)}
                className="relative w-full aspect-video rounded-2xl overflow-hidden bg-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
              >
                <img
                  src={post.platformScreenshot}
                  alt={t('community.platform_screenshot')}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm">
                  <span className="text-xs text-white font-medium">
                    {t('community.platform')}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setPreviewImage(post.receiptScreenshot)}
                className="relative w-full aspect-video rounded-2xl overflow-hidden bg-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
              >
                <img
                  src={post.receiptScreenshot}
                  alt={t('community.receipt_screenshot')}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm">
                  <span className="text-xs text-white font-medium">
                    {t('community.receipt')}
                  </span>
                </div>
              </button>
            </m.div>

            {/* 文字内容 */}
            {post.content && (
              <m.p
                initial={isAnimationEnabled ? { opacity: 0 } : undefined}
                animate={{ opacity: 1 }}
                transition={{ ...SPRINGS.gentle, delay: 0.1 }}
                className="text-base text-neutral-700 leading-relaxed"
              >
                {post.content}
              </m.p>
            )}

            {/* 点赞+评论计数 */}
            <div className="flex items-center gap-6 py-3 border-y border-neutral-100">
              <button onClick={handleLike} className="flex items-center gap-2 group">
                <m.div
                  animate={liked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                  transition={SPRINGS.bouncy}
                >
                  {liked ? (
                    <RiHeartFill className="size-6 text-red-500" />
                  ) : (
                    <RiHeartLine className="size-6 text-neutral-400 group-hover:text-red-400 transition-colors" />
                  )}
                </m.div>
                <span className={`text-sm font-medium tabular-nums ${liked ? 'text-red-500' : 'text-neutral-500'}`}>
                  {likeCount || post.likeCount}
                </span>
              </button>

              <button
                onClick={() => commentInputRef.current?.focus()}
                className="flex items-center gap-2 text-neutral-400 hover:text-primary-500 transition-colors"
              >
                <RiChat3Line className="size-6" />
                <span className="text-sm font-medium tabular-nums">{post.commentCount}</span>
              </button>
            </div>

            {/* 评论列表 */}
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-neutral-800 mb-3">
                {t('community.comments')}
              </h3>

              {comments.length === 0 ? (
                <div className="py-8 text-center">
                  <RiChat3Line className="size-8 text-neutral-200 mx-auto mb-2" />
                  <p className="text-sm text-neutral-400">
                    {t('community.no_comments')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment, index) => (
                    <m.div
                      key={comment.id}
                      initial={isAnimationEnabled ? { opacity: 0, y: 8 } : undefined}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...SPRINGS.gentle, delay: index * STAGGER.fast }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {comment.userAvatar ? (
                          <img src={comment.userAvatar} alt={comment.userName} className="w-full h-full object-cover" />
                        ) : (
                          <RiUserLine className="size-4 text-neutral-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-neutral-700">
                            {comment.userName}
                          </span>
                          <span className="text-xs text-neutral-400">
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600">{comment.content}</p>
                      </div>
                    </m.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </PullToRefresh>

        {/* 底部评论输入框 — z-[60] 在浮岛导航(z-50)之上，底部留出导航高度 */}
        <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white/90 backdrop-blur-xl border-t border-neutral-100/60 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px)+68px)] md:pl-60 md:pb-3">
          <div className="flex items-center gap-2">
            <input
              ref={commentInputRef}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
              placeholder={t('community.write_comment')}
              className="flex-1 h-11 px-4 rounded-full bg-neutral-100 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all"
              maxLength={200}
            />
            <m.button
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || commentMutation.isPending}
              className="flex-shrink-0 w-11 h-11 rounded-full bg-primary-500 flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed"
              whileTap={{ scale: 0.9 }}
              transition={SPRINGS.snappy}
            >
              <RiSendPlaneFill className="size-5" />
            </m.button>
          </div>
        </div>

        {/* 图片全屏预览 */}
        {previewImage && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setPreviewImage(null)}
          >
            <img
              src={previewImage}
              alt="معاينة"
              className="max-w-full max-h-full object-contain p-4"
            />
          </m.div>
        )}
      </div>
    </LazyMotion>
  );
}

/** 顶部导航 */
function DetailHeader() {
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
            aria-label={t('btn.back')}
          >
            <RiArrowLeftSLine className="w-6 h-6 text-neutral-600" />
          </button>
          <h1 className="text-lg font-bold text-neutral-800 tracking-tight">
            {t('community.detail')}
          </h1>
          <div className="w-10" />
        </div>
      </div>
    </header>
  );
}

/** 加载骨架屏 */
function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/60 via-white to-neutral-50">
      <DetailHeader />
      <div className="px-4 py-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-neutral-200/60 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-4 w-28 bg-neutral-200/60 rounded animate-pulse" />
            <div className="h-3 w-20 bg-neutral-200/40 rounded animate-pulse" />
          </div>
        </div>
        <div className="aspect-video rounded-2xl bg-neutral-100 animate-pulse" />
        <div className="aspect-video rounded-2xl bg-neutral-100 animate-pulse" />
        <div className="h-5 w-3/4 bg-neutral-200/40 rounded animate-pulse" />
      </div>
    </div>
  );
}
