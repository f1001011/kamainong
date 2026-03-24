/**
 * @file 通用金额选择组件（胶囊芯片版）
 * @description 胶囊 pill 形状预设选择 + 自定义输入，供充值/提现页复用
 * 选中态实心品牌色填充，居中排列
 */

'use client';

import { useState, useCallback, type ChangeEvent } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useText } from '@/hooks/use-text';
import { formatCurrency } from '@/lib/format';
import { SPRINGS } from '@/lib/animation';

export type AmountSelectorType = 'recharge' | 'withdraw';

export interface AmountSelectorProps {
  type?: AmountSelectorType;
  presets: number[];
  minAmount: number;
  maxAmount: number;
  value: number | null;
  onChange: (amount: number | null) => void;
  customValue: string;
  onCustomChange: (value: string) => void;
  showAllButton?: boolean;
  availableBalance?: number;
  onWithdrawAll?: () => void;
  label?: string;
  customLabel?: string;
  error?: string;
  disabled?: boolean;
}

export function AmountSelector({
  type = 'recharge',
  presets,
  minAmount,
  maxAmount,
  value,
  onChange,
  customValue,
  onCustomChange,
  showAllButton = false,
  availableBalance = 0,
  onWithdrawAll,
  label,
  customLabel,
  error,
  disabled = false,
}: AmountSelectorProps) {
  const { config } = useGlobalConfig();
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();

  const handlePresetClick = useCallback((amount: number) => {
    if (disabled) return;
    onCustomChange('');
    onChange(amount);
  }, [disabled, onChange, onCustomChange]);

  const handleCustomInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const inputValue = e.target.value;
    if (inputValue && !/^\d*\.?\d*$/.test(inputValue)) return;
    onCustomChange(inputValue);
    if (inputValue) onChange(null);
  }, [disabled, onChange, onCustomChange]);

  const handleCustomBlur = useCallback(() => {
    if (!customValue) return;
    const amount = parseFloat(customValue);
    if (isNaN(amount) || amount < minAmount || amount > maxAmount) return;
    onCustomChange(amount.toFixed(2));
  }, [customValue, minAmount, maxAmount, onCustomChange]);

  const handleWithdrawAll = useCallback(() => {
    if (disabled || !onWithdrawAll) return;
    onChange(null);
    onCustomChange(availableBalance.toFixed(2));
    onWithdrawAll();
  }, [disabled, availableBalance, onChange, onCustomChange, onWithdrawAll]);

  const amountLabel = label || t('label.amount');
  const customAmountLabel = customLabel || t('label.custom_amount');
  const minFormatted = formatCurrency(minAmount, config, { decimals: 0 });
  const maxFormatted = formatCurrency(maxAmount, config, { decimals: 0 });
  const rangeTipTemplate = t('tip.amount_range');
  const rangeTip = rangeTipTemplate.replace('{min}', minFormatted).replace('{max}', maxFormatted);

  return (
    <div className="space-y-4">
      {/* 金额标签 */}
      <div className="text-sm font-semibold text-neutral-500">
        {amountLabel}
      </div>

      {/* 胶囊芯片预设 — 居中排列 */}
      <div className="flex flex-wrap justify-center gap-2.5">
        {presets.map((amount) => {
          const isSelected = value === amount;
          return (
            <m.button
              key={amount}
              type="button"
              disabled={disabled}
              onClick={() => handlePresetClick(amount)}
              className={cn(
                'h-11 px-5 rounded-full font-semibold text-sm transition-all duration-200',
                isSelected
                  ? 'bg-primary-500 text-white shadow-[0_2px_8px_rgba(var(--color-primary-rgb),0.25)]'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:border-primary-300',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
              {...(isAnimationEnabled && {
                whileTap: { scale: 0.93 },
                transition: SPRINGS.snappy,
              })}
            >
              {formatCurrency(amount, config, { decimals: 0 })}
            </m.button>
          );
        })}
      </div>

      {/* 分割线 */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-neutral-100" />
        <span className="text-xs text-neutral-400">{customAmountLabel}</span>
        <div className="flex-1 h-px bg-neutral-100" />
      </div>

      {/* 自定义金额输入 */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
          {config.currencySymbol}
        </div>
        <input
          type="text"
          inputMode="decimal"
          value={customValue}
          onChange={handleCustomInput}
          onBlur={handleCustomBlur}
          placeholder="0.00"
          disabled={disabled}
          className={cn(
            'w-full h-14 pl-12 pr-4 rounded-xl border text-lg font-medium',
            'bg-white transition-all',
            'placeholder:text-neutral-300',
            'focus:outline-none',
            !error && 'border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100',
            error && 'border-error focus:border-error focus:ring-2 focus:ring-red-100',
            disabled && 'opacity-50 cursor-not-allowed bg-neutral-50',
          )}
        />
        {type === 'withdraw' && showAllButton && (
          <button
            type="button"
            onClick={handleWithdrawAll}
            disabled={disabled || availableBalance <= 0}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2',
              'px-3 py-1.5 rounded-lg text-sm font-medium',
              'bg-primary-50 text-primary-600',
              'hover:bg-primary-100 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {t('btn.withdraw_all')}
          </button>
        )}
      </div>

      {/* 金额范围提示 */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-400">{rangeTip}</span>
        {type === 'withdraw' && (
          <span className="text-neutral-400">
            {t('label.available')}: {formatCurrency(availableBalance, config)}
          </span>
        )}
      </div>

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

AmountSelector.displayName = 'AmountSelector';
