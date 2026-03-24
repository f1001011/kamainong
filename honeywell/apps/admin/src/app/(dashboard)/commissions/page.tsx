/**
 * @file 返佣记录管理页
 * @description 后台管理系统返佣记录管理页面，支持搜索筛选、统计分析、趋势图表、导出功能
 * @depends 开发文档/开发文档.md 第13.14节 - 返佣记录管理
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第19节
 */

'use client';

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  Tag,
  Space,
  Button,
  Typography,
  App,
  Tooltip,
  Select,
  InputNumber,
  Row,
  Col,
  Empty,
} from 'antd';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import {
  RiRefreshLine,
  RiMoneyDollarCircleLine,
  RiExchangeLine,
  RiTeamLine,
  RiGroupLine,
} from '@remixicon/react';
import { Area } from '@ant-design/charts';
import Link from 'next/link';

import {
  fetchCommissionList,
  fetchCommissionStats,
  exportCommissionRecordsFrontend,
} from '@/services/commissions';
import { fetchProductList } from '@/services/products';
import {
  AmountDisplay,
  TimeDisplay,
  StatisticCard,
  StatisticCardGroup,
} from '@/components/common';
import { QuickFilters, DateRangeSelect, ListPageSkeleton } from '@/components/tables';
import type { FilterOption, DateRangeValue } from '@/components/tables';
import { UserInfoCard } from '@/components/business';
import { ExportButton } from '@/components/reports';
import { formatCurrency } from '@/utils/format';
import type {
  CommissionListItem,
  CommissionListParams,
  CommissionStatsSummary,
  CommissionLevel,
  DailyTrendItem,
  COMMISSION_LEVEL_MAP,
} from '@/types/commissions';

const { Text } = Typography;

/**
 * 返佣级别标签配置
 */
const LEVEL_TAG_CONFIG: Record<CommissionLevel, { color: string; text: string }> = {
  LEVEL_1: { color: 'blue', text: '一级' },
  LEVEL_2: { color: 'green', text: '二级' },
  LEVEL_3: { color: 'orange', text: '三级' },
};

/**
 * 快捷筛选配置
 */
const LEVEL_QUICK_FILTERS: FilterOption<CommissionLevel>[] = [
  { value: 'LEVEL_1', label: '一级返佣' },
  { value: 'LEVEL_2', label: '二级返佣' },
  { value: 'LEVEL_3', label: '三级返佣' },
];

/**
 * 产品选项类型
 */
interface ProductOption {
  value: number;
  label: string;
}

/**
 * 返佣记录管理页面
 * @description 依据：开发文档.md 第13.14节
 */
