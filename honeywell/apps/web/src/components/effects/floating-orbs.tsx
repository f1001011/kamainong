/**
 * @file 浮动光球装饰组件
 * @description "Luminous Depth" 光辉深度设计系统 - 动态浮动光球，为页面增添深度和科技感
 * 2-3个模糊光球在背景中缓慢飘动，营造呼吸般的视觉效果
 */

'use client';

import { cn } from '@/lib/utils';

/**
 * 光球配置
 */
interface OrbConfig {
  /** 颜色方案 */
  color: 'primary' | 'purple' | 'blue' | 'pink' | 'gold';
  /** 大小 (px) */
  size: number;
  /** 位置 */
  position: { top?: string; bottom?: string; left?: string; right?: string };
  /** 动画延迟 */
  delay?: string;
  /** 模糊程度 */
  blur?: string;
}

/**
 * 预设颜色映射
 */
const colorMap: Record<string, string> = {
  primary: 'rgba(var(--color-primary-rgb), 0.15)',
  purple: 'rgba(var(--color-gold-rgb), 0.12)',
  blue: 'rgba(var(--color-primary-rgb), 0.12)',
  pink: 'rgba(var(--color-gold-rgb), 0.10)',
  gold: 'rgba(var(--color-gold-rgb), 0.15)',
};

export interface FloatingOrbsProps {
  /** 预设方案 */
  variant?: 'home' | 'activities' | 'profile' | 'subtle';
  /** 自定义光球配置（覆盖预设） */
  orbs?: OrbConfig[];
  /** 自定义类名 */
  className?: string;
}

/**
 * 预设光球方案
 */
const presets: Record<string, OrbConfig[]> = {
  /** 首页：3个光球，橙+紫+蓝 */
  home: [
    { color: 'primary', size: 300, position: { top: '-5%', right: '-8%' }, blur: 'blur-[80px]' },
    { color: 'purple', size: 250, position: { top: '40%', left: '-10%' }, delay: '-3s', blur: 'blur-[70px]' },
    { color: 'blue', size: 200, position: { bottom: '10%', right: '5%' }, delay: '-6s', blur: 'blur-[60px]' },
  ],
  /** 活动页：2个光球，粉+橙 */
  activities: [
    { color: 'pink', size: 280, position: { top: '-3%', left: '-5%' }, blur: 'blur-[80px]' },
    { color: 'primary', size: 220, position: { bottom: '20%', right: '-8%' }, delay: '-4s', blur: 'blur-[70px]' },
  ],
  /** 个人中心：2个光球，紫+橙 */
  profile: [
    { color: 'purple', size: 260, position: { top: '-8%', right: '-5%' }, blur: 'blur-[80px]' },
    { color: 'primary', size: 200, position: { top: '25%', left: '-10%' }, delay: '-5s', blur: 'blur-[60px]' },
  ],
  /** 微妙版：1个小光球 */
  subtle: [
    { color: 'primary', size: 180, position: { top: '10%', right: '-5%' }, blur: 'blur-[60px]' },
  ],
};

/**
 * 浮动光球装饰组件
 * @description 在页面背景中添加动态浮动光球，增添深度和科技感
 * 
 * @example
 * ```tsx
 * <div className="relative">
 *   <FloatingOrbs variant="home" />
 *   {/\* 页面内容 *\/}
 * </div>
 * ```
 */
export function FloatingOrbs({ variant = 'home', orbs, className }: FloatingOrbsProps) {
  const orbConfigs = orbs || presets[variant] || presets.home;

  return (
    <div
      className={cn(
        'absolute inset-0 overflow-hidden pointer-events-none z-0',
        className
      )}
      aria-hidden="true"
    >
      {orbConfigs.map((orb, index) => (
        <div
          key={index}
          className={cn(
            'absolute rounded-full animate-float-slow',
            orb.blur || 'blur-[70px]'
          )}
          style={{
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${colorMap[orb.color] || colorMap.primary} 0%, transparent 70%)`,
            ...orb.position,
            animationDelay: orb.delay || '0s',
            animationDuration: `${8 + index * 3}s`,
          }}
        />
      ))}
    </div>
  );
}
