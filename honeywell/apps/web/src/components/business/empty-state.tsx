/**
 * @file 空状态组件
 * @description 列表为空时的占位提示
 * @reference 开发文档/01-设计系统/01.3-组件规范.md
 */

'use client';

import { type ReactNode, useMemo } from 'react';
import { m } from 'motion/react';
import {
  RiFileList3Fill,
  RiShoppingBag3Fill,
  RiWalletFill,
  RiHistoryFill,
  RiUserFill,
  RiSearchFill,
} from '@remixicon/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { fadeVariants, SPRINGS } from '@/lib/animation';
import { useText } from '@/hooks';

/**
 * 预设空状态类型
 */
type EmptyType = 'default' | 'products' | 'positions' | 'transactions' | 'search' | 'user';

/**
 * 空状态组件属性
 */
export interface EmptyStateProps {
  /** 空状态类型 */
  type?: EmptyType;
  /** 自定义图标 */
  icon?: ReactNode;
  /** 标题 */
  title?: string;
  /** 描述 */
  description?: string;
  /** 操作按钮文案 */
  actionText?: string;
  /** 操作按钮回调 */
  onAction?: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 图标预设配置
 * @description 文案通过 useText() 动态获取，图标固定配置
 */
const iconPresets: Record<EmptyType, typeof RiFileList3Fill> = {
  default: RiFileList3Fill,
  products: RiShoppingBag3Fill,
  positions: RiWalletFill,
  transactions: RiHistoryFill,
  search: RiSearchFill,
  user: RiUserFill,
};

/**
 * 文案 key 映射
 * @description 根据类型映射到文案配置 key
 */
const textKeyMap: Record<EmptyType, { title: string; description: string }> = {
  default: { title: 'empty.default', description: 'empty.default_desc' },
  products: { title: 'empty.noProducts', description: 'empty.noProducts_desc' },
  positions: { title: 'empty.positions', description: 'empty.positions_guide' },
  transactions: { title: 'empty.transactions', description: 'empty.transactions_desc' },
  search: { title: 'empty.search', description: 'empty.search_desc' },
  user: { title: 'empty.user', description: 'empty.user_desc' },
};

/**
 * 空状态组件
 * @description 当列表或数据为空时显示的占位组件
 * 依据：核心开发规范.md - 所有文案必须从配置获取
 * 
 * @example
 * ```tsx
 * // 使用预设
 * <EmptyState type="positions" />
 * 
 * // 自定义内容
 * <EmptyState
 *   icon={<RiSearchFill />}
 *   title="没有找到结果"
 *   description="请尝试其他搜索条件"
 *   actionText="重新搜索"
 *   onAction={handleSearch}
 * />
 * ```
 */
export function EmptyState({
  type = 'default',
  icon,
  title,
  description,
  actionText,
  onAction,
  className,
}: EmptyStateProps) {
  // 依据：核心开发规范.md - 使用 useText() 获取文案
  const t = useText();
  
  // 获取图标组件
  const IconComponent = iconPresets[type];
  
  // 获取文案 key
  const textKeys = textKeyMap[type];
  
  // 使用传入的值或从配置获取的默认值
  const displayTitle = title || t(textKeys.title);
  const displayDescription = description || t(textKeys.description);

  return (
    <m.div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      transition={SPRINGS.gentle}
    >
      {/* 图标 - 轻微上下浮动动画 */}
      {/* 依据：03.4.2-充值记录页.md 第240行 - 空状态插图浮动 */}
      <m.div
        className="mb-4"
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {icon || <IconComponent className="h-16 w-16 text-neutral-300" />}
      </m.div>

      {/* 标题 */}
      <h3 className="text-lg font-medium text-neutral-500">{displayTitle}</h3>

      {/* 描述 */}
      <p className="mt-2 text-sm text-neutral-400 max-w-xs">{displayDescription}</p>

      {/* 操作按钮 */}
      {actionText && onAction && (
        <Button
          variant="secondary"
          className="mt-6"
          onClick={onAction}
        >
          {actionText}
        </Button>
      )}
    </m.div>
  );
}
