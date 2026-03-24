/**
 * @file 通用余额展示组件
 * @description 带动画数字和眼睛切换的余额展示，供首页/个人中心/提现页复用
 * @reference 开发文档/03-前端用户端/03.5-财务模块/03.5.1-提现页.md
 * 
 * 2026高端美学设计要点：
 * - 大号字体余额展示，使用 AnimatedNumber 动画
 * - 眼睛切换按钮，支持余额隐藏/显示
 * - 可配置前缀、后缀、小数位数
 */

'use client';

import { useState, useCallback, type HTMLAttributes } from 'react';
import { RiEyeLine, RiEyeOffLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useText } from '@/hooks/use-text';

/**
 * 余额展示组件属性
 */
export interface BalanceDisplayProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 余额金额（字符串或数字） */
  balance: string | number;
  /** 标签文案 */
  label?: string;
  /** 是否显示眼睛切换按钮 */
  showToggle?: boolean;
  /** 初始隐藏状态 */
  initialHidden?: boolean;
  /** 隐藏状态变化回调 */
  onHiddenChange?: (hidden: boolean) => void;
  /** 受控隐藏状态 */
  isHidden?: boolean;
  /** 小数位数，默认 0（COP无小数位） */
  decimals?: number;
  /** 余额文字大小样式 */
  balanceClassName?: string;
  /** 标签文字样式 */
  labelClassName?: string;
  /** 布局方向 */
  layout?: 'vertical' | 'horizontal';
}

/**
 * 通用余额展示组件
 * @description 支持 AnimatedNumber 动画、眼睛切换、垂直/水平布局
 * 
 * @example
 * ```tsx
 * // 基础用法
 * <BalanceDisplay balance={1500.00} label="可用余额" />
 * 
 * // 带眼睛切换
 * <BalanceDisplay
 *   balance={user.availableBalance}
 *   label={t('label.available_balance')}
 *   showToggle
 * />
 * 
 * // 水平布局
 * <BalanceDisplay
 *   balance={1500}
 *   layout="horizontal"
 *   balanceClassName="text-xl"
 * />
 * ```
 */
export function BalanceDisplay({
  balance,
  label,
  showToggle = false,
  initialHidden = false,
  onHiddenChange,
  isHidden: controlledHidden,
  decimals = 0,
  balanceClassName,
  labelClassName,
  layout = 'vertical',
  className,
  ...props
}: BalanceDisplayProps) {
  // 获取配置
  const { config } = useGlobalConfig();
  const t = useText();

  // 内部隐藏状态（非受控模式）
  const [internalHidden, setInternalHidden] = useState(initialHidden);

  // 实际隐藏状态（支持受控和非受控）
  const isHiddenValue = controlledHidden !== undefined ? controlledHidden : internalHidden;

  // 解析金额为数字
  const balanceNumber = typeof balance === 'string' ? parseFloat(balance) || 0 : balance;

  // 货币符号
  const currencySymbol = config.currencySymbol || 'د.م.';

  /**
   * 切换隐藏状态
   */
  const handleToggle = useCallback(() => {
    const newHidden = !isHiddenValue;
    
    // 非受控模式更新内部状态
    if (controlledHidden === undefined) {
      setInternalHidden(newHidden);
    }
    
    // 通知外部
    onHiddenChange?.(newHidden);
  }, [isHiddenValue, controlledHidden, onHiddenChange]);

  // 是否垂直布局
  const isVertical = layout === 'vertical';

  return (
    <div
      className={cn(
        isVertical ? 'space-y-2' : 'flex items-center justify-between',
        className
      )}
      {...props}
    >
      {/* 标签行 */}
      {label && (
        <div className={cn(
          'flex items-center gap-2',
          isVertical ? '' : 'order-first'
        )}>
          <span className={cn(
            'text-sm text-neutral-400',
            labelClassName
          )}>
            {label}
          </span>
          
          {/* 眼睛切换按钮 */}
          {showToggle && (
            <button
              type="button"
              onClick={handleToggle}
              className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-neutral-100 transition-colors"
              aria-label={isHiddenValue ? t('action.show_balance') : t('action.hide_balance')}
            >
              {isHiddenValue ? (
                <RiEyeOffLine className="w-4 h-4 text-neutral-400" />
              ) : (
                <RiEyeLine className="w-4 h-4 text-neutral-400" />
              )}
            </button>
          )}
        </div>
      )}

      {/* 余额数字 */}
      <div className={cn(
        'font-bold tracking-tight',
        isVertical ? 'text-3xl text-neutral-800' : 'text-xl text-neutral-800',
        balanceClassName
      )}>
        {isHiddenValue ? (
          <span>{currencySymbol} ****</span>
        ) : (
          <AnimatedNumber
            value={balanceNumber}
            prefix={`${currencySymbol} `}
            decimals={decimals}
          />
        )}
      </div>
    </div>
  );
}

BalanceDisplay.displayName = 'BalanceDisplay';
