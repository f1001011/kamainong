/**
 * @file 动画配置 Hook
 * @description 从后台获取动画配置，支持动态调整
 * @reference 开发文档/01-设计系统/01.2-动画系统.md
 */

'use client';

import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SPRINGS } from '@/lib/animation';
import type { AnimationConfig } from '@/types';
import api from '@/lib/api';

interface AnimationConfigApiResponse extends Partial<AnimationConfig> {
  animationEnabled?: boolean;
  animationSpeed?: number;
  reducedMotion?: boolean;
}

/**
 * 默认动画配置
 */
const defaultAnimationConfig: AnimationConfig = {
  enabled: true,
  stiffness: 200,
  damping: 25,
  mass: 1,
  durationMultiplier: 1,
};

function normalizePositiveNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeAnimationConfig(
  config: AnimationConfigApiResponse | undefined,
  prefersReducedMotion: boolean
): AnimationConfig {
  const baseConfig: AnimationConfigApiResponse = config ?? {};
  const enabled = typeof baseConfig.enabled === 'boolean'
    ? baseConfig.enabled
    : typeof baseConfig.animationEnabled === 'boolean'
      ? baseConfig.animationEnabled
      : defaultAnimationConfig.enabled;
  const reducedMotion = typeof baseConfig.reducedMotion === 'boolean'
    ? baseConfig.reducedMotion
    : false;

  return {
    // Backward-compatible with both legacy spring fields and current API payload.
    enabled: enabled && !reducedMotion && !prefersReducedMotion,
    stiffness: normalizePositiveNumber(baseConfig.stiffness, defaultAnimationConfig.stiffness),
    damping: normalizePositiveNumber(baseConfig.damping, defaultAnimationConfig.damping),
    mass: normalizePositiveNumber(baseConfig.mass, defaultAnimationConfig.mass),
    durationMultiplier: normalizePositiveNumber(
      baseConfig.durationMultiplier ?? baseConfig.animationSpeed,
      defaultAnimationConfig.durationMultiplier
    ),
  };
}

/**
 * 动画配置 Hook 返回类型
 */
interface UseAnimationConfigReturn {
  /** 动画配置 */
  config: AnimationConfig;
  /** 是否启用动画 */
  isAnimationEnabled: boolean;
  /** 获取调整后的弹簧配置 */
  getSpring: (type: keyof typeof SPRINGS) => {
    type: 'spring';
    stiffness: number;
    damping: number;
    mass: number;
  };
  /** 获取调整后的持续时间 */
  getDuration: (baseDuration: number) => number;
}

/**
 * 动画配置 Hook
 * @description 获取后台动画配置，支持用户偏好检测
 * 
 * @example
 * ```tsx
 * const { isAnimationEnabled, getSpring, getDuration } = useAnimationConfig();
 * 
 * // 使用调整后的弹簧配置
 * <motion.div
 *   animate={{ opacity: 1 }}
 *   transition={getSpring('gentle')}
 * />
 * ```
 */
export function useAnimationConfig(): UseAnimationConfigReturn {
  // 从后台获取动画配置
  const { data: config } = useQuery<AnimationConfigApiResponse>({
    queryKey: ['animation-config'],
    queryFn: () => api.get('/config/animation'),
    staleTime: 10 * 60 * 1000, // 10 分钟缓存
    retry: false,
  });

  // 使用 useState + useEffect 检测用户减少动画偏好
  // 避免 hydration 不匹配（服务端返回 false，客户端可能返回 true）
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 合并配置
  const finalConfig = useMemo(() => {
    return normalizeAnimationConfig(config, prefersReducedMotion);
  }, [config, prefersReducedMotion]);

  /**
   * 获取调整后的弹簧配置
   */
  const getSpring = useMemo(() => {
    return (type: keyof typeof SPRINGS) => {
      const baseSpring = SPRINGS[type];
      
      // 如果动画禁用，返回即时动画
      if (!finalConfig.enabled) {
        return {
          type: 'spring' as const,
          stiffness: 1000,
          damping: 100,
          mass: 0.1,
        };
      }

      // 应用配置调整
      const stiffnessScale = normalizePositiveNumber(
        finalConfig.stiffness / defaultAnimationConfig.stiffness,
        1
      );
      const dampingScale = normalizePositiveNumber(
        finalConfig.damping / defaultAnimationConfig.damping,
        1
      );

      return {
        type: 'spring' as const,
        stiffness: baseSpring.stiffness * stiffnessScale,
        damping: baseSpring.damping * dampingScale,
        mass: baseSpring.mass * finalConfig.mass,
      };
    };
  }, [finalConfig]);

  /**
   * 获取调整后的持续时间
   */
  const getDuration = useMemo(() => {
    return (baseDuration: number) => {
      if (!finalConfig.enabled) return 0.01;
      return normalizePositiveNumber(
        baseDuration * finalConfig.durationMultiplier,
        baseDuration
      );
    };
  }, [finalConfig]);

  return {
    config: finalConfig,
    isAnimationEnabled: finalConfig.enabled,
    getSpring,
    getDuration,
  };
}
