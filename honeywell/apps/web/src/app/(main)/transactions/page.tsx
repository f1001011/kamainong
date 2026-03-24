/**
 * @file 资金明细页
 * @description 极简沉浸式财务视图，清晰展示用户所有资金流水
 * @depends 开发文档/03-前端用户端/03.9-资金明细/03.9.1-资金明细页.md
 * @depends 开发文档/01-设计系统/01.1-设计Token.md - 2026高端美学配色
 * @depends 开发文档/01-设计系统/01.2-动画系统.md - 交错动画
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWRInfinite from 'swr/infinite';
import { RiArrowLeftLine, RiRefreshLine, RiLoader4Line } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import api from '@/lib/api';
import { PullToRefresh, InfiniteScroll } from '@/components/ui/pull-to-refresh';
import {
  TypeFilterTabs,
  TransactionList,
  TransactionListSkeleton,
  DateRangePicker,
  type TransactionRecord,
} from '@/components/transactions';

/**
 * API 响应类型
 * 依据：02.3-前端API接口清单.md 第7节
 */
interface TransactionsResponse {
  list: TransactionRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 页面大小
 */
const PAGE_SIZE = 20;

/**
 * 资金明细页面
 * @description 极简沉浸式财务视图，核心特性：
 * - 类型筛选胶囊（横向滚动）
 * - 日期范围筛选（可选，配置控制）
 * - 按日期分组展示
 * - 收入/支出金额颜色区分
 * - 交错入场动画
 * - 下拉刷新 + 无限滚动
 * 
 * 依据：03.9.1-资金明细页.md
 */
export default function TransactionsPage() {
  const router = useRouter();
  const t = useText();
  const { config: globalConfig } = useGlobalConfig();
  
  // 筛选状态
  const [activeType, setActiveType] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // 是否启用时间筛选（从配置获取）
  const isTimeFilterEnabled = globalConfig?.transactionTimeFilterEnabled ?? false;

  // 是否有筛选条件
  const isFiltered = activeType !== 'ALL' || startDate !== null || endDate !== null;

  /**
   * 清除所有筛选条件
   * 依据：03.9.1-资金明细页.md 4.6节 - 空状态清除筛选
   */
  const handleClearFilter = useCallback(() => {
    setActiveType('ALL');
    setStartDate(null);
    setEndDate(null);
  }, []);

  /**
   * SWR Infinite Key 生成函数
   */
  const getKey = useCallback(
    (pageIndex: number, previousPageData: TransactionsResponse | null) => {
      // 如果已经没有更多数据了，返回 null 停止请求
      if (previousPageData && previousPageData.list.length === 0) return null;

      // 构建查询参数
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(PAGE_SIZE),
      });

      // 类型筛选
      if (activeType !== 'ALL') {
        params.set('type', activeType);
      }

      // 日期筛选
      if (startDate) {
        params.set('startDate', startDate);
      }
      if (endDate) {
        params.set('endDate', endDate);
      }

      return `/transactions?${params.toString()}`;
    },
    [activeType, startDate, endDate]
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
  } = useSWRInfinite<TransactionsResponse>(
    getKey,
    (url: string) => api.get<TransactionsResponse>(url),
    {
      revalidateOnFocus: false,
      revalidateFirstPage: false,
    }
  );

  // 合并所有页面的数据
  const transactions = useMemo(() => {
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
   * 处理类型筛选变更
   */
  const handleTypeChange = useCallback((type: string) => {
    setActiveType(type);
  }, []);

  /**
   * 处理日期筛选变更
   */
  const handleDateChange = useCallback((start: string | null, end: string | null) => {
    setStartDate(start);
    setEndDate(end);
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

  return (
    <div className="min-h-screen bg-immersive pb-20 md:pb-8">
      {/* 电脑端页面标题区 - 依据：03.9.1-资金明细页.md 3.4节 */}
      <div className="hidden md:block px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-800">
          {t('page.transactions')}
        </h1>
      </div>

      {/* 顶部导航栏 - 依据：03.9.1-资金明细页.md 3.2节 */}
      <header className="sticky top-0 z-20 bg-white/65 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/40 shadow-[0_1px_12px_rgba(0,0,0,0.03)]">
        {/* 移动端导航栏 */}
        <div className="flex items-center h-14 px-4 md:hidden">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label={t('btn.back')}
          >
            <RiArrowLeftLine className="h-5 w-5 text-neutral-600" />
          </button>
          <h1 className="flex-1 min-w-0 text-center text-lg font-bold tracking-tight text-neutral-800 truncate">
            {t('page.transactions')}
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

        {/* 筛选区域 - 依据：03.9.1-资金明细页.md 3.3/3.4节 */}
        <div className="px-4 md:px-6 py-3 md:flex md:items-center md:gap-6">
          {/* 类型筛选胶囊 */}
          <TypeFilterTabs
            activeType={activeType}
            onChange={handleTypeChange}
          />
          
          {/* 日期筛选（根据配置显示） */}
          {isTimeFilterEnabled && (
            <div className="mt-3 md:mt-0">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onChange={handleDateChange}
              />
            </div>
          )}
        </div>
      </header>

      {/* 内容区域 - 依据：03.9.1-资金明细页.md 3.3/3.4节 */}
      <main className="px-4 md:px-6 pt-6 md:max-w-4xl">
        <PullToRefresh onRefresh={handleRefresh}>
          {isLoading ? (
            <TransactionListSkeleton count={8} />
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-neutral-500">{t('error.load_failed')}</p>
              <p className="text-sm text-neutral-400 mt-1">{t('error.load_failed_tip')}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 text-primary-500 hover:text-primary-600"
              >
                {t('btn.retry')}
              </button>
            </div>
          ) : (
            <>
              <InfiniteScroll
                hasMore={hasMore}
                loading={isLoadingMore}
                onLoadMore={handleLoadMore}
              >
                <TransactionList
                  transactions={transactions}
                  isFiltered={isFiltered}
                  onClearFilter={handleClearFilter}
                />
              </InfiniteScroll>

              {/* 加载更多指示器 - 依据：03.9.1-资金明细页.md 5.1节 */}
              {isLoadingMore && (
                <div className="py-6 flex justify-center">
                  <RiLoader4Line className="w-6 h-6 text-primary-500 animate-spin" />
                </div>
              )}

              {/* 没有更多数据 - 依据：03.9.1-资金明细页.md 5.1节 */}
              {!isLoading && !hasMore && transactions.length > 0 && (
                <div className="py-8 text-center">
                  <span className="text-sm text-neutral-400">{t('tip.no_more_data')}</span>
                </div>
              )}
            </>
          )}
        </PullToRefresh>
      </main>
    </div>
  );
}
