/**
 * @file 礼花特效组件
 * @description 成功操作后的庆祝礼花动画
 * @depends 开发文档/01-设计系统/01.2-动画系统.md
 * @depends 开发文档/01-设计系统/01.3-组件规范.md 第6.1节 - Confetti
 */

'use client';

import { useCallback, useRef } from 'react';
import { useAnimationConfig } from '@/hooks/use-animation-config';

/**
 * 礼花配置
 */
export interface ConfettiConfig {
  /** 粒子数量 */
  particleCount?: number;
  /** 扩散角度 */
  spread?: number;
  /** 起始位置 */
  origin?: { x: number; y: number };
  /** 颜色数组 */
  colors?: string[];
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 默认配置
 */
const defaultConfig: Required<ConfettiConfig> = {
  particleCount: 100,
  spread: 70,
  origin: { x: 0.5, y: 0.6 },
  colors: ['var(--color-gold-500)', 'var(--color-gold-400)', 'var(--color-gold-300)', 'var(--color-ivory-200)', 'var(--color-jade-200)'],
  disabled: false,
};

/**
 * 礼花特效 Hook
 * @description 触发礼花动画效果
 * 依据：01.2-动画系统.md - 尊重用户 prefers-reduced-motion 设置
 *
 * @example
 * ```tsx
 * function SuccessPage() {
 *   const { triggerConfetti } = useConfetti();
 *
 *   useEffect(() => {
 *     triggerConfetti();
 *   }, []);
 *
 *   return <div>成功！</div>;
 * }
 * ```
 */
/** canvas-confetti 函数类型 */
type ConfettiFunction = (options?: Record<string, unknown>) => Promise<null> | null;

export function useConfetti(config: ConfettiConfig = {}) {
  const confettiRef = useRef<ConfettiFunction | null>(null);
  // 依据：01.2-动画系统.md - 使用动画配置
  const { isAnimationEnabled } = useAnimationConfig();

  /**
   * 动态加载 canvas-confetti
   */
  const loadConfetti = useCallback(async () => {
    if (confettiRef.current) return confettiRef.current;

    try {
      const module = await import('canvas-confetti');
      confettiRef.current = module.default as unknown as ConfettiFunction;
      return confettiRef.current;
    } catch {
      console.warn('canvas-confetti 加载失败');
      return null;
    }
  }, []);

  /**
   * 触发礼花
   */
  const triggerConfetti = useCallback(
    async (overrideConfig?: Partial<ConfettiConfig>) => {
      const finalConfig = { ...defaultConfig, ...config, ...overrideConfig };

      // 依据：01.2-动画系统.md - 尊重用户偏好
      if (finalConfig.disabled || !isAnimationEnabled) return;

      const confetti = await loadConfetti();
      if (!confetti) return;

      // 基础礼花
      confetti({
        particleCount: finalConfig.particleCount,
        spread: finalConfig.spread,
        origin: finalConfig.origin,
        colors: finalConfig.colors,
        ticks: 200,
        gravity: 1.2,
        scalar: 1.2,
        shapes: ['circle', 'square'],
      });
    },
    [config, loadConfetti, isAnimationEnabled]
  );

  /**
   * 连续礼花（更热烈的效果）
   */
  const triggerBurst = useCallback(async () => {
    // 依据：01.2-动画系统.md - 尊重用户偏好
    if (!isAnimationEnabled) return;

    const confettiFn = await loadConfetti();
    if (!confettiFn) return;

    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: defaultConfig.colors,
    };

    const fire = (particleRatio: number, opts: Record<string, unknown>) => {
      confettiFn({
        ...defaults,
        particleCount: Math.floor(count * particleRatio),
        ...opts,
      });
    };

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, [loadConfetti, isAnimationEnabled]);

  return {
    /** 触发单次礼花 */
    triggerConfetti,
    /** 触发连续礼花 */
    triggerBurst,
    /** 动画是否启用 */
    isAnimationEnabled,
  };
}

/**
 * 礼花触发按钮组件
 * @description 点击后触发礼花效果的按钮
 */
export interface ConfettiButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  config?: ConfettiConfig;
  className?: string;
}

export function ConfettiButton({
  children,
  onClick,
  config,
  className,
}: ConfettiButtonProps) {
  const { triggerConfetti } = useConfetti(config);

  const handleClick = () => {
    triggerConfetti();
    onClick?.();
  };

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
