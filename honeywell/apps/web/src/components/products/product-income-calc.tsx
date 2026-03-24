/**
 * @file 收益计算组件
 * @description 产品详情页 - 实时显示收益计算结果（日收益 × 周期 = 总收益）
 * @depends 开发文档/03-前端/03.3-页面/03.3.2-产品详情页.md
 * @depends 开发文档/01-设计系统/01.2-动画系统.md - AnimatedNumber数字滚动
 */

'use client';

import { useMemo } from 'react';
import { m } from 'motion/react';
import { RiArrowRightLine, RiTimeLine, RiMoneyDollarCircleFill } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { slideUpVariants } from '@/lib/animation';
import type { Product } from '@/types';

/**
 * 收益计算组件属性
 */
export interface ProductIncomeCalcProps {
  /** 产品数据 */
  product: Product;
  /** 自定义类名 */
  className?: string;
}

/**
 * 收益计算组件
 * @description 毛玻璃背景卡片，实时显示收益计算公式
 * 依据：03.3.2-产品详情页.md - 收益计算卡片
 */
export function ProductIncomeCalc({ product, className }: ProductIncomeCalcProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();

  // 计算收益数据 - 依据：02.3-前端API接口清单.md 使用 dailyIncome/totalIncome
  const incomeData = useMemo(() => {
    // 优先使用新字段名，兼容旧字段名
    const dailyIncome = parseFloat(product.dailyIncome || product.dailyRate || '0');
    const totalIncome = parseFloat(product.totalIncome || product.totalReturn || '0');
    const cycleDays = product.cycleDays;
    
    return {
      dailyIncome,
      cycleDays,
      totalIncome,
    };
  }, [product]);

  return (
    <m.div
      className={cn(
        // 依据：01.1-设计Token.md 毛玻璃效果 glass
        'rounded-2xl bg-white/70 backdrop-blur-xl border border-neutral-100/50 p-5 shadow-soft',
        className
      )}
      variants={isAnimationEnabled ? slideUpVariants : undefined}
      initial={isAnimationEnabled ? 'initial' : undefined}
      animate={isAnimationEnabled ? 'animate' : undefined}
    >
      {/* 标题 */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
          <RiMoneyDollarCircleFill className="h-4 w-4 text-primary-500" />
        </div>
        <h3 className="font-semibold text-foreground">
          {t('product.income_calc', 'حاسبة الأرباح')}
        </h3>
      </div>

      {/* 收益计算公式展示 */}
      <div className="flex items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-neutral-50 to-white p-4">
        {/* 日收益 */}
        <div className="text-center">
          <p className="text-xs text-neutral-400 mb-1">
            {t('product.daily', 'يومي')}
          </p>
          <p className="text-lg font-bold text-success tabular-nums">
            <AnimatedNumber
              value={incomeData.dailyIncome}
              prefix={`${config.currencySymbol} `}
              decimals={config?.currencyDecimals ?? 0}
            />
          </p>
        </div>

        {/* 乘号 */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
          <span className="text-neutral-400 font-medium">×</span>
        </div>

        {/* 周期天数 */}
        <div className="text-center">
          <p className="text-xs text-neutral-400 mb-1">
            {t('product.days', 'أيام')}
          </p>
          <div className="flex items-center justify-center gap-1">
            <RiTimeLine className="h-4 w-4 text-neutral-400" />
            <p className="text-lg font-bold text-foreground tabular-nums">
              <AnimatedNumber value={incomeData.cycleDays} decimals={0} />
            </p>
          </div>
        </div>

        {/* 等号 */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
          <RiArrowRightLine className="h-4 w-4 text-primary-500" />
        </div>

        {/* 总收益 */}
        <div className="text-center">
          <p className="text-xs text-neutral-400 mb-1">
            {t('product.total', 'الإجمالي')}
          </p>
          <p className="text-lg font-bold text-primary-500 tabular-nums">
            <AnimatedNumber
              value={incomeData.totalIncome}
              prefix={`${config.currencySymbol} `}
              decimals={config?.currencyDecimals ?? 0}
            />
          </p>
        </div>
      </div>

      {/* 收益说明 */}
      <p className="mt-3 text-xs text-neutral-400 text-center leading-relaxed">
        {t(
          'product.income_tip',
          'يتم إضافة الأرباح يومياً إلى رصيدك المتاح'
        )}
      </p>
    </m.div>
  );
}
