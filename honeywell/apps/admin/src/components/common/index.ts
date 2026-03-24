/**
 * @file 通用组件导出
 * @description 统一导出所有通用组件
 */

export { AmountDisplay, AmountChange } from './AmountDisplay';
export type { AmountDisplayProps } from './AmountDisplay';

export { TimeDisplay, RelativeTime, DateDisplay } from './TimeDisplay';
export type { TimeDisplayProps } from './TimeDisplay';

export {
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
  BannerStatusBadge,
  LoginStatusBadge,
  NotificationReadStatusBadge,
  TaskStatusBadge,
} from './StatusBadge';
export type { StatusBadgeProps } from './StatusBadge';

export {
  MaskedText,
  MaskedPhone,
  MaskedBankCard,
  MaskedIdCard,
} from './MaskedText';
export type { MaskedTextProps, MaskType } from './MaskedText';

export { CopyButton, OrderNoCopy } from './CopyButton';
export type { CopyButtonProps } from './CopyButton';

export { StatisticCard, StatisticCardGroup } from './StatisticCard';
export type { StatisticCardProps, TrendInfo, MiniChartData } from './StatisticCard';

export { ProgressBar, startProgress, stopProgress } from './ProgressBar';
export { ErrorBoundary } from './ErrorBoundary';

export { default as RichTextEditor } from './RichTextEditor';
export type { RichTextEditorProps, RichTextEditorRef } from './RichTextEditor';
