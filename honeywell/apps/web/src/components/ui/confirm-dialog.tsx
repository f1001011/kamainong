/**
 * @file 确认对话框组件
 * @description 用于危险操作的确认对话框
 * @reference 开发文档/01-设计系统/01.3-组件规范.md
 */

'use client';

import { type ReactNode } from 'react';
import { RiAlertLine, RiErrorWarningLine, RiInformationLine } from '@remixicon/react';
import { ResponsiveModal } from './responsive-modal';
import { Button } from './button';
import { cn } from '@/lib/utils';

/**
 * 确认对话框类型
 */
type ConfirmType = 'info' | 'warning' | 'danger';

/**
 * 确认对话框属性
 */
export interface ConfirmDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 打开状态变化回调 */
  onOpenChange: (open: boolean) => void;
  /** 对话框类型 */
  type?: ConfirmType;
  /** 标题 */
  title: string;
  /** 描述内容 */
  description?: string | ReactNode;
  /** 确认按钮文案 */
  confirmText?: string;
  /** 取消按钮文案 */
  cancelText?: string;
  /** 确认回调 */
  onConfirm?: () => void | Promise<void>;
  /** 取消回调 */
  onCancel?: () => void;
  /** 是否正在加载 */
  isLoading?: boolean;
  /** 是否隐藏取消按钮 */
  hideCancelButton?: boolean;
}

/**
 * 图标配置
 */
const iconConfig: Record<ConfirmType, { icon: typeof RiAlertLine; color: string; bg: string }> = {
  info: {
    icon: RiInformationLine,
    color: 'text-info',
    bg: 'bg-blue-50',
  },
  warning: {
    icon: RiAlertLine,
    color: 'text-warning',
    bg: 'bg-gold-50',
  },
  danger: {
    icon: RiErrorWarningLine,
    color: 'text-error',
    bg: 'bg-red-50',
  },
};

/**
 * 确认对话框组件
 * @description 用于需要用户确认的重要操作
 * 
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   type="danger"
 *   title="确认删除"
 *   description="删除后数据将无法恢复，是否继续？"
 *   confirmText="删除"
 *   onConfirm={handleDelete}
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  type = 'warning',
  title,
  description,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  onConfirm,
  onCancel,
  isLoading = false,
  hideCancelButton = false,
}: ConfirmDialogProps) {
  const config = iconConfig[type];
  const Icon = config.icon;

  /**
   * 处理确认
   */
  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    onOpenChange(false);
  };

  /**
   * 处理取消
   */
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      showClose={false}
      dismissible={!isLoading}
    >
      <div className="flex flex-col items-center text-center">
        {/* 图标 */}
        <div className={cn('mb-4 rounded-full p-3', config.bg)}>
          <Icon className={cn('h-8 w-8', config.color)} />
        </div>

        {/* 标题 */}
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>

        {/* 描述 */}
        {description && (
          <div className="mt-2 text-sm text-neutral-500">
            {typeof description === 'string' ? <p>{description}</p> : description}
          </div>
        )}

        {/* 按钮组 */}
        <div className="mt-6 flex w-full gap-3">
          {!hideCancelButton && (
            <Button
              variant="secondary"
              fullWidth
              onClick={handleCancel}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
          )}
          <Button
            variant={type === 'danger' ? 'destructive' : 'primary'}
            fullWidth
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
