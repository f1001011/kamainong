/**
 * @file 必需产品标签组件
 * @description 阶梯卡片中展示必需产品的标签
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.4-连单奖励活动页.md 第4.6节
 */

'use client';

import { cn } from '@/lib/utils';
import { RiCheckLine } from '@remixicon/react';

/**
 * 必需产品数据
 */
interface RequiredProduct {
  id: number;
  name: string;
  isPurchased: boolean;
}

/**
 * 必需产品标签组件属性
 */
interface RequiredProductTagProps {
  /** 产品数据 */
  product: RequiredProduct;
  /** 尺寸 */
  size?: 'sm' | 'md';
}

/**
 * 必需产品标签组件
 * @description 依据：03.11.4-连单奖励活动页.md 第4.6节 - 必需产品标签设计
 * 
 * 设计规范：
 * - 已购：绿色背景 bg-green-100，绿色文字 text-green-700，带勾选图标
 * - 未购：灰色背景 bg-neutral-100，灰色文字 text-neutral-500，带锁图标
 * - 圆角药丸形 rounded-full
 * 
 * @example
 * ```tsx
 * <RequiredProductTag product={{ id: 1, name: "VIP1", isPurchased: true }} />
 * ```
 */
export function RequiredProductTag({ product, size = 'sm' }: RequiredProductTagProps) {
  const isPurchased = product.isPurchased;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md font-semibold transition-colors',
        sizeClasses[size],
        isPurchased
          ? 'bg-gradient-to-r from-primary-50 to-primary-100/60 border border-primary-200/70 text-primary-700 shadow-soft-sm'
          : 'bg-neutral-50/80 border border-neutral-200/80 text-neutral-400'
      )}
    >
      {isPurchased && (
        <RiCheckLine className={cn(iconSizes[size], 'text-success-500 mr-0.5')} />
      )}
      <span>{product.name}</span>
    </div>
  );
}
