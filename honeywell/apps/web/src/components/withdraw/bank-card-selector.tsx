/**
 * @file 银行卡选择组件
 * @description 横向滚动的卡片式银行卡选择器
 * @reference 开发文档/03-前端用户端/03.5-财务模块/03.5.1-提现页.md 第4.5-4.6节
 * 
 * 2026高端美学设计要点：
 * - 横向滚动布局，支持多卡滑动选择
 * - 选中态有主色边框+浅色背景+右上角勾选图标
 * - 银行图标 + 银行名称 + 脱敏卡号 + 持卡人姓名
 * - 添加银行卡入口使用虚线边框
 */

'use client';

import { useCallback, type HTMLAttributes } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { RiBankCardFill, RiCheckFill, RiAddLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useText } from '@/hooks/use-text';
import { SPRINGS } from '@/lib/animation';

/**
 * 银行卡数据类型
 * @description 依据：02.3-前端API接口清单 第7.1节
 */
export interface BankCardData {
  /** 银行卡ID */
  id: number;
  /** 银行代码 */
  bankCode: string;
  /** 银行名称 */
  bankName: string;
  /** 脱敏卡号（如：****3456） */
  accountNoMask: string;
  /** 持卡人姓名 */
  accountName: string;
  /** 是否可删除 */
  canDelete?: boolean;
}

/**
 * 银行卡选择器属性
 */
export interface BankCardSelectorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** 银行卡列表 */
  cards: BankCardData[];
  /** 选中的银行卡ID */
  value: number | null;
  /** 选择变化回调 */
  onChange: (cardId: number) => void;
  /** 是否加载中 */
  isLoading?: boolean;
  /** 添加银行卡回调 */
  onAddCard?: () => void;
  /** 最大可绑卡数量 */
  maxCount?: number;
  /** 是否可添加新卡 */
  canAdd?: boolean;
  /** 标签文案 */
  label?: string;
  /** 错误信息 */
  error?: string;
}

/**
 * 银行卡选择组件
 * @description 横向滚动的精美卡片式银行卡选择器
 * 依据：03.5.1-提现页.md 第4.5-4.6节 - 银行卡横向滚动实现
 * 
 * @example
 * ```tsx
 * <BankCardSelector
 *   cards={bankCards}
 *   value={selectedCardId}
 *   onChange={setSelectedCardId}
 *   onAddCard={() => router.push('/bank-cards/add')}
 * />
 * ```
 */
