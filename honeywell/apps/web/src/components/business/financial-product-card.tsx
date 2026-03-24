/**
 * @file 理财产品卡片组件（建筑精度设计语言）
 * @description 展示理财类产品：日收益、周期、到期本金+利息
 * 统一占位图（RiBuilding2Fill + 翡翠渐变）、衬线体价格、无 ROI 环
 * 支持 COMING_SOON 状态
 */

'use client';

import { m } from 'motion/react';
import Image from 'next/image';
import {
  RiCoinsFill,
  RiBuilding2Fill,
} from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { formatCurrency } from '@/lib/format';
import { SPRINGS, STAGGER } from '@/lib/animation';
import { Button } from '@/components/ui/button';

/** 理财产品数据 */
export interface FinancialProductData {
  id: number;
  name: string;
  price: string;
  dailyIncome: string;
  cycleDays: number;
  totalIncome: string;
  status: 'ACTIVE' | 'COMING_SOON';
  mainImage: string | null;
}

export interface FinancialProductCardProps {
  /** 产品数据 */
  product: FinancialProductData;
  /** 购买回调 */
  onBuy?: (product: FinancialProductData) => void;
  /** 列表索引（入场动画延迟） */
  index?: number;
  /** 自定义样式 */
  className?: string;
}

/**
 * 理财产品卡片
 * @description 展示收益计算：投资金额、日收益、周期、到期返还（本金+利息=总额）
 */
export function FinancialProductCard({
  product,
  onBuy,
  index = 0,
  className,
}: FinancialProductCardProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();

  const isComingSoon = product.status === 'COMING_SOON';
  const price = parseFloat(product.price) || 0;
  const dailyIncome = parseFloat(product.dailyIncome) || 0;
  const totalIncome = parseFloat(product.totalIncome) || 0;
  const totalReturn = price + totalIncome;

  return (
    <m.div
      initial={isAnimationEnabled ? { opacity: 0, y: 16 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRINGS.gentle, delay: index * STAGGER.fast }}
      className={cn(
        'relative rounded-[16px] overflow-hidden border transition-all',
        isComingSoon
          ? 'bg-neutral-50 border-neutral-200/40 opacity-60'
          : 'bg-white border-neutral-100/80 shadow-architectural',
        className,
      )}
    >
      {/* 顶部装饰渐变 */}
      {!isComingSoon && (
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(90deg, var(--color-primary-400), var(--color-gold-500), var(--color-primary-400))',
          }}
        />
      )}

      {/* 产品图片（占位图统一翡翠渐变 + 建筑剪影） */}
      <div className="relative aspect-[21/9] overflow-hidden">
        {product.mainImage ? (
          <Image src={product.mainImage} alt={product.name} fill className="object-cover" sizes="100vw" />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(160deg, var(--color-primary-800) 0%, var(--color-dark-950) 100%)',
            }}
          >
            <RiBuilding2Fill className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-white/8" />
          </div>
        )}

        {/* 底部渐变遮罩 */}
        <div
          className="absolute bottom-0 inset-x-0 h-12"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)' }}
        />
        <div className="absolute bottom-2 left-3 right-3">
          <h3 className="text-sm font-bold text-white truncate">{product.name}</h3>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* 价格 + 日收益 + 周期 三栏 */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-[10px] text-neutral-400 mb-0.5">{t('product.price')}</p>
            <p className={cn(
              'text-lg font-heading font-financial leading-tight',
              isComingSoon ? 'text-neutral-400' : 'text-neutral-800',
            )}>
              {formatCurrency(product.price, config)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 mb-0.5">{t('biz.daily_income')}</p>
            <p className={cn(
              'text-lg font-financial font-semibold leading-tight',
              isComingSoon ? 'text-neutral-400' : 'text-primary-500',
            )}>
              +{formatCurrency(product.dailyIncome, config)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 mb-0.5">{t('biz.cycle_days')}</p>
            <p className={cn(
              'text-lg font-financial font-semibold leading-tight',
              isComingSoon ? 'text-neutral-400' : 'text-neutral-700',
            )}>
              {product.cycleDays}{t('unit.days')}
            </p>
          </div>
        </div>

        {/* 到期明细：本金 + 利息 = 总额（上下两行，防溢出） */}
        {!isComingSoon && (
          <div className="px-3 py-3 rounded-xl bg-neutral-50/60 border border-neutral-100/50">
            <div className="flex items-center gap-1 mb-2">
              <RiCoinsFill className="size-4 text-gold-500 flex-shrink-0" />
              <span className="text-xs text-neutral-500">
                {t('financial.maturity')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-financial flex-wrap">
              <span className="text-neutral-500">{formatCurrency(price, config)}</span>
              <span className="text-neutral-300">+</span>
              <span className="text-primary-600 font-semibold">{formatCurrency(totalIncome, config)}</span>
              <span className="text-neutral-300">=</span>
              <span className="text-neutral-800 font-bold font-heading">{formatCurrency(totalReturn, config)}</span>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        {isComingSoon ? (
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            disabled
            className="h-11 rounded-xl"
          >
            {t('product.coming_soon')}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => onBuy?.(product)}
            className="h-11 rounded-xl btn-gradient"
          >
            {t('financial.invest_now')}
          </Button>
        )}
      </div>
    </m.div>
  );
}
