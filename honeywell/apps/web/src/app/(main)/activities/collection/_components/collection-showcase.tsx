/**
 * @file 已购产品收藏展示组件 - 2026高端美学升级版
 * @description 以徽章网格形式展示用户已购买的VIP产品，高级画廊风格
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.4-连单奖励活动页.md 第4.5节
 */

'use client';

import { useRouter } from 'next/navigation';
import { m } from 'motion/react';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { ProductBadge } from './product-badge';
import { RiArrowRightSLine, RiVipCrownFill, RiVipDiamondFill } from '@remixicon/react';
import { SPRINGS } from '@/lib/animation';

/**
 * 已购产品数据
 * @description 来自 API 响应 /api/activities/collection
 */
interface PurchasedProduct {
  id: number;
  name: string;
  icon: string;
}

/**
 * 收藏展示组件属性
 */
interface CollectionShowcaseProps {
  /** 已购买的VIP产品列表（来自API） */
  purchasedProducts: PurchasedProduct[];
}

/**
 * 已购产品收藏展示组件 - 2026高端美学版
 * @description 依据：03.11.4-连单奖励活动页.md 第4.5节 - 已购产品收藏区设计
 * 
 * 设计特色：
 * - 毛玻璃卡片背景 + 装饰光晕
 * - 渐变标题 + VIP钻石图标
 * - 高级徽章网格
 * - 精美空状态引导
 */
export function CollectionShowcase({ purchasedProducts }: CollectionShowcaseProps) {
  const t = useText();
  const router = useRouter();
  const { isAnimationEnabled } = useAnimationConfig();

  const hasProducts = purchasedProducts.length > 0;

  return (
    <m.div
      initial={isAnimationEnabled ? { opacity: 0, y: 10 } : undefined}
      animate={isAnimationEnabled ? { opacity: 1, y: 0 } : undefined}
      transition={SPRINGS.gentle}
      className="relative rounded-2xl overflow-hidden shadow-soft-md"
      style={{
        background: 'linear-gradient(160deg, #1c1410 0%, #2a1a0e 35%, #3d2814 65%, #1a1208 100%)',
      }}
    >
      {/* 渐变边框效果 */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          padding: '1px',
          background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb),0.4) 0%, rgba(var(--color-gold-rgb),0.15) 50%, rgba(255,255,255,0.05) 100%)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      {/* 装饰性大光晕 */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-20 blur-[60px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(var(--color-primary-rgb),0.6) 0%, transparent 60%)' }}
      />
      <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-15 blur-[50px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(var(--color-gold-rgb),0.5) 0%, transparent 60%)' }}
      />
      {/* 闪光效果 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
            animation: 'shimmer-flow 4s ease-in-out infinite',
          }}
        />
      </div>

      <div className="relative z-10 p-5">
        {/* 标题区 */}
        <div className="flex items-center justify-center gap-2.5 mb-5">
          <RiVipDiamondFill className="w-5 h-5 text-primary-400" />
          <h2 className="text-base font-bold text-white/90">
            {t('collection.purchased_title', 'مجموعتي')}
          </h2>
          <span className="text-xs font-bold text-primary-400 bg-white/8 px-2.5 py-0.5 rounded-full border border-white/10">
            {purchasedProducts.length}
          </span>
        </div>

        {hasProducts ? (
          <div className="grid grid-cols-4 gap-3 justify-items-center mb-5">
            {purchasedProducts.map((product, index) => (
              <ProductBadge
                key={product.id}
                name={product.name}
                icon={product.icon}
                isPurchased={true}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-6 mb-4">
            {/* 大型装饰图标 */}
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb),0.12) 0%, rgba(var(--color-primary-rgb),0.04) 100%)',
                  border: '1px solid rgba(var(--color-primary-rgb),0.15)',
                }}
              >
                <RiVipCrownFill className="w-9 h-9 text-primary-400/60" />
              </div>
              {/* 图标背后的光晕 */}
              <div className="absolute inset-0 rounded-2xl blur-xl opacity-40 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(var(--color-primary-rgb),0.2) 0%, transparent 70%)' }}
              />
            </div>
            <p className="text-sm font-medium text-white/30 mb-1">
              {t('collection.no_purchased', 'لا تملك منتجات VIP بعد')}
            </p>
            <p className="text-xs text-white/15">
              {t('collection.no_purchased_hint', 'اشترِ VIP لفتح المكافآت')}
            </p>
          </div>
        )}

        {/* CTA 按钮 - 渐变高端风格 */}
        <button
          onClick={() => router.push('/products')}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb),0.15) 0%, rgba(var(--color-primary-rgb),0.08) 100%)',
            border: '1px solid rgba(var(--color-primary-rgb),0.2)',
            color: 'rgba(var(--color-primary-rgb),0.9)',
          }}
        >
          {t('collection.go_products', 'عرض المنتجات')}
          <RiArrowRightSLine className="w-4 h-4" />
        </button>
      </div>
    </m.div>
  );
}
