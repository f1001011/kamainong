/**
 * @file 用户报表页
 * @description 展示平台用户增长、活跃度、付费转化等核心运营指标
 * @depends 开发文档/04-后台管理端/04.2-数据报表/04.2.2-用户报表页.md
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Row, Col, Card, Table, Spin, Empty, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  RiUserAddLine,
  RiUserHeartLine,
  RiVipCrownLine,
  RiPercentLine,
  RiUserStarLine,
  RiWalletLine,
  RiBankLine,
  RiMoneyDollarCircleLine,
} from '@remixicon/react';
import { Line, Pie, Funnel } from '@ant-design/charts';
import { ReportPageHeader, ReportStatCard } from '@/components/reports';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';
import { formatSystemDate } from '@/utils/timezone';
import { useGlobalConfigStore } from '@/stores/config';
import {
  getUserReport,
  exportUserReport,
  getDateRangeByQuickOption,
} from '@/services/reports';
import type {
  DateRangeParams,
  UserReportResponse,
  UserDailyData,
  VipDistributionItem,
  ChartDataPoint,
} from '@/types/reports';

/**
 * 用户报表页面
 */
export default function UserReportPage() {
  // 状态
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeParams>(() =>
    getDateRangeByQuickOption('last7days')
  );
  const [reportData, setReportData] = useState<UserReportResponse | null>(null);

  // 全局配置
  const { config } = useGlobalConfigStore();

  // 图表引用（使用 any 类型以兼容 @ant-design/charts 的 Plot 类型）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);

  /**
   * 加载报表数据
   */
  const loadReport = useCallback(async (range: DateRangeParams) => {
    setLoading(true);
    try {
      const data = await getUserReport(range);
      setReportData(data);
    } catch (error) {
      console.error('加载用户报表失败:', error);
      message.error('加载报表数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 日期范围变化
   */
  const handleDateRangeChange = useCallback((range: DateRangeParams) => {
    setDateRange(range);
    loadReport(range);
  }, [loadReport]);

  /**
   * 导出Excel
   */
  const handleExportExcel = async () => {
    await exportUserReport(dateRange);
  };

  /**
   * 导出图表
   */
  const handleExportChart = async () => {
    if (chartRef.current?.downloadImage) {
      chartRef.current.downloadImage();
    }
  };

  // 首次加载
  useEffect(() => {
    loadReport(dateRange);
  }, []);

  // 解构数据
  const summary = reportData?.summary;
  const vipDistribution = reportData?.vipDistribution || [];
  const daily = reportData?.daily || [];

  // 计算总用户数（从 VIP 分布累加）
  const totalUsers = vipDistribution.reduce((sum, item) => sum + item.count, 0);

  /**
   * 准备用户增长趋势图数据
   */
  const trendChartData: ChartDataPoint[] = daily.flatMap((item) => [
    { date: item.date, type: '新增用户', value: item.newUsers },
    { date: item.date, type: '活跃用户', value: item.activeUsers },
    { date: item.date, type: '付费用户', value: item.paidUsers },
  ]);

  /**
   * 趋势图配置 - @ant-design/charts v2.x
   */
  const trendChartConfig = {
    data: trendChartData,
    xField: 'date',
    yField: 'value',
    colorField: 'type',
    color: ['#1890ff', '#52c41a', '#faad14'],
    smooth: true,
    legend: { position: 'top' as const },
    point: { size: 3, shape: 'circle' as const },
    animation: {
      appear: { duration: 300 },
    },
  };

  /**
   * 准备 VIP 等级分布饼图数据
   */
  const pieChartData = vipDistribution.map((item) => ({
    type: item.level === 0 ? '普通用户' : `VIP${item.level}`,
    value: item.count,
  }));

  /**
   * 饼图配置 - @ant-design/charts v2.x
   */
  const pieChartConfig = {
    data: pieChartData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.9,
    innerRadius: 0.6,
    legend: { position: 'right' as const },
    animation: {
      appear: { duration: 300 },
    },
  };

  /**
   * 准备付费转化漏斗图数据
   */
  const funnelData = [
    {
      stage: '注册用户',
      count: totalUsers,
      rate: '100%',
    },
    {
      stage: '活跃用户',
      count: summary?.activeUsers || 0,
      rate: totalUsers > 0 
        ? `${((summary?.activeUsers || 0) / totalUsers * 100).toFixed(1)}%` 
        : '0%',
    },
    {
      stage: '充值用户',
      count: summary?.rechargeUsers || 0,
      rate: totalUsers > 0 
        ? `${((summary?.rechargeUsers || 0) / totalUsers * 100).toFixed(1)}%` 
        : '0%',
    },
    {
      stage: '付费用户',
      count: summary?.paidUsers || 0,
      rate: totalUsers > 0 
        ? `${((summary?.paidUsers || 0) / totalUsers * 100).toFixed(1)}%` 
        : '0%',
    },
  ];

  /**
   * 漏斗图配置 - @ant-design/charts v2.x
   */
  const funnelChartConfig = {
    data: funnelData,
    xField: 'stage',
    yField: 'count',
    legend: false,
    animation: {
      appear: { duration: 300 },
    },
  };

  /**
   * 日报明细表格列配置
   */
  const tableColumns: ColumnsType<UserDailyData> = [
    {
      title: '日期',
      dataIndex: 'date',
      align: 'center',
      width: 120,
      sorter: (a, b) => a.date.localeCompare(b.date),
      defaultSortOrder: 'descend',
      render: (val) => formatSystemDate(val),
    },
    {
      title: '新增用户',
      dataIndex: 'newUsers',
      align: 'right',
      sorter: (a, b) => a.newUsers - b.newUsers,
      render: (val) => formatNumber(val),
    },
    {
      title: '活跃用户',
      dataIndex: 'activeUsers',
      align: 'right',
      sorter: (a, b) => a.activeUsers - b.activeUsers,
      render: (val) => formatNumber(val),
    },
    {
      title: '付费用户',
      dataIndex: 'paidUsers',
      align: 'right',
      sorter: (a, b) => a.paidUsers - b.paidUsers,
      render: (val) => formatNumber(val),
    },
  ];

  /**
   * 计算表格合计
   */
  const tableSummary = () => {
    const totalNew = daily.reduce((sum, item) => sum + item.newUsers, 0);
    const totalActive = daily.reduce((sum, item) => sum + item.activeUsers, 0);
    const totalPaid = daily.reduce((sum, item) => sum + item.paidUsers, 0);

    return (
      <Table.Summary.Row className="table-summary-row">
        <Table.Summary.Cell index={0} align="center">
          <strong>合计</strong>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={1} align="right">
          <strong>{formatNumber(totalNew)}</strong>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={2} align="right">
          <strong>{formatNumber(totalActive)}</strong>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={3} align="right">
          <strong>{formatNumber(totalPaid)}</strong>
        </Table.Summary.Cell>
      </Table.Summary.Row>
    );
  };

  return (
    <div className="report-page user-report-page">
      {/* 页面头部 */}
      <ReportPageHeader
        title="用户报表"
        onDateRangeChange={handleDateRangeChange}
        onExportExcel={handleExportExcel}
        onExportChart={handleExportChart}
        estimatedRows={daily.length}
        loading={loading}
        excelOnly={false}
      />

      <Spin spinning={loading}>
        {/* 核心指标卡片区 - 第一行 */}
        <Row gutter={[24, 24]} className="report-section">
          <Col xs={24} sm={12} lg={6}>
            <ReportStatCard
              title="新增用户"
              value={formatNumber(summary?.newUsers || 0)}
              suffix="人"
              icon={<RiUserAddLine size={28} />}
              color="#1890ff"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <ReportStatCard
              title="活跃用户"
              value={formatNumber(summary?.activeUsers || 0)}
              suffix="人"
              icon={<RiUserHeartLine size={28} />}
              color="#52c41a"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <ReportStatCard
              title="付费用户"
              value={formatNumber(summary?.paidUsers || 0)}
              suffix="人"
              icon={<RiVipCrownLine size={28} />}
              color="#faad14"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <ReportStatCard
              title="付费转化率"
              value={formatPercent(summary?.conversionRate)}
              icon={<RiPercentLine size={28} />}
              color="#722ed1"
              loading={loading}
              tooltip="付费用户 / 新增用户"
            />
          </Col>
        </Row>

        {/* 核心指标卡片区 - 第二行 */}
        <Row gutter={[24, 24]} className="report-section">
          <Col xs={24} sm={12} lg={6}>
            <ReportStatCard
              title="新增付费用户"
              value={formatNumber(summary?.newPaidUsers || 0)}
              suffix="人"
              icon={<RiUserStarLine size={28} />}
              color="#eb2f96"
              loading={loading}
              tooltip="首次购买产品的用户"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <ReportStatCard
              title="充值用户"
              value={formatNumber(summary?.rechargeUsers || 0)}
              suffix="人"
              icon={<RiWalletLine size={28} />}
              color="#13c2c2"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <ReportStatCard
              title="提现用户"
              value={formatNumber(summary?.withdrawUsers || 0)}
              suffix="人"
              icon={<RiBankLine size={28} />}
              color="#a0d911"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <ReportStatCard
              title="人均充值"
              value={formatNumber(Number(summary?.avgRechargePerUser || 0))}
              prefix={<span className="currency-symbol">{config.currencySymbol}</span>}
              icon={<RiMoneyDollarCircleLine size={28} />}
              color="#f5222d"
              loading={loading}
              tooltip="充值总额 / 充值用户数"
            />
          </Col>
        </Row>

        {/* 图表展示区 */}
        <Row gutter={[24, 24]} className="report-section">
          {/* 用户增长趋势图 */}
          <Col xs={24} xl={14}>
            <Card title="用户增长趋势" className="chart-card">
              <div className="chart-container">
                {daily.length > 0 ? (
                  <Line {...trendChartConfig} onReady={(plot) => { chartRef.current = plot; }} />
                ) : (
                  <Empty description="暂无数据" />
                )}
              </div>
            </Card>
          </Col>

          {/* VIP 等级分布饼图 */}
          <Col xs={24} xl={10}>
            <Card title="用户等级分布" className="chart-card">
              <div className="chart-container">
                {vipDistribution.length > 0 ? (
                  <Pie {...pieChartConfig} />
                ) : (
                  <Empty description="暂无数据" />
                )}
              </div>
            </Card>
          </Col>
        </Row>

        {/* 付费转化漏斗图 */}
        <Card title="付费转化漏斗" className="report-section chart-card">
          <div className="chart-container funnel-chart">
            {totalUsers > 0 ? (
              <Funnel {...funnelChartConfig} />
            ) : (
              <Empty description="暂无数据" />
            )}
          </div>
        </Card>

        {/* 日报明细表格 */}
        <Card title="日报明细" className="report-section chart-card">
          <Table
            columns={tableColumns}
            dataSource={daily}
            rowKey="date"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            scroll={{ x: 500 }}
            summary={tableSummary}
            size="middle"
          />
        </Card>
      </Spin>
    </div>
  );
}
