/**
 * @file 提现记录页
 * @description 显示用户的提现订单列表，支持状态筛选和无限滚动
 * @depends 开发文档/03-前端用户端/03.5-提现模块/03.5.2-提现记录页.md
 */

'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { m } from 'motion/react';
import { RiArrowLeftLine, RiRefreshLine, RiFileList3Line } from '@remixicon/react';
import useSWRInfinite from 'swr/infinite';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import api from '@/lib/api';
import { PullToRefresh, InfiniteScroll } from '@/components/ui/pull-to-refresh';
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderCard, type WithdrawOrderData, type WithdrawOrderStatus } from '@/components/business/order-card';
import { EmptyState } from '@/components/business/empty-state';

/**
 * API 响应类型
 */
interface WithdrawOrdersResponse {
  list: WithdrawOrderData[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Tab 筛选值类型
 * 依据：03.5.2-提现记录页.md 第3.4节 - 状态筛选映射
 */
type TabFilter = 'all' | 'pending_review' | 'processing' | 'completed' | 'rejected' | 'failed';

/**
 * Tab 筛选到 API 状态的映射
 * 依据：03.5.2-提现记录页.md 第3.4节
 */
/**
 * Tab 筛选到 API 状态的映射
 * 依据：03.5.2-提现记录页.md 第3.4节
 * 注意：processing 映射 APPROVED,PAYOUT_FAILED 两个状态
 * 后端 API 已将 PAYOUT_FAILED 转为 APPROVED 返回给用户端
 * 但查询时需要包含两个状态，否则 PAYOUT_FAILED 订单不会出现在"处理中"列表
 */
const tabToStatusMap: Record<TabFilter, string | undefined> = {
  all: undefined,
  pending_review: 'PENDING_REVIEW',
  processing: 'APPROVED,PAYOUT_FAILED',
  completed: 'COMPLETED',
  rejected: 'REJECTED',
  failed: 'FAILED',
};

/**
 * Tab 配置项
 */
interface TabItem {
  key: TabFilter;
  labelKey: string;
}

/**
 * Tab 选项列表
 * 依据：03.5.2-提现记录页.md 第2.2节 - 文案配置
 */
const tabItems: TabItem[] = [
  { key: 'all', labelKey: 'tab.all' },
  { key: 'pending_review', labelKey: 'tab.pending_review' },
  { key: 'processing', labelKey: 'tab.processing' },
  { key: 'completed', labelKey: 'tab.completed' },
  { key: 'rejected', labelKey: 'tab.rejected' },
  { key: 'failed', labelKey: 'tab.failed' },
];

/**
 * 页面大小
 */
const PAGE_SIZE = 20;

/**
 * 横向滚动 Tab 组件
 * 依据：03.5.2-提现记录页.md 第6.5节 - 横向滚动Tab组件实现
 */
function WithdrawRecordTabs({
  activeKey,
  onChange,
}: {
  activeKey: TabFilter;
  onChange: (key: TabFilter) => void;
}) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();

  // Tab 切换时自动滚动到可见区域
  const handleTabClick = (key: TabFilter) => {
    onChange(key);
    // 滚动到选中 Tab 可见
    const tabElement = document.getElementById(`withdraw-tab-${key}`);
    tabElement?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3 -mx-4 border-b border-neutral-100">
      {tabItems.map((item) => {
        const isActive = activeKey === item.key;
        
        return (
          <m.button
            key={item.key}
            id={`withdraw-tab-${item.key}`}
            onClick={() => handleTabClick(item.key)}
            whileTap={isAnimationEnabled ? { scale: 0.95 } : undefined}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-500 text-white shadow-glow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
            type="button"
            role="tab"
            aria-selected={isActive}
          >
            {t(item.labelKey)}
          </m.button>
        );
      })}
    </div>
  );
}

/**
 * 提现记录页面
 */
export default function WithdrawRecordsPage() {
  const router = useRouter();
  const t = useText();
  const { config } = useGlobalConfig();

  // 当前 Tab
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  /**
   * SWR Infinite Key 生成函数
   */
  const getKey = useCallback(
    (pageIndex: number, previousPageData: WithdrawOrdersResponse | null) => {
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

      return `/withdraw/orders?${params.toString()}`;
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
  } = useSWRInfinite<WithdrawOrdersResponse>(
    getKey,
    (url: string) => api.get<WithdrawOrdersResponse>(url),
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
  const handleTabChange = useCallback((key: TabFilter) => {
    setActiveTab(key);
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
   * 处理订单点击
   */
  const handleOrderClick = useCallback((order: WithdrawOrderData) => {
    router.push(`/withdraw/records/${order.id}`);
  }, [router]);

  /**
   * 渲染骨架屏
   * 依据：03.5.2-提现记录页.md 第7.1节 - 骨架屏加载
   */
  const renderSkeleton = () => (
    <div className="space-y-4">
      {/* Tab 骨架 */}
      <div className="flex gap-2 overflow-hidden py-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-full shrink-0" />
        ))}
      </div>
      {/* 订单卡片骨架 */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow-soft p-4 flex">
          <Skeleton className="w-1 h-20 mr-4" />
          <div className="flex-1 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-6 w-24" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-3.5 rounded" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      ))}
    </div>
  );

  /**
   * 渲染空状态
   * 依据：03.5.2-提现记录页.md 第7.2节 - 空状态
   */
  const renderEmptyState = () => (
    <EmptyState
      icon={<RiFileList3Line className="h-16 w-16 text-neutral-300" />}
      title={t('empty.withdraw_record', 'لا يوجد سجل سحوبات')}
      description={t('empty.withdraw_record_desc', 'قم بالسحب لعرض السجل هنا')}
      actionText={t('btn.withdraw', 'سحب')}
      onAction={() => router.push('/withdraw')}
    />
  );

  /**
   * 渲染订单列表
   * 依据：03.5.2-提现记录页.md 第5节 - 动效清单
   */
  const renderOrderList = () => (
    <AnimatedList layout="single" gap="medium" stagger="fast">
      {orders.map((order) => (
        <AnimatedListItem key={order.id} itemKey={order.id}>
          <OrderCard
            type="withdraw"
            order={order}
            onClick={() => handleOrderClick(order)}
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
            {t('page.withdraw_record', 'سجل السحوبات')}
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

        {/* 横向滚动 Tab 筛选 */}
        <div className="px-4">
          <WithdrawRecordTabs
            activeKey={activeTab}
            onChange={handleTabChange}
          />
        </div>
      </header>

      {/* 内容区域 */}
      <main className="px-4 py-4 md:px-6">
        <PullToRefresh onRefresh={handleRefresh}>
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
        </PullToRefresh>
      </main>
    </div>
  );
}
