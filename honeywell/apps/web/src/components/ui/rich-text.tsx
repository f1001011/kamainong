/**
 * @file 富文本渲染组件
 * @description 安全渲染HTML内容，支持金额高亮
 * @depends 开发文档/03-前端用户端/03.12-消息模块/03.12.2-消息详情页.md 第四节
 */

'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import { useGlobalConfig } from '@/hooks/use-global-config';

/**
 * RichText 组件属性
 */
export interface RichTextProps {
  /** HTML内容 */
  content: string;
  /** 自定义类名 */
  className?: string;
  /** 是否启用金额高亮 */
  highlightAmount?: boolean;
}

/**
 * RichText 富文本渲染组件
 * @description 依据：03.12.2-消息详情页.md - 安全渲染HTML内容
 *
 * @example
 * ```tsx
 * <RichText
 *   content="<p>您已成功充值 <strong>$ 100.00</strong></p>"
 *   className="text-base leading-relaxed"
 * />
 * ```
 */
export function RichText({
  content,
  className,
  highlightAmount = true,
}: RichTextProps) {
  const { config } = useGlobalConfig();
  const currencySymbol = config.currencySymbol || 'د.م.';

  // 安全过滤HTML并处理金额高亮
  const sanitizedContent = useMemo(() => {
    // 配置 DOMPurify 允许的标签和属性
    const cleanHtml = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'b',
        'em',
        'i',
        'a',
        'span',
        'div',
        'ul',
        'ol',
        'li',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
      // 自动添加 rel="noopener noreferrer" 到外链
      ADD_ATTR: ['target'],
    });

    // 金额高亮处理：匹配 货币符号+数字 格式（动态使用全局配置的货币符号）
    if (highlightAmount) {
      const escaped = currencySymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const amountPattern = new RegExp(`(${escaped}\\s*[\\d,]+\\.?\\d*)`, 'g');
      return cleanHtml.replace(
        amountPattern,
        '<span class="font-semibold text-primary-600">$1</span>'
      );
    }

    return cleanHtml;
  }, [content, highlightAmount, currencySymbol]);

  return (
    <div
      className={cn(
        'rich-text',
        // 段落样式
        '[&_p]:mb-4 [&_p:last-child]:mb-0',
        // 链接样式
        '[&_a]:text-primary-500 [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-primary-600',
        // 加粗样式
        '[&_strong]:font-semibold [&_b]:font-semibold',
        // 列表样式
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4',
        '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4',
        '[&_li]:mb-1',
        // 标题样式
        '[&_h1]:text-xl [&_h1]:font-semibold [&_h1]:mb-3',
        '[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2',
        '[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2',
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
