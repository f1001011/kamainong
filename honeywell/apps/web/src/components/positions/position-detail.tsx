/**
 * @file 持仓详情组件（完全重构）
 * @description Sunrise Portfolio 设计：收益曲线 + Bento 网格 + Tab 分段
 * 灵感来源：Robinhood（收益曲线）× Apple（Bento 网格）× Revolut（数据可视化）
 */

'use client';

import { m } from 'motion/react';
import { RiMoneyDollarCircleFill } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { slideUpVariants } from '@/lib/animation';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { formatCurrency } from '@/lib/format';
import { PositionHeroSection, PositionHeroSectionSkeleton } from './position-hero-section';
import { EarningsChart, EarningsChartSkeleton } from './earnings-chart';
import { BentoStatsGrid, BentoStatsGridSkeleton } from './bento-stats-grid';
import { MilestoneProgress, MilestoneProgressSkeleton } from './milestone-progress';
import { CountdownStrip } from './countdown-strip';
import { ContentTabs } from './content-tabs';
import { DetailsPanel } from './details-panel';
import { CalendarPanel } from './calendar-panel';
import { HistoryPanel } from './history-panel';
import { CompletionCelebration } from './completion-celebration';
import type { PositionOrderStatus } from './position-card';

/**
 * 收益记录项数据
 */
export interface IncomeRecordItem {
  id: number;
  settleSequence: number;
  amount: string;
  status: 'PENDING' | 'SETTLED' | 'FAILED';
  scheduleAt: string;
  settledAt: string | null;
}

/**
 * 图表数据点
 */
export interface ChartDataPoint {
  day: number;
  cumulative: string;
  status: string;
  date: string;
}

/**
 * 持仓详情完整数据（增强版）
 */
export interface PositionDetailData {
  id: number;
  orderNo: string;
  productId: number;
  productName: string;
  productImage: string | null;
  purchaseAmount: string;
  dailyIncome: string;
  totalIncome: string;
  cycleDays: number;
  paidDays: number;
  remainingDays: number;
  earnedIncome: string;
  status: PositionOrderStatus;
  isGift: boolean;
  startAt: string;
  endAt: string | null;
  nextSettleAt: string | null;
  productSeries: string;
  productType: string;
  returnPrincipal?: boolean;
  dailyRate: string;
  todayIncome: {
    amount: string;
    settled: boolean;
  };
  settledStreak: number;
  estimatedEndAt: string | null;
  milestones: {
    quarter: boolean;
    half: boolean;
    threeQuarter: boolean;
    complete: boolean;
  };
}

/**
 * PositionDetail 组件属性
 */
export interface PositionDetailProps {
  position: PositionDetailData;
  incomeRecords?: IncomeRecordItem[];
  chartData?: ChartDataPoint[];
  hasMoreIncomes?: boolean;
  loadingMoreIncomes?: boolean;
  onLoadMoreIncomes?: () => void;
  className?: string;
  onCountdownComplete?: () => void;
}

/**
 * PositionDetail 持仓详情组件（Sunrise Portfolio 设计）
 */
