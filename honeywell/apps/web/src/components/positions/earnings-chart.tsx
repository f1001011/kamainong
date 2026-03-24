/**
 * @file 收益增长曲线组件
 * @description Robinhood 风格面积图，展示累计收益增长轨迹
 */

'use client';

import { useMemo, useState } from 'react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { formatCurrency } from '@/lib/format';
import { SPRINGS } from '@/lib/animation/constants';

interface ChartDataPoint {
  day: number;
  cumulative: string;
  status: string;
  date: string;
}

interface EarningsChartProps {
  chartData: ChartDataPoint[];
  totalDays: number;
  paidDays: number;
  dailyIncome: string;
  totalIncome: string;
  productSeries: string;
  className?: string;
}

type TimeRange = '1S' | '1M' | '3M' | 'Todo';

export function EarningsChart({
  chartData,
  totalDays,
  paidDays,
  dailyIncome,
  totalIncome,
  productSeries,
  className,
}: EarningsChartProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  const [activeRange, setActiveRange] = useState<TimeRange>('Todo');
  const [tooltip, setTooltip] = useState<{ x: number; y: number; day: number; amount: string; status: string } | null>(null);

  const isVIP = productSeries === 'VIP';
  const strokeColor = isVIP ? 'var(--color-gold-500)' : 'var(--color-primary-500)';
  const fillFrom = isVIP ? 'rgba(var(--color-gold-rgb), 0.15)' : 'rgba(var(--color-primary-rgb), 0.15)';
  const fillTo = isVIP ? 'rgba(var(--color-gold-rgb), 0.02)' : 'rgba(var(--color-primary-rgb), 0.02)';

  // 图表尺寸
  const width = 360;
  const height = 180;
  const padL = 45;
  const padR = 10;
  const padT = 10;
  const padB = 25;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  // 根据时间范围过滤数据
  const filteredRange = useMemo(() => {
    const maxDay = totalDays;
    switch (activeRange) {
      case '1S': return Math.min(7, maxDay);
      case '1M': return Math.min(30, maxDay);
      case '3M': return Math.min(90, maxDay);
      default: return maxDay;
    }
  }, [activeRange, totalDays]);

  // 起始天数
  const startDay = useMemo(() => {
    if (activeRange === 'Todo') return 1;
    return Math.max(1, paidDays - filteredRange + 1);
  }, [activeRange, paidDays, filteredRange]);

  // 构建完整的图表数据（含预期）
  const fullData = useMemo(() => {
    const daily = parseFloat(dailyIncome);
    const total = parseFloat(totalIncome);
    const points: { day: number; value: number; isSettled: boolean }[] = [];

    // 已发放数据：从 chartData 获取
    const dataMap = new Map<number, { cumulative: number; status: string }>();
    chartData.forEach(d => dataMap.set(d.day, { cumulative: parseFloat(d.cumulative), status: d.status }));

    let lastCum = 0;
    for (let day = 1; day <= totalDays; day++) {
      const record = dataMap.get(day);
      if (record && record.status === 'SETTLED') {
        lastCum = record.cumulative;
        points.push({ day, value: lastCum, isSettled: true });
      } else {
        // 预期：累计已获 + 剩余天数 × 日收益
        const projected = lastCum + daily * (day - paidDays);
        points.push({ day, value: Math.min(projected, total), isSettled: false });
      }
    }

    // 按时间范围过滤
    if (activeRange === 'Todo') return points;
    return points.filter(p => p.day >= startDay && p.day <= startDay + filteredRange - 1);
  }, [chartData, totalDays, paidDays, dailyIncome, totalIncome, activeRange, startDay, filteredRange]);

  // 最大值
  const maxValue = useMemo(() => {
    const total = parseFloat(totalIncome);
    if (activeRange === 'Todo') return total;
    const vals = fullData.map(p => p.value);
    return Math.max(...vals, 1);
  }, [fullData, totalIncome, activeRange]);

  // 坐标转换
  const toX = (day: number) => {
    const minDay = fullData.length > 0 ? fullData[0].day : 1;
    const maxDay = fullData.length > 0 ? fullData[fullData.length - 1].day : totalDays;
    const range = Math.max(maxDay - minDay, 1);
    return padL + ((day - minDay) / range) * chartW;
  };
  const toY = (val: number) => padT + chartH - (val / maxValue) * chartH;

  // 已发放数据点和预期数据点
  const settledPoints = fullData.filter(p => p.isSettled);
  const projectedPoints = fullData.filter(p => !p.isSettled);

  // 生成 SVG 路径
  const buildPath = (points: typeof fullData) => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.day).toFixed(1)},${toY(p.value).toFixed(1)}`).join(' ');
  };

  const buildAreaPath = (points: typeof fullData) => {
    if (points.length === 0) return '';
    const linePath = buildPath(points);
    const lastX = toX(points[points.length - 1].day);
    const firstX = toX(points[0].day);
    const baseY = toY(0);
    return `${linePath} L${lastX.toFixed(1)},${baseY.toFixed(1)} L${firstX.toFixed(1)},${baseY.toFixed(1)} Z`;
  };

  // 连接点路径（从已发放最后到预期第一个）
  const connectionPath = settledPoints.length > 0 && projectedPoints.length > 0
    ? `M${toX(settledPoints[settledPoints.length - 1].day).toFixed(1)},${toY(settledPoints[settledPoints.length - 1].value).toFixed(1)} L${toX(projectedPoints[0].day).toFixed(1)},${toY(projectedPoints[0].value).toFixed(1)}`
    : '';

  // Y 轴刻度
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = maxValue / 3;
    for (let i = 0; i <= 3; i++) ticks.push(Math.round(step * i));
    return ticks;
  }, [maxValue]);

  // X 轴刻度（显示 4-5 个标签）
  const xTicks = useMemo(() => {
    if (fullData.length === 0) return [];
    const first = fullData[0].day;
    const last = fullData[fullData.length - 1].day;
    const range = last - first;
    if (range <= 7) return fullData.map(p => p.day);
    const step = Math.ceil(range / 4);
    const ticks = [first];
    for (let d = first + step; d < last; d += step) ticks.push(d);
    ticks.push(last);
    return ticks;
  }, [fullData]);

  // 触摸/悬停
  const handleInteraction = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const svgX = ((clientX - rect.left) / rect.width) * width;

    // 找到最近的数据点
    let closest = fullData[0];
    let minDist = Infinity;
    for (const p of fullData) {
      const dist = Math.abs(toX(p.day) - svgX);
      if (dist < minDist) {
        minDist = dist;
        closest = p;
      }
    }
    if (closest) {
      setTooltip({
        x: toX(closest.day),
        y: toY(closest.value),
        day: closest.day,
        amount: formatCurrency(closest.value, config),
        status: closest.isSettled ? 'settled' : 'projected',
      });
    }
  };

  // 时间范围可用性
  const rangeAvailable = (range: TimeRange) => {
    if (range === 'Todo') return true;
    const days = range === '1S' ? 7 : range === '1M' ? 30 : 90;
    return totalDays >= days;
  };

  const gradientId = `earnings-fill-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className={cn('px-4 py-2', className)}>
      {/* SVG 图表 */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          style={{ height: 200 }}
          onMouseMove={handleInteraction}
          onTouchMove={handleInteraction}
          onMouseLeave={() => setTooltip(null)}
          onTouchEnd={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillFrom} />
              <stop offset="100%" stopColor={fillTo} />
            </linearGradient>
          </defs>

          {/* Y 轴刻度线和标签 */}
          {yTicks.map((tick, i) => (
            <g key={`y-${i}`}>
              <line
                x1={padL} y1={toY(tick)} x2={width - padR} y2={toY(tick)}
                stroke="#e7e5e4" strokeWidth="0.5" strokeDasharray="4 4"
              />
              <text x={padL - 6} y={toY(tick) + 3} textAnchor="end" className="fill-neutral-300" fontSize="9" fontFamily="monospace">
                {tick}
              </text>
            </g>
          ))}

          {/* X 轴标签 */}
          {xTicks.map(day => (
            <text key={`x-${day}`} x={toX(day)} y={height - 4} textAnchor="middle" className="fill-neutral-300" fontSize="9" fontFamily="monospace">
              D{day}
            </text>
          ))}

          {/* 已发放面积 */}
          {settledPoints.length > 0 && (
            <m.path
              d={buildAreaPath(settledPoints)}
              fill={`url(#${gradientId})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
            />
          )}

          {/* 已发放线 */}
          {settledPoints.length > 0 && (
            <m.path
              d={buildPath(settledPoints)}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
            />
          )}

          {/* 连接线（已发放到预期） */}
          {connectionPath && (
            <path d={connectionPath} fill="none" stroke="#d6d3d1" strokeWidth="1.5" strokeDasharray="4 3" />
          )}

          {/* 预期虚线 */}
          {projectedPoints.length > 0 && (
            <path
              d={buildPath(projectedPoints)}
              fill="none"
              stroke="#d6d3d1"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              strokeLinecap="round"
            />
          )}

          {/* 今天标记点 */}
          {paidDays > 0 && paidDays <= totalDays && fullData.some(p => p.day === paidDays) && (
            <g>
              <circle cx={toX(paidDays)} cy={toY(fullData.find(p => p.day === paidDays)!.value)} r="4" fill={strokeColor} stroke="white" strokeWidth="2" />
            </g>
          )}

          {/* Tooltip */}
          {tooltip && (
            <g>
              <line x1={tooltip.x} y1={padT} x2={tooltip.x} y2={padT + chartH} stroke="#d6d3d1" strokeWidth="0.5" strokeDasharray="3 3" />
              <circle cx={tooltip.x} cy={tooltip.y} r="4" fill={strokeColor} stroke="white" strokeWidth="2" />
              <rect x={tooltip.x - 50} y={Math.max(tooltip.y - 34, 2)} width="100" height="24" rx="6" fill="#292524" opacity="0.9" />
              <text x={tooltip.x} y={Math.max(tooltip.y - 18, 16)} textAnchor="middle" fill="white" fontSize="10" fontFamily="monospace">
                D{tooltip.day} · {tooltip.amount}
              </text>
            </g>
          )}
        </svg>
      </m.div>

      {/* 时间范围选择器 */}
      <div className="flex justify-center mt-3">
        <div className="inline-flex bg-neutral-100 rounded-lg p-0.5">
          {(['1S', '1M', '3M', 'Todo'] as TimeRange[]).map(range => {
            const available = rangeAvailable(range);
            return (
              <button
                key={range}
                onClick={() => available && setActiveRange(range)}
                disabled={!available}
                className={cn(
                  'relative px-4 py-1.5 text-xs font-medium rounded-md transition-all',
                  activeRange === range
                    ? 'bg-white shadow-sm text-neutral-800 font-semibold'
                    : available
                      ? 'text-neutral-500 hover:text-neutral-700'
                      : 'text-neutral-300 cursor-not-allowed'
                )}
              >
                {range}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function EarningsChartSkeleton() {
  return (
    <div className="px-4 py-2 animate-pulse">
      <div className="h-[200px] bg-neutral-50 rounded-xl flex items-end justify-center p-4">
        <div className="w-full h-3/4 bg-neutral-100/60 rounded-lg" />
      </div>
      <div className="flex justify-center mt-3">
        <div className="h-8 w-48 bg-neutral-100 rounded-lg" />
      </div>
    </div>
  );
}
