/**
 * @file 提示气泡组件
 * @description 悬停或点击时显示的提示信息
 * @reference 开发文档/01-设计系统/01.3-组件规范.md
 */

'use client';

import { type ReactNode } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

/**
 * Tooltip Provider
 * @description 在应用根部包裹以启用 Tooltip 功能
 */
export const TooltipProvider = TooltipPrimitive.Provider;

/**
 * Tooltip 组件属性
 */
export interface TooltipProps {
  /** 触发元素 */
  children: ReactNode;
  /** 提示内容 */
  content: ReactNode;
  /** 显示位置 */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** 对齐方式 */
  align?: 'start' | 'center' | 'end';
  /** 延迟显示时间（毫秒） */
  delayDuration?: number;
  /** 自定义类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * Tooltip 组件
 * @description 用于显示额外信息的提示气泡
 * 
 * @example
 * ```tsx
 * <Tooltip content="这是余额的说明">
 *   <RiQuestionLine className="text-neutral-400 cursor-help" />
 * </Tooltip>
 * ```
 */
export function Tooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  delayDuration = 200,
  className,
  disabled = false,
}: TooltipProps) {
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={4}
          className={cn(
            'z-50 max-w-xs rounded-lg bg-neutral-500 px-3 py-2 text-sm text-white shadow-soft',
            'animate-in fade-in-0 zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            'data-[side=bottom]:slide-in-from-top-2',
            'data-[side=left]:slide-in-from-right-2',
            'data-[side=right]:slide-in-from-left-2',
            'data-[side=top]:slide-in-from-bottom-2',
            className
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-neutral-500" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/**
 * 简化的 Tooltip 包装组件
 * @description 用于需要信息图标触发的场景
 */
export interface InfoTooltipProps {
  /** 提示内容 */
  content: ReactNode;
  /** 图标大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 自定义类名 */
  className?: string;
}

import { RiQuestionLine } from '@remixicon/react';

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function InfoTooltip({
  content,
  size = 'sm',
  className,
}: InfoTooltipProps) {
  return (
    <Tooltip content={content}>
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-500 transition-colors',
          className
        )}
      >
        <RiQuestionLine className={sizeMap[size]} />
      </button>
    </Tooltip>
  );
}
