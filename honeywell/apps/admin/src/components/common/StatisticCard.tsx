/**
 * @file 统计卡片组件
 * @description 用于展示关键指标的统计卡片，支持趋势、迷你图表等
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第11节 - 常用组件规范
 */

'use client';

import React from 'react';
import { Card, Skeleton, Typography, Space, Tooltip } from 'antd';
import { RiArrowUpLine, RiArrowDownLine, RiInformationLine } from '@remixicon/react';
import { formatCurrency, formatNumber } from '@/utils/format';

const { Text, Title } = Typography;

/**
 * 趋势类型
 */
export interface TrendInfo {
  /** 趋势值（百分比，如 12.5 表示 12.5%） */
  value: number;
  /** 趋势类型 */
  type?: 'up' | 'down';
  /** 趋势描述（如"同比"、"环比"） */
  label?: string;
}

/**
 * 迷你图表数据
 */
export interface MiniChartData {
  /** 数据点 */
  data: number[];
  /** 图表颜色 */
  color?: string;
}

export interface StatisticCardProps {
  /** 标题 */
  title: string;
  /** 数值 */
  value: number | string;
  /** 前缀图标 */
  prefix?: React.ReactNode;
  /** 后缀单位（支持文本或 React 元素） */
  suffix?: React.ReactNode;
  /** 趋势信息 */
  trend?: TrendInfo;
  /** 是否为金额类型 */
  isCurrency?: boolean;
  /** 加载状态 */
  loading?: boolean;
  /** 尺寸 */
  size?: 'default' | 'large';
  /** 数值样式 */
  valueStyle?: React.CSSProperties;
  /** 迷你图表 */
  miniChart?: MiniChartData;
  /** 提示信息 */
  tooltip?: string;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 点击回调 */
  onClick?: () => void;
}

/**
 * 绘制简单的迷你折线图（SVG）
 */
function MiniLineChart({ data, color = '#1677ff' }: MiniChartData) {
  if (!data || data.length < 2) return null;

  const width = 80;
  const height = 32;
  const padding = 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // 计算点位置
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {/* 渐变填充 */}
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* 填充区域 */}
      <polygon
        points={`${padding},${height - padding} ${points.join(' ')} ${width - padding},${height - padding}`}
        fill={`url(#gradient-${color.replace('#', '')})`}
      />
      {/* 折线 */}
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 统计卡片组件
 * @description 用于展示关键指标，支持趋势显示和迷你图表
 * @example
 * <StatisticCard
 *   title="今日充值"
 *   value={12500}
 *   isCurrency
 *   prefix={<RiMoneyDollarCircleLine />}
 *   trend={{ value: 12.5, type: 'up', label: '同比' }}
 *   suffix="笔"
 * />
 */
export function StatisticCard({
  title,
  value,
  prefix,
  suffix,
  trend,
  isCurrency = false,
  loading = false,
  size = 'default',
  valueStyle,
  miniChart,
  tooltip,
  className,
  style,
  onClick,
}: StatisticCardProps) {
  // 尺寸配置 - 使用设计系统间距
  const sizeConfig = {
    default: {
      padding: 'var(--card-padding-sm, 16px) var(--spacing-lg, 20px)',
      titleSize: 14,
      valueSize: 28,
      iconSize: 20,
      trendSize: 12,
      gap: 'var(--spacing-sm, 12px)',
    },
    large: {
      padding: 'var(--card-padding, 24px)',
      titleSize: 15,
      valueSize: 36,
      iconSize: 24,
      trendSize: 13,
      gap: 'var(--spacing-md, 16px)',
    },
  };

  const config = sizeConfig[size];

  // 格式化数值
  const displayValue = isCurrency
    ? formatCurrency(value)
    : typeof value === 'number'
    ? formatNumber(value)
    : value;

  // 趋势颜色和图标
  const getTrendConfig = () => {
    if (!trend) return null;

    const isUp = trend.type === 'up' || (trend.type === undefined && trend.value > 0);
    const isDown = trend.type === 'down' || (trend.type === undefined && trend.value < 0);

    return {
      color: isUp ? '#52c41a' : isDown ? '#ff4d4f' : '#8c8c8c',
      icon: isUp ? (
        <RiArrowUpLine size={config.trendSize} />
      ) : isDown ? (
        <RiArrowDownLine size={config.trendSize} />
      ) : null,
      value: Math.abs(trend.value).toFixed(1),
    };
  };

  const trendConfig = getTrendConfig();

  return (
    <Card
      className={`stat-card-component ${className || ''}`}
      style={{
        borderRadius: 'var(--radius-lg, 12px)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.04))',
        border: '1px solid var(--border-light, #f0f0f0)',
        ...style,
      }}
      styles={{
        body: {
          padding: config.padding,
        },
      }}
      hoverable={!!onClick}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = 'var(--shadow-hover, 0 6px 16px rgba(0, 0, 0, 0.1), 0 12px 32px rgba(0, 0, 0, 0.08))';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = 'var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.04))';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} />
      ) : (
        <>
          {/* 标题行 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <Space size={8}>
              {prefix && (
                <span
                  style={{
                    color: '#8c8c8c',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {prefix}
                </span>
              )}
              <Text
                type="secondary"
                style={{
                  fontSize: config.titleSize,
                }}
              >
                {title}
              </Text>
              {tooltip && (
                <Tooltip title={tooltip}>
                  <RiInformationLine
                    size={14}
                    style={{ color: '#bfbfbf', cursor: 'help' }}
                  />
                </Tooltip>
              )}
            </Space>

            {/* 迷你图表 */}
            {miniChart && <MiniLineChart {...miniChart} />}
          </div>

          {/* 数值行 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: config.valueSize,
                fontWeight: 600,
                color: '#262626',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1.2,
                ...valueStyle,
              }}
            >
              {displayValue}
            </span>

            {suffix && (
              <Text
                type="secondary"
                style={{
                  fontSize: config.titleSize,
                }}
              >
                {suffix}
              </Text>
            )}
          </div>

          {/* 趋势行 */}
          {trendConfig && (
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span
                style={{
                  color: trendConfig.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  fontSize: config.trendSize,
                  fontWeight: 500,
                }}
              >
                {trendConfig.icon}
                {trendConfig.value}%
              </span>
              {trend?.label && (
                <Text
                  type="secondary"
                  style={{
                    fontSize: config.trendSize,
                  }}
                >
                  {trend.label}
                </Text>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

/**
 * 统计卡片组（横向排列）
 */
export function StatisticCardGroup({
  children,
  columns = 4,
  gap = 16,
  className,
  style,
}: {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default StatisticCard;
