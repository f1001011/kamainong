/**
 * @file 金币飞入特效组件
 * @description 收益到账时的金币飞入动画
 * @depends 开发文档/01-设计系统/01.2-动画系统.md
 * @depends 开发文档/01-设计系统/01.3-组件规范.md 第6.2节 - CoinFly
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { RiCoinLine } from '@remixicon/react';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS } from '@/lib/animation';

/**
 * 单个金币配置
 */
interface Coin {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: number;
  rotation: number;
}

/**
 * 金币飞入配置
 */
export interface CoinFlyConfig {
  /** 金币数量 */
  count?: number;
  /** 目标元素选择器 */
  targetSelector?: string;
  /** 动画持续时间（秒） */
  duration?: number;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 默认配置
 */
const defaultConfig: Required<CoinFlyConfig> = {
  count: 5,
  targetSelector: '.balance-display',
  duration: 0.8,
  disabled: false,
};

/**
 * 金币飞入特效 Hook
 * @description 触发金币飞入动画效果
 * 依据：01.2-动画系统.md - 尊重用户 prefers-reduced-motion 设置
 *
 * @example
 * ```tsx
 * function IncomePage() {
 *   const { triggerCoinFly, CoinFlyPortal } = useCoinFly();
 *
 *   const handleClaim = () => {
 *     triggerCoinFly();
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleClaim}>领取收益</button>
 *       <CoinFlyPortal />
 *     </>
 *   );
 * }
 * ```
 */
export function useCoinFly(config: CoinFlyConfig = {}) {
  const [coins, setCoins] = useState<Coin[]>([]);
  const coinIdRef = useRef(0);
  // 依据：01.2-动画系统.md - 使用动画配置
  const { isAnimationEnabled } = useAnimationConfig();

  const finalConfig = { ...defaultConfig, ...config };

  /**
   * 触发金币飞入
   */
  const triggerCoinFly = useCallback(
    (sourceElement?: HTMLElement) => {
      // 依据：01.2-动画系统.md - 尊重用户偏好
      if (finalConfig.disabled || !isAnimationEnabled) return;

      // 获取目标位置
      const target = document.querySelector(finalConfig.targetSelector);
      const targetRect = target?.getBoundingClientRect();
      const endX = targetRect
        ? targetRect.left + targetRect.width / 2
        : window.innerWidth / 2;
      const endY = targetRect
        ? targetRect.top + targetRect.height / 2
        : 100;

      // 获取起始位置
      let startX = window.innerWidth / 2;
      let startY = window.innerHeight / 2;

      if (sourceElement) {
        const sourceRect = sourceElement.getBoundingClientRect();
        startX = sourceRect.left + sourceRect.width / 2;
        startY = sourceRect.top + sourceRect.height / 2;
      }

      // 创建金币
      const newCoins: Coin[] = Array.from({ length: finalConfig.count }, (_, i) => ({
        id: coinIdRef.current++,
        startX: startX + (Math.random() - 0.5) * 100,
        startY: startY + (Math.random() - 0.5) * 100,
        endX,
        endY,
        delay: i * 0.1,
        rotation: Math.random() * 360,
      }));

      setCoins((prev) => [...prev, ...newCoins]);

      // 动画结束后移除金币
      setTimeout(() => {
        setCoins((prev) => prev.filter((c) => !newCoins.some((nc) => nc.id === c.id)));
      }, (finalConfig.duration + finalConfig.count * 0.1) * 1000 + 500);
    },
    [finalConfig, isAnimationEnabled]
  );

  /**
   * 金币渲染组件
   */
  const CoinFlyPortal = useCallback(() => (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      <AnimatePresence>
        {coins.map((coin) => (
          <m.div
            key={coin.id}
            className="absolute"
            initial={{
              x: coin.startX,
              y: coin.startY,
              scale: 0,
              rotate: coin.rotation,
              opacity: 0,
            }}
            animate={{
              x: coin.endX,
              y: coin.endY,
              scale: [0, 1.2, 1, 0.8],
              rotate: coin.rotation + 720,
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              ...SPRINGS.bouncy,
              delay: coin.delay,
              duration: finalConfig.duration,
            }}
          >
            <div className="relative">
              {/* 金币主体 */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 shadow-soft-lg">
                <RiCoinLine className="h-5 w-5 text-white" />
              </div>
              {/* 光晕效果 */}
              <div className="absolute inset-0 rounded-full bg-gold-500 opacity-30 blur-sm" />
            </div>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  ), [coins, finalConfig.duration]);

  return {
    /** 触发金币飞入 */
    triggerCoinFly,
    /** 金币渲染组件 */
    CoinFlyPortal,
    /** 当前活跃的金币数量 */
    activeCoins: coins.length,
  };
}

/**
 * 脉冲包装组件
 * @description 给子元素添加脉冲动画效果
 * 依据：01.2-动画系统.md - 尊重用户 prefers-reduced-motion 设置
 */
export interface PulseWrapperProps {
  children: React.ReactNode;
  /** 是否激活脉冲 */
  active?: boolean;
  /** 脉冲颜色 */
  color?: string;
  /** 自定义类名 */
  className?: string;
}

export function PulseWrapper({
  children,
  active = false,
  color = 'var(--color-primary-400)',
  className,
}: PulseWrapperProps) {
  // 依据：01.2-动画系统.md - 使用动画配置
  const { isAnimationEnabled } = useAnimationConfig();

  return (
    <div className={`relative ${className || ''}`}>
      {/* 依据：01.2-动画系统.md - 仅在动画启用时显示脉冲 */}
      {active && isAnimationEnabled && (
        <m.div
          className="absolute inset-0 rounded-full"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{
            opacity: [0.6, 0],
            scale: [1, 1.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </div>
  );
}
