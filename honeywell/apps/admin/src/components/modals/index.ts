/**
 * @file 弹窗组件导出
 * @description 统一导出所有弹窗组件
 */

export {
  ConfirmModal,
  DangerConfirmModal,
  WarningConfirmModal,
} from './ConfirmModal';
export type { ConfirmModalProps, ConfirmType } from './ConfirmModal';

export { BatchResultModal } from './BatchResultModal';
export type {
  BatchResultModalProps,
  FailedRecord,
  BatchResultStatus,
} from './BatchResultModal';

export { DetailDrawer, DetailSection } from './DetailDrawer';
export type { DetailDrawerProps, DetailItem, DetailStatus } from './DetailDrawer';
