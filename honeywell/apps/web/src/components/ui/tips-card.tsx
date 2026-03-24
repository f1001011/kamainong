/**
 * @file 通用提示卡片组件
 * @description 毛玻璃效果的提示卡片，支持富文本内容
 * @reference 开发文档/01-设计系统/01.1-设计Token.md
 */

'use client';

import { type HTMLAttributes, type ReactNode } from 'react';
import { RiInformationFill, RiErrorWarningFill, RiCheckboxCircleFill } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';

/**
 * 提示卡片类型
 */
export type TipsCardType = 'info' | 'warning' | 'success';

/**
 * 提示卡片属性
 */
export interface TipsCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 提示类型 */
  type?: TipsCardType;
  /** 标题（可选） */
  title?: ReactNode;
  /** 文本内容（纯文本） */
  content?: string;
  /** 富文本内容（HTML字符串，会自动消毒） */
  htmlContent?: string;
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 自定义图标 */
  icon?: ReactNode;
}

/**
 * 图标配置映射
 */
const iconConfig: Record<TipsCardType, { icon: typeof RiInformationFill; className: string }> = {
  info: { icon: RiInformationFill, className: 'text-info' },
  warning: { icon: RiErrorWarningFill, className: 'text-warning' },
  success: { icon: RiCheckboxCircleFill, className: 'text-success' },
};

/**
 * 通用提示卡片组件
 * @description 毛玻璃效果的提示卡片，适用于充值/提现提示、重要信息展示
 * 
 * @example
 * ```tsx
 * // 基础用法
 * <TipsCard content={t('recharge.tips')} />
 * 
 * // 带标题
 * <TipsCard title={t('tips.title')} content={t('tips.content')} />
 * 
 * // 富文本内容
 * <TipsCard htmlContent={tipsHtml} />
 * 
 * // 警告类型
 * <TipsCard type="warning" content={t('warning.text')} />
 * ```
 */
export function TipsCard({
  className,
  type = 'info',
  title,
  content,
  htmlContent,
  showIcon = true,
  icon,
  children,
  ...props
}: TipsCardProps) {
  // 获取图标配置
  const { icon: IconComponent, className: iconClassName } = iconConfig[type];

  return (
    <div
      className={cn(
        // 毛玻璃效果 + 圆角 + 柔和阴影
        'glass shadow-soft rounded-2xl p-4',
        className
      )}
      {...props}
    >
      <div className="flex gap-3">
        {/* 图标 */}
        {showIcon && (
          <div className="shrink-0 mt-0.5">
            {icon || <IconComponent className={cn('h-5 w-5', iconClassName)} />}
          </div>
        )}

        {/* 内容区 */}
        <div className="flex-1 min-w-0">
          {/* 标题 */}
          {title && (
            <div className="font-medium text-neutral-500 mb-1">
              {title}
            </div>
          )}

          {/* 纯文本内容 */}
          {content && (
            <div className="text-sm text-neutral-400 leading-relaxed">
              {content}
            </div>
          )}

          {/* 富文本内容 */}
          {htmlContent && (
            <div
              className="text-sm text-neutral-400 leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlContent) }}
            />
          )}

          {/* 自定义子内容 */}
          {children && (
            <div className="text-sm text-neutral-400 leading-relaxed">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

TipsCard.displayName = 'TipsCard';
