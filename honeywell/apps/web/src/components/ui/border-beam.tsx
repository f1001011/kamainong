/**
 * @file 边框光束动画组件
 * @description 灵感来自 Magic UI - 在元素边框上运行的光束动画效果
 * 用于高端卡片、按钮等元素的视觉增强
 * 需要父元素设置 position: relative 和 overflow: hidden
 *
 * 兼容性方案（iOS 13+ / Android 80+ / Chrome 60+）：
 * - 使用 conic-gradient（Safari 12.1+ / Chrome 69+）
 * - 使用 -webkit-mask-composite: xor（Safari 4+ / Chrome 1+）
 * - 使用 transform: rotate() 旋转（全兼容）
 * - 不使用 @property / oklch / color-mix / dvh
 */

'use client';

import { cn } from '@/lib/utils';

/**
 * BorderBeam 组件属性
 */
interface BorderBeamProps {
  /** 动画持续时间（秒），默认 12 */
  duration?: number;
  /** 光束颜色起始色，默认使用香槟金强调色 */
  colorFrom?: string;
  /** 光束颜色结束色，默认透明 */
  colorTo?: string;
  /** 延迟开始（秒），默认 0 */
  delay?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 边框光束动画组件
 * @description 在容器边框上呈现一道持续运动的光束
 *
 * 实现原理：
 * 1. 外层容器绝对定位覆盖父元素，使用 mask 只露出 1.5px 边框区域
 * 2. 内层超大 conic-gradient 圆盘通过 transform: rotate() 持续旋转
 * 3. 父元素 overflow: hidden + 外层 mask = 只看到边框上的光束移动
 *
 * 需要父元素 `position: relative` + `overflow: hidden`
 *
 * @example
 * ```tsx
 * <div className="relative overflow-hidden rounded-2xl">
 *   <BorderBeam duration={10} />
 *   <div>内容</div>
 * </div>
 * ```
 */
export function BorderBeam({
  duration = 12,
  colorFrom = 'var(--color-gold-500)',
  colorTo = 'transparent',
  delay = 0,
  className,
}: BorderBeamProps) {
  return (
    /* 外层：绝对定位 + mask 只露出边框 */
    <div
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden',
        className
      )}
      style={{
        /* mask 技巧：两层遮罩 xor = 只留边框区域
         * -webkit-mask-composite: xor 兼容 Safari 4+ / Chrome 1+
         */
        WebkitMask:
          'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        padding: '1.5px',
      }}
    >
      {/* 内层：超大旋转锥形渐变圆盘 */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          backgroundImage: `conic-gradient(from 0deg, transparent 0%, ${colorFrom} 8%, ${colorTo} 16%, transparent 24%)`,
          animation: `border-beam-rotate ${duration}s linear ${delay}s infinite`,
        }}
      />
    </div>
  );
}