export function BankCardSelector({
  cards,
  value,
  onChange,
  isLoading = false,
  onAddCard,
  maxCount = 3,
  canAdd = true,
  label,
  error,
  className,
  ...props
}: BankCardSelectorProps) {
  // 获取动画配置
  const { isAnimationEnabled } = useAnimationConfig();
  const t = useText();

  // 是否有银行卡
  const hasCards = cards.length > 0;

  // 是否可以添加更多银行卡
  const canAddMore = canAdd && cards.length < maxCount;

  /**
   * 处理银行卡选择
   */
  const handleSelect = useCallback((cardId: number) => {
    onChange(cardId);
  }, [onChange]);

  /**
   * 处理添加银行卡
   */
  const handleAddCard = useCallback(() => {
    onAddCard?.();
  }, [onAddCard]);

  // 加载状态
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)} {...props}>
        {label && (
          <div className="text-base font-medium text-neutral-500">{label}</div>
        )}
        {/* 横向滚动骨架屏 */}
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-36 h-24 rounded-xl bg-neutral-100 animate-pulse flex-shrink-0"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)} {...props}>
      {/* 标签 */}
      {label && (
        <div className="text-base font-medium text-neutral-500">{label}</div>
      )}

      {/* 银行卡横向滚动列表 */}
      {/* 依据：03.5.1-提现页.md 第4.6节 - 横向滚动容器 */}
      {hasCards ? (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <AnimatePresence mode="popLayout">
            {cards.map((card, index) => {
              const isSelected = value === card.id;
              
              return (
                <m.button
                  key={card.id}
                  type="button"
                  onClick={() => handleSelect(card.id)}
                  className={cn(
                    // 基础样式 - 固定宽度的卡片
                    'relative w-36 h-24 flex-shrink-0 flex flex-col justify-between p-3 rounded-xl border transition-all text-left',
                    // 未选中态
                    !isSelected && 'border-neutral-100 bg-white hover:border-neutral-200',
                    // 选中态
                    isSelected && 'border-primary-500 bg-primary-50'
                  )}
                  // 动画效果
                  {...(isAnimationEnabled && {
                    initial: { opacity: 0, scale: 0.9 },
                    animate: { opacity: 1, scale: 1 },
                    exit: { opacity: 0, scale: 0.9 },
                    transition: { ...SPRINGS.snappy, delay: index * 0.05 },
                    whileTap: { scale: 0.95 },
                  })}
                >
                  {/* 选中指示器 - 右上角勾选图标 */}
                  {/* 依据：03.5.1-提现页.md 第4.5节 - 选中态右上角勾选图标 RiCheckFill */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full bg-primary-500">
                      <RiCheckFill className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}

                  {/* 银行名称 + 图标 */}
                  <div className="flex items-center gap-2">
                    <RiBankCardFill className={cn(
                      'w-5 h-5',
                      isSelected ? 'text-primary-600' : 'text-neutral-400'
                    )} />
                    <span className={cn(
                      'text-sm font-medium truncate',
                      isSelected ? 'text-primary-700' : 'text-neutral-600'
                    )}>
                      {card.bankName}
                    </span>
                  </div>

                  {/* 脱敏卡号 + 持卡人姓名 */}
                  <div className="space-y-0.5">
                    <div className={cn(
                      'text-sm font-mono',
                      isSelected ? 'text-primary-600' : 'text-neutral-500'
                    )}>
                      {card.accountNoMask}
                    </div>
                    <div className="text-xs text-neutral-400 truncate">
                      {card.accountName}
                    </div>
                  </div>
                </m.button>
              );
            })}
          </AnimatePresence>

          {/* 添加银行卡入口 */}
          {/* 依据：03.5.1-提现页.md 第4.5节 - 虚线边框 border-dashed */}
          {canAddMore && onAddCard && (
            <m.button
              type="button"
              onClick={handleAddCard}
              className="w-36 h-24 flex-shrink-0 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              {...(isAnimationEnabled && {
                whileTap: { scale: 0.95 },
              })}
            >
              <RiAddLine className="w-6 h-6 text-neutral-400" />
              <span className="text-sm text-neutral-400">
                {t('btn.add_card')}
              </span>
            </m.button>
          )}
        </div>
      ) : (
        /* 无银行卡时的空状态 */
        <m.button
          type="button"
          onClick={handleAddCard}
          className="w-full flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          {...(isAnimationEnabled && {
            initial: { opacity: 0, scale: 0.95 },
            animate: { opacity: 1, scale: 1 },
            transition: SPRINGS.gentle,
            whileTap: { scale: 0.98 },
          })}
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50">
            <RiBankCardFill className="w-8 h-8 text-primary-500" />
          </div>
          <div className="text-center">
            <div className="font-medium text-neutral-600">
              {t('empty.no_bank_card')}
            </div>
            <div className="text-sm text-neutral-400 mt-1">
              {t('empty.add_bank_card_tip')}
            </div>
          </div>
          <div className="flex items-center gap-2 text-primary-600 font-medium mt-2">
            <RiAddLine className="w-5 h-5" />
            <span>{t('btn.bind_card')}</span>
          </div>
        </m.button>
      )}

      {/* 错误信息 */}
      <AnimatePresence mode="wait">
        {error && (
          <m.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={SPRINGS.snappy}
            className="text-sm text-error"
          >
            {error}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

BankCardSelector.displayName = 'BankCardSelector';
