/**
 * @file 页面内容容器组件
 * @description 统一的页面内容区域包装器
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * PageContent 组件属性
 */
interface PageContentProps {
  /** 子内容 */
  children: ReactNode;
  /** 自定义类名 */
  className?: string;
}

/**
 * PageContent 页面内容容器
 * @description 提供统一的页面内容区域样式
 */
export function PageContent({ children, className }: PageContentProps) {
  return (
    <div className={cn('max-w-2xl mx-auto', className)}>
      {children}
    </div>
  );
}
