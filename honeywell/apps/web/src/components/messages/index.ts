/**
 * @file 消息模块组件导出
 * @description 统一导出消息相关组件
 */

export { MessageCard, type MessageCardProps } from './message-card';
export { MessageHeader, type MessageHeaderProps } from './message-header';
export {
  MessageDateGroup,
  type MessageDateGroupProps,
} from './message-date-group';
export {
  MessageSkeleton,
  MessageHeaderSkeleton,
  MessageDateGroupSkeleton,
  NotificationDetailSkeleton,
  type MessageSkeletonProps,
} from './message-skeleton';
export {
  NotificationTypeIcon,
  getNotificationTypeConfig,
  type NotificationTypeIconProps,
} from './notification-type-icon';
