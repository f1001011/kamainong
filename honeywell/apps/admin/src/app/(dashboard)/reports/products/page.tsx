/**
 * @file 产品报表页
 * @description 展示各产品的销售表现，支持按产品系列筛选分析
 * @depends 开发文档/04-后台管理端/04.2-数据报表/04.2.3-产品报表页.md
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Row, Col, Card, Table, Radio, Progress, Tag, Badge, Space, Statistic, Spin, Empty, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  RiShoppingCartLine,
  RiMoneyDollarCircleLine,
  RiTimeLine,
} from '@remixicon/react';
import { Bar, Pie, Column } from '@ant-design/charts';
import { ReportPageHeader, ReportStatCard } from '@/components/reports';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';
import { useGlobalConfigStore } from '@/stores/config';
import {
  getProductReport,
  exportProductReport,
  getDateRangeByQuickOption,
} from '@/services/reports';
import type {
  DateRangeParams,
  ProductReportResponse,
  ProductReportParams,
  ProductSalesItem,
} from '@/types/reports';

/**
 * 产品报表页面
 */
export default function ProductReportPage() {
  // 状态
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeParams>(() =>
    getDateRangeByQuickOption('last7days')
  );
  const [series, setSeries] = useState<'PO' | 'VIP' | ''>('');
  const [reportData, setReportData] = useState<ProductReportResponse | null>(null);

  // 全局配置
  const { config } = useGlobalConfigStore();

  // 图表引用（使用 any 类型以兼容 @ant-design/charts 的 Plot 类型）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);

  /**
   * 加载报表数据
   */
  const loadReport = useCallback(async (range: DateRangeParams, seriesFilter?: 'PO' | 'VIP' | '') => {
    setLoading(true);
    try {
      const params: ProductReportParams = {
        ...range,
        ...(seriesFilter ? { series: seriesFilter as 'PO' | 'VIP' } : {}),
      };
      const data = await getProductReport(params);
      setReportData(data);
    } catch (error) {
      console.error('加载产品报表失败:', error);
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
    loadReport(range, series);
  }, [loadReport, series]);

  /**
   * 系列筛选变化
   */
  const handleSeriesChange = (value: 'PO' | 'VIP' | '') => {
    setSeries(value);
    loadReport(dateRange, value);
  };

  /**
   * 导出Excel
   */
  const handleExportExcel = async () => {
    const params: ProductReportParams = {
      ...dateRange,
      ...(series ? { series: series as 'PO' | 'VIP' } : {}),
    };
    await exportProductReport(params);
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
    loadReport(dateRange, series);
  }, []);

  // 解构数据
  const summary = reportData?.summary;
  const list = reportData?.list || [];

  // 计算待发放收益总额
  const totalPendingIncome = list.reduce(
    (sum, item) => sum + Number(item.pendingIncome),
    0
  );

  // 计算系列占比
  const poPercent = summary
    ? (Number(summary.poSalesAmount) / Number(summary.totalSalesAmount) * 100).toFixed(1)
    : '0';
  const vipPercent = summary
    ? (Number(summary.vipSalesAmount) / Number(summary.totalSalesAmount) * 100).toFixed(1)
    : '0';

  /**
   * 准备销量排行柱状图数据（Top 10）
   * 将 productSeries 转换为中文标签，避免图例 key 冲突
   */
  const barChartData = [...list]
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 10)
    .map((item) => ({
      productName: item.productName,
      salesCount: item.salesCount,
      seriesLabel: item.productSeries === 'VIP' ? 'VIP系列' : 'Po系列',
    }));

  /**
   * 柱状图配置 - @ant-design/charts v2.x
   * 使用 seriesLabel 作为 colorField 以避免图例内部 key 冲突
   */
  const barChartConfig = {
    data: barChartData,
    xField: 'salesCount',
    yField: 'productName',
    colorField: 'seriesLabel',
    color: ['#1890ff', '#faad14'],
    legend: {
      position: 'top-right' as const,
    },
    animation: {
      appear: { duration: 300 },
    },
  };

  /**
   * 准备销售额占比饼图数据（Top 5 + 其他）
   */
  const pieChartData = (() => {
    const sorted = [...list].sort((a, b) => Number(b.salesAmount) - Number(a.salesAmount));
    const top5 = sorted.slice(0, 5);
    const others = sorted.slice(5);
    const othersTotal = others.reduce((sum, item) => sum + Number(item.salesAmount), 0);

    return [
      ...top5.map((item) => ({
        type: item.productName,
        value: Number(item.salesAmount),
      })),
      ...(othersTotal > 0 ? [{ type: '其他', value: othersTotal }] : []),
    ];
  })();

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
   * 系列对比数据
   */
  const comparisonData = [
    {
      series: 'Po系列',
      metric: '销售额',
      value: Number(summary?.poSalesAmount || 0),
    },
    {
      series: 'VIP系列',
      metric: '销售额',
      value: Number(summary?.vipSalesAmount || 0),
    },
    {
      series: 'Po系列',
      metric: '销量',
      value: list.filter((p) => p.productSeries === 'PO').reduce((sum, p) => sum + p.salesCount, 0),
    },
    {
      series: 'VIP系列',
      metric: '销量',
      value: list.filter((p) => p.productSeries === 'VIP').reduce((sum, p) => sum + p.salesCount, 0),
    },
  ];

  /**
   * 对比图配置 - @ant-design/charts v2.x
   */
  const comparisonChartConfig = {
    data: comparisonData,
    xField: 'metric',
    yField: 'value',
    colorField: 'series',
    group: true,
    color: ['#1890ff', '#faad14'],
    legend: { position: 'top' as const },
    animation: {
      appear: { duration: 300 },
    },
  };

  /**
   * 产品销售明细表格列配置
   */
  const tableColumns: ColumnsType<ProductSalesItem> = [
    {
      title: '排名',
      dataIndex: 'index',
      align: 'center',
      width: 60,
      render: (_, __, index) => (
        <Badge
          count={index + 1}
          style={{
            backgroundColor: index < 3 ? '#faad14' : '#d9d9d9',
            fontSize: 12,
          }}
        />
      ),
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      width: 140,
      render: (text, record) => (
        <Space>
          <Tag color={record.productSeries === 'PO' ? 'blue' : 'orange'}>
            {record.productSeries}
          </Tag>
          {text}
        </Space>
      ),
    },
    {
      title: '销量',
      dataIndex: 'salesCount',
      align: 'right',
      sorter: (a, b) => a.salesCount - b.salesCount,
      render: (val) => formatNumber(val),
    },
    {
      title: '销售额',
      dataIndex: 'salesAmount',
      align: 'right',
      sorter: (a, b) => Number(a.salesAmount) - Number(b.salesAmount),
      defaultSortOrder: 'descend',
      render: (val) => formatCurrency(val),
    },
    {
      title: '占比',
      dataIndex: 'salesPercent',
      align: 'right',
      width: 120,
      render: (val) => (
        <Progress
          percent={Number(val)}
          size="small"
          format={(p) => `${p?.toFixed(1)}%`}
          strokeWidth={6}
        />
      ),
    },
    {
      title: '购买用户',
      dataIndex: 'purchaseUsers',
      align: 'right',
      sorter: (a, b) => a.purchaseUsers - b.purchaseUsers,
      render: (val) => formatNumber(val),
    },
    {
      title: '进行中订单',
      dataIndex: 'activeOrders',
      align: 'right',
      render: (val) => formatNumber(val),
    },
    {
      title: '待发放收益',
      dataIndex: 'pendingIncome',
      align: 'right',
      render: (val) => (
        <span style={{ color: '#faad14' }}>{formatCurrency(val)}</span>
      ),
    },
  ];

  /**
   * 计算表格合计
   */
  const tableSummary = (pageData: readonly ProductSalesItem[]) => {
    const totalCount = pageData.reduce((sum, item) => sum + item.salesCount, 0);
    const totalAmount = pageData.reduce((sum, item) => sum + Number(item.salesAmount), 0);
    const totalUsers = pageData.reduce((sum, item) => sum + item.purchaseUsers, 0);
    const totalActive = pageData.reduce((sum, item) => sum + item.activeOrders, 0);
    const totalPending = pageData.reduce((sum, item) => sum + Number(item.pendingIncome), 0);

    return (
      <Table.Summary.Row className="table-summary-row">
        <Table.Summary.Cell index={0} colSpan={2} align="center">
          <strong>合计</strong>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={1} align="right">
          <strong>{formatNumber(totalCount)}</strong>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={2} align="right">
          <strong>{formatCurrency(totalAmount)}</strong>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={3} align="right">
          100%
        </Table.Summary.Cell>
        <Table.Summary.Cell index={4} align="right">
          {formatNumber(totalUsers)}
        </Table.Summary.Cell>
        <Table.Summary.Cell index={5} align="right">
          {formatNumber(totalActive)}
        </Table.Summary.Cell>
        <Table.Summary.Cell index={6} align="right">
          <strong style={{ color: '#faad14' }}>{formatCurrency(totalPending)}</strong>
        </Table.Summary.Cell>
      </Table.Summary.Row>
    );
  };

  /**
   * 额外的筛选组件
   */
  const extraFilter = (
    <Radio.Group
      value={series}
      onChange={(e) => handleSeriesChange(e.target.value)}
      optionType="button"
      buttonStyle="solid"
      disabled={loading}
    >
      <Radio.Button value="">全部</Radio.Button>
      <Radio.Button value="PO">Po系列</Radio.Button>
      <Radio.Button value="VIP">VIP系列</Radio.Button>
    </Radio.Group>
  );

  return (
    <div className="report-page product-report-page">
      {/* 页面头部 */}
      <ReportPageHeader
        title="产品报表"
        onDateRangeChange={handleDateRangeChange}
        onExportExcel={handleExportExcel}
        onExportChart={handleExportChart}
        estimatedRows={list.length}
        loading={loading}
        extra={extraFilter}
        excelOnly={false}
      />

      <Spin spinning={loading}>
        {/* 销售汇总卡片区 */}
        <Row gutter={[24, 24]} className="report-section">
          <Col xs={24} sm={12} lg={8}>
            <ReportStatCard
              title="总销售额"
              value={formatNumber(Number(summary?.totalSalesAmount || 0))}
              prefix={<span className="currency-symbol">{config.currencySymbol}</span>}
              icon={<RiMoneyDollarCircleLine size={28} />}
              color="#1890ff"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <ReportStatCard
              title="总销量"
              value={formatNumber(summary?.totalSalesCount || 0)}
              suffix="笔"
              icon={<RiShoppingCartLine size={28} />}
              color="#52c41a"
              loading={loading}
            />
          </Col>
          <Col xs={24} sm={24} lg={8}>
            <ReportStatCard
              title="待发放收益"
              value={formatNumber(totalPendingIncome)}
              prefix={<span className="currency-symbol">{config.currencySymbol}</span>}
              icon={<RiTimeLine size={28} />}
              color="#faad14"
              loading={loading}
              tooltip="进行中订单的待发放收益总额"
            />
          </Col>
        </Row>

        {/* 系列对比条 */}
        <Card size="small" className="report-section series-comparison-card">
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="Po系列销售额"
                value={Number(summary?.poSalesAmount || 0)}
                prefix={config.currencySymbol}
                suffix={`(${poPercent}%)`}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="VIP系列销售额"
                value={Number(summary?.vipSalesAmount || 0)}
                prefix={config.currencySymbol}
                suffix={`(${vipPercent}%)`}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
          </Row>
          <Progress
            percent={Number(poPercent)}
            success={{ percent: 0 }}
            strokeColor="#1890ff"
            trailColor="#faad14"
            showInfo={false}
            style={{ marginTop: 12 }}
          />
          <Row justify="space-between" style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
            <Col>Po系列 {poPercent}%</Col>
            <Col>VIP系列 {vipPercent}%</Col>
          </Row>
        </Card>

        {/* 图表展示区 */}
        <Row gutter={[24, 24]} className="report-section">
          {/* 产品销量排行 */}
          <Col xs={24} xl={12}>
            <Card title="产品销量排行（Top 10）" className="chart-card">
              <div className="chart-container">
                {barChartData.length > 0 ? (
                  <Bar {...barChartConfig} onReady={(plot) => { chartRef.current = plot; }} />
                ) : (
                  <Empty description="暂无数据" />
                )}
              </div>
            </Card>
          </Col>

          {/* 销售额占比 */}
          <Col xs={24} xl={12}>
            <Card title="产品销售额占比" className="chart-card">
              <div className="chart-container">
                {pieChartData.length > 0 ? (
                  <Pie {...pieChartConfig} />
                ) : (
                  <Empty description="暂无数据" />
                )}
              </div>
            </Card>
          </Col>
        </Row>

        {/* Po系列 vs VIP系列 对比 */}
        <Card title="Po系列 vs VIP系列 对比" className="report-section chart-card">
          <div className="chart-container">
            {comparisonData.length > 0 ? (
              <Column {...comparisonChartConfig} />
            ) : (
              <Empty description="暂无数据" />
            )}
          </div>
        </Card>

        {/* 产品销售明细表格 */}
        <Card title="产品销售明细" className="report-section chart-card">
          <Table
            columns={tableColumns}
            dataSource={list}
            rowKey="productId"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个产品`,
            }}
            scroll={{ x: 1000 }}
            summary={tableSummary}
            size="middle"
          />
        </Card>
      </Spin>
    </div>
  );
}
