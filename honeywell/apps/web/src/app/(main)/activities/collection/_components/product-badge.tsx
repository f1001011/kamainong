/**
 * @file 产品徽章组件
 * @description 已购/未购产品的徽章展示，带入场动画
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.4-连单奖励活动页.md 第4.5节
 */

'use client';

import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { RiCheckLine } from '@remixicon/react';
import { SPRINGS } from '@/lib/animation';

/**
 * 产品徽章组件属性
 */
interface ProductBadgeProps {
  /** 产品名称 */
  name: string;
  /** 产品图标URL */
  icon?: string;
  /** 是否已购买 */
  isPurchased: boolean;
  /** 徽章尺寸 */
  size?: 'sm' | 'md';
  /** 动画延迟索引 */
  index?: number;
}

/**
 * 产品徽章组件
 * @description 依据：03.11.4-连单奖励活动页.md 第4.5节 - 已购产品收藏区设计
 * 
 * 设计规范：
 * - 已购徽章：金色渐变背景 from-gold-50 to-gold-100，金色边框 border-gold-300
 * - 未购占位：虚线边框 border-dashed border-neutral-200
 * - 入场动画：缩放 0.8 → 1 + 弹性效果
 * - 尺寸：64×64px (移动端) / 72×72px (电脑端)
 * 
 * @example
 * ```tsx
 * <ProductBadge name="VIP1" icon="/images/vip1.png" isPurchased={true} index={0} />
 * ```
 */
export function ProductBadge({
  name,
  icon,
  isPurchased,
  size = 'md',
  index = 0,
}: ProductBadgeProps) {
  const { isAnimationEnabled } = useAnimationConfig();

  const sizeClasses = {
    sm: 'w-14 h-14 md:w-16 md:h-16',
    md: 'w-16 h-16 md:w-[72px] md:h-[72px]',
  };

  return (
    <m.div
      initial={isAnimationEnabled ? { scale: 0.8, opacity: 0 } : undefined}
      animate={isAnimationEnabled ? { scale: 1, opacity: 1 } : undefined}
      transition={{
        ...SPRINGS.bouncy,
        delay: index * 0.05,
      }}
      className={cn(
        'relative rounded-xl flex flex-col items-center justify-center shadow-soft-sm',
        sizeClasses[size],
        isPurchased
          ? 'bg-gradient-to-br from-gold-50 to-gold-100 border-2 border-gold-300/70'
          : 'border-2 border-dashed border-neutral-200 bg-neutral-50/50'
      )}
    >
      {/* 已购买时的微光效果 */}
      {isPurchased && (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-[0.15]"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(var(--color-gold-rgb),0.4) 0%, transparent 60%)',
            }}
          />
        </div>
      )}

      {/* 产品图标或占位 */}
      {isPurchased && icon ? (
        <img 
          src={icon} 
          alt="" 
          className="relative z-10 w-6 h-6 mb-1 object-contain" 
          loading="lazy" 
        />
      ) : (
        <div className="w-6 h-6 mb-1" />
      )}

      {/* 产品名称 */}
      <span
        className={cn(
          'relative z-10 text-xs font-semibold',
          isPurchased ? 'text-gold-700' : 'text-neutral-400'
        )}
      >
        {name}
      </span>

      {/* 已购买勾选标识 - 更精致的样式 */}
      {isPurchased && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-br from-success to-success-600 flex items-center justify-center shadow-soft-sm ring-2 ring-white">
          <RiCheckLine className="w-3 h-3 text-white" />
        </div>
      )}
    </m.div>
  );
}
