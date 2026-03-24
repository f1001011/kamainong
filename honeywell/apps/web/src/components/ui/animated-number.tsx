/**
 * @file 动画数字组件
 * @description 数字变化时的滚动动画效果
 * @depends 开发文档/01-设计系统/01.2-动画系统.md
 * @depends 开发文档/01-设计系统/01.3-组件规范.md 第3.4节 - AnimatedNumber
 */

'use client';

import { useEffect, useRef, useState, type HTMLAttributes } from 'react';
import { m, useSpring, useTransform } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS } from '@/lib/animation';

/**
 * 动画数字组件属性
 * 依据：使用 Omit 移除与 Motion 冲突的事件属性
 */
export interface AnimatedNumberProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  /** 目标数值 */
  value: number;
  /** 前缀（如货币符号） */
  prefix?: string;
  /** 后缀（如百分号） */
  suffix?: string;
  /** 小数位数 */
  decimals?: number;
  /** 千分位分隔符 */
  separator?: string;
  /** 动画持续时间（秒） */
  duration?: number;
  /** 是否使用弹簧动画 */
  useSpringAnimation?: boolean;
}

/**
 * 格式化数字
 */
function formatNumber(
  value: number,
  decimals: number,
  separator: string
): string {
  const fixed = value.toFixed(decimals);
  const [integer, decimal] = fixed.split('.');
  
  // 添加千分位分隔符
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  
  return decimal ? `${formattedInteger}.${decimal}` : formattedInteger;
}

/**
 * 动画数字组件
 * @description 数字变化时平滑过渡的动画效果
 * 依据：01.2-动画系统.md - 尊重用户 prefers-reduced-motion 设置
 *
 * @example
 * ```tsx
 * <AnimatedNumber
 *   value={1234.56}
 *   prefix="$ "
 *   decimals={2}
 * />
 * ```
 */
export function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  separator = '.',
  duration = 0.8,
  useSpringAnimation = true,
  className,
  ...props
}: AnimatedNumberProps) {
  // 依据：01.2-动画系统.md - 使用动画配置
  const { isAnimationEnabled } = useAnimationConfig();
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  // 使用弹簧动画
  const springValue = useSpring(value, {
    ...SPRINGS.gentle,
    duration: useSpringAnimation ? undefined : duration,
  });

  // 转换为格式化字符串
  const formattedValue = useTransform(springValue, (latest) =>
    formatNumber(latest, decimals, separator)
  );

  // 订阅数值变化
  useEffect(() => {
    springValue.set(value);
    previousValue.current = value;
  }, [value, springValue]);

  // 非弹簧动画的简化实现
  useEffect(() => {
    if (useSpringAnimation) return;

    const startValue = previousValue.current;
    const endValue = value;
    const diff = endValue - startValue;
    const startTime = performance.now();
    const durationMs = duration * 1000;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // 缓出动画曲线
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + diff * easeOut;

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    previousValue.current = value;
  }, [value, duration, useSpringAnimation]);

  // 提取不会与 Motion 冲突的属性
  const { style, ...restProps } = props;

  // 依据：01.2-动画系统.md - 如果动画被禁用，直接显示最终值
  if (!isAnimationEnabled) {
    return (
      <span className={cn('tabular-nums', className)} style={style} {...restProps}>
        {prefix}
        {formatNumber(value, decimals, separator)}
        {suffix}
      </span>
    );
  }

  if (useSpringAnimation) {
    return (
      <m.span className={cn('tabular-nums', className)} style={style}>
        {prefix}
        <m.span>{formattedValue}</m.span>
        {suffix}
      </m.span>
    );
  }

  return (
    <span className={cn('tabular-nums', className)} style={style} {...restProps}>
      {prefix}
      {formatNumber(displayValue, decimals, separator)}
      {suffix}
    </span>
  );
}
