/**
 * @file 返佣报表页
 * @description 展示三级分销返佣体系的运营数据
 * @depends 开发文档/04-后台管理端/04.2-数据报表/04.2.4-返佣报表页.md
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Row, Col, Card, Table, Tabs, Radio, Tag, Progress, Space, Statistic, Spin, Empty, message } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  RiMoneyDollarCircleLine,
  RiShoppingCartLine,
  RiUserReceivedLine,
} from '@remixicon/react';
import { Area, Bar } from '@ant-design/charts';
import { ReportPageHeader, ReportStatCard } from '@/components/reports';
import { formatCurrency, formatNumber, maskPhone } from '@/utils/format';
import { formatSystemTime } from '@/utils/timezone';
import { useGlobalConfigStore } from '@/stores/config';
import {
  getCommissionReport,
  getCommissionStats,
  getCommissionList,
  exportCommissionReport,
  getDateRangeByQuickOption,
} from '@/services/reports';
import type {
  DateRangeParams,
  CommissionReportResponse,
  CommissionStatsResponse,
  CommissionRecord,
  CommissionLevel,
  ChartDataPoint,
} from '@/types/reports';

/**
 * 返佣级别标签配置
 */
const levelTagMap: Record<CommissionLevel, { color: string; text: string }> = {
  LEVEL_1: { color: 'blue', text: '一级' },
  LEVEL_2: { color: 'green', text: '二级' },
  LEVEL_3: { color: 'orange', text: '三级' },
};

/**
 * 返佣报表页面
 */
