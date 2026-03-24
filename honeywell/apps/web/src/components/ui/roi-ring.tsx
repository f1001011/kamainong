/**
 * @file ROI 环形指示器
 * @description 产品投资回报率（ROI）圆环可视化组件，纯 SVG 实现
 */

'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface RoiRingProps {
  totalIncome: string;
  price: string;
  theme?: 'light' | 'warm';
  size?: number;
  className?: string;
}

const MAX_ROI = 1000;

export function RoiRing({ totalIncome, price, theme = 'light', size = 64, className }: RoiRingProps) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, []);

  const priceNum = parseFloat(price) || 1;
  const incomeNum = parseFloat(totalIncome) || 0;
  const roi = Math.round((incomeNum / priceNum) * 100);
  const strokeWidth = 4;
  const r = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(roi / MAX_ROI, 1);
  const offset = circumference * (1 - (animated ? progress : 0));
  const strokeColor = theme === 'warm' ? 'var(--color-gold-500)' : 'var(--color-primary-500)';
  const trackColor = theme === 'warm' ? 'rgba(var(--color-gold-rgb),0.1)' : 'var(--color-neutral-100)';

  return (
    <div className={cn('relative flex-shrink-0', className)} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold leading-none', size >= 64 ? 'text-base' : 'text-sm', 'text-neutral-800')}>{roi}</span>
        <span className={cn('leading-none mt-0.5', size >= 64 ? 'text-[10px]' : 'text-[8px]', 'text-neutral-400 font-medium')}>% ROI</span>
      </div>
    </div>
  );
}
