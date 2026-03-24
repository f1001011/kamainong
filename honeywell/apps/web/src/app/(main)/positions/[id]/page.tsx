/**
 * @file 持仓详情页（Sunrise Portfolio 重构版）
 * @description 显示单个持仓订单的完整信息：收益曲线 + Bento 网格 + Tab 分段
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { RiArrowLeftSLine, RiRefreshLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import api from '@/lib/api';
import {
  PositionDetail,
  PositionDetailSkeleton,
  type PositionDetailData,
  type IncomeRecordItem,
  type ChartDataPoint,
} from '@/components/positions/position-detail';

/**
 * 收益记录 API 响应类型
 */
interface IncomeRecordsResponse {
  list: IncomeRecordItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalSettled: string;
    pendingCount: number;
  };
}

/**
 * 图表数据 API 响应类型
 */
interface ChartDataResponse {
  chartData: ChartDataPoint[];
  totalDays: number;
  paidDays: number;
  dailyIncome: string;
  startAt: string;
}

const INCOME_PAGE_SIZE = 50;

export default function PositionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const t = useText();
  const positionId = params.id as string;

  // 获取持仓详情
  const {
    data: positionData,
    error: positionError,
    isLoading: positionLoading,
    isValidating: positionValidating,
    mutate: mutatePosition,
  } = useSWR<PositionDetailData>(
    positionId ? `/positions/${positionId}` : null,
    (url: string) => api.get<PositionDetailData>(url),
    { revalidateOnFocus: false }
  );

  // 获取图表数据
  const {
    data: chartResponse,
  } = useSWR<ChartDataResponse>(
    positionData ? `/positions/${positionId}/chart-data` : null,
    (url: string) => api.get<ChartDataResponse>(url),
    { revalidateOnFocus: false }
  );

  // 获取收益记录（一次加载更多，用于日历和列表）
  const getIncomeKey = useCallback(
    (pageIndex: number, previousPageData: IncomeRecordsResponse | null) => {
      if (!positionData) return null;
      if (previousPageData && previousPageData.list.length === 0) return null;
      return `/positions/${positionId}/incomes?page=${pageIndex + 1}&pageSize=${INCOME_PAGE_SIZE}`;
    },
    [positionId, positionData]
  );

  const {
    data: incomeData,
    mutate: mutateIncome,
    size,
    setSize,
    isValidating: incomeValidating,
  } = useSWRInfinite<IncomeRecordsResponse>(
    getIncomeKey,
    (url: string) => api.get<IncomeRecordsResponse>(url),
    { revalidateOnFocus: false, revalidateFirstPage: false }
  );

  // 合并收益记录
  const incomeRecords = useMemo(() => {
    if (!incomeData) return [];
    return incomeData.flatMap((page) => page.list);
  }, [incomeData]);

  // 是否有更多
  const hasMoreIncomes = useMemo(() => {
    if (!incomeData || incomeData.length === 0) return false;
    const lastPage = incomeData[incomeData.length - 1];
    return lastPage.pagination.page < lastPage.pagination.totalPages;
  }, [incomeData]);

  const position = positionData;

  const handleRefresh = useCallback(async () => {
    await Promise.all([mutatePosition(), mutateIncome()]);
  }, [mutatePosition, mutateIncome]);

  const handleCountdownComplete = useCallback(() => {
    mutatePosition();
    mutateIncome();
  }, [mutatePosition, mutateIncome]);

  const handleLoadMoreIncomes = useCallback(() => {
    setSize(size + 1);
  }, [setSize, size]);

  const isLoading = positionLoading;
  const isValidating = positionValidating;
  const error = positionError;

  return (
    <div className="min-h-screen bg-premium-subtle">
      {/* 毛玻璃导航栏 */}
      <header className="sticky top-0 z-30 glass-heavy border-b border-neutral-100/40">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label={t('btn.back', 'رجوع')}
          >
            <RiArrowLeftSLine className="h-5 w-5 text-neutral-700" />
          </button>
          <h1 className="flex-1 min-w-0 text-center text-base font-semibold tracking-tight text-neutral-800 truncate">
            {t('page.position_detail', 'تفاصيل الاستثمار')}
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
              'h-5 w-5 text-neutral-500',
              isValidating && 'animate-spin'
            )} />
          </button>
        </div>
      </header>

      {/* 内容区域 */}
      <main className="pb-28 md:pb-8">
        {isLoading ? (
          <PositionDetailSkeleton />
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
        ) : position ? (
          <PositionDetail
            position={position}
            incomeRecords={incomeRecords}
            chartData={chartResponse?.chartData}
            hasMoreIncomes={hasMoreIncomes}
            loadingMoreIncomes={incomeValidating}
            onLoadMoreIncomes={handleLoadMoreIncomes}
            onCountdownComplete={handleCountdownComplete}
          />
        ) : (
          <div className="py-12 text-center">
            <p className="text-neutral-500">{t('error.position_not_found', 'لم يتم العثور على الاستثمار')}</p>
            <button
              onClick={() => router.push('/positions')}
              className="mt-4 text-primary-500 hover:text-primary-600"
            >
              {t('btn.back_to_positions', 'العودة إلى استثماراتي')}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
