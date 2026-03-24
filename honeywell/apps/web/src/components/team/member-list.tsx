/**
 * @file 团队成员列表组件
 * @description 支持层级筛选和无限滚动加载的成员列表
 * @reference 开发文档/03.10.1-我的团队页.md
 */

'use client';

import { memo, useState, useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { m, AnimatePresence } from 'motion/react';
import { RiTeamFill, RiFilterLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import api from '@/lib/api';
import { PullToRefresh, InfiniteScroll } from '@/components/ui/pull-to-refresh';
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list';
import { Skeleton } from '@/components/ui/skeleton';
import { MemberCard, type TeamMember } from './member-card';
import { SPRINGS } from '@/lib/animation';

/**
 * 成员列表响应类型
 */
interface MembersResponse {
  list: TeamMember[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 筛选选项
 */
type LevelFilter = 'all' | 1 | 2 | 3;

/**
 * 团队成员列表组件属性
 */
interface MemberListProps {
  /** 自定义样式 */
  className?: string;
}

/**
 * 筛选按钮组件
 */
const FilterButton = memo(function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { isAnimationEnabled } = useAnimationConfig();
  
  return (
    <m.button
      className={cn(
        active
          ? 'rounded-full bg-primary-500 text-white px-3.5 py-1.5 text-xs font-bold shadow-[0_2px_6px_rgba(var(--color-primary-rgb),0.2)]'
          : 'rounded-full border border-neutral-200 bg-white text-neutral-500 px-3.5 py-1.5 text-xs font-semibold transition-all duration-200'
      )}
      onClick={onClick}
      whileTap={isAnimationEnabled ? { scale: 0.95 } : undefined}
      transition={SPRINGS.snappy}
    >
      {children}
    </m.button>
  );
});

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
        <RiTeamFill className="w-10 h-10 text-neutral-400" />
      </div>
      <p className="text-base text-neutral-500">
        {t('team.noMembers', 'لا يوجد أعضاء بعد')}
      </p>
      <p className="text-sm text-neutral-400 mt-1">
        {t('team.inviteFriends', 'ادعُ أصدقاءك للانضمام')}
      </p>
    </m.div>
  );
});

/**
 * 加载骨架屏组件
 */
const MemberSkeleton = memo(function MemberSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-soft">
      <Skeleton circle width={48} height={48} />
      <div className="flex-1">
        <Skeleton className="h-5 w-24 mb-1" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
});

/**
 * 团队成员列表组件
 * @description 支持层级筛选（全部/L1/L2/L3）和无限滚动加载
 * 
 * @example
 * ```tsx
 * <MemberList />
 * ```
 */
export const MemberList = memo(function MemberList({
  className,
}: MemberListProps) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();
  // 依据：03.10.1-我的团队页.md 第3.4节 - 默认显示一级成员
  const [levelFilter, setLevelFilter] = useState<LevelFilter>(1);
  
  // 获取成员列表数据
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
    queryKey: ['team', 'members', levelFilter],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        pageSize: '20',
      });
      if (levelFilter !== 'all') {
        params.append('level', String(levelFilter));
      }
      return api.get<MembersResponse>(`/team/members?${params}`);
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
  
  // 合并所有页面的成员数据
  const members = useMemo(() => {
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
  
  // 筛选选项
  const filterOptions: { value: LevelFilter; label: string }[] = [
    { value: 'all', label: t('team.all', 'الكل') },
    { value: 1, label: 'L1' },
    { value: 2, label: 'L2' },
    { value: 3, label: 'L3' },
  ];
  
  return (
    <div className={cn('flex flex-col', className)}>
      {/* 筛选栏 */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white/70 backdrop-blur-xl sticky top-0 z-10">
        <RiFilterLine className="w-4 h-4 text-neutral-400 shrink-0" />
        <div className="flex items-center gap-2">
          {filterOptions.map((option) => (
            <FilterButton
              key={option.value}
              active={levelFilter === option.value}
              onClick={() => setLevelFilter(option.value)}
            >
              {option.label}
            </FilterButton>
          ))}
        </div>
      </div>
      
      {/* 列表内容 */}
      <PullToRefresh onRefresh={handleRefresh} disabled={isRefetching}>
        <div className="px-4 pb-4">
          {/* 加载中状态 */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <MemberSkeleton key={i} />
              ))}
            </div>
          ) : members.length === 0 ? (
            /* 空状态 */
            <EmptyState />
          ) : (
            /* 成员列表 */
            <AnimatedList stagger="fast" gap="medium" className="space-y-3">
              {members.map((member) => (
                <AnimatedListItem key={member.id}>
                  <MemberCard member={member} />
                </AnimatedListItem>
              ))}
            </AnimatedList>
          )}
          
          {/* 无限滚动加载 */}
          {members.length > 0 && (
            <InfiniteScroll
              hasMore={hasNextPage || false}
              loading={isFetchingNextPage}
              onLoadMore={handleLoadMore}
            >
              {isFetchingNextPage && (
                <div className="pt-3 space-y-3">
                  <MemberSkeleton />
                  <MemberSkeleton />
                </div>
              )}
            </InfiniteScroll>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
});

export default MemberList;
