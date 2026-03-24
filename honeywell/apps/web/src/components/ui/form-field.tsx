/**
 * @file 表单字段组件
 * @description 标签 + 输入框 + 错误提示的组合组件
 * @reference 开发文档/01-设计系统/01.3-组件规范.md
 */

'use client';

import { type ReactNode, type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * 表单字段组件属性
 */
export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  /** 字段标签 */
  label?: string;
  /** 标签右侧的额外内容（如必填标记） */
  labelSuffix?: ReactNode;
  /** 错误信息 */
  error?: string;
  /** 帮助文本 */
  helperText?: string;
  /** 是否必填 */
  required?: boolean;
  /** 子元素（输入框） */
  children: ReactNode;
}

/**
 * 表单字段组件
 * @description 将标签、输入框、错误提示组合在一起的表单字段
 * 
 * @example
 * ```tsx
 * <FormField
 *   label="手机号"
 *   error={errors.phone?.message}
 *   required
 * >
 *   <Input
 *     {...register('phone')}
 *     placeholder="请输入手机号"
 *   />
 * </FormField>
 * ```
 */
export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      className,
      label,
      labelSuffix,
      error,
      helperText,
      required = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {/* 标签行 */}
        {label && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              {label}
              {required && (
                <span className="ml-1 text-error">*</span>
              )}
            </label>
            {labelSuffix && (
              <span className="text-sm text-neutral-400">{labelSuffix}</span>
            )}
          </div>
        )}

        {/* 输入框 */}
        {children}

        {/* 错误信息 */}
        {error && (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        )}

        {/* 帮助文本 */}
        {!error && helperText && (
          <p className="text-sm text-neutral-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

/**
 * 表单分组组件
 * @description 用于对表单字段进行分组
 */
export interface FormGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** 分组标题 */
  title?: string;
  /** 分组描述 */
  description?: string;
  /** 子元素 */
  children: ReactNode;
}

export const FormGroup = forwardRef<HTMLDivElement, FormGroupProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-4', className)}
        {...props}
      >
        {(title || description) && (
          <div className="border-b border-neutral-100 pb-3">
            {title && (
              <h3 className="text-base font-semibold text-foreground">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-1 text-sm text-neutral-400">
                {description}
              </p>
            )}
          </div>
        )}
        <div className="space-y-4">
          {children}
        </div>
      </div>
    );
  }
);

FormGroup.displayName = 'FormGroup';

/**
 * 表单操作区组件
 * @description 表单底部的按钮区域
 */
export interface FormActionsProps extends HTMLAttributes<HTMLDivElement> {
  /** 子元素（按钮） */
  children: ReactNode;
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right' | 'between';
}

const alignmentMap = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
  between: 'justify-between',
};

export const FormActions = forwardRef<HTMLDivElement, FormActionsProps>(
  ({ className, align = 'right', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3 pt-4',
          alignmentMap[align],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

FormActions.displayName = 'FormActions';
