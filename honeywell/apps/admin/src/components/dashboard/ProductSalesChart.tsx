/**
 * @file 产品销量分布饼图组件
 * @description 展示各产品销售金额占比
 * @depends 开发文档/04-后台管理端/04.1.1-仪表盘页.md - 第 4.4.4 节
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Segmented, Skeleton, Empty } from 'antd';
import { Pie } from '@ant-design/charts';
import type { TrendRange } from '@/types/dashboard';
import { useGlobalConfigStore } from '@/stores/config';
import { get } from '@/utils/request';

interface ProductSalesData {
  productId: number;
  productName: string;
  productSeries: string;
  salesCount: number;
  salesAmount: string;
  salesPercent: string;
}

interface ProductReportResponse {
  list: ProductSalesData[];
  summary: {
    totalSalesCount: number;
    totalSalesAmount: string;
  };
}

interface ProductSalesChartProps {
  /** 是否加载中（外部控制） */
  externalLoading?: boolean;
}

/**
 * 产品销量分布饼图
 */
export function ProductSalesChart({ externalLoading }: ProductSalesChartProps) {
  const [range, setRange] = useState<TrendRange>('7d');
  const [data, setData] = useState<ProductSalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const { config } = useGlobalConfigStore();

  // 获取产品销量数据
  const fetchData = useCallback(async (range: TrendRange) => {
    setLoading(true);
    try {
      // 计算日期范围
      const endDate = new Date().toISOString().split('T')[0];
      const days = range === '7d' ? 7 : 30;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const result = await get<ProductReportResponse>('/reports/products', {
        startDate,
        endDate,
      });

      if (result?.list) {
        setData(result.list);
      }
    } catch (error) {
      console.error('获取产品销量数据失败:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载和范围变更时获取数据
  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  // 处理范围切换
  const handleRangeChange = (value: string | number) => {
    setRange(value as TrendRange);
  };

  // 转换为饼图数据
  const chartData = useMemo(() => {
    return data
      .filter(item => Number(item.salesAmount) > 0)
      .map(item => ({
        productName: item.productName,
        salesAmount: Number(item.salesAmount),
        percent: Number(item.salesPercent),
      }));
  }, [data]);

  // 计算总销售额
  const totalSales = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.salesAmount, 0);
  }, [chartData]);

  // 饼图配置 - @ant-design/charts v2.x
  const pieConfig = {
    data: chartData,
    angleField: 'salesAmount',
    colorField: 'productName',
    radius: 0.8,
    innerRadius: 0.5,
    legend: {
      position: 'right' as const,
    },
    animation: {
      appear: {
        animation: 'fade-in',
        duration: 800,
      },
    },
  };

  const isLoading = loading || externalLoading;

  return (
    <Card
      title="产品销量分布"
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
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : chartData.length > 0 ? (
        <div style={{ height: 320 }}>
          <Pie {...pieConfig} />
        </div>
      ) : (
        <Empty description="暂无销售数据" style={{ height: 320, paddingTop: 100 }} />
      )}
    </Card>
  );
}

export default ProductSalesChart;