export function PositionDetail({
  position,
  incomeRecords = [],
  chartData = [],
  hasMoreIncomes = false,
  loadingMoreIncomes = false,
  onLoadMoreIncomes,
  className,
  onCountdownComplete,
}: PositionDetailProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  const isActive = position.status === 'ACTIVE';
  const isFinancialProduct = position.returnPrincipal === true || position.productType === 'FINANCIAL';

  return (
    <div className={cn('', className)}>
      {/* Hero 区：暖色渐变 + 产品胶囊 + 大数字 */}
      <PositionHeroSection
        productName={position.productName}
        productImage={position.productImage}
        productSeries={position.productSeries}
        cycleDays={position.cycleDays}
        status={position.status as 'ACTIVE' | 'COMPLETED'}
        isGift={position.isGift}
        earnedIncome={position.earnedIncome}
        totalIncome={position.totalIncome}
        dailyRate={position.dailyRate}
      />

      {/* 收益增长曲线 */}
      <m.div
        variants={slideUpVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
      >
        <EarningsChart
          chartData={chartData}
          totalDays={position.cycleDays}
          paidDays={position.paidDays}
          dailyIncome={position.dailyIncome}
          totalIncome={position.totalIncome}
          productSeries={position.productSeries}
        />
      </m.div>

      {/* Bento 指标网格 */}
      <m.div
        variants={slideUpVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        <BentoStatsGrid
          purchaseAmount={position.purchaseAmount}
          dailyIncome={position.dailyIncome}
          cycleDays={position.cycleDays}
          paidDays={position.paidDays}
          totalIncome={position.totalIncome}
          isActive={isActive}
        />
      </m.div>

      {/* 理财产品到期返还信息 */}
      {isFinancialProduct && (
        <m.div
          variants={slideUpVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.32 }}
          className="px-4 mt-4"
        >
          <div className="rounded-xl bg-gradient-to-r from-primary-50 to-jade-50 border border-primary-100/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <RiMoneyDollarCircleFill className="h-5 w-5 text-primary-500" />
              <span className="font-semibold text-primary-700">
                {t('position.maturity_info')}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">{t('position.principal')}</span>
                <span className="font-medium">{formatCurrency(position.purchaseAmount, config)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">{t('position.interest')}</span>
                <span className="font-medium text-primary-600">{formatCurrency(position.totalIncome, config)}</span>
              </div>
              <div className="h-px bg-primary-200/50" />
              <div className="flex justify-between">
                <span className="font-medium text-neutral-700">{t('position.total_return')}</span>
                <span className="font-bold text-primary-600">
                  {formatCurrency(Number(position.purchaseAmount) + Number(position.totalIncome), config)}
                </span>
              </div>
            </div>
          </div>
        </m.div>
      )}

      {/* 里程碑进度条 */}
      <m.div
        variants={slideUpVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.35 }}
        className="mt-4"
      >
        <MilestoneProgress
          paidDays={position.paidDays}
          cycleDays={position.cycleDays}
          milestones={position.milestones}
          productSeries={position.productSeries}
        />
      </m.div>

      {/* 倒计时条（仅 ACTIVE） */}
      {isActive && position.nextSettleAt && (
        <div className="mt-4">
          <CountdownStrip
            nextSettleAt={position.nextSettleAt}
            dailyIncome={position.dailyIncome}
            onComplete={onCountdownComplete}
          />
        </div>
      )}

      {/* Tab 分段内容区 */}
      <ContentTabs
        detailsContent={
          <DetailsPanel
            orderNo={position.orderNo}
            startAt={position.startAt}
            endAt={position.endAt}
            estimatedEndAt={position.estimatedEndAt}
            status={position.status as 'ACTIVE' | 'COMPLETED'}
            productName={position.productName}
            productSeries={position.productSeries}
            productType={position.productType}
            isGift={position.isGift}
            settledStreak={position.settledStreak}
          />
        }
        calendarContent={
          <CalendarPanel
            records={incomeRecords}
            startAt={position.startAt}
            cycleDays={position.cycleDays}
          />
        }
        historyContent={
          <HistoryPanel
            records={incomeRecords}
            hasMore={hasMoreIncomes}
            loading={loadingMoreIncomes}
            onLoadMore={onLoadMoreIncomes}
          />
        }
      />

      {/* 完成庆祝（仅 COMPLETED） */}
      {!isActive && (
        <CompletionCelebration
          totalEarned={position.earnedIncome}
          cycleDays={position.cycleDays}
        />
      )}
    </div>
  );
}

/**
 * PositionDetailSkeleton 持仓详情骨架屏
 */
export function PositionDetailSkeleton() {
  return (
    <div>
      <PositionHeroSectionSkeleton />
      <EarningsChartSkeleton />
      <div className="mt-6">
        <BentoStatsGridSkeleton />
      </div>
      <div className="mt-4">
        <MilestoneProgressSkeleton />
      </div>
      {/* 倒计时骨架 */}
      <div className="mx-4 mt-4 p-4 bg-primary-50/50 rounded-2xl animate-pulse">
        <div className="flex justify-between mb-3">
          <div className="h-5 w-28 bg-neutral-200/60 rounded" />
          <div className="h-5 w-24 bg-neutral-200/60 rounded" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-36 bg-neutral-200/60 rounded" />
          <div className="h-4 w-16 bg-neutral-200/60 rounded" />
        </div>
      </div>
      {/* Tab 区域骨架 */}
      <div className="mx-4 mt-6 animate-pulse">
        <div className="flex border-b border-neutral-100 mb-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 py-3 flex justify-center">
              <div className="h-4 w-16 bg-neutral-100 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-soft-sm">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex justify-between py-3.5">
              <div className="h-4 w-24 bg-neutral-100 rounded" />
              <div className="h-4 w-32 bg-neutral-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PositionDetail;
