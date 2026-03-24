/**
 * @file 转盘抽奖 SVG 组件
 * @description 可复用的转盘 SVG，支持旋转动画 + 目标扇区定位 + 结束回调
 */

'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { formatCurrency } from '@/lib/format';

/** 转盘扇区交替配色（翡翠绿+香槟金主题） */
const SEGMENT_COLORS = [
  { bg: 'var(--color-primary-50)', text: 'var(--color-primary-700)' },
  { bg: 'var(--color-gold-100)', text: 'var(--color-gold-800)' },
];

/** 奖品数据 */
export interface SpinPrize {
  id: number;
  label: string;
  amount: number;
  color?: string;
}

export interface SpinWheelProps {
  /** 奖品列表 */
  prizes: SpinPrize[];
  /** 是否正在旋转 */
  spinning: boolean;
  /** 中奖扇区索引 */
  targetIndex?: number;
  /** 旋转结束回调 */
  onSpinEnd?: () => void;
  /** 转盘尺寸（px） */
  size?: number;
  /** 自定义样式 */
  className?: string;
}

/**
 * 转盘 SVG 组件
 * @description CSS transition 驱动旋转，4秒 ease-out 减速
 */
export function SpinWheel({
  prizes,
  spinning,
  targetIndex,
  onSpinEnd,
  size = 300,
  className,
}: SpinWheelProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  const wheelRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const segmentAngle = prizes.length > 0 ? 360 / prizes.length : 30;

  /** 启动旋转动画 */
  useEffect(() => {
    if (!spinning || targetIndex === undefined || prizes.length === 0) return;

    // extraSpins 必须为整数，否则 extraSpins*360 会引入额外角度偏移，导致指针停在错误扇区
    const extraSpins = 5 + Math.floor(Math.random() * 4);
    const jitter = (Math.random() - 0.5) * segmentAngle * 0.6;
    const targetAngle = 360 - (targetIndex * segmentAngle + segmentAngle / 2 + jitter);
    const currentEffective = rotation % 360;
    const delta = (targetAngle - currentEffective + 360) % 360;
    const totalRotation = rotation + extraSpins * 360 + delta;

    // 用 requestAnimationFrame 确保 DOM 更新后再设置旋转
    requestAnimationFrame(() => {
      setRotation(totalRotation);
    });

    timerRef.current = setTimeout(() => {
      onSpinEnd?.();
    }, 4000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, targetIndex]);

  /** 渲染扇区路径 */
  const renderSegments = useCallback(() => {
    const cx = 150, cy = 150, r = 150;

    return prizes.map((prize, index) => {
      const startAngle = index * segmentAngle;
      const endAngle = startAngle + segmentAngle;
      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);
      const largeArc = segmentAngle > 180 ? 1 : 0;
      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);

      const colors = prize.color
        ? { bg: prize.color, text: '#fff' }
        : SEGMENT_COLORS[index % 2];

      const textAngle = startAngle + segmentAngle / 2;
      const textRad = (textAngle - 90) * (Math.PI / 180);
      const textR = 100;
      const tx = cx + textR * Math.cos(textRad);
      const ty = cy + textR * Math.sin(textRad);

      return (
        <g key={prize.id}>
          <path
            d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill={colors.bg}
            stroke="#fff"
            strokeWidth="1"
          />
          <text
            x={tx}
            y={ty}
            textAnchor="middle"
            dominantBaseline="central"
            fill={colors.text}
            fontSize="11"
            fontWeight="bold"
            transform={`rotate(${textAngle}, ${tx}, ${ty})`}
          >
            {prize.amount > 0
              ? formatCurrency(prize.amount, config, { decimals: 0 })
              : t('spin.thanks')}
          </text>
        </g>
      );
    });
  }, [prizes, segmentAngle, config, t]);

  if (prizes.length === 0) return null;

  return (
    <div
      className={cn('relative', className)}
      style={{ width: size, height: size }}
    >
      {/* 外圈装饰 */}
      <div
        className="absolute -inset-3 rounded-full border-[5px] border-gold-200/40"
        style={{
          background: 'radial-gradient(circle, rgba(var(--color-gold-rgb), 0.08) 0%, transparent 70%)',
        }}
      />

      {/* 顶部指针 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
        <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[22px] border-l-transparent border-r-transparent border-t-primary-500 drop-shadow-md" />
      </div>

      {/* 转盘主体 */}
      <div
        ref={wheelRef}
        className="w-full h-full rounded-full overflow-hidden shadow-[0_8px_32px_rgba(var(--color-gold-rgb),0.25),inset_0_0_0_3px_rgba(var(--color-gold-rgb),0.3)]"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning
            ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
            : 'none',
        }}
      >
        <svg viewBox="0 0 300 300" className="w-full h-full">
          {renderSegments()}
        </svg>
      </div>
    </div>
  );
}
