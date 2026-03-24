/**
 * @file 银行选择器组件
 * @description 支持搜索的银行选择下拉组件，显示银行Logo和名称
 * @reference 开发文档/03-前端页面/03.6.2-添加编辑银行卡页.md
 * 
 * 2026高端美学设计要点：
 * - 搜索输入框 + 下拉列表
 * - 银行图标（使用 Remix Icon）+ 银行名称
 * - 选中态有主色背景
 * - 空搜索结果友好提示
 */

'use client';

import { useState, useCallback, useMemo, useRef, useEffect, type HTMLAttributes } from 'react';
import { m, AnimatePresence } from 'motion/react';
import {
  RiSearchLine,
  RiBankLine,
  RiCheckLine,
  RiArrowDownSLine,
  RiCloseLine,
} from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useText } from '@/hooks/use-text';
import { SPRINGS } from '@/lib/animation';

/**
 * 银行数据类型
 * @description 依据：02.3-前端API接口清单 第1.5节
 */
export interface BankOption {
  /** 银行代码 */
  code: string;
  /** 银行名称 */
  name: string;
}

/**
 * 银行选择器属性
 */
export interface BankSelectorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** 银行列表 */
  banks: BankOption[];
  /** 选中的银行代码 */
  value: string | null;
  /** 选择变化回调 */
  onChange: (bankCode: string) => void;
  /** 是否加载中 */
  isLoading?: boolean;
  /** 标签 */
  label?: string;
  /** 占位文本 */
  placeholder?: string;
  /** 错误信息 */
  error?: string;
  /** 是否必填 */
  required?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 银行选择器组件
 * @description 带搜索功能的银行选择下拉组件
 * 
 * @example
 * ```tsx
 * <BankSelector
 *   banks={bankList}
 *   value={selectedBank}
 *   onChange={setSelectedBank}
 *   label="Seleccionar banco"
 *   required
 * />
 * ```
 */
