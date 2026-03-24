/**
 * @file 类型筛选胶囊组件
 * @description 横向滚动的胶囊标签，用于资金明细类型筛选
 * @depends 开发文档/03-前端用户端/03.9-资金明细/03.9.1-资金明细页.md
 */

'use client';

import { useRef, useEffect } from 'react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS } from '@/lib/animation/constants';

/**
 * 流水类型列表
 * 依据：02.1-数据库设计.md TransactionType枚举
 */
const TRANSACTION_TYPES = [
  { key: 'ALL', labelKey: 'filter.all' },
  { key: 'RECHARGE', labelKey: 'trans.recharge' },
  { key: 'WITHDRAW_FREEZE', labelKey: 'trans.withdraw_freeze' },
  { key: 'WITHDRAW_SUCCESS', labelKey: 'trans.withdraw_success' },
  { key: 'WITHDRAW_REFUND', labelKey: 'trans.withdraw_refund' },
  { key: 'PURCHASE', labelKey: 'trans.purchase' },
  { key: 'INCOME', labelKey: 'trans.income' },
  { key: 'REFERRAL_COMMISSION', labelKey: 'trans.commission' },
  { key: 'SIGN_IN', labelKey: 'trans.sign_in' },
  { key: 'ACTIVITY_REWARD', labelKey: 'trans.activity' },
  { key: 'REGISTER_BONUS', labelKey: 'trans.register' },
  { key: 'ADMIN_ADD', labelKey: 'trans.admin_add' },
  { key: 'ADMIN_DEDUCT', labelKey: 'trans.admin_deduct' },
] as const;

/**
 * TypeFilterTabs 组件属性
 */
interface TypeFilterTabsProps {
  /** 当前选中的类型 */
  activeType: string;
  /** 类型变更回调 */
  onChange: (type: string) => void;
}

/**
 * 类型筛选胶囊组件
 * @description 横向滚动的胶囊标签，支持选中项自动滚动居中
 */
export function TypeFilterTabs({ activeType, onChange }: TypeFilterTabsProps) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // 选中项自动滚动到可视区域中心
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const active = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();

      // 计算滚动位置，使选中项居中
      const scrollLeft = active.offsetLeft - (containerRect.width / 2) + (activeRect.width / 2);
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
  }, [activeType]);

  return (
    <div 
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {TRANSACTION_TYPES.map((type) => {
        const isActive = activeType === type.key;
        
        return (
          <m.button
            key={type.key}
            ref={isActive ? activeRef : null}
            onClick={() => onChange(type.key)}
            whileTap={isAnimationEnabled ? { scale: 0.95 } : undefined}
            transition={SPRINGS.snappy}
            className={cn(
              'relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap',
              'transition-colors duration-200 focus:outline-none flex-shrink-0',
              isActive
                ? 'bg-primary-500 text-white shadow-glow-sm'
                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
            )}
          >
            {t(type.labelKey)}
          </m.button>
        );
      })}
    </div>
  );
}
