/**
 * @file 页面过渡动画组件
 * @description 实现页面切换时的淡入+微妙上移动画效果
 * @reference 开发文档/01-设计系统/01.2-动画系统.md
 */

'use client';

import { m, AnimatePresence } from 'motion/react';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS, DURATIONS } from '@/lib/animation/constants';

interface PageTransitionProps {
  /** 子元素 */
  children: ReactNode;
}

/**
 * 页面过渡动画变体
 * 淡入 + 微妙上移 - 体现高端感
 */
const pageVariants = {
  initial: { 
    opacity: 0, 
    y: 12, // 微妙上移距离
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      ...SPRINGS.elegant,
      opacity: { duration: DURATIONS.normal },
    },
  },
  exit: { 
    opacity: 0,
    y: -8,
    transition: { 
      duration: DURATIONS.fast,
    },
  },
};

/**
 * 页面过渡动画组件
 * @description 包裹页面内容，实现流畅的淡入滑动动画
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const { isAnimationEnabled } = useAnimationConfig();

  // 如果禁用动画，直接渲染内容
  if (!isAnimationEnabled) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-full"
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
