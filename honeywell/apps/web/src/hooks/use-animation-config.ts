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
  const { data: config } = useQuery<AnimationConfig>({
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
    const baseConfig = config || defaultAnimationConfig;
    return {
      ...baseConfig,
      // 如果用户偏好减少动画，则禁用
      enabled: baseConfig.enabled && !prefersReducedMotion,
    };
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
      return {
        type: 'spring' as const,
        stiffness: baseSpring.stiffness * (finalConfig.stiffness / 200),
        damping: baseSpring.damping * (finalConfig.damping / 25),
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
      return baseDuration * finalConfig.durationMultiplier;
    };
  }, [finalConfig]);

  return {
    config: finalConfig,
    isAnimationEnabled: finalConfig.enabled,
    getSpring,
    getDuration,
  };
}
