/**
 * @file 模糊淡入动画组件
 * @description 灵感来自 Magic UI - 元素进入视口时的模糊淡入效果
 * 支持从下方滑入 + 高斯模糊渐显，营造高端质感入场动画
 *
 * 兼容性：iOS 13+ / Android 80+ / Chrome 60+
 * - 使用 motion/react 的 useInView + AnimatePresence
 * - filter: blur() iOS 9+ 支持
 */

'use client';

import { useRef } from 'react';
import {
  AnimatePresence,
  m,
  useInView,
  type Variants,
} from 'motion/react';
import { useAnimationConfig } from '@/hooks/use-animation-config';

/**
 * BlurFade 组件属性
 */
interface BlurFadeProps {
  /** 子元素 */
  children: React.ReactNode;
  /** 动画延迟（秒），默认 0 */
  delay?: number;
  /** 是否在视口中触发（而非立即），默认 true */
  inView?: boolean;
  /** Y 轴偏移量（像素），默认 12 */
  yOffset?: number;
  /** 模糊程度（像素），默认 6 */
  blur?: number;
  /** 动画持续时间（秒），默认 0.5 */
  duration?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 模糊淡入动画组件
 * @description 包裹子元素，在进入视口时触发模糊淡入动画
 * 适用于首页区块、卡片列表的入场效果
 *
 * @example
 * ```tsx
 * <BlurFade delay={0.1} inView>
 *   <h2>标题文案</h2>
 * </BlurFade>
 * ```
 */
export function BlurFade({
  children,
  delay = 0,
  inView = true,
  yOffset = 12,
  blur = 6,
  duration = 0.5,
  className,
}: BlurFadeProps) {
  const { isAnimationEnabled } = useAnimationConfig();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const shouldAnimate = isAnimationEnabled;
  const isVisible = !inView || isInView;

  const variants: Variants = {
    hidden: {
      y: yOffset,
      opacity: 0,
      filter: `blur(${blur}px)`,
    },
    visible: {
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
    },
  };

  // 动画关闭时直接显示内容
  if (!shouldAnimate) {
    return <div ref={ref} className={className}>{children}</div>;
  }

  return (
    <AnimatePresence>
      <m.div
        ref={ref}
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        exit="hidden"
        variants={variants}
        transition={{
          delay: 0.04 + delay,
          duration,
          ease: 'easeOut',
        }}
        className={className}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
