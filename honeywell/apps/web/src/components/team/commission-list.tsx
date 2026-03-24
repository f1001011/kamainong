/**
 * @file 返佣记录列表组件
 * @description 支持无限滚动加载的返佣记录列表
 * @reference 开发文档/03.10.1-我的团队页.md
 */

'use client';

import { memo, useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { m } from 'motion/react';
import { RiMoneyDollarCircleFill } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import api from '@/lib/api';
import { PullToRefresh, InfiniteScroll } from '@/components/ui/pull-to-refresh';
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list';
import { Skeleton } from '@/components/ui/skeleton';
import { CommissionCard, type CommissionRecord } from './commission-card';
import { SPRINGS } from '@/lib/animation';

/**
 * 返佣记录列表响应类型
 */
interface CommissionsResponse {
  list: CommissionRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 返佣记录列表组件属性
 */
interface CommissionListProps {
  /** 自定义样式 */
  className?: string;
}

/**
 * 空状态组件
 */
const EmptyState = memo(function EmptyState() {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();
  
  return (
    <m.div
      className="flex flex-col items-center justify-center py-16"
      initial={isAnimationEnabled ? { opacity: 0, scale: 0.9 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPRINGS.gentle}
    >
      <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
        <RiMoneyDollarCircleFill className="w-10 h-10 text-neutral-400" />
      </div>
      <p className="text-base text-neutral-500">
        {t('team.noCommissions', 'لا توجد عمولات بعد')}
      </p>
      <p className="text-sm text-neutral-400 mt-1">
        {t('team.inviteToEarn', 'ادعُ أصدقاءك لكسب العمولات')}
      </p>
    </m.div>
  );
});

/**
 * 加载骨架屏组件
 */
const CommissionSkeleton = memo(function CommissionSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-soft">
      <Skeleton circle width={40} height={40} />
      <div className="flex-1">
        <Skeleton className="h-5 w-20 mb-1" />
        <Skeleton className="h-4 w-36" />
      </div>
      <Skeleton className="h-6 w-20" />
    </div>
  );
});

/**
 * 返佣记录列表组件
 * @description 支持无限滚动加载的返佣记录列表
 * 
 * @example
 * ```tsx
 * <CommissionList />
 * ```
 */
export const CommissionList = memo(function CommissionList({
  className,
}: CommissionListProps) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();
  
  // 获取返佣记录数据
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['team', 'commissions'],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        pageSize: '20',
      });
      return api.get<CommissionsResponse>(`/team/commissions?${params}`);
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
  
  // 合并所有页面的记录数据
  const commissions = useMemo(() => {
    return data?.pages.flatMap((page) => page.list) || [];
  }, [data]);
  
  // 下拉刷新处理
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);
  
  // 加载更多处理
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  return (
    <div className={cn('flex flex-col', className)}>
      {/* 列表内容 */}
      <PullToRefresh onRefresh={handleRefresh} disabled={isRefetching}>
        <div className="px-4 pb-4">
          {/* 加载中状态 */}
          {isLoading ? (
            <div className="space-y-3 pt-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <CommissionSkeleton key={i} />
              ))}
            </div>
          ) : commissions.length === 0 ? (
            /* 空状态 */
            <EmptyState />
          ) : (
            /* 返佣记录列表 */
            <AnimatedList stagger="fast" gap="medium" className="space-y-3 pt-3">
              {commissions.map((record) => (
                <AnimatedListItem key={record.id}>
                  <CommissionCard record={record} />
                </AnimatedListItem>
              ))}
            </AnimatedList>
          )}
          
          {/* 无限滚动加载 */}
          {commissions.length > 0 && (
            <InfiniteScroll
              hasMore={hasNextPage || false}
              loading={isFetchingNextPage}
              onLoadMore={handleLoadMore}
            >
              {isFetchingNextPage && (
                <div className="pt-3 space-y-3">
                  <CommissionSkeleton />
                  <CommissionSkeleton />
                </div>
              )}
            </InfiniteScroll>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
});

export default CommissionList;
