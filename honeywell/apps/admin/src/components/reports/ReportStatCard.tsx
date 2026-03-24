/**
 * @file 报表统计卡片组件
 * @description 报表页面的核心指标卡片，支持趋势显示和迷你图
 * @depends 开发文档/04-后台管理端/04.2-数据报表/ - 统计卡片设计
 */

'use client';

import React from 'react';
import { Card, Typography, Space, Skeleton, Tooltip } from 'antd';
import { RiArrowUpLine, RiArrowDownLine, RiSubtractLine } from '@remixicon/react';
import type { TrendChange } from '@/types/reports';

const { Text } = Typography;

interface ReportStatCardProps {
  /** 卡片标题 */
  title: string;
  /** 主要数值 */
  value: string | number;
  /** 值的前缀（如货币符号） */
  prefix?: React.ReactNode;
  /** 值的后缀（如单位） */
  suffix?: React.ReactNode;
  /** 图标 */
  icon?: React.ReactNode;
  /** 图标背景色 */
  color?: string;
  /** 趋势变化 */
  trend?: TrendChange;
  /** 趋势对比说明 */
  trendLabel?: string;
  /** 底部附加信息 */
  footer?: React.ReactNode;
  /** 是否加载中 */
  loading?: boolean;
  /** 点击事件 */
  onClick?: () => void;
  /** 提示文字 */
  tooltip?: string;
  /** 自定义类名 */
  className?: string;
  /** 值的颜色 */
  valueColor?: string;
}

/**
 * 报表统计卡片
 * @description 展示核心指标数值和趋势变化
 */
export function ReportStatCard({
  title,
  value,
  prefix,
  suffix,
  icon,
  color = '#1677ff',
  trend,
  trendLabel = '较上期',
  footer,
  loading = false,
  onClick,
  tooltip,
  className,
  valueColor,
}: ReportStatCardProps) {
  // 加载状态
  if (loading) {
    return (
      <Card className={`report-stat-card ${className || ''}`} variant="borderless">
        <Skeleton active paragraph={{ rows: 2 }} />
      </Card>
    );
  }

  // 趋势图标和颜色
  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.trend) {
      case 'up':
        return <RiArrowUpLine size={14} className="trend-icon trend-icon-up" />;
      case 'down':
        return <RiArrowDownLine size={14} className="trend-icon trend-icon-down" />;
      default:
        return <RiSubtractLine size={14} className="trend-icon trend-icon-flat" />;
    }
  };

  const getTrendClass = () => {
    if (!trend) return '';
    return `trend-${trend.trend}`;
  };

  const cardContent = (
    <Card
      className={`report-stat-card ${className || ''}`}
      variant="borderless"
      onClick={onClick}
      hoverable={!!onClick}
    >
      <div className="stat-card-content">
        {/* 左侧信息 */}
        <div className="stat-card-info">
          {/* 标题 */}
          <Text type="secondary" className="stat-card-title">
            {title}
          </Text>

          {/* 主数值 */}
          <div className="stat-card-value" style={valueColor ? { color: valueColor } : undefined}>
            {prefix && <span className="stat-card-prefix">{prefix}</span>}
            <span className="stat-card-number">{value}</span>
            {suffix && <span className="stat-card-suffix">{suffix}</span>}
          </div>

          {/* 趋势变化 */}
          {trend && (
            <div className={`stat-card-trend ${getTrendClass()}`}>
              <Space size={4}>
                {getTrendIcon()}
                <span className="trend-text">{trend.text}</span>
                <Text type="secondary" className="trend-label">
                  {trendLabel}
                </Text>
              </Space>
            </div>
          )}

          {/* 底部附加信息 */}
          {footer && <div className="stat-card-footer">{footer}</div>}
        </div>

        {/* 右侧图标 */}
        {icon && (
          <div
            className="stat-card-icon"
            style={{
              background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
              color: color,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );

  // 带 Tooltip 的卡片
  if (tooltip) {
    return <Tooltip title={tooltip}>{cardContent}</Tooltip>;
  }

  return cardContent;
}

/**
 * 统计卡片组容器
 */
interface StatCardGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function StatCardGroup({ children, className }: StatCardGroupProps) {
  return <div className={`stat-card-group ${className || ''}`}>{children}</div>;
}

export default ReportStatCard;
