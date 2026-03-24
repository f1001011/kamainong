/**
 * @file 用户增长趋势图组件
 * @description 双轴图展示新增用户（柱状图）和活跃用户（折线图）
 * @depends 开发文档/04-后台管理端/04.1.1-仪表盘页.md - 第 4.4.3 节
 */

'use client';

import React, { useMemo } from 'react';
import { Card, Segmented, Skeleton, Empty } from 'antd';
import { DualAxes } from '@ant-design/charts';
import type { TrendData, TrendRange } from '@/types/dashboard';

interface UserTrendChartProps {
  /** 趋势数据 */
  data: TrendData | null;
  /** 当前范围 */
  range: TrendRange;
  /** 是否加载中 */
  loading?: boolean;
  /** 范围变更回调 */
  onRangeChange?: (range: TrendRange) => void;
}

/**
 * 用户增长趋势双轴图
 */
export function UserTrendChart({
  data,
  range,
  loading,
  onRangeChange,
}: UserTrendChartProps) {
  // 处理范围切换
  const handleRangeChange = (value: string | number) => {
    onRangeChange?.(value as TrendRange);
  };

  // 转换数据格式
  const chartData = useMemo(() => {
    if (!data) return [];

    return data.dates.map((date, index) => ({
      date: date.slice(5), // 只显示 MM-DD
      newUsers: data.newUsers[index] || 0,
      activeUsers: data.activeUsers[index] || 0,
    }));
  }, [data]);

  // 双轴图配置 - @ant-design/charts v2.x 使用 G2 5.x 语法
  const config = {
    data: [chartData, chartData],
    xField: 'date',
    yField: ['newUsers', 'activeUsers'],
    geometryOptions: [
      {
        geometry: 'column',
        color: '#5B8FF9',
        columnWidthRatio: 0.4,
        columnStyle: {
          radius: [4, 4, 0, 0],
        },
      },
      {
        geometry: 'line',
        color: '#5AD8A6',
        lineStyle: {
          lineWidth: 2,
        },
        point: {
          size: 4,
          shape: 'circle',
          style: {
            fill: '#5AD8A6',
            stroke: '#fff',
            lineWidth: 1,
          },
        },
        smooth: true,
      },
    ],
    legend: {
      position: 'top-right' as const,
    },
    animation: {
      appear: {
        animation: 'fade-in',
        duration: 800,
      },
    },
  };

  return (
    <Card
      title="用户增长趋势"
      variant="borderless"
      extra={
        <Segmented
          value={range}
          onChange={handleRangeChange}
          options={[
            { label: '近7天', value: '7d' },
            { label: '近30天', value: '30d' },
          ]}
        />
      }
      className="dashboard-chart-card"
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : chartData.length > 0 ? (
        <div style={{ height: 320 }}>
          <DualAxes {...config} />
        </div>
      ) : (
        <Empty description="暂无数据" style={{ height: 320, paddingTop: 100 }} />
      )}
    </Card>
  );
}

export default UserTrendChart;
