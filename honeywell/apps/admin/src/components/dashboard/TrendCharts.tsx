/**
 * @file 趋势图表组件
 * @description 仪表盘中部的充提趋势图表，支持7天/30天切换
 * @depends 开发文档/04-后台管理端/04.1.1-仪表盘页.md - 第 4.4.2 节
 */

'use client';

import React, { useMemo } from 'react';
import { Card, Segmented, Skeleton, Empty } from 'antd';
import { Area } from '@ant-design/charts';
import type { TrendData, TrendRange } from '@/types/dashboard';
import { useGlobalConfigStore } from '@/stores/config';

interface FinanceTrendChartProps {
  /** 趋势数据 */
  trendData: TrendData | null;
  /** 当前范围 */
  range: TrendRange;
  /** 是否加载中 */
  loading?: boolean;
  /** 范围变更回调 */
  onRangeChange?: (range: TrendRange) => void;
}

/**
 * 充提趋势面积图
 * @description 展示充值、提现、净流入三条曲线
 */
export function FinanceTrendChart({
  trendData,
  range,
  loading,
  onRangeChange,
}: FinanceTrendChartProps) {
  const { config } = useGlobalConfigStore();

  // 处理范围切换
  const handleRangeChange = (value: string | number) => {
    onRangeChange?.(value as TrendRange);
  };

  // 转换趋势数据为图表格式
  const areaChartData = useMemo(() => {
    if (!trendData) return [];

    const data: Array<{ date: string; type: string; value: number }> = [];

    trendData.dates.forEach((date, index) => {
      // 格式化日期显示（仅显示月-日）
      const formattedDate = date.slice(5);

      data.push({
        date: formattedDate,
        type: '充值金额',
        value: trendData.recharge[index] || 0,
      });
      data.push({
        date: formattedDate,
        type: '提现金额',
        value: trendData.withdraw[index] || 0,
      });
      data.push({
        date: formattedDate,
        type: '净流入',
        value: trendData.netInflow[index] || 0,
      });
    });

    return data;
  }, [trendData]);

  // 面积图配置 - @ant-design/charts v2.x
  const areaConfig = {
    data: areaChartData,
    xField: 'date',
    yField: 'value',
    colorField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    style: {
      fillOpacity: 0.3,
    },
    color: ['#52c41a', '#ff4d4f', '#1677ff'],
    legend: {
      position: 'top-right' as const,
    },
  };

  return (
    <Card
      title="充提趋势"
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
      ) : areaChartData.length > 0 ? (
        <div style={{ height: 320 }}>
          <Area {...areaConfig} />
        </div>
      ) : (
        <Empty description="暂无数据" style={{ height: 320, paddingTop: 100 }} />
      )}
    </Card>
  );
}

// 为了向后兼容，保留 TrendCharts 作为 FinanceTrendChart 的别名
export const TrendCharts = FinanceTrendChart;
export default FinanceTrendChart;
