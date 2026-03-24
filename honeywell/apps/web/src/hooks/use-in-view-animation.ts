/**
 * @file 视口入场动画 Hook
 * @description 元素进入视口时触发动画，支持交错延迟、阈值配置
 * @depends 开发文档/01-设计系统/01.2-动画系统.md - 第十三节 性能优化
 * 
 * 使用 IntersectionObserver 实现，性能优于 scroll 事件监听
 */

'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useAnimationConfig } from './use-animation-config';
import type { Variants } from 'motion/react';
import { SPRINGS, DISTANCES, STAGGER } from '@/lib/animation/constants';

/**
 * useInViewAnimation 配置
 */
export interface UseInViewAnimationOptions {
  /** 触发阈值（0-1，元素可见百分比） */
  threshold?: number;
  /** 仅触发一次 */
  once?: boolean;
  /** 自定义 rootMargin */
  rootMargin?: string;
  /** 延迟触发（秒） */
  delay?: number;
  /** 动画变体类型 */
  variant?: 'fadeUp' | 'fadeIn' | 'slideRight' | 'slideLeft' | 'scaleUp' | 'pop';
}

/**
 * useInViewAnimation 返回类型
 */
export interface UseInViewAnimationReturn {
  /** ref 绑定到目标元素 */
  ref: React.RefObject<HTMLElement | null>;
  /** 是否在视口内 */
  isInView: boolean;
  /** motion 组件使用的属性 */
  motionProps: {
    initial: string;
    animate: string;
    variants: Variants;
    transition: Record<string, unknown>;
  };
}

/**
 * 动画变体映射
 */
const variantMap: Record<string, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: DISTANCES.large },
    visible: { opacity: 1, y: 0 },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  slideRight: {
    hidden: { opacity: 0, x: -DISTANCES.large },
    visible: { opacity: 1, x: 0 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: DISTANCES.large },
    visible: { opacity: 1, x: 0 },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
  pop: {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { opacity: 1, scale: 1 },
  },
};

/**
 * useInViewAnimation 视口入场动画 Hook
 * @description 当元素滚动进入视口时触发入场动画
 * 依据：01.2-动画系统.md - 性能优先原则，使用 IntersectionObserver
 * 
 * @example
 * ```tsx
 * function Card() {
 *   const { ref, motionProps } = useInViewAnimation({ variant: 'fadeUp', once: true });
 *   return <m.div ref={ref} {...motionProps}>内容</m.div>;
 * }
 * ```
 */
export function useInViewAnimation(options: UseInViewAnimationOptions = {}): UseInViewAnimationReturn {
  const {
    threshold = 0.15,
    once = true,
    rootMargin = '0px 0px -50px 0px',
    delay = 0,
    variant = 'fadeUp',
  } = options;

  const ref = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const { isAnimationEnabled, getSpring, getDuration } = useAnimationConfig();

  useEffect(() => {
    // 动画禁用时直接显示
    if (!isAnimationEnabled) {
      setIsInView(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, once, isAnimationEnabled]);

  // 构建 motion props
  const motionProps = useMemo(() => {
    const variants = variantMap[variant] || variantMap.fadeUp;

    return {
      initial: 'hidden',
      animate: isInView ? 'visible' : 'hidden',
      variants,
      transition: {
        ...getSpring('gentle'),
        delay: getDuration(delay),
      },
    };
  }, [variant, isInView, getSpring, getDuration, delay]);

  return { ref, isInView, motionProps };
}

/**
 * useStaggerInView 交错入场动画 Hook
 * @description 容器内多个子元素依次入场
 * 
 * @example
 * ```tsx
 * function List() {
 *   const { containerRef, containerProps, itemProps } = useStaggerInView({ itemCount: 5 });
 *   return (
 *     <m.div ref={containerRef} {...containerProps}>
 *       {items.map((item, i) => (
 *         <m.div key={i} {...itemProps(i)}>...</m.div>
 *       ))}
 *     </m.div>
 *   );
 * }
 * ```
 */
export interface UseStaggerInViewOptions {
  /** 子元素数量 */
  itemCount: number;
  /** 触发阈值 */
  threshold?: number;
  /** 仅触发一次 */
  once?: boolean;
  /** 交错延迟速度 */
  staggerSpeed?: 'fast' | 'normal' | 'slow';
  /** 子元素动画变体 */
  variant?: 'fadeUp' | 'fadeIn' | 'slideRight' | 'scaleUp';
}

export function useStaggerInView(options: UseStaggerInViewOptions) {
  const {
    threshold = 0.1,
    once = true,
    staggerSpeed = 'normal',
    variant = 'fadeUp',
  } = options;

  const containerRef = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const { isAnimationEnabled, getSpring, getDuration } = useAnimationConfig();

  useEffect(() => {
    if (!isAnimationEnabled) {
      setIsInView(true);
      return;
    }

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) observer.unobserve(element);
        } else if (!once) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin: '0px 0px -30px 0px' }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [threshold, once, isAnimationEnabled]);

  const staggerDelay = STAGGER[staggerSpeed] || STAGGER.normal;
  const itemVariants = variantMap[variant] || variantMap.fadeUp;

  const containerProps = useMemo(() => ({
    initial: 'hidden',
    animate: isInView ? 'visible' : 'hidden',
    variants: {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: getDuration(staggerDelay),
          delayChildren: getDuration(0.1),
        },
      },
    } as Variants,
  }), [isInView, staggerDelay, getDuration]);

  const itemProps = useCallback((index: number) => ({
    variants: itemVariants,
    transition: getSpring('gentle'),
  }), [itemVariants, getSpring]);

  return { containerRef, isInView, containerProps, itemProps };
}
