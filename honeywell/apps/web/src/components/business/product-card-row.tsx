/**
 * @file 首页推荐产品 - 横向卡片组件
 * @description 用于首页推荐产品区域的横向卡片，左侧3px竖线标识产品系列
 * @depends 开发文档/03-前端/03.3-页面/03.3.0-首页.md
 */

'use client';

import { m } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { RiTimeLine, RiPercentLine, RiImageFill } from '@remixicon/react';
import { scaleVariants } from '@/lib/animation/variants';
import { Card } from '@/components/ui/card';
import { VipBadge } from '@/components/business/vip-badge';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useText } from '@/hooks/use-text';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * 产品卡片数据接口（首页推荐用）
 * 与 ProductData 类似但包含首页推荐场景的额外字段
 */
export interface ProductCardData {
  id: number | string;
  code: string;
  name: string;
  /** 产品类型：体验产品 / 付费产品 */
  type: 'TRIAL' | 'PAID';
  /** 产品系列：Po系列 / VIP系列 */
  series: 'PO' | 'VIP';
  price: string | number;
  dailyIncome: string | number;
  cycleDays: number;
  totalIncome: string | number;
  /** 购买后授予的VIP等级 */
  grantVipLevel?: number;
  /** 购买后授予的SVIP等级 */
  grantSvipLevel?: number;
  /** 购买所需的最低VIP等级 */
  requireVipLevel?: number;
  /** 限购数量 */
  purchaseLimit?: number;
  /** 产品主图 */
  mainImage?: string;
  /** 是否显示推荐角标 */
  showRecommendBadge?: boolean;
  /** 自定义角标文案 */
  customBadgeText?: string;
  status: string;
  /** 当前用户是否已购买 */
  purchased?: boolean;
  /** 当前用户是否可以购买 */
  canPurchase?: boolean;
  /** 锁定原因（如VIP等级不足） */
  lockReason?: string;
}

/**
 * 横向产品卡片组件属性
 */
export interface ProductCardRowProps {
  product: ProductCardData;
  className?: string;
}

/**
 * 根据产品系列和类型返回左侧竖线的渐变色
 * 体验产品=绿色，VIP系列=金色，Po系列=品牌橙
 */
function getSeriesGradient(series: string, type: string): string {
  if (type === 'TRIAL') return 'from-primary-400 to-primary-500';
  if (series === 'VIP') return 'from-gold-400 to-gold-500';
  return 'from-primary-400 to-primary-600';
}

/**
 * 首页推荐产品 - 横向卡片组件
 * @description 左侧3px竖线标识系列，包含缩略图、名称、VIP角标、收益信息、价格
 */
export function ProductCardRow({ product, className }: ProductCardRowProps) {
  const { config } = useGlobalConfig();
  const t = useText();

  const currencySymbol = config?.currencySymbol || 'د.م.';
  const gradient = getSeriesGradient(product.series, product.type);

  const price = parseFloat(String(product.price)) || 0;
  const dailyIncome = parseFloat(String(product.dailyIncome)) || 0;
  const totalIncome = parseFloat(String(product.totalIncome)) || 0;
  const isLocked = product.canPurchase === false;

  return (
    <m.div
      variants={scaleVariants}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Link href={`/products/${product.id}`} className="block">
        <Card
          padding="none"
          className={cn(
            'relative overflow-hidden rounded-2xl',
            'bg-white/80 backdrop-blur-sm border border-white/60',
            'shadow-[0_4px_16px_rgba(0,0,0,0.05),0_1px_4px_rgba(0,0,0,0.03)]',
            'transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08),0_4px_12px_rgba(var(--color-primary-rgb),0.04)]',
            isLocked && 'opacity-60',
            className
          )}
        >
          <div className="flex">
            {/* 左侧3px竖线 - 标识产品系列 */}
            <div
              className={cn(
                'w-[3px] flex-shrink-0 rounded-l-2xl bg-gradient-to-b',
                gradient
              )}
            />

            {/* 内容区域 */}
            <div className="flex-1 p-4">
              <div className="flex gap-4">
                {/* 产品缩略图 80×80 */}
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                  {product.mainImage ? (
                    <Image
                      src={product.mainImage}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <RiImageFill className="w-8 h-8 text-neutral-300" />
                    </div>
                  )}

                  {product.showRecommendBadge && (
                    <div className="absolute top-0 left-0 px-1.5 py-0.5 bg-error text-white text-[10px] font-medium rounded-br-lg">
                      {product.customBadgeText || t('product.recommend')}
                    </div>
                  )}
                </div>

                {/* 产品信息 */}
                <div className="flex-1 min-w-0">
                  {/* 名称 + VIP/SVIP角标 */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-bold text-neutral-800 truncate tracking-tight">
                      {product.name}
                    </h3>
                    {product.grantSvipLevel && product.grantSvipLevel > 0 ? (
                      <VipBadge type="svip" level={product.grantSvipLevel} size="sm" />
                    ) : product.grantVipLevel && product.grantVipLevel > 0 ? (
                      <VipBadge type="vip" level={product.grantVipLevel} size="sm" />
                    ) : null}
                  </div>

                  {/* 日收益 + 周期天数 */}
                  <div className="flex items-center gap-4 text-xs text-neutral-500 mb-2">
                    <span className="flex items-center gap-1">
                      <RiPercentLine className="w-3.5 h-3.5" />
                      {formatCurrency(dailyIncome, config)}/{t('unit.days', 'يوم')}
                    </span>
                    <span className="flex items-center gap-1">
                      <RiTimeLine className="w-3.5 h-3.5" />
                      {product.cycleDays} {t('unit.days', 'أيام')}
                    </span>
                  </div>

                  {/* 价格 + 总收益 */}
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-xs text-neutral-400">
                        {t('biz.price', 'السعر')}
                      </span>
                      <div className="text-lg font-bold text-primary-600 font-mono">
                        {formatCurrency(price, config)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-neutral-400">
                        {t('biz.total_return', 'العائد الإجمالي')}
                      </span>
                      <div className="text-sm font-semibold text-primary-600 font-mono">
                        {formatCurrency(totalIncome, config, { showSign: true })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 锁定原因提示 */}
              {isLocked && product.lockReason && (
                <div className="mt-3 pt-3 border-t border-neutral-100 text-xs text-gold-600">
                  {product.lockReason}
                </div>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </m.div>
  );
}