export default function CommissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();

  // 首次加载状态（用于骨架屏）
  const [initialLoading, setInitialLoading] = useState(true);

  // 筛选状态
  const [levelFilter, setLevelFilter] = useState<CommissionLevel[]>([]);
  const [dateRange, setDateRange] = useState<DateRangeValue>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [amountRange, setAmountRange] = useState<{ min?: number; max?: number }>({});
  const filterMounted = useRef(false);

  // 统计数据
  const [summary, setSummary] = useState<CommissionStatsSummary>({
    totalAmount: '0.00',
    totalCount: 0,
    level1Amount: '0.00',
    level1Count: 0,
    level2Amount: '0.00',
    level2Count: 0,
    level3Amount: '0.00',
    level3Count: 0,
  });

  // 趋势数据
  const [dailyTrend, setDailyTrend] = useState<DailyTrendItem[]>([]);

  // 产品选项
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);

  // 所有数据（用于导出）
  const [allData, setAllData] = useState<CommissionListItem[]>([]);
  const [total, setTotal] = useState(0);

  // 图表引用
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);

  /**
   * 加载产品选项
   */
  const loadProductOptions = useCallback(async () => {
    try {
      const res = await fetchProductList({ status: 'ACTIVE' });
      const options = res.list.map((p) => ({
        value: p.id,
        label: p.name,
      }));
      setProductOptions(options);
    } catch {
      // 忽略错误，产品选项不是必须的
    }
  }, []);

  /**
   * 加载统计数据
   */
  const loadStats = useCallback(async () => {
    try {
      const params: { startDate?: string; endDate?: string } = {};
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const res = await fetchCommissionStats(params);
      setSummary(res.summary);
      setDailyTrend(res.dailyTrend || []);
    } catch {
      message.error('加载统计数据失败');
    }
  }, [dateRange, message]);

  /**
   * 从 URL 参数获取初始筛选条件
   */
  const getInitialParams = useCallback((): Partial<CommissionListParams> => {
    const params: Partial<CommissionListParams> = {};

    // 获佣用户ID
    const receiverId = searchParams.get('receiverId');
    if (receiverId) params.receiverId = Number(receiverId);

    // 来源用户ID
    const sourceUserId = searchParams.get('sourceUserId');
    if (sourceUserId) params.sourceUserId = Number(sourceUserId);

    // 返佣级别（支持多选，URL参数用逗号分隔）
    const level = searchParams.get('level');
    if (level) {
      const levels = level.split(',').filter(l => ['LEVEL_1', 'LEVEL_2', 'LEVEL_3'].includes(l)) as CommissionLevel[];
      if (levels.length > 0) {
        setLevelFilter(levels);
      }
    }

    return params;
  }, [searchParams]);

  /**
   * 快捷筛选变化处理（支持多选）
   */
  const handleLevelFilterChange = useCallback((value: CommissionLevel | CommissionLevel[] | undefined) => {
    if (value === undefined) {
      setLevelFilter([]);
    } else if (Array.isArray(value)) {
      setLevelFilter(value);
    } else {
      // 单选点击时切换（如果已选中则取消，否则添加）
      setLevelFilter((prev) => {
        if (prev.includes(value)) {
          return prev.filter((v) => v !== value);
        }
        return [...prev, value];
      });
    }
  }, []);

  // 筛选状态变化后触发刷新（在状态提交后执行，避免闭包过期）
  useEffect(() => {
    if (!filterMounted.current) {
      filterMounted.current = true;
      return;
    }
    actionRef.current?.reload();
  }, [levelFilter, selectedProducts, dateRange]);

  /**
   * 日期范围变化
   */
  const handleDateRangeChange = useCallback((value: DateRangeValue) => {
    setDateRange(value);
    // 重新加载统计数据
    loadStats();
  }, [loadStats]);

  /**
   * 产品筛选变化
   */
  const handleProductChange = useCallback((value: number[]) => {
    setSelectedProducts(value);
  }, []);

  /**
   * 金额范围变化
   */
  const handleAmountRangeChange = useCallback((type: 'min' | 'max', value: number | null) => {
    setAmountRange((prev) => ({
      ...prev,
      [type]: value || undefined,
    }));
  }, []);

  /**
   * 应用金额范围筛选
   */
  const applyAmountFilter = useCallback(() => {
    actionRef.current?.reload();
  }, []);

  /**
   * 刷新列表
   */
  const handleRefresh = useCallback(() => {
    actionRef.current?.reload();
    loadStats();
  }, [loadStats]);

  /**
   * 导出 Excel
   */
  const handleExportExcel = useCallback(async () => {
    if (allData.length === 0) {
      message.warning('没有可导出的数据');
      return;
    }
    try {
      const startDate = dateRange?.[0]?.format('YYYY-MM-DD');
      const endDate = dateRange?.[1]?.format('YYYY-MM-DD');
      await exportCommissionRecordsFrontend(allData, startDate, endDate);
    } catch {
      message.error('导出失败，请稍后重试');
    }
  }, [allData, dateRange, message]);

  /**
   * 趋势图配置 - @ant-design/charts v2.x
   */
  const trendChartConfig = useMemo(() => ({
    data: dailyTrend.map((item) => ({
      date: item.date,
      金额: Number(item.amount),
    })),
    xField: 'date',
    yField: '金额',
    areaStyle: { fillOpacity: 0.6 },
    color: '#1890ff',
    smooth: true,
    animation: {
      appear: { duration: 300 },
    },
    tooltip: {
      formatter: (datum: { date: string; 金额: number }) => ({
        name: '返佣金额',
        value: formatCurrency(datum.金额),
      }),
    },
  }), [dailyTrend]);

  /**
   * 表格列配置
   * @description 依据：开发文档.md 第13.14节
   */
  const columns: ProColumns<CommissionListItem>[] = [
    {
      title: '获佣用户',
      dataIndex: 'receiverId',
      width: 180,
      fixed: 'left',
      hideInSearch: true,
      render: (_, record) => (
        <UserInfoCard
          userId={record.receiverId}
          phone={record.receiverPhone}
          nickname={record.receiverNickname}
          avatarUrl={record.receiverAvatarUrl}
          vipLevel={record.receiverVipLevel}
          showVip
          showStatus={false}
          clickable
          size="small"
        />
      ),
    },
    {
      title: '来源用户',
      dataIndex: 'sourceUserId',
      width: 180,
      hideInSearch: true,
      render: (_, record) => (
        <UserInfoCard
          userId={record.sourceUserId}
          phone={record.sourceUserPhone}
          nickname={record.sourceUserNickname}
          avatarUrl={record.sourceUserAvatarUrl}
          vipLevel={record.sourceUserVipLevel}
          showVip
          showStatus={false}
          clickable
          size="small"
        />
      ),
    },
    {
      title: '关系等级',
      dataIndex: 'level',
      width: 90,
      align: 'center',
      hideInSearch: true,
      render: (_, record) => {
        const config = LEVEL_TAG_CONFIG[record.level];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '基础金额',
      dataIndex: 'baseAmount',
      width: 110,
      align: 'right',
      hideInSearch: true,
      render: (_, record) => <AmountDisplay value={record.baseAmount} />,
    },
    {
      title: '返佣比例',
      dataIndex: 'rate',
      width: 90,
      align: 'center',
      hideInSearch: true,
      render: (_, record) => (
        <Text style={{ fontFamily: 'Roboto Mono, monospace' }}>{record.rate}%</Text>
      ),
    },
    {
      title: '返佣金额',
      dataIndex: 'amount',
      width: 120,
      align: 'right',
      hideInSearch: true,
      sorter: true,
      render: (_, record) => (
        <AmountDisplay value={record.amount} highlight style={{ color: '#52c41a' }} />
      ),
    },
    {
      title: '产品',
      dataIndex: 'productName',
      width: 100,
      hideInSearch: true,
      ellipsis: true,
    },
    {
      title: '订单号',
      dataIndex: 'positionOrderNo',
      width: 200,
      hideInSearch: true,
      render: (_, record) => (
        <Link
          href={`/orders/positions?search=${record.positionOrderNo}`}
          style={{ color: '#1677ff', textDecoration: 'none' }}
        >
          <Tooltip title="点击查看订单详情">
            <Text
              style={{
                fontFamily: 'Roboto Mono, monospace',
                fontSize: 12,
              }}
            >
              {record.positionOrderNo}
            </Text>
          </Tooltip>
        </Link>
      ),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 160,
      sorter: true,
      hideInSearch: true,
      render: (_, record) => <TimeDisplay value={record.createdAt} />,
    },
    // ================== 隐藏的搜索字段 ==================
    {
      title: '获佣用户ID',
      dataIndex: 'receiverId',
      key: 'receiverId_search',
      hideInTable: true,
      order: 10,
      valueType: 'digit',
      fieldProps: {
        placeholder: '输入用户ID',
        style: { width: '100%' },
      },
    },
    {
      title: '获佣用户手机号',
      dataIndex: 'receiverPhone',
      hideInTable: true,
      order: 9,
      fieldProps: {
        placeholder: '输入手机号搜索',
      },
    },
    {
      title: '来源用户ID',
      dataIndex: 'sourceUserId',
      key: 'sourceUserId_search',
      hideInTable: true,
      order: 8,
      valueType: 'digit',
      fieldProps: {
        placeholder: '输入用户ID',
        style: { width: '100%' },
      },
    },
    {
      title: '来源用户手机号',
      dataIndex: 'sourceUserPhone',
      hideInTable: true,
      order: 7,
      fieldProps: {
        placeholder: '输入手机号搜索',
      },
    },
    {
      title: '时间范围',
      dataIndex: 'dateRange',
      hideInTable: true,
      order: 5,
      valueType: 'dateRange',
      search: {
        transform: (value) => ({
          startDate: value?.[0],
          endDate: value?.[1],
        }),
      },
    },
  ];

  // 首次加载
  useEffect(() => {
    loadProductOptions();
    loadStats();
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // 骨架屏
  if (initialLoading) {
    return (
      <div className="commissions-page">
        <ListPageSkeleton showSearch searchCount={6} rows={10} columns={8} />
      </div>
    );
  }

  return (
    <div className="commissions-page">
      {/* 统计卡片区 */}
      <StatisticCardGroup columns={4} gap={16} style={{ marginBottom: 16 }}>
        <StatisticCard
          title="总返佣金额"
          value={summary.totalAmount}
          prefix={<RiMoneyDollarCircleLine size={20} style={{ color: '#faad14' }} />}
          isCurrency
          size="large"
          valueStyle={{ color: '#faad14' }}
          tooltip="所选时间范围内的返佣总金额"
        />
        <StatisticCard
          title="一级返佣金额"
          value={summary.level1Amount}
          prefix={<RiExchangeLine size={20} style={{ color: '#1890ff' }} />}
          isCurrency
          suffix={`${summary.level1Count}笔`}
          valueStyle={{ color: '#1890ff' }}
          onClick={() => { setLevelFilter(['LEVEL_1']); }}
          tooltip="点击筛选一级返佣"
        />
        <StatisticCard
          title="二级返佣金额"
          value={summary.level2Amount}
          prefix={<RiTeamLine size={20} style={{ color: '#52c41a' }} />}
          isCurrency
          suffix={`${summary.level2Count}笔`}
          valueStyle={{ color: '#52c41a' }}
          onClick={() => { setLevelFilter(['LEVEL_2']); }}
          tooltip="点击筛选二级返佣"
        />
        <StatisticCard
          title="三级返佣金额"
          value={summary.level3Amount}
          prefix={<RiGroupLine size={20} style={{ color: '#fa8c16' }} />}
          isCurrency
          suffix={`${summary.level3Count}笔`}
          valueStyle={{ color: '#fa8c16' }}
          onClick={() => { setLevelFilter(['LEVEL_3']); }}
          tooltip="点击筛选三级返佣"
        />
      </StatisticCardGroup>

      {/* 趋势图表区 */}
      <Card
        title="每日返佣趋势"
        style={{ marginBottom: 16, borderRadius: 12 }}
        styles={{ body: { padding: '16px 24px' } }}
      >
        <div style={{ height: 280 }}>
          {dailyTrend.length > 0 ? (
            <Area
              {...trendChartConfig}
              onReady={(plot) => { chartRef.current = plot; }}
            />
          ) : (
            <Empty description="暂无趋势数据" style={{ paddingTop: 60 }} />
          )}
        </div>
      </Card>

      {/* 筛选区 */}
      <div
        style={{
          marginBottom: 16,
          padding: '16px 24px',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          {/* 返佣等级快捷筛选（多选） */}
          <Col flex="auto">
            <Space size={16} wrap>
              <span style={{ color: '#8c8c8c', fontSize: 14 }}>返佣等级：</span>
              <QuickFilters
                options={LEVEL_QUICK_FILTERS}
                value={levelFilter}
                onChange={handleLevelFilterChange}
                multiple
                allOption={{ value: '' as unknown as CommissionLevel, label: '全部' }}
              />
            </Space>
          </Col>

          {/* 产品筛选 */}
          <Col>
            <Space>
              <span style={{ color: '#8c8c8c', fontSize: 14 }}>产品：</span>
              <Select
                mode="multiple"
                placeholder="选择产品"
                style={{ minWidth: 200 }}
                options={productOptions}
                value={selectedProducts}
                onChange={handleProductChange}
                allowClear
                maxTagCount={2}
              />
            </Space>
          </Col>

          {/* 金额范围 */}
          <Col>
            <Space>
              <span style={{ color: '#8c8c8c', fontSize: 14 }}>金额范围：</span>
              <InputNumber
                placeholder="最小"
                style={{ width: 100 }}
                min={0}
                value={amountRange.min}
                onChange={(v) => handleAmountRangeChange('min', v)}
              />
              <span>-</span>
              <InputNumber
                placeholder="最大"
                style={{ width: 100 }}
                min={0}
                value={amountRange.max}
                onChange={(v) => handleAmountRangeChange('max', v)}
              />
              <Button size="small" type="primary" onClick={applyAmountFilter}>
                应用
              </Button>
            </Space>
          </Col>

          {/* 时间范围 */}
          <Col>
            <DateRangeSelect
              value={dateRange}
              onChange={handleDateRangeChange}
              disableFuture
            />
          </Col>
        </Row>
      </div>

      {/* 列表表格 */}
      <ProTable<CommissionListItem>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 1400 }}
        params={{ levelFilter, selectedProducts, dateRange, amountRange }}
        request={async (params, sort) => {
          // 合并 URL 参数
          const initialParams = getInitialParams();

          // 构建查询参数
          const mergedParams: CommissionListParams = {
            ...initialParams,
            page: params.current,
            pageSize: params.pageSize,
            receiverId: params.receiverId,
            receiverPhone: params.receiverPhone,
            sourceUserId: params.sourceUserId,
            sourceUserPhone: params.sourceUserPhone,
            level: levelFilter.length > 0 ? levelFilter : undefined,
            productId: selectedProducts.length > 0 ? selectedProducts : undefined,
            amountMin: amountRange.min,
            amountMax: amountRange.max,
          };

          // 日期范围
          if (dateRange && dateRange[0] && dateRange[1]) {
            mergedParams.startDate = dateRange[0].format('YYYY-MM-DD');
            mergedParams.endDate = dateRange[1].format('YYYY-MM-DD');
          } else if (params.startDate && params.endDate) {
            mergedParams.startDate = params.startDate;
            mergedParams.endDate = params.endDate;
          }

          // 排序
          if (sort) {
            const sortKey = Object.keys(sort)[0];
            if (sortKey) {
              mergedParams.sortField = sortKey;
              mergedParams.sortOrder = sort[sortKey] as 'ascend' | 'descend';
            }
          }

          try {
            const data = await fetchCommissionList(mergedParams);
            // 更新汇总统计
            if (data.summary) {
              setSummary(data.summary);
            }
            // 保存数据用于导出
            setAllData(data.list);
            setTotal(data.pagination.total);
            return {
              data: data.list,
              success: true,
              total: data.pagination.total,
            };
          } catch {
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: true,
          span: 6,
          collapseRender: (collapsed) => (collapsed ? '展开更多筛选' : '收起'),
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
        }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: true,
        }}
        headerTitle="返佣记录列表"
        toolBarRender={() => [
          <ExportButton
            key="export"
            onExportExcel={handleExportExcel}
            estimatedRows={total}
            excelOnly
          />,
          <Button
            key="refresh"
            icon={<RiRefreshLine size={16} />}
            onClick={handleRefresh}
          >
            刷新
          </Button>,
        ]}
      />

      {/* 样式 */}
      <style jsx global>{`
        .commissions-page .ant-pro-table-search {
          margin-bottom: 16px;
          padding: 20px 24px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
        
        .commissions-page .ant-card {
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
      `}</style>
    </div>
  );
}
