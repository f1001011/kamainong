/**
 * @file Toast Provider
 * @description Sonner Toast 提供者，配置为高端简约风格
 * @reference 开发文档/01-设计系统/01.3-组件规范.md
 */

'use client';

import { Toaster, toast } from 'sonner';
import {
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiErrorWarningFill,
  RiInformationFill,
} from '@remixicon/react';

/**
 * Toast Provider 组件
 * @description 配置 Sonner Toast 样式，匹配 2026 高端美学设计系统
 * 依据：01.3-组件规范.md - Toast 提示规范
 * 依据：核心开发规范.md - 禁止 Emoji，统一使用 Remix Icon
 */
export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      expand={false}
      richColors
      closeButton
      duration={3000}
      // 依据：01.3-组件规范.md - 使用 Remix Icon 作为 Toast 图标
      icons={{
        success: <RiCheckboxCircleFill className="h-5 w-5" />,
        error: <RiCloseCircleFill className="h-5 w-5" />,
        warning: <RiErrorWarningFill className="h-5 w-5" />,
        info: <RiInformationFill className="h-5 w-5" />,
      }}
      toastOptions={{
        style: {
          background: 'var(--color-background)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-soft-lg)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
        },
        classNames: {
          toast: 'shadow-soft',
          title: 'text-foreground font-medium',
          description: 'text-muted-foreground text-sm',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          closeButton: 'text-muted-foreground hover:text-foreground',
          success: 'bg-primary-50 text-primary-800 border-primary-200',
          error: 'bg-red-50 text-red-800 border-red-200',
          warning: 'bg-gold-50 text-gold-800 border-gold-200',
          info: 'bg-blue-50 text-blue-800 border-blue-200',
        },
      }}
    />
  );
}

// 重新导出 toast 函数供组件使用
export { toast };
