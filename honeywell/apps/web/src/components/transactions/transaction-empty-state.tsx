/**
 * @file 流水空状态组件
 * @description 流水列表为空时的提示
 * @depends 开发文档/03-前端用户端/03.9-资金明细/03.9.1-资金明细页.md
 */

'use client';

import { m } from 'motion/react';
import { RiFileList3Line } from '@remixicon/react';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { Button } from '@/components/ui/button';

/**
 * TransactionEmptyState 组件属性
 */
interface TransactionEmptyStateProps {
  /** 是否是筛选后的空状态 */
  isFiltered?: boolean;
  /** 清除筛选回调 */
  onClearFilter?: () => void;
}

/**
 * 流水空状态组件
 * @description 区分初始空状态和筛选后空状态，支持清除筛选
 */
export function TransactionEmptyState({ 
  isFiltered = false,
  onClearFilter,
}: TransactionEmptyStateProps) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      {/* 图标动画 - 依据：03.9.1-资金明细页.md 4.6节 y: [0, -8, 0] */}
      <m.div
        animate={isAnimationEnabled ? { y: [0, -8, 0] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-6"
      >
        <RiFileList3Line className="w-10 h-10 text-neutral-300" />
      </m.div>

      {/* 文案 */}
      <p className="text-neutral-500 text-center mb-2">
        {isFiltered ? t('empty.transactions_filtered') : t('empty.transactions')}
      </p>
      
      <p className="text-sm text-neutral-400 text-center mb-6">
        {isFiltered ? t('empty.transactions_filtered_tip') : t('empty.transactions_tip')}
      </p>

      {/* 清除筛选按钮 */}
      {isFiltered && onClearFilter && (
        <Button variant="secondary" size="sm" onClick={onClearFilter}>
          {t('btn.clear_filter')}
        </Button>
      )}
    </div>
  );
}
