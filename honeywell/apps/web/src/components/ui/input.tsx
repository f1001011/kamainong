/**
 * @file 输入框组件
 * @description "Luminous Depth 2.0" - 精致边框 + 柔和聚焦光晕 + 高级过渡
 * @reference 开发文档/01-设计系统/01.3-组件规范.md
 */

'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * 输入框变体样式 - 2.0 增强版
 */
const inputVariants = cva(
  // 基础样式 - 增强圆角、内阴影、过渡
  'flex w-full rounded-xl border bg-white/80 backdrop-blur-sm px-4 py-3 text-base transition-all duration-200 placeholder:text-neutral-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        /** 默认样式 - 精致边框 + 聚焦光晕 */
        default: [
          'border-neutral-200/70',
          'shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]',
          'focus:border-primary-400',
          'focus:shadow-[0_0_0_3px_rgba(var(--color-primary-rgb),0.08),inset_0_1px_2px_rgba(0,0,0,0.02)]',
          'hover:border-neutral-300',
        ].join(' '),
        /** 错误状态 */
        error: [
          'border-error/60',
          'shadow-[inset_0_1px_2px_rgba(220,38,38,0.04)]',
          'focus:border-error',
          'focus:shadow-[0_0_0_3px_rgba(220,38,38,0.08),inset_0_1px_2px_rgba(0,0,0,0.02)]',
        ].join(' '),
        /** 成功状态 */
        success: [
          'border-success/60',
          'shadow-[inset_0_1px_2px_rgba(34,197,94,0.04)]',
          'focus:border-success',
          'focus:shadow-[0_0_0_3px_rgba(34,197,94,0.08),inset_0_1px_2px_rgba(0,0,0,0.02)]',
        ].join(' '),
      },
      inputSize: {
        sm: 'h-9 px-3 text-sm rounded-lg',
        md: 'h-11 px-4 text-base',
        lg: 'h-13 px-5 text-lg rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
    },
  }
);

/**
 * 输入框组件属性
 */
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  error?: string;
  helperText?: string;
}

/**
 * 输入框组件
 * @description "Luminous Depth 2.0" - 精致聚焦光晕 + 高级过渡
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      inputSize,
      leftElement,
      rightElement,
      error,
      helperText,
      disabled,
      ...props
    },
    ref
  ) => {
    const finalVariant = error ? 'error' : variant;

    return (
      <div className="w-full">
        <div className="relative">
          {leftElement && (
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
              {leftElement}
            </div>
          )}

          <input
            ref={ref}
            className={cn(
              inputVariants({ variant: finalVariant, inputSize }),
              leftElement && 'pl-10',
              rightElement && 'pr-10',
              className
            )}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${props.id}-error` : undefined}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>

        {error && (
          <p
            id={`${props.id}-error`}
            className="mt-1.5 text-sm text-error font-medium"
            role="alert"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p className="mt-1.5 text-sm text-neutral-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { inputVariants };
