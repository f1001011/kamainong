/**
 * @file Motion Provider
 * @description 动画库配置提供者，使用 LazyMotion 优化加载性能
 * @reference 开发文档/01-设计系统/01.2-动画系统.md
 */

'use client';

import { LazyMotion, domAnimation, MotionConfig } from 'motion/react';
import { type ReactNode, useMemo, useState, useEffect } from 'react';
import { useAnimationConfig } from '@/hooks/use-animation-config';

/**
 * Motion Provider Props
 */
interface MotionProviderProps {
  children: ReactNode;
}

/**
 * Motion Provider 组件
 * @description 使用 LazyMotion 懒加载动画功能，减少初始包体积
 * 依据：01.2-动画系统.md 第5.1节 - Motion 全局配置
 */
export function MotionProvider({ children }: MotionProviderProps) {
  // 依据：01.2-动画系统.md - 从后台获取动画配置
  const { isAnimationEnabled, getDuration } = useAnimationConfig();

  // 使用 useState + useEffect 确保服务端和客户端渲染一致
  // 避免 hydration 不匹配
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // 依据：01.2-动画系统.md - 检测用户减少动画偏好
    // 只在客户端检测，避免 hydration 问题
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    // 监听偏好变化
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 计算全局过渡配置
  // 依据：01.2-动画系统.md - 尊重用户 prefers-reduced-motion 设置
  const globalTransition = useMemo(() => {
    if (!isAnimationEnabled) {
      return { duration: 0 };
    }
    return { duration: getDuration(0.3) };
  }, [isAnimationEnabled, getDuration]);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig
        reducedMotion={prefersReducedMotion || !isAnimationEnabled ? 'always' : 'never'}
        transition={globalTransition}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
