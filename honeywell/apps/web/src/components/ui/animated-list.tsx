/**
 * @file 通用列表动画组件
 * @description 提供列表交错入场动画效果
 * @depends 开发文档/01-设计系统/01.2-动画系统.md
 * @depends 开发文档/03-前端用户端/03.3-产品模块/03.3.1-产品列表页.md
 * 
 * 复用说明：本组件将被所有列表页复用
 * - FE-06 产品列表页
 * - FE-09 我的持仓页
 * - FE-11 充值记录页
 * - FE-15 提现记录页
 * - FE-17 团队成员列表
 */

'use client';

import { Children, ReactNode, cloneElement, isValidElement } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { STAGGER, DISTANCES } from '@/lib/animation/constants';
import { listContainerVariants, listItemVariants } from '@/lib/animation/variants';

/**
 * AnimatedList 组件属性
 */
export interface AnimatedListProps {
  /** 子元素 */
  children: ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 交错延迟类型 */
  stagger?: 'fast' | 'normal' | 'slow';
  /** 是否启用动画（覆盖全局配置） */
  animate?: boolean;
  /** 列表布局类型 */
  layout?: 'single' | 'double' | 'auto';
  /** 列表间距 */
  gap?: 'small' | 'medium' | 'large';
}

/**
 * AnimatedList 列表动画容器
 * @description 为子元素提供交错入场动画效果
 * 
 * @example
 * ```tsx
 * <AnimatedList stagger="fast" layout="single" gap="medium">
 *   {products.map(product => (
 *     <AnimatedListItem key={product.id}>
 *       <ProductCard product={product} />
 *     </AnimatedListItem>
 *   ))}
 * </AnimatedList>
 * ```
 */
export function AnimatedList({
  children,
  className,
  stagger = 'fast',
  animate,
  layout = 'auto',
  gap = 'medium',
}: AnimatedListProps) {
  const { isAnimationEnabled } = useAnimationConfig();
  
  // 决定是否启用动画
  const shouldAnimate = animate ?? isAnimationEnabled;

  // 布局类名映射
  // 依据：03.3.1-产品列表页.md 第4.6节 - 列表布局映射
  const layoutClasses = {
    single: 'grid grid-cols-1',
    double: 'grid grid-cols-2 md:grid-cols-3',
    auto: 'grid grid-cols-1 md:grid-cols-2',
  };

  // 间距类名映射
  // 依据：01.1-设计Token.md 第四节 - 呼吸感留白原则
  const gapClasses = {
    small: 'gap-3',
    medium: 'gap-4 md:gap-5',
    large: 'gap-5 md:gap-6',
  };

  // 交错延迟配置
  const staggerValue = STAGGER[stagger];

  // 自定义动画变体（支持可配置的交错延迟）
  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: staggerValue,
        delayChildren: 0.1,
      },
    },
    exit: {},
  };

  // 如果禁用动画，直接渲染内容
  if (!shouldAnimate) {
    return (
      <div className={cn(layoutClasses[layout], gapClasses[gap], className)}>
        {children}
      </div>
    );
  }

  return (
    <m.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(layoutClasses[layout], gapClasses[gap], className)}
    >
      {children}
    </m.div>
  );
}

/**
 * AnimatedListItem 组件属性
 */
export interface AnimatedListItemProps {
  /** 子元素 */
  children: ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 唯一标识（用于 AnimatePresence） */
  itemKey?: string | number;
}

/**
 * AnimatedListItem 列表项动画组件
 * @description 必须在 AnimatedList 内部使用，提供单项入场动画
 * 
 * @example
 * ```tsx
 * <AnimatedListItem itemKey={product.id}>
 *   <ProductCard product={product} />
 * </AnimatedListItem>
 * ```
 */
export function AnimatedListItem({
  children,
  className,
  itemKey,
}: AnimatedListItemProps) {
  const { isAnimationEnabled } = useAnimationConfig();

  // 如果禁用动画，直接渲染内容
  if (!isAnimationEnabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      variants={listItemVariants}
      className={className}
      layout
    >
      {children}
    </m.div>
  );
}

/**
 * AnimatedListWithPresence 带增删动画的列表
 * @description 支持列表项增删时的动画效果
 */
export interface AnimatedListWithPresenceProps extends AnimatedListProps {
  /** 子元素必须有 key */
  children: ReactNode;
}

export function AnimatedListWithPresence({
  children,
  className,
  stagger = 'fast',
  layout = 'auto',
  gap = 'medium',
}: AnimatedListWithPresenceProps) {
  const { isAnimationEnabled } = useAnimationConfig();

  // 布局类名映射
  const layoutClasses = {
    single: 'grid grid-cols-1',
    double: 'grid grid-cols-2 md:grid-cols-3',
    auto: 'grid grid-cols-1 md:grid-cols-2',
  };

  // 间距类名映射
  const gapClasses = {
    small: 'gap-3',
    medium: 'gap-4 md:gap-5',
    large: 'gap-5 md:gap-6',
  };

  if (!isAnimationEnabled) {
    return (
      <div className={cn(layoutClasses[layout], gapClasses[gap], className)}>
        {children}
      </div>
    );
  }

  return (
    <m.div
      className={cn(layoutClasses[layout], gapClasses[gap], className)}
      layout
    >
      <AnimatePresence mode="popLayout">
        {children}
      </AnimatePresence>
    </m.div>
  );
}
