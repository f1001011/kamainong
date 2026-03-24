/**
 * @file 产品信息组件
 * @description 产品详情页 - 展示产品图片、名称、价格、VIP等级徽章等信息
 * @depends 开发文档/03-前端/03.3-页面/03.3.2-产品详情页.md
 * @depends 开发文档/01-设计系统/01.1-设计Token.md - 2026高端美学配色
 */

'use client';

import { m } from 'motion/react';
import { RiVipCrownFill, RiVipDiamondFill, RiInformationLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { slideUpVariants } from '@/lib/animation';
import { ImagePreview } from '@/components/ui/image-preview';
import type { Product } from '@/types';

/**
 * 产品信息组件属性
 */
export interface ProductInfoProps {
  /** 产品数据 */
  product: Product;
  /** 自定义类名 */
  className?: string;
}

/**
 * 产品信息组件
 * @description 展示产品图片、名称、价格，精美的2026高端美学设计
 * 依据：03.3.2-产品详情页.md - 产品主图展示
 */
export function ProductInfo({ product, className }: ProductInfoProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();

  // 依据：开发文档.md 第8.0.0节 - 使用 type 字段判断体验产品
  const isTrialProduct = product.type === 'TRIAL';
  
  // 依据：开发文档.md 第8.1节 - 使用 series 判断VIP系列
  const isVipSeries = product.series === 'VIP';

  // 是否有赠送VIP/SVIP等级 - 依据：03.3.2-产品详情页.md VIP升级提示
  const hasGrantVip = product.grantVipLevel > 0;
  const hasGrantSvip = product.grantSvipLevel > 0;
  const hasAnyGrant = hasGrantVip || hasGrantSvip;

  // 格式化价格显示 - 依据：02.3-前端API接口清单.md 使用 dailyIncome/totalIncome
  const formattedPrice = formatCurrency(product.price, config);
  const formattedDailyIncome = formatCurrency(product.dailyIncome || product.dailyRate || '0', config);
  const formattedTotalIncome = formatCurrency(product.totalIncome || product.totalReturn || '0', config);

  // 获取产品图片 - 优先使用 mainImage，兼容旧字段 image
  const productImage = product.mainImage || product.image;

  return (
    <m.div
      className={cn('space-y-6', className)}
      variants={isAnimationEnabled ? slideUpVariants : undefined}
      initial={isAnimationEnabled ? 'initial' : undefined}
      animate={isAnimationEnabled ? 'animate' : undefined}
    >
      {/* 产品主图 - 依据：01.1-设计Token.md 圆角 rounded-2xl + 柔和阴影 */}
      {/* 依据：03.3.2-产品详情页.md - 支持点击放大预览 */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100 shadow-soft">
        {productImage ? (
          <ImagePreview
            src={productImage}
            alt={product.name}
            className="h-full w-full"
            imageClassName="h-full w-full object-cover"
            showZoomControls
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
            <span className="text-6xl font-bold text-primary-200">
              {product.name.charAt(0)}
            </span>
          </div>
        )}

        {/* 角标区域 - 依据：03.3.2-产品详情页.md 精美渐变徽章 */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {/* 体验产品标签 */}
          {isTrialProduct && (
            <m.span
              initial={isAnimationEnabled ? { opacity: 0, scale: 0.8 } : undefined}
              animate={isAnimationEnabled ? { opacity: 1, scale: 1 } : undefined}
              transition={{ delay: 0.2 }}
              className="rounded-full bg-gradient-to-r from-primary-400 to-primary-500 px-3 py-1 text-xs font-medium text-white shadow-soft"
            >
              {t('tag.trial', 'تجربة')}
            </m.span>
          )}

          {/* 推荐角标 - 依据：03.3.2-产品详情页.md showRecommendBadge */}
          {product.showRecommendBadge && (
            <m.span
              initial={isAnimationEnabled ? { opacity: 0, scale: 0.8 } : undefined}
              animate={isAnimationEnabled ? { opacity: 1, scale: 1 } : undefined}
              transition={{ delay: 0.2 }}
              className="rounded-full bg-gradient-to-r from-success to-success-600 px-3 py-1 text-xs font-medium text-white shadow-soft"
            >
              {product.customBadgeText || t('tag.recommend', 'مُوصى به')}
            </m.span>
          )}

          {/* VIP等级徽章 - 依据：01.1-设计Token.md 2026趋势色 lavender */}
          {isVipSeries && product.requireVipLevel > 0 && (
            <m.span
              initial={isAnimationEnabled ? { opacity: 0, scale: 0.8 } : undefined}
              animate={isAnimationEnabled ? { opacity: 1, scale: 1 } : undefined}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-1 rounded-full bg-gradient-to-r from-primary-100 to-white px-3 py-1 text-xs font-medium text-primary-600 shadow-soft"
            >
              {product.requireVipLevel >= 3 ? (
                <RiVipDiamondFill className="h-3.5 w-3.5" />
              ) : (
                <RiVipCrownFill className="h-3.5 w-3.5" />
              )}
              VIP{product.requireVipLevel}
            </m.span>
          )}
        </div>
      </div>

      {/* 产品名称和描述 */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          {product.name}
        </h1>
        {product.description && (
          <p className="text-sm text-neutral-400 leading-relaxed">
            {product.description}
          </p>
        )}
      </div>

      {/* 价格展示 - 依据：03.3.2-产品详情页.md 超大字体主色 */}
      <m.div
        className="rounded-2xl bg-gradient-to-br from-primary-50 to-white p-5 shadow-soft"
        initial={isAnimationEnabled ? { opacity: 0, y: 10 } : undefined}
        animate={isAnimationEnabled ? { opacity: 1, y: 0 } : undefined}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs text-neutral-400 mb-1">
              {t('product.price', 'السعر')}
            </p>
            <p className="text-3xl font-bold text-primary-500 tabular-nums">
              {formattedPrice}
            </p>
          </div>
          
          {/* 周期标签 */}
          <div className="text-right">
            <p className="text-xs text-neutral-400 mb-1">
              {t('product.cycle', 'الدورة')}
            </p>
            <p className="text-lg font-semibold text-foreground">
              {product.cycleDays} {t('unit.days', 'أيام')}
            </p>
          </div>
        </div>
      </m.div>

      {/* 产品参数 - 依据：01.3-组件规范.md 卡片设计 */}
      <m.div
        className="grid grid-cols-2 gap-3"
        initial={isAnimationEnabled ? { opacity: 0, y: 10 } : undefined}
        animate={isAnimationEnabled ? { opacity: 1, y: 0 } : undefined}
        transition={{ delay: 0.3 }}
      >
        {/* 日收益 */}
        <div className="rounded-xl bg-white p-4 shadow-soft">
          <div className="flex items-center gap-1 text-xs text-neutral-400 mb-1">
            <span>{t('biz.daily_income', 'الدخل اليومي')}</span>
          </div>
          <p className="text-lg font-semibold text-success tabular-nums">
            +{formattedDailyIncome}
          </p>
        </div>

        {/* 总收益 */}
        <div className="rounded-xl bg-white p-4 shadow-soft">
          <div className="flex items-center gap-1 text-xs text-neutral-400 mb-1">
            <span>{t('biz.total_return', 'العائد الإجمالي')}</span>
            <RiInformationLine className="h-3.5 w-3.5 text-neutral-300" />
          </div>
          <p className="text-lg font-semibold text-foreground tabular-nums">
            {formattedTotalIncome}
          </p>
        </div>
      </m.div>

      {/* 赠送VIP/SVIP等级提示 - 依据：03.3.2-产品详情页.md VIP升级角标 */}
      {hasAnyGrant && (
        <m.div
          className="flex items-center gap-3 rounded-xl bg-primary-100/50 p-4"
          initial={isAnimationEnabled ? { opacity: 0, y: 10 } : undefined}
          animate={isAnimationEnabled ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.4 }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-500">
            {hasGrantSvip ? (
              <RiVipDiamondFill className="h-5 w-5 text-white" />
            ) : (
              <RiVipCrownFill className="h-5 w-5 text-white" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {hasGrantSvip 
                ? t('tag.vip_upgrade', 'الترقية إلى SVIP{level}').replace('{level}', String(product.grantSvipLevel))
                : t('tag.vip_upgrade', 'الترقية إلى VIP{level}').replace('{level}', String(product.grantVipLevel))
              }
            </p>
            <p className="text-xs text-neutral-400">
              {t('product.grant_vip_desc', 'اشترِ هذا المنتج واستمتع بمزايا VIP')}
            </p>
          </div>
        </m.div>
      )}
    </m.div>
  );
}
