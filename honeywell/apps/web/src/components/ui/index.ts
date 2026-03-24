/**
 * @file UI 组件统一导出
 * @description 所有 UI 基础组件的统一入口
 * @depends 开发文档/01-设计系统/01.3-组件规范.md
 * 
 * 组件分类：
 * - 基础组件：Button, Input, Card, Skeleton
 * - 数据展示：AnimatedNumber, CircularProgress
 * - 反馈组件：ConfirmDialog, Tooltip, TipsCard
 * - 表单组件：FormField, FormGroup, FormActions, AmountSelector
 * - 导航组件：SimpleTabs, TabContent
 * - 列表组件：AnimatedList, PullToRefresh, InfiniteScroll, InfiniteScrollTrigger
 * - 工具组件：CopyButton, Countdown, ImagePreview, LoadingSpinner
 * - 弹窗组件：ResponsiveModal
 */

// ========== 基础组件 ==========
export { Button, buttonVariants, type ButtonProps } from './button';
export { Input, inputVariants, type InputProps } from './input';
export { Card, CardHeader, CardContent, CardFooter, type CardProps, type CardHeaderProps, type CardContentProps, type CardFooterProps } from './card';
export { Skeleton, BalanceCardSkeleton, ListItemSkeleton, FormSkeleton, type SkeletonProps } from './skeleton';

// ========== 数据展示组件 ==========
export { AnimatedNumber, type AnimatedNumberProps } from './animated-number';
export { CircularProgress, CircularProgressSkeleton, type CircularProgressProps } from './circular-progress';

// ========== 反馈组件 ==========
export { ConfirmDialog, type ConfirmDialogProps } from './confirm-dialog';
export { Tooltip, TooltipProvider, InfoTooltip, type TooltipProps, type InfoTooltipProps } from './tooltip';
export { TipsCard, type TipsCardProps, type TipsCardType } from './tips-card';

// ========== 加载组件 ==========
export { 
  LoadingSpinner, 
  FullScreenLoader, 
  ButtonSpinner, 
  PageLoader, 
  InlineSpinner,
  loadingSpinnerVariants,
  type LoadingSpinnerProps, 
  type FullScreenLoaderProps 
} from './loading-spinner';

// ========== 表单组件 ==========
export { FormField, FormGroup, FormActions, type FormFieldProps, type FormGroupProps, type FormActionsProps } from './form-field';
export { AmountSelector, type AmountSelectorProps, type AmountSelectorType } from './amount-selector';

// ========== 导航组件 ==========
export { SimpleTabs, TabContent, type TabItem, type SimpleTabsProps, type TabContentProps } from './simple-tabs';

// ========== 列表组件 ==========
export { AnimatedList, AnimatedListItem, AnimatedListWithPresence, type AnimatedListProps, type AnimatedListItemProps, type AnimatedListWithPresenceProps } from './animated-list';
export { PullToRefresh, InfiniteScroll, type PullToRefreshProps, type InfiniteScrollProps } from './pull-to-refresh';
export { 
  InfiniteScrollTrigger, 
  InfiniteScrollWrapper, 
  useInfiniteScroll,
  type InfiniteScrollTriggerProps, 
  type InfiniteScrollWrapperProps 
} from './infinite-scroll-trigger';

// ========== 工具组件 ==========
export { CopyButton, type CopyButtonProps } from './copy-button';
export { Countdown, calculateExpireTime, type CountdownProps } from './countdown';
export { ImagePreview, type ImagePreviewProps } from './image-preview';

// ========== 弹窗组件 ==========
export { ResponsiveModal, type ResponsiveModalProps } from './responsive-modal';