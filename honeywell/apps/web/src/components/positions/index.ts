/**
 * @file 持仓组件导出
 * @description 统一导出持仓相关组件和类型
 */

// 持仓卡片（列表页用）
export {
  PositionCard,
  PositionCardSkeleton,
  type PositionOrderData,
  type PositionOrderStatus,
  type PositionCardProps,
} from './position-card';

// 持仓统计（列表页用）
export {
  PositionStats,
  PositionStatsSkeleton,
  PositionStatsCompact,
  type PositionSummary,
  type PositionStatsProps,
  type PositionStatsCompactProps,
} from './position-stats';

// 持仓详情（重构版）
export {
  PositionDetail,
  PositionDetailSkeleton,
  type PositionDetailData,
  type PositionDetailProps,
  type IncomeRecordItem,
  type ChartDataPoint,
} from './position-detail';

// Hero 区
export {
  PositionHeroSection,
  PositionHeroSectionSkeleton,
} from './position-hero-section';

// 收益增长曲线
export {
  EarningsChart,
  EarningsChartSkeleton,
} from './earnings-chart';

// Bento 指标网格
export {
  BentoStatsGrid,
  BentoStatsGridSkeleton,
} from './bento-stats-grid';

// 里程碑进度条
export {
  MilestoneProgress,
  MilestoneProgressSkeleton,
} from './milestone-progress';

// 倒计时条
export { CountdownStrip } from './countdown-strip';

// Tab 分段
export { ContentTabs } from './content-tabs';

// 详情面板
export { DetailsPanel } from './details-panel';

// 日历面板
export { CalendarPanel } from './calendar-panel';

// 收益明细面板
export { HistoryPanel } from './history-panel';

// 完成庆祝
export { CompletionCelebration } from './completion-celebration';
