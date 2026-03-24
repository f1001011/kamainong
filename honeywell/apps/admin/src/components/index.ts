/**
 * @file 组件库主入口
 * @description 统一导出所有组件，便于使用
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第11节 - 常用组件规范
 */

// ==================== 通用组件 ====================
export {
  // 金额显示
  AmountDisplay,
  AmountChange,
  // 时间显示
  TimeDisplay,
  RelativeTime,
  DateDisplay,
  // 状态标签
  StatusBadge,
  StatusDot,
  UserStatusBadge,
  RechargeStatusBadge,
  WithdrawStatusBadge,
  PositionStatusBadge,
  ProductStatusBadge,
  ChannelStatusBadge,
  IncomeStatusBadge,
  AdminStatusBadge,
  ActivityStatusBadge,
  // 脱敏显示
  MaskedText,
  MaskedPhone,
  MaskedBankCard,
  MaskedIdCard,
  // 复制按钮
  CopyButton,
  OrderNoCopy,
  // 统计卡片
  StatisticCard,
  StatisticCardGroup,
  // 其他
  ProgressBar,
  startProgress,
  stopProgress,
  ErrorBoundary,
} from './common';

export type {
  AmountDisplayProps,
  TimeDisplayProps,
  StatusBadgeProps,
  MaskedTextProps,
  MaskType,
  CopyButtonProps,
  StatisticCardProps,
  TrendInfo,
  MiniChartData,
} from './common';

// ==================== 弹窗组件 ====================
export {
  ConfirmModal,
  DangerConfirmModal,
  WarningConfirmModal,
  BatchResultModal,
  DetailDrawer,
  DetailSection,
} from './modals';

export type {
  ConfirmModalProps,
  ConfirmType,
  BatchResultModalProps,
  FailedRecord,
  BatchResultStatus,
  DetailDrawerProps,
  DetailItem,
  DetailStatus,
} from './modals';

// ==================== 表格组件 ====================
export {
  // 筛选相关
  QuickFilters,
  StatusQuickFilters,
  ExpandableSearchForm,
  DateRangeSelect,
  // 排序列表
  DragSortList,
  // 批量操作
  BatchOperationBar,
  // 导出
  ExportButton,
  // 骨架屏
  ListPageSkeleton,
  DetailPageSkeleton,
  // 高亮行
  getHighlightRowClassName,
  generateHighlightStyles,
  getUserRowClassName,
  getWithdrawRowClassName,
  getIncomeRowClassName,
  HIGHLIGHT_ROW_CLASSES,
  HIGHLIGHT_ROW_STYLES,
} from './tables';

export type {
  QuickFiltersProps,
  FilterOption,
  StatusFilterOption,
  ExpandableSearchFormProps,
  SearchFieldConfig,
  BatchOperationBarProps,
  BatchAction,
  DateRangeSelectProps,
  DateRangeValue,
  QuickOption,
  ListPageSkeletonProps,
  DragSortListProps,
  SortableItem,
  SortableItemRenderer,
  HighlightType,
  HighlightConfig,
  HighlightRule,
} from './tables';

// ==================== 业务组件 ====================
export {
  UserInfoCard,
  UserBrief,
  UserAvatarGroup,
  OrderInfoCard,
  OrderNoDisplay,
  OrderAmountCard,
} from './business';

export type {
  UserInfoCardProps,
  OrderInfoCardProps,
  OrderType,
} from './business';
