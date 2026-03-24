/**
 * @file 充值记录页
 * @description 显示用户的充值订单列表，支持状态筛选和无限滚动
 * @depends 开发文档/03-前端用户端/03.4-充值模块/03.4.2-充值记录页.md
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { m } from 'motion/react';
import { RiArrowLeftLine, RiRefreshLine, RiHistoryFill } from '@remixicon/react';
import useSWRInfinite from 'swr/infinite';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import api from '@/lib/api';
import { SimpleTabs, TabContent, type TabItem } from '@/components/ui/simple-tabs';
import { PullToRefresh, InfiniteScroll } from '@/components/ui/pull-to-refresh';
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderCard, type RechargeOrderData, type RechargeOrderStatus } from '@/components/business/order-card';
import { EmptyState } from '@/components/business/empty-state';

/**
 * API 响应类型
 */
interface RechargeOrdersResponse {
  list: RechargeOrderData[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Tab 筛选值类型
 */
type TabFilter = 'all' | 'pending' | 'completed' | 'cancelled';

/**
 * Tab 筛选到 API 状态的映射
 */
const tabToStatusMap: Record<TabFilter, RechargeOrderStatus | undefined> = {
  all: undefined,
  pending: 'PENDING_PAYMENT',
  completed: 'PAID',
  cancelled: 'CANCELLED',
};

/**
 * 页面大小
 */
const PAGE_SIZE = 20;

/**
 * 充值记录页面
 */
export default function RechargeRecordsPage() {
  const router = useRouter();
  const t = useText();
  const { config } = useGlobalConfig();
  
  // 当前 Tab
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  // Tab 选项
  const tabItems: TabItem[] = useMemo(() => [
    { key: 'all', label: t('tab.all') },
    { key: 'pending', label: t('tab.pending_payment') },
    { key: 'completed', label: t('tab.completed') },
    { key: 'cancelled', label: t('tab.cancelled') },
  ], [t]);

  /**
   * SWR Infinite Key 生成函数
   */
  const getKey = useCallback(
    (pageIndex: number, previousPageData: RechargeOrdersResponse | null) => {
      // 如果已经没有更多数据了，返回 null 停止请求
      if (previousPageData && previousPageData.list.length === 0) return null;

      // 构建查询参数
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(PAGE_SIZE),
      });

      const status = tabToStatusMap[activeTab];
      if (status) {
        params.set('status', status);
      }

      return `/recharge/orders?${params.toString()}`;
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
  } = useSWRInfinite<RechargeOrdersResponse>(
    getKey,
    (url: string) => api.get<RechargeOrdersResponse>(url),
    {
      revalidateOnFocus: false,
      revalidateFirstPage: false,
    }
  );

  // 合并所有页面的数据
  const orders = useMemo(() => {
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
    await mutate();
  }, [mutate]);

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
  const handleExpire = useCallback(() => {
    mutate();
  }, [mutate]);

  /**
   * 处理订单点击
   */
  const handleOrderClick = useCallback((order: RechargeOrderData) => {
    router.push(`/recharge/records/${order.id}`);
  }, [router]);

  /**
   * 渲染骨架屏
   */
  const renderSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow-soft p-4 flex">
          <Skeleton className="w-1 h-full mr-4" />
          <div className="flex-1 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );

  /**
   * 渲染空状态
   */
  const renderEmptyState = () => (
    <EmptyState
      icon={<RiHistoryFill className="h-16 w-16 text-neutral-300" />}
      title={t('empty.recharge_record')}
      description={t('empty.recharge_record_desc')}
      actionText={t('btn.recharge')}
      onAction={() => router.push('/recharge')}
    />
  );

  /**
   * 渲染订单列表
   */
  const renderOrderList = () => (
    <AnimatedList layout="single" gap="medium" stagger="fast">
      {orders.map((order) => (
        <AnimatedListItem key={order.id} itemKey={order.id}>
          <OrderCard
            type="recharge"
            order={order}
            onClick={() => handleOrderClick(order)}
            onExpire={handleExpire}
            timeoutMinutes={config.rechargeTimeoutMinutes || 30}
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
            aria-label={t('btn.back')}
          >
            <RiArrowLeftLine className="h-5 w-5 text-neutral-600" />
          </button>
          <h1 className="flex-1 min-w-0 text-center text-lg font-bold tracking-tight text-neutral-800 truncate">
            {t('page.recharge_record')}
          </h1>
          <button
            onClick={handleRefresh}
            disabled={isValidating}
            className={cn(
              'p-2 -mr-2 rounded-lg hover:bg-neutral-100 transition-colors',
              isValidating && 'opacity-50'
            )}
            aria-label={t('btn.refresh')}
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
          <TabContent activeKey={activeTab}>
            {isLoading ? (
              renderSkeleton()
            ) : error ? (
              <div className="py-12 text-center">
                <p className="text-neutral-500">{t('error.load_failed')}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 text-primary-500 hover:text-primary-600"
                >
                  {t('btn.retry')}
                </button>
              </div>
            ) : orders.length === 0 ? (
              renderEmptyState()
            ) : (
              <InfiniteScroll
                hasMore={hasMore}
                loading={isLoadingMore}
                onLoadMore={handleLoadMore}
              >
                {renderOrderList()}
              </InfiniteScroll>
            )}
          </TabContent>
        </PullToRefresh>
      </main>
    </div>
  );
}
