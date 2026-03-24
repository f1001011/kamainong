/**
 * @file 我的持仓页
 * @description 沉浸式卡片流设计，展示用户所有持仓订单
 * @depends 开发文档/03-页面开发/03.8.1-我的持仓页.md
 * @depends 开发文档/01-设计系统/01.1-设计Token.md - 2026高端美学配色
 * @depends 开发文档/01-设计系统/01.2-动画系统.md - 卡片动画
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWRInfinite from 'swr/infinite';
import useSWR from 'swr';
import { RiArrowLeftLine, RiRefreshLine, RiBriefcaseFill } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import api from '@/lib/api';
import { SimpleTabs, TabContent, type TabItem } from '@/components/ui/simple-tabs';
import { PullToRefresh, InfiniteScroll } from '@/components/ui/pull-to-refresh';
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list';
import { EmptyState } from '@/components/business/empty-state';
import {
  PositionCard,
  PositionCardSkeleton,
  type PositionOrderData,
  type PositionOrderStatus,
} from '@/components/positions/position-card';
import {
  PositionStats,
  PositionStatsSkeleton,
  type PositionSummary,
} from '@/components/positions/position-stats';

/**
 * API 响应类型
 * 依据：02.3-前端API接口清单.md 第8.1节
 */
interface PositionsResponse {
  list: PositionOrderData[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  summary: PositionSummary;
}

/**
 * Tab 筛选值类型
 */
type TabFilter = 'active' | 'completed';

/**
 * Tab 筛选到 API 状态的映射
 */
const tabToStatusMap: Record<TabFilter, PositionOrderStatus> = {
  active: 'ACTIVE',
  completed: 'COMPLETED',
};

/**
 * 页面大小
 */
const PAGE_SIZE = 20;

/**
 * 我的持仓页面
 * @description 沉浸式卡片流设计，核心特性：
 * - Tab 分类：进行中 / 已完成
 * - 渐变进度背景卡片
 * - 收益脉冲动画
 * - 实时倒计时
 * - 下拉刷新 + 无限滚动
 * 
 * 依据：03.8.1-我的持仓页.md
 */
export default function PositionsPage() {
  const router = useRouter();
  const t = useText();
  
  // 当前 Tab
  const [activeTab, setActiveTab] = useState<TabFilter>('active');

  /**
   * 获取统计摘要
   */
  const {
    data: summaryData,
    mutate: mutateSummary,
  } = useSWR<PositionsResponse>(
    '/positions?page=1&pageSize=1',
    (url: string) => api.get<PositionsResponse>(url),
    {
      revalidateOnFocus: false,
    }
  );

  const summary = summaryData?.summary;

  // Tab 选项（显示数量统计）
  // 依据：03.8.1-我的持仓页.md 第3.1节 - Tab标签显示数量
  const tabItems: TabItem[] = useMemo(() => [
    { 
      key: 'active', 
      label: summary 
        ? `${t('tab.active', 'قيد التنفيذ')} (${summary.activeCount})`
        : t('tab.active', 'قيد التنفيذ')
    },
    { 
      key: 'completed', 
      label: summary 
        ? `${t('tab.completed', 'مكتمل')} (${summary.completedCount})`
        : t('tab.completed', 'مكتمل')
    },
  ], [t, summary]);

  /**
   * SWR Infinite Key 生成函数
   */
  const getKey = useCallback(
    (pageIndex: number, previousPageData: PositionsResponse | null) => {
      // 如果已经没有更多数据了，返回 null 停止请求
      if (previousPageData && previousPageData.list.length === 0) return null;

      // 构建查询参数
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(PAGE_SIZE),
        status: tabToStatusMap[activeTab],
      });

      return `/positions?${params.toString()}`;
    },
    [activeTab]
  );

  /**
   * SWR Infinite 获取数据
   */
  const {
    data,
    error,
    size,
    setSize,
    isLoading,
    isValidating,
    mutate,
  } = useSWRInfinite<PositionsResponse>(
    getKey,
    (url: string) => api.get<PositionsResponse>(url),
    {
      revalidateOnFocus: false,
      revalidateFirstPage: false,
    }
  );

  // 合并所有页面的数据
  const positions = useMemo(() => {
    if (!data) return [];
    return data.flatMap((page) => page.list);
  }, [data]);

  // 是否有更多数据
  const hasMore = useMemo(() => {
    if (!data || data.length === 0) return false;
    const lastPage = data[data.length - 1];
    return lastPage.pagination.page < lastPage.pagination.totalPages;
  }, [data]);

  // 是否正在加载更多
  const isLoadingMore = isValidating && size > 1;

  /**
   * 处理 Tab 切换
   */
  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key as TabFilter);
  }, []);

  /**
   * 处理下拉刷新
   */
  const handleRefresh = useCallback(async () => {
    await Promise.all([mutate(), mutateSummary()]);
  }, [mutate, mutateSummary]);

  /**
   * 处理加载更多
   */
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      setSize(size + 1);
    }
  }, [isLoadingMore, hasMore, setSize, size]);

  /**
   * 处理倒计时归零（刷新列表）
   */
  const handleCountdownComplete = useCallback(() => {
    mutate();
    mutateSummary();
  }, [mutate, mutateSummary]);

  /**
   * 处理持仓卡片点击
   */
  const handlePositionClick = useCallback((position: PositionOrderData) => {
    router.push(`/positions/${position.id}`);
  }, [router]);

  /**
   * 渲染骨架屏
   * 依据：03.8.1-我的持仓页.md - 卡片间距 gap-6
   */
  const renderSkeleton = () => (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <PositionCardSkeleton key={i} />
      ))}
    </div>
  );

  /**
   * 渲染空状态
   * 依据：03.8.1-我的持仓页.md - 空状态需要 3D 风格插画
   */
  const renderEmptyState = () => (
    <EmptyState
      icon={<RiBriefcaseFill className="h-16 w-16 text-neutral-300" />}
      title={
        activeTab === 'active'
          ? t('empty.position_active', 'لا توجد استثمارات نشطة')
          : t('empty.position_completed', 'لا توجد استثمارات مكتملة')
      }
      description={
        activeTab === 'active'
          ? t('empty.position_active_desc', 'استكشف منتجاتنا لبدء الاستثمار')
          : t('empty.position_completed_desc', 'ستظهر الاستثمارات المكتملة هنا')
      }
      actionText={activeTab === 'active' ? t('btn.explore_products', 'استكشاف المنتجات') : undefined}
      onAction={activeTab === 'active' ? () => router.push('/products') : undefined}
    />
  );

  /**
   * 渲染持仓列表
   * 依据：03.8.1-我的持仓页.md - 沉浸式卡片流，卡片间距 gap-6
   */
  const renderPositionList = () => (
    <AnimatedList layout="single" gap="large" stagger="fast">
      {positions.map((position) => (
        <AnimatedListItem key={position.id} itemKey={position.id}>
          <PositionCard
            position={position}
            onClick={() => handlePositionClick(position)}
            onCountdownComplete={handleCountdownComplete}
          />
        </AnimatedListItem>
      ))}
    </AnimatedList>
  );

  return (
    <div className="min-h-screen bg-immersive">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-20 bg-white/65 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/40 shadow-[0_1px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label={t('btn.back', 'رجوع')}
          >
            <RiArrowLeftLine className="h-5 w-5 text-neutral-600" />
          </button>
          <h1 className="flex-1 min-w-0 text-center text-lg font-bold tracking-tight text-neutral-800 truncate">
            {t('page.my_positions', 'استثماراتي')}
          </h1>
          <button
            onClick={handleRefresh}
            disabled={isValidating}
            className={cn(
              'p-2 -mr-2 rounded-lg hover:bg-neutral-100 transition-colors',
              isValidating && 'opacity-50'
            )}
            aria-label={t('btn.refresh', 'تحديث')}
          >
            <RiRefreshLine className={cn(
              'h-5 w-5 text-neutral-600',
              isValidating && 'animate-spin'
            )} />
          </button>
        </div>

        {/* Tab 筛选 */}
        <SimpleTabs
          items={tabItems}
          activeKey={activeTab}
          onChange={handleTabChange}
          className="px-4"
        />
      </header>

      {/* 内容区域 */}
      <main className="px-4 py-4 md:px-6">
        <PullToRefresh onRefresh={handleRefresh}>
          {/* 统计概览卡片 */}
          <div className="mb-4">
            {summary ? (
              <PositionStats summary={summary} />
            ) : (
              <PositionStatsSkeleton />
            )}
          </div>

          {/* 持仓列表 */}
          <TabContent activeKey={activeTab}>
            {isLoading ? (
              renderSkeleton()
            ) : error ? (
              <div className="py-12 text-center">
                <p className="text-neutral-500">{t('error.load_failed', 'خطأ في التحميل')}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 text-primary-500 hover:text-primary-600"
                >
                  {t('btn.retry', 'إعادة المحاولة')}
                </button>
              </div>
            ) : positions.length === 0 ? (
              renderEmptyState()
            ) : (
              <InfiniteScroll
                hasMore={hasMore}
                loading={isLoadingMore}
                onLoadMore={handleLoadMore}
              >
                {renderPositionList()}
              </InfiniteScroll>
            )}
          </TabContent>
        </PullToRefresh>

        {/* 底部留白 - 为底部导航预留空间 */}
        {/* 依据：03.8.1-我的持仓页.md - 底部留白 h-24 */}
        <div className="h-24" />
      </main>
    </div>
  );
}
