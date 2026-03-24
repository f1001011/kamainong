/**
 * @file 手续费计算组件
 * @description 实时显示申请金额、手续费、实际到账，带动画数字效果
 * @reference 开发文档/03-前端用户端/03.5-财务模块/03.5.1-提现页.md 第3.3节
 * 
 * 2026高端美学设计要点：
 * - 毛玻璃效果浮层卡片
 * - 三行信息清晰展示：申请金额、手续费、实际到账
 * - 实际到账用绿色大字突出
 * - AnimatedNumber 实时动画效果
 * - 金额计算向下取整到分 floorToCent()
 */

'use client';

import { useMemo, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useText } from '@/hooks/use-text';

/**
 * 向下取整到分（0.01）
 * @description 依据：开发文档.md 第16.5节 - 金额计算精度规则
 * @param value - 金额
 * @returns 向下取整到分的金额
 */
function floorToCent(value: number): number {
  return Math.floor(value * 100) / 100;
}

/**
 * 手续费计算组件属性
 */
export interface FeeCalculatorProps extends HTMLAttributes<HTMLDivElement> {
  /** 申请金额 */
  amount: number;
  /** 手续费百分比（5 表示 5%） */
  feePercent: number;
  /** 是否显示为空状态（无金额时） */
  showEmpty?: boolean;
  /** 空状态提示文案 */
  emptyText?: string;
  /** 是否作为浮层样式（更紧凑） */
  asOverlay?: boolean;
}

/**
 * 手续费计算组件
 * @description 实时展示提现费用明细，带动画数字效果
 * 依据：03.5.1-提现页.md 第3.3节 - 手续费计算向下取整到分
 * 
 * @example
 * ```tsx
 * <FeeCalculator
 *   amount={1000}
 *   feePercent={5}
 * />
 * // 显示：
 * // 申请金额: $ 1,000.00
 * // 手续费(5%): -$ 50.00
 * // 实际到账: $ 950.00 (绿色大字)
 * ```
 */
export function FeeCalculator({
  amount,
  feePercent,
  showEmpty = true,
  emptyText,
  asOverlay = false,
  className,
  ...props
}: FeeCalculatorProps) {
  // 获取配置
  const { config } = useGlobalConfig();
  const t = useText();

  // 货币符号
  const currencySymbol = config.currencySymbol || 'د.م.';

  // 计算手续费和实际到账（向下取整到分）
  // 依据：03.5.1-提现页.md 第6.4节 - floorToCent 函数
  const { fee, actualAmount } = useMemo(() => {
    if (amount <= 0 || isNaN(amount)) {
      return { fee: 0, actualAmount: 0 };
    }
    
    // 手续费 = 金额 × 手续费百分比，向下取整到分
    const calculatedFee = floorToCent(amount * feePercent / 100);
    // 实际到账 = 金额 - 手续费，向下取整到分
    const calculatedActual = floorToCent(amount - calculatedFee);
    
    return {
      fee: Math.max(0, calculatedFee),
      actualAmount: Math.max(0, calculatedActual),
    };
  }, [amount, feePercent]);

  // 是否有有效金额
  const hasValidAmount = amount > 0 && !isNaN(amount);

  // 空状态提示
  const emptyMessage = emptyText || t('tip.enter_amount_to_calculate');

  // 空状态渲染
  if (showEmpty && !hasValidAmount) {
    return (
      <div
        className={cn(
          // 毛玻璃效果卡片
          asOverlay ? 'glass rounded-xl p-4' : 'glass shadow-soft rounded-2xl p-5',
          className
        )}
        {...props}
      >
        <div className="text-center text-neutral-400 py-2">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        // 毛玻璃效果卡片
        // 依据：03.5.1-提现页.md 第4.4节 - 摘要浮层 glass 或 bg-white/70 backdrop-blur-xl
        asOverlay 
          ? 'bg-white/70 backdrop-blur-xl rounded-xl p-4 space-y-3' 
          : 'glass shadow-soft rounded-2xl p-5 space-y-4',
        className
      )}
      {...props}
    >
      {/* 申请金额 */}
      {/* 依据：03.5.1-提现页.md 第2.5节 - biz.apply_amount */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-400">
          {t('biz.apply_amount')}
        </span>
        <AnimatedNumber
          value={amount}
          prefix={`${currencySymbol} `}
          decimals={config?.currencyDecimals ?? 0}
          className="text-base font-medium text-neutral-600"
        />
      </div>

      {/* 分割线 */}
      <div className="h-px bg-neutral-200" />

      {/* 手续费 */}
      {/* 依据：03.5.1-提现页.md 第2.5节 - biz.fee */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-400">
          {t('biz.fee')} ({feePercent}%)
        </span>
        <AnimatedNumber
          value={fee}
          prefix={`-${currencySymbol} `}
          decimals={config?.currencyDecimals ?? 0}
          className="text-base font-medium text-error"
        />
      </div>

      {/* 分割线 */}
      <div className="h-px bg-neutral-200" />

      {/* 实际到账 - 绿色大字突出 */}
      {/* 依据：03.5.1-提现页.md 第2.5节 - biz.actual_amount */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-base font-medium text-neutral-600">
          {t('biz.actual_amount')}
        </span>
        <AnimatedNumber
          value={actualAmount}
          prefix={`${currencySymbol} `}
          decimals={config?.currencyDecimals ?? 0}
          className={cn(
            asOverlay ? 'text-lg font-bold text-success' : 'text-xl font-bold text-success'
          )}
        />
      </div>
    </div>
  );
}

FeeCalculator.displayName = 'FeeCalculator';
