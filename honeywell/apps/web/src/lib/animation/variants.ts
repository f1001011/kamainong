/**
 * @file 动画变体预设
 * @description "Metropolitan Prestige 2.0" 动画变体 - 沉稳流畅，无弹跳
 */

import type { Variants } from 'motion/react';
import { SPRINGS, DURATIONS, DISTANCES, SCALES, STAGGER } from './constants';

/**
 * 淡入淡出动画
 */
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * 从下方滑入动画
 */
export const slideUpVariants: Variants = {
  initial: { opacity: 0, y: DISTANCES.medium },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: SPRINGS.gentle,
  },
  exit: { 
    opacity: 0, 
    y: DISTANCES.medium,
    transition: { duration: DURATIONS.fast },
  },
};

/**
 * 从上方滑入动画
 */
export const slideDownVariants: Variants = {
  initial: { opacity: 0, y: -DISTANCES.medium },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: SPRINGS.gentle,
  },
  exit: { 
    opacity: 0, 
    y: -DISTANCES.medium,
    transition: { duration: DURATIONS.fast },
  },
};

/**
 * 缩放动画
 */
export const scaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: SPRINGS.snappy,
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: DURATIONS.fast },
  },
};

/**
 * 弹出动画（带回弹）
 */
export const popVariants: Variants = {
  initial: { opacity: 0, scale: SCALES.hidden },
  animate: { 
    opacity: 1, 
    scale: SCALES.normal,
    transition: SPRINGS.bouncy,
  },
  exit: { 
    opacity: 0, 
    scale: SCALES.hidden,
    transition: { duration: DURATIONS.fast },
  },
};

/**
 * 抽屉动画（从底部滑入）
 */
export const drawerVariants: Variants = {
  initial: { y: '100%' },
  animate: { 
    y: 0,
    transition: SPRINGS.gentle,
  },
  exit: { 
    y: '100%',
    transition: { duration: DURATIONS.normal },
  },
};

/**
 * 遮罩层动画
 */
export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: DURATIONS.fast },
  },
  exit: { 
    opacity: 0,
    transition: { duration: DURATIONS.fast },
  },
};

/**
 * 列表容器动画（控制子元素依次出现）
 */
export const listContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
  exit: {},
};

/**
 * 列表项目动画
 */
export const listItemVariants: Variants = {
  initial: { opacity: 0, y: DISTANCES.small },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: SPRINGS.gentle,
  },
  exit: { 
    opacity: 0, 
    y: -DISTANCES.small,
    transition: { duration: DURATIONS.fast },
  },
};

/**
 * 按钮交互动画
 */
export const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: { scale: SCALES.hover },
  tap: { scale: SCALES.press },
};

/**
 * 卡片悬停动画
 */
export const cardHoverVariants: Variants = {
  initial: { 
    y: 0,
    boxShadow: 'var(--shadow-soft)',
  },
  hover: { 
    y: -4,
    boxShadow: 'var(--shadow-soft-lg)',
    transition: SPRINGS.snappy,
  },
};

/**
 * 脉冲动画（用于加载状态）
 */
export const pulseVariants: Variants = {
  initial: { opacity: 1 },
  animate: {
    opacity: [1, 0.5, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * 抖动动画（用于错误提示）
 */
export const shakeVariants: Variants = {
  initial: { x: 0 },
  animate: {
    x: [-10, 10, -10, 10, 0],
    transition: {
      duration: 0.4,
    },
  },
};

/**
 * 闪光动画（骨架屏）
 */
export const shimmerVariants: Variants = {
  initial: { x: '-100%' },
  animate: {
    x: '100%',
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * 页面切换动画
 */
export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: SPRINGS.gentle,
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { duration: DURATIONS.fast },
  },
};

/**
 * 数字滚动动画配置
 */
export const numberAnimationConfig = {
  spring: SPRINGS.snappy,
  duration: DURATIONS.normal,
};

/**
 * 视口入场 - 从下方淡入（带延迟）
 */
export const inViewFadeUpVariants: Variants = {
  hidden: { opacity: 0, y: DISTANCES.large },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRINGS.gentle,
  },
};

/**
 * 视口入场 - 从右侧滑入
 */
export const inViewSlideRightVariants: Variants = {
  hidden: { opacity: 0, x: DISTANCES.large },
  visible: {
    opacity: 1,
    x: 0,
    transition: SPRINGS.gentle,
  },
};

/**
 * 成功弹入动画 - 用于奖励/成就
 */
export const successBounceVariants: Variants = {
  initial: { opacity: 0, scale: 0.3 },
  animate: {
    opacity: 1,
    scale: [0.3, 1.1, 0.9, 1.03, 1],
    transition: {
      duration: 0.6,
      times: [0, 0.4, 0.6, 0.8, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    transition: { duration: DURATIONS.fast },
  },
};

/**
 * 金额弹跳动画 - 数字展示时使用
 */
export const amountPopVariants: Variants = {
  initial: { opacity: 0, scale: 0.5, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: SPRINGS.bouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: DURATIONS.fast },
  },
};

/**
 * 交错容器变体（视口入场专用）
 */
export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

/**
 * 交错子项变体（视口入场专用）
 */
export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: DISTANCES.medium },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRINGS.gentle,
  },
};

/**
 * 礼花动画配置
 */
export const confettiConfig = {
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 },
  colors: ['#0D6B3D', '#2EAD66', '#C9A96E', '#D4B468', '#EBDBB1'],
};

/**
 * 金币飞入动画配置
 */
export const coinFlyConfig = {
  count: 5,
  duration: 0.8,
  spring: SPRINGS.celebration,
};

/**
 * 卡片入场 — 带微弱缩放
 */
export const cardRevealVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: SPRINGS.elegant,
  },
};

/**
 * 英雄区文字 — 模糊淡入
 */
export const heroTextVariants: Variants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
  },
};

/**
 * 数字翻牌 — 上下滑入滑出
 */
export const numberCountUpVariants: Variants = {
  initial: { opacity: 0, y: -12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
};