export function BankSelector({
  banks,
  value,
  onChange,
  isLoading = false,
  label,
  placeholder,
  error,
  required = false,
  disabled = false,
  className,
  ...props
}: BankSelectorProps) {
  const { isAnimationEnabled } = useAnimationConfig();
  const t = useText();
  
  // 下拉框状态
  const [isOpen, setIsOpen] = useState(false);
  // 搜索关键词
  const [searchQuery, setSearchQuery] = useState('');
  
  // 组件引用（用于点击外部关闭）
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 当前选中的银行
  const selectedBank = useMemo(() => {
    return banks.find(b => b.code === value) || null;
  }, [banks, value]);

  // 过滤后的银行列表
  const filteredBanks = useMemo(() => {
    if (!searchQuery.trim()) {
      return banks;
    }
    const query = searchQuery.toLowerCase().trim();
    return banks.filter(bank => 
      bank.name.toLowerCase().includes(query) ||
      bank.code.toLowerCase().includes(query)
    );
  }, [banks, searchQuery]);

  /**
   * 处理打开/关闭下拉框
   */
  const handleToggle = useCallback(() => {
    if (disabled) return;
    setIsOpen(prev => {
      if (!prev) {
        // 打开时清空搜索
        setSearchQuery('');
        // 聚焦搜索框
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      return !prev;
    });
  }, [disabled]);

  /**
   * 处理选择银行
   */
  const handleSelect = useCallback((bankCode: string) => {
    onChange(bankCode);
    setIsOpen(false);
    setSearchQuery('');
  }, [onChange]);

  /**
   * 处理点击外部关闭
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * 处理键盘导航
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full', className)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {/* 标签 */}
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {label}
          {required && <span className="ml-1 text-error">*</span>}
        </label>
      )}

      {/* 触发按钮 */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || isLoading}
        className={cn(
          // 基础样式
          'w-full h-12 px-4 flex items-center justify-between gap-3',
          'rounded-lg border bg-white transition-all',
          'focus:outline-none focus:ring-2 focus:ring-primary-100',
          // 状态样式
          !error && !isOpen && 'border-neutral-200 hover:border-neutral-300',
          !error && isOpen && 'border-primary-400 ring-2 ring-primary-100',
          error && 'border-error focus:ring-red-100',
          disabled && 'opacity-50 cursor-not-allowed bg-neutral-50',
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-2 text-neutral-400">
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">{t('loading')}</span>
          </div>
        ) : selectedBank ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-50 flex-shrink-0">
              <RiBankLine className="w-5 h-5 text-primary-600" />
            </div>
            <span className="text-base text-neutral-800 truncate">
              {selectedBank.name}
            </span>
          </div>
        ) : (
          <span className="text-neutral-400">
            {placeholder || t('placeholder.select_bank')}
          </span>
        )}

        <RiArrowDownSLine
          className={cn(
            'w-5 h-5 text-neutral-400 transition-transform flex-shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* 错误信息 */}
      {error && (
        <p className="mt-1.5 text-sm text-error" role="alert">
          {error}
        </p>
      )}

      {/* 下拉面板 */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            className={cn(
              'absolute z-50 w-full mt-2',
              'bg-white rounded-xl border border-neutral-100',
              'shadow-soft-lg overflow-hidden'
            )}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={SPRINGS.snappy}
          >
            {/* 搜索框 */}
            <div className="p-3 border-b border-neutral-100">
              <div className="relative">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('placeholder.search_bank')}
                  className={cn(
                    'w-full h-10 pl-10 pr-10 rounded-lg',
                    'border border-neutral-200 bg-neutral-50',
                    'text-sm placeholder:text-neutral-400',
                    'focus:outline-none focus:border-primary-400 focus:bg-white'
                  )}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-neutral-200 transition-colors"
                  >
                    <RiCloseLine className="w-4 h-4 text-neutral-400" />
                  </button>
                )}
              </div>
            </div>

            {/* 银行列表 */}
            <div className="max-h-64 overflow-y-auto overscroll-contain">
              {filteredBanks.length > 0 ? (
                <div className="py-1">
                  {filteredBanks.map((bank, index) => {
                    const isSelected = bank.code === value;
                    
                    return (
                      <m.button
                        key={bank.code}
                        type="button"
                        onClick={() => handleSelect(bank.code)}
                        className={cn(
                          'w-full px-4 py-3 flex items-center gap-3',
                          'transition-colors text-left',
                          isSelected 
                            ? 'bg-primary-50 text-primary-700' 
                            : 'hover:bg-neutral-50 text-neutral-700'
                        )}
                        {...(isAnimationEnabled && {
                          initial: { opacity: 0, x: -8 },
                          animate: { opacity: 1, x: 0 },
                          transition: { ...SPRINGS.snappy, delay: index * 0.02 },
                        })}
                      >
                        {/* 银行图标 */}
                        <div className={cn(
                          'flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0',
                          isSelected ? 'bg-primary-100' : 'bg-neutral-100'
                        )}>
                          <RiBankLine className={cn(
                            'w-5 h-5',
                            isSelected ? 'text-primary-600' : 'text-neutral-500'
                          )} />
                        </div>

                        {/* 银行信息 */}
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            'text-sm font-medium truncate',
                            isSelected && 'text-primary-700'
                          )}>
                            {bank.name}
                          </div>
                          <div className="text-xs text-neutral-400">
                            {bank.code}
                          </div>
                        </div>

                        {/* 选中标记 */}
                        {isSelected && (
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-500 flex-shrink-0">
                            <RiCheckLine className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </m.button>
                    );
                  })}
                </div>
              ) : (
                // 空状态
                <div className="py-8 text-center">
                  <RiBankLine className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                  <p className="text-sm text-neutral-400">
                    {t('empty.no_banks_found')}
                  </p>
                </div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

BankSelector.displayName = 'BankSelector';