export default function CommissionReportPage() {
  // 状态
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeParams>(() =>
    getDateRangeByQuickOption('last7days')
  );
  const [reportData, setReportData] = useState<CommissionReportResponse | null>(null);
  const [statsData, setStatsData] = useState<CommissionStatsResponse | null>(null);
  const [activeChartTab, setActiveChartTab] = useState('trend');
  const [levelFilter, setLevelFilter] = useState<CommissionLevel | ''>('');
  
  // 明细列表
  const [commissionList, setCommissionList] = useState<CommissionRecord[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

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
      const [reportRes, statsRes] = await Promise.all([
        getCommissionReport(range),
        getCommissionStats(range),
      ]);
      setReportData(reportRes);
      setStatsData(statsRes);
    } catch (error) {
      console.error('加载返佣报表失败:', error);
      message.error('加载报表数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 加载返佣明细列表
   */
  const loadCommissionList = useCallback(async (
    range: DateRangeParams,
    page: number,
    pageSize: number,
    level?: CommissionLevel | ''
  ) => {
    setTableLoading(true);
    try {
      const res = await getCommissionList({
        ...range,
        page,
        pageSize,
        ...(level ? { level } : {}),
      });
      setCommissionList(res.list);
      setPagination({
        current: res.pagination.page,
        pageSize: res.pagination.pageSize,
        total: res.pagination.total,
      });
    } catch (error) {
      console.error('加载返佣明细失败:', error);
      message.error('加载明细数据失败');
    } finally {
      setTableLoading(false);
    }
  }, []);

  /**
   * 日期范围变化
   */
  const handleDateRangeChange = useCallback((range: DateRangeParams) => {
    setDateRange(range);
    loadReport(range);
    loadCommissionList(range, 1, pagination.pageSize, levelFilter);
  }, [loadReport, loadCommissionList, pagination.pageSize, levelFilter]);

  /**
   * 级别筛选变化
   */
  const handleLevelChange = (value: CommissionLevel | '') => {
    setLevelFilter(value);
    loadCommissionList(dateRange, 1, pagination.pageSize, value);
  };

  /**
   * 表格分页变化
   */
  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    loadCommissionList(
      dateRange,
      paginationConfig.current || 1,
      paginationConfig.pageSize || 20,
      levelFilter
    );
  };

  /**
   * 导出Excel
   */
  const handleExportExcel = async () => {
    await exportCommissionReport(dateRange);
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
   * 查看用户详情
   */
  const viewUserDetail = (userId: number) => {
    window.open(`/users/${userId}`, '_blank');
  };

  /**
   * 查看订单详情
   */
  const viewOrderDetail = (orderNo: string) => {
    window.open(`/orders/positions?search=${orderNo}`, '_blank');
  };

  // 首次加载
  useEffect(() => {
    loadReport(dateRange);
    loadCommissionList(dateRange, 1, pagination.pageSize, levelFilter);
  }, []);

  // 解构数据
  const summary = reportData?.summary;
  const daily = reportData?.daily || [];
  const topReceivers = statsData?.topReceivers || [];

  // 计算三级返佣占比
  const totalAmount = Number(summary?.totalAmount || 0);
  const level1Amount = Number(summary?.level1Amount || 0);
  const level2Amount = Number(summary?.level2Amount || 0);
  const level3Amount = Number(summary?.level3Amount || 0);

  const level1Percent = totalAmount > 0 ? (level1Amount / totalAmount * 100) : 0;
  const level2Percent = totalAmount > 0 ? (level2Amount / totalAmount * 100) : 0;
  const level3Percent = totalAmount > 0 ? (level3Amount / totalAmount * 100) : 0;

  // 计算平均值
  const avgCommissionPerOrder = summary && summary.triggerOrderCount > 0
    ? totalAmount / summary.triggerOrderCount
    : 0;
  const avgAmountPerUser = summary && summary.receiverCount > 0
    ? totalAmount / summary.receiverCount
    : 0;

  /**
   * 准备趋势图数据
   */
  const trendChartData: ChartDataPoint[] = daily.flatMap((item) => [
    { date: item.date, type: '一级返佣', value: Number(item.level1Amount) },
    { date: item.date, type: '二级返佣', value: Number(item.level2Amount) },
    { date: item.date, type: '三级返佣', value: Number(item.level3Amount) },
  ]);

  /**
   * 趋势图配置 - @ant-design/charts v2.x
   */
  const trendChartConfig = {
    data: trendChartData,
    xField: 'date',
    yField: 'value',
    colorField: 'type',
    stack: true,
    areaStyle: { fillOpacity: 0.6 },
    color: ['#1890ff', '#52c41a', '#faad14'],
    legend: { position: 'top' as const },
    smooth: true,
    animation: {
      appear: { duration: 300 },
    },
  };

  /**
   * 准备获佣排行数据
   */
  const rankChartData = topReceivers.slice(0, 10).map((item) => ({
    nickname: item.nickname || maskPhone(item.userPhone),
    totalAmount: Number(item.totalAmount),
  }));

  /**
   * 排行图配置 - @ant-design/charts v2.x
   */
  const rankChartConfig = {
    data: rankChartData,
    xField: 'totalAmount',
    yField: 'nickname',
    colorField: 'nickname',
    legend: false,
    animation: {
      appear: { duration: 300 },
    },
  };

  /**
   * 返佣明细表格列配置
   */
  const tableColumns: ColumnsType<CommissionRecord> = [
    {
      title: '返佣时间',
      dataIndex: 'createdAt',
      align: 'center',
      width: 140,
      render: (val) => formatSystemTime(val, 'MM-DD HH:mm'),
    },
    {
      title: '获佣用户',
      dataIndex: 'receiverPhone',
      width: 130,
      render: (_, record) => (
        <a onClick={() => viewUserDetail(record.receiverId)}>
          {record.receiverNickname || maskPhone(record.receiverPhone)}
        </a>
      ),
    },
    {
      title: '返佣级别',
      dataIndex: 'level',
      align: 'center',
      width: 90,
      render: (level: CommissionLevel) => (
        <Tag color={levelTagMap[level].color}>{levelTagMap[level].text}</Tag>
      ),
    },
    {
      title: '返佣金额',
      dataIndex: 'amount',
      align: 'right',
      width: 110,
      render: (val) => (
        <span style={{ color: '#52c41a', fontWeight: 500 }}>
          +{formatCurrency(val)}
        </span>
      ),
    },
    {
      title: '来源用户',
      dataIndex: 'sourceUserPhone',
      width: 130,
      render: (_, record) => (
        <a onClick={() => viewUserDetail(record.sourceUserId)}>
          {record.sourceUserNickname || maskPhone(record.sourceUserPhone)}
        </a>
      ),
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      align: 'center',
      width: 90,
    },
    {
      title: '产品金额',
      dataIndex: 'baseAmount',
      align: 'right',
      width: 110,
      render: (val) => formatCurrency(val),
    },
    {
      title: '操作',
      align: 'center',
      width: 90,
      render: (_, record) => (
        <a onClick={() => viewOrderDetail(record.positionOrderNo)}>查看订单</a>
      ),
    },
  ];

  return (
    <div className="report-page commission-report-page">
      {/* 页面头部 */}
      <ReportPageHeader
        title="返佣报表"
        onDateRangeChange={handleDateRangeChange}
        onExportExcel={handleExportExcel}
        onExportChart={handleExportChart}
        estimatedRows={pagination.total}
        loading={loading}
        excelOnly={false}
      />

      <Spin spinning={loading}>
        {/* 返佣汇总卡片区 */}
        <Row gutter={[16, 16]} className="report-section">
          <Col xs={24} sm={8}>
            <ReportStatCard
              title="返佣总额"
              value={formatNumber(totalAmount)}
              prefix={<span className="currency-symbol">{config.currencySymbol}</span>}
              icon={<RiMoneyDollarCircleLine size={28} />}
              color="#faad14"
              loading={loading}
              footer={
                <span style={{ fontSize: 12, color: '#999' }}>
                  平均每单返佣：{formatCurrency(avgCommissionPerOrder)}
                </span>
              }
            />
          </Col>
          <Col xs={24} sm={8}>
            <ReportStatCard
              title="触发订单数"
              value={formatNumber(summary?.triggerOrderCount || 0)}
              suffix="单"
              icon={<RiShoppingCartLine size={28} />}
              color="#1890ff"
              loading={loading}
              footer={
                <span style={{ fontSize: 12, color: '#999' }}>首购付费产品订单</span>
              }
            />
          </Col>
          <Col xs={24} sm={8}>
            <ReportStatCard
              title="获佣用户数"
              value={formatNumber(summary?.receiverCount || 0)}
              suffix="人"
              icon={<RiUserReceivedLine size={28} />}
              color="#52c41a"
              loading={loading}
              footer={
                <span style={{ fontSize: 12, color: '#999' }}>
                  人均获佣：{formatCurrency(avgAmountPerUser)}
                </span>
              }
            />
          </Col>
        </Row>

        {/* 三级返佣分布区 */}
        <Card title="三级返佣分布" className="report-section">
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Card size="small" className="level-card level-card-1">
                <Statistic
                  title={<span style={{ color: '#1890ff' }}>一级返佣 ({config.commissionLevel1Rate}%)</span>}
                  value={level1Amount}
                  prefix={config.currencySymbol}
                  valueStyle={{ color: '#1890ff' }}
                />
                <div className="level-percent">占比 {level1Percent.toFixed(1)}%</div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" className="level-card level-card-2">
                <Statistic
                  title={<span style={{ color: '#52c41a' }}>二级返佣 ({config.commissionLevel2Rate}%)</span>}
                  value={level2Amount}
                  prefix={config.currencySymbol}
                  valueStyle={{ color: '#52c41a' }}
                />
                <div className="level-percent">占比 {level2Percent.toFixed(1)}%</div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" className="level-card level-card-3">
                <Statistic
                  title={<span style={{ color: '#faad14' }}>三级返佣 ({config.commissionLevel3Rate}%)</span>}
                  value={level3Amount}
                  prefix={config.currencySymbol}
                  valueStyle={{ color: '#faad14' }}
                />
                <div className="level-percent">占比 {level3Percent.toFixed(1)}%</div>
              </Card>
            </Col>
          </Row>

          {/* 占比进度条 */}
          <div className="level-progress-bar">
            <Progress
              percent={100}
              success={{ percent: level1Percent, strokeColor: '#1890ff' }}
              strokeColor="#52c41a"
              trailColor="#faad14"
              showInfo={false}
            />
            <Row justify="space-between" className="level-labels">
              <Col>一级 {level1Percent.toFixed(1)}%</Col>
              <Col>二级 {level2Percent.toFixed(1)}%</Col>
              <Col>三级 {level3Percent.toFixed(1)}%</Col>
            </Row>
          </div>
        </Card>

        {/* 图表展示区 */}
        <Card className="report-section chart-section">
          <Tabs
            activeKey={activeChartTab}
            onChange={setActiveChartTab}
            items={[
              {
                key: 'trend',
                label: '趋势分析',
                children: (
                  <div className="chart-container">
                    {daily.length > 0 ? (
                      <Area {...trendChartConfig} onReady={(plot) => { chartRef.current = plot; }} />
                    ) : (
                      <Empty description="暂无数据" />
                    )}
                  </div>
                ),
              },
              {
                key: 'rank',
                label: '获佣排行',
                children: (
                  <div className="chart-container">
                    {rankChartData.length > 0 ? (
                      <Bar {...rankChartConfig} />
                    ) : (
                      <Empty description="暂无数据" />
                    )}
                  </div>
                ),
              },
            ]}
          />
        </Card>

        {/* 返佣明细表格 */}
        <Card
          title="返佣明细"
          className="report-section"
          extra={
            <Radio.Group
              value={levelFilter}
              onChange={(e) => handleLevelChange(e.target.value)}
              optionType="button"
              size="small"
            >
              <Radio.Button value="">全部</Radio.Button>
              <Radio.Button value="LEVEL_1">一级</Radio.Button>
              <Radio.Button value="LEVEL_2">二级</Radio.Button>
              <Radio.Button value="LEVEL_3">三级</Radio.Button>
            </Radio.Group>
          }
        >
          <Table
            columns={tableColumns}
            dataSource={commissionList}
            rowKey="id"
            loading={tableLoading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1000 }}
            size="middle"
          />
        </Card>
      </Spin>
    </div>
  );
}
