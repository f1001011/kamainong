/**
 * @file 财务报表页
 * @description 展示平台资金流入流出的全貌视图
 * @depends 开发文档/04-后台管理端/04.2-数据报表/04.2.1-财务报表页.md
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Row, Col, Card, Table, Tabs, Descriptions, Divider, Spin, Empty, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  RiExchangeFundsLine,
  RiMoneyDollarCircleLine,
  RiExchangeDollarLine,
  RiLineChartLine,
  RiArrowDownCircleLine,
  RiArrowUpCircleLine,
} from '@remixicon/react';
import { Line, Column } from '@ant-design/charts';
import { ReportPageHeader, ReportStatCard } from '@/components/reports';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';
import { formatSystemDate } from '@/utils/timezone';
import { useGlobalConfigStore } from '@/stores/config';
import {
  getFinancialReport,
  exportFinancialReport,
  calculateTrend,
  getDateRangeByQuickOption,
} from '@/services/reports';
import type {
  DateRangeParams,
  FinancialReportResponse,
  FinancialSummary,
  FinancialDailyData,
  ChartDataPoint,
} from '@/types/reports';

/**
 * 财务报表页面
 */
export default function FinancialReportPage() {
  // 状态
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeParams>(() => 
    getDateRangeByQuickOption('last7days')
  );
  const [reportData, setReportData] = useState<FinancialReportResponse | null>(null);
  const [activeChartTab, setActiveChartTab] = useState('trend');

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
      const data = await getFinancialReport(range);
      setReportData(data);
    } catch (error) {
      console.error('加载财务报表失败:', error);
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
    await exportFinancialReport(dateRange);
  };

  /**
   * 导出图表
   */
  const handleExportChart = async () => {
    if (chartRef.current?.downloadImage) {
      chartRef.current.downloadImage();
    }
  };

  /**
   * 打印报表
   */
  const handlePrint = () => {
    window.print();
  };

  // 首次加载
  useEffect(() => {
    loadReport(dateRange);
  }, []);

  // 解构数据
  const summary = reportData?.summary;
  const daily = reportData?.daily || [];

  // 计算收入小计（充值 + 提现手续费收入 - 通道代收手续费）
  const incomeTotal = summary
    ? Number(summary.rechargeAmount) + Number(summary.withdrawFee) - Number(summary.channelPayFee || 0)
    : 0;

  /**
   * 准备趋势图数据
   */
  const trendChartData: ChartDataPoint[] = daily.flatMap((item) => [
    { date: item.date, type: '充值', value: Number(item.rechargeAmount) },
    { date: item.date, type: '提现', value: Number(item.withdrawAmount) },
    { date: item.date, type: '净入金', value: Number(item.netInflow) },
  ]);

  /**
   * 准备充提对比图数据
   */
  const comparisonChartData = daily.flatMap((item) => [
    { date: item.date, type: '充值', value: Number(item.rechargeAmount) },
    { date: item.date, type: '提现', value: Number(item.withdrawAmount) },
  ]);

  /**
   * 趋势图配置 - @ant-design/charts v2.x
   */
  const trendChartConfig = {
    data: trendChartData,
    xField: 'date',
    yField: 'value',
    colorField: 'type',
    color: ['#1890ff', '#faad14', '#52c41a'],
    smooth: true,
    legend: { position: 'top-right' as const },
    animation: {
      appear: { duration: 300 },
    },
  };

  /**
   * 充提对比图配置 - @ant-design/charts v2.x
   */
  const comparisonChartConfig = {
    data: comparisonChartData,
    xField: 'date',
    yField: 'value',
    colorField: 'type',
    group: true,
    color: ['#1890ff', '#faad14'],
    legend: { position: 'top-right' as const },
    animation: {
      appear: { duration: 300 },
    },
  };

  /**
   * 日报明细表格列配置
   */
  const tableColumns: ColumnsType<FinancialDailyData> = [
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
      title: '充值金额',
      dataIndex: 'rechargeAmount',
      align: 'right',
      sorter: (a, b) => Number(a.rechargeAmount) - Number(b.rechargeAmount),
      render: (val) => formatCurrency(val),
    },
    {
      title: '充值笔数',
      dataIndex: 'rechargeCount',
      align: 'right',
      sorter: (a, b) => a.rechargeCount - b.rechargeCount,
      render: (val) => formatNumber(val),
    },
    {
      title: '提现金额',
      dataIndex: 'withdrawAmount',
      align: 'right',
      sorter: (a, b) => Number(a.withdrawAmount) - Number(b.withdrawAmount),
      render: (val) => formatCurrency(val),
    },
    {
      title: '提现笔数',
      dataIndex: 'withdrawCount',
      align: 'right',
      sorter: (a, b) => a.withdrawCount - b.withdrawCount,
      render: (val) => formatNumber(val),
    },
    {
      title: '净入金',
      dataIndex: 'netInflow',
      align: 'right',
      sorter: (a, b) => Number(a.netInflow) - Number(b.netInflow),
      render: (val) => (
        <span style={{ color: Number(val) >= 0 ? '#52c41a' : '#ff4d4f', fontWeight: 500 }}>
          {formatCurrency(val)}
        </span>
      ),
    },
  ];

  /**
   * 计算表格合计
   */
  const tableSummary = () => {
    const totalRecharge = daily.reduce((sum, item) => sum + Number(item.rechargeAmount), 0);
    const totalRechargeCount = daily.reduce((sum, item) => sum + item.rechargeCount, 0);
    const totalWithdraw = daily.reduce((sum, item) => sum + Number(item.withdrawAmount), 0);
    const totalWithdrawCount = daily.reduce((sum, item) => sum + item.withdrawCount, 0);
    const totalNet = daily.reduce((sum, item) => sum + Number(item.netInflow), 0);

    return (
      <Table.Summary.Row className="table-summary-row">
        <Table.Summary.Cell index={0} align="center">
          <strong>合计</strong>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={1} align="right">
          <strong>{formatCurrency(totalRecharge)}</strong>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={2} align="right">
          <strong>{formatNumber(totalRechargeCount)}</strong>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={3} align="right">
          <strong>{formatCurrency(totalWithdraw)}</strong>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={4} align="right">
          <strong>{formatNumber(totalWithdrawCount)}</strong>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={5} align="right">
          <strong style={{ color: totalNet >= 0 ? '#52c41a' : '#ff4d4f' }}>
            {formatCurrency(totalNet)}
          </strong>
        </Table.Summary.Cell>
      </Table.Summary.Row>
    );
  };

  return (
    <div className="report-page financial-report-page">
      {/* 页面头部 */}
      <ReportPageHeader
        title="财务报表"
        onDateRangeChange={handleDateRangeChange}
        onExportExcel={handleExportExcel}
        onExportChart={handleExportChart}
        onPrint={handlePrint}
        estimatedRows={daily.length}
        loading={loading}
        excelOnly={false}
      />

      <Spin spinning={loading}>
        {/* 核心指标卡片区 */}
        <Row gutter={[24, 24]} className="report-section">
          <Col xs={24} sm={12} lg={6}>
            <ReportStatCard
              title="净入金"
              value={formatNumber(Number(summary?.netInflow || 0))}
              prefix={<span className="currency-symbol">{config.currencySymbol}</span>}
              icon={<RiExchangeFundsLine size={28} />}
              color={Number(summary?.netInflow || 0) >= 0 ? '#52c41a' : '#ff4d4f'}
              valueColor={Number(summary?.netInflow || 0) >= 0 ? '#52c41a' : '#ff4d4f'}
              loading={loading}
              tooltip="(充值 - 代收手续费) - (提现 + 代付手续费)"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <ReportStatCard
              title="充值总额"
              value={formatNumber(Number(summary?.rechargeAmount || 0))}
              prefix={<span className="currency-symbol">{config.currencySymbol}</span>}
              icon={<RiMoneyDollarCircleLine size={28} />}
              color="#1890ff"
              loading={loading}
              footer={
                <span style={{ fontSize: 12, color: '#999' }}>
                  {summary?.rechargeCount || 0} 笔
                </span>
              }
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <ReportStatCard
              title="提现总额"
              value={formatNumber(Number(summary?.withdrawAmount || 0))}
              prefix={<span className="currency-symbol">{config.currencySymbol}</span>}
              icon={<RiExchangeDollarLine size={28} />}
              color="#faad14"
              loading={loading}
              footer={
                <span style={{ fontSize: 12, color: '#999' }}>
                  {summary?.withdrawCount || 0} 笔
                </span>
              }
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <ReportStatCard
              title="理论利润"
              value={formatNumber(Number(summary?.theoreticalProfit || 0))}
              prefix={<span className="currency-symbol">{config.currencySymbol}</span>}
              icon={<RiLineChartLine size={28} />}
              color="#722ed1"
              valueColor={Number(summary?.theoreticalProfit || 0) >= 0 ? '#52c41a' : '#ff4d4f'}
              loading={loading}
              tooltip="净入金 - 其他支出(收益+返佣+签到+活动+注册)"
            />
          </Col>
        </Row>

        {/* 收支明细卡片区 */}
        <Row gutter={[24, 24]} className="report-section">
          {/* 收入项 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <span className="card-title-income">
                  <RiArrowDownCircleLine size={18} style={{ marginRight: 8 }} />
                  收入项
                </span>
              }
              className="income-expense-card income-card"
            >
              <Descriptions column={1} size="small" colon={false}>
                <Descriptions.Item label="充值总额">
                  {formatCurrency(summary?.rechargeAmount)} ({summary?.rechargeCount || 0}笔)
                </Descriptions.Item>
                <Descriptions.Item label="充值成功率">
                  {formatPercent(summary?.rechargeSuccessRate)}
                </Descriptions.Item>
                <Descriptions.Item label="提现手续费收入">
                  {formatCurrency(summary?.withdrawFee)}
                </Descriptions.Item>
                <Descriptions.Item label={
                  <span style={{ color: '#ff4d4f' }}>通道代收手续费</span>
                }>
                  <span style={{ color: '#ff4d4f' }}>
                    -{formatCurrency(summary?.channelPayFee || '0')}
                  </span>
                </Descriptions.Item>
              </Descriptions>
              <Divider style={{ margin: '16px 0' }} />
              <div className="income-expense-total">
                <span>收入小计</span>
                <span className="total-amount income-amount">
                  {formatCurrency(incomeTotal)}
                </span>
              </div>
            </Card>
          </Col>

          {/* 支出项 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <span className="card-title-expense">
                  <RiArrowUpCircleLine size={18} style={{ marginRight: 8 }} />
                  支出项
                </span>
              }
              className="income-expense-card expense-card"
            >
              <Descriptions column={1} size="small" colon={false}>
                <Descriptions.Item label="收益发放">
                  {formatCurrency(summary?.incomeAmount)}
                </Descriptions.Item>
                <Descriptions.Item label="返佣发放">
                  {formatCurrency(summary?.commissionAmount)}
                </Descriptions.Item>
                <Descriptions.Item label="签到奖励">
                  {formatCurrency(summary?.signInRewardAmount)}
                </Descriptions.Item>
                <Descriptions.Item label="活动奖励">
                  {formatCurrency(summary?.activityRewardAmount)}
                </Descriptions.Item>
                <Descriptions.Item label="注册奖励">
                  {formatCurrency(summary?.registerBonusAmount)}
                </Descriptions.Item>
                <Descriptions.Item label={
                  <span style={{ color: '#fa8c16' }}>
                    通道代付手续费
                    <span style={{ fontSize: 11, color: '#999', marginLeft: 4 }}>(已含于净入金)</span>
                  </span>
                }>
                  <span style={{ color: '#fa8c16' }}>
                    {formatCurrency(summary?.channelTransferFee || '0')}
                  </span>
                </Descriptions.Item>
              </Descriptions>
              <Divider style={{ margin: '16px 0' }} />
              <div className="income-expense-total">
                <span>支出小计</span>
                <span className="total-amount expense-amount">
                  {formatCurrency(summary?.totalExpense)}
                </span>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 趋势图表区 */}
        <Card className="report-section chart-section chart-card">
          <Tabs
            activeKey={activeChartTab}
            onChange={setActiveChartTab}
            items={[
              {
                key: 'trend',
                label: '资金趋势',
                children: (
                  <div className="chart-container">
                    {daily.length > 0 ? (
                      <Line {...trendChartConfig} onReady={(plot) => { chartRef.current = plot; }} />
                    ) : (
                      <Empty description="暂无数据" />
                    )}
                  </div>
                ),
              },
              {
                key: 'comparison',
                label: '充提对比',
                children: (
                  <div className="chart-container">
                    {daily.length > 0 ? (
                      <Column {...comparisonChartConfig} />
                    ) : (
                      <Empty description="暂无数据" />
                    )}
                  </div>
                ),
              },
            ]}
          />
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
            scroll={{ x: 800 }}
            summary={tableSummary}
            size="middle"
          />
        </Card>
      </Spin>
    </div>
  );
}
