/**
 * @file 持仓订单列表页
 * @description 后台管理系统持仓订单列表页面，支持搜索筛选、详情查看、收益记录
 * @depends 开发文档/04-后台管理端/04.4-订单管理/04.4.1-持仓订单列表页.md
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第6节
 */

'use client';

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Tag,
  Space,
  Button,
  Typography,
  Tooltip,
  App,
  InputNumber,
  Progress,
  Select,
  Descriptions,
  Timeline,
  Divider,
  Empty,
  Skeleton,
  Modal,
  Input,
  Alert,
} from 'antd';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import {
  RiRefreshLine,
  RiGiftLine,
  RiEyeLine,
  RiFileListLine,
  RiUser3Line,
} from '@remixicon/react';
import Link from 'next/link';

import {
  fetchPositionOrderList,
  fetchPositionOrderDetail,
  fetchPositionOrderIncomes,
  fetchProductOptions,
  terminatePositionOrder,
  batchTerminatePositionOrders,
} from '@/services/position-orders';
import {
  CopyButton,
  OrderNoCopy,
  AmountDisplay,
  TimeDisplay,
  PositionStatusBadge,
  IncomeStatusBadge,
} from '@/components/common';
import { QuickFilters, ListPageSkeleton } from '@/components/tables';
import type { FilterOption } from '@/components/tables';
import { DetailDrawer, DetailSection } from '@/components/modals';
import { UserInfoCard } from '@/components/business';
import type {
  PositionOrderListItem,
  PositionOrderListParams,
  PositionOrderDetail,
  IncomeRecord,
  IncomeSummary,
  ProductOption,
  PositionOrderStatus,
  OrderType,
  ProductSeries,
  IncomeStatus,
} from '@/types/position-orders';
import {
  POSITION_STATUS_OPTIONS,
  PRODUCT_SERIES_OPTIONS,
  ORDER_TYPE_OPTIONS,
  INCOME_STATUS_OPTIONS,
} from '@/types/position-orders';

const { Text, Title } = Typography;

/**
 * 快捷筛选配置
 */
const QUICK_FILTERS: FilterOption<string>[] = [
  { value: 'active', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'terminated', label: '已终止' },
  { value: 'gift', label: '赠送订单' },
  { value: 'vic', label: 'VIC系列' },
  { value: 'nws', label: 'NWS系列' },
  { value: 'qld', label: 'QLD系列' },
  { value: 'financial', label: '理财系列' },
];

/**
 * 快捷筛选到参数的映射
 */
const QUICK_FILTER_PARAMS: Record<string, Partial<PositionOrderListParams>> = {
  active: { status: ['ACTIVE'] },
  completed: { status: ['COMPLETED'] },
  terminated: { status: ['TERMINATED'] },
  gift: { orderType: 'gift' },
  vic: { productSeries: 'VIC' },
  nws: { productSeries: 'NWS' },
  qld: { productSeries: 'QLD' },
  financial: { productSeries: 'FINANCIAL' },
};

/**
 * 持仓订单列表页面
 * @description 依据：04.4.1-持仓订单列表页.md
 */
export default function PositionOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionRef = useRef<ActionType>(null);
  const { message, modal } = App.useApp();

  // 首次加载状态（用于骨架屏）
  const [initialLoading, setInitialLoading] = useState(true);

  // 快捷筛选状态
  const [quickFilter, setQuickFilter] = useState<string | undefined>();
  const quickFilterMounted = useRef(false);

  // 产品选项
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);

  // 详情抽屉状态
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<PositionOrderDetail | null>(null);

  // 收益记录抽屉状态
  const [incomeDrawerOpen, setIncomeDrawerOpen] = useState(false);
  const [incomeLoading, setIncomeLoading] = useState(false);
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [incomeSummary, setIncomeSummary] = useState<IncomeSummary | null>(null);
  const [incomeStatus, setIncomeStatus] = useState<IncomeStatus | undefined>();
  const [incomePage, setIncomePage] = useState(1);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [currentOrderForIncome, setCurrentOrderForIncome] = useState<PositionOrderListItem | null>(null);

  /**
   * 从 URL 参数获取初始筛选条件
   */
  const getInitialParams = useCallback((): Partial<PositionOrderListParams> => {
    const params: Partial<PositionOrderListParams> = {};

    // 用户ID（支持从用户详情页跳转过来）
    const userId = searchParams.get('userId');
    if (userId) {
      params.userId = Number(userId);
    }

    // 订单状态
    const status = searchParams.get('status');
    if (status) {
      params.status = status.split(',') as PositionOrderStatus[];
    }

    return params;
  }, [searchParams]);

  /**
   * 加载产品选项
   */
  const loadProductOptions = useCallback(async () => {
    try {
      const data = await fetchProductOptions();
      setProductOptions(data.list);
    } catch (error) {
      console.error('加载产品选项失败:', error);
    }
  }, []);

  /**
   * 查看订单详情
   */
  const handleViewDetail = useCallback(async (record: PositionOrderListItem) => {
    setDetailDrawerOpen(true);
    setDetailLoading(true);
    try {
      const detail = await fetchPositionOrderDetail(record.id);
      setCurrentOrder(detail);
    } catch (error) {
      message.error('加载订单详情失败');
      console.error('加载订单详情失败:', error);
    } finally {
      setDetailLoading(false);
    }
  }, [message]);

  /**
   * 查看收益记录
   */
  const handleViewIncomes = useCallback(async (record: PositionOrderListItem) => {
    setCurrentOrderForIncome(record);
    setIncomeDrawerOpen(true);
    setIncomeLoading(true);
    setIncomeStatus(undefined);
    setIncomePage(1);

    try {
      const data = await fetchPositionOrderIncomes(record.id, { page: 1, pageSize: 20 });
      setIncomeRecords(data.list);
      setIncomeSummary(data.summary);
      setIncomeTotal(data.pagination.total);
    } catch (error) {
      message.error('加载收益记录失败');
      console.error('加载收益记录失败:', error);
    } finally {
      setIncomeLoading(false);
    }
  }, [message]);

  /**
   * 加载更多收益记录
   */
  const loadMoreIncomes = useCallback(async () => {
    if (!currentOrderForIncome) return;

    setIncomeLoading(true);
    try {
      const data = await fetchPositionOrderIncomes(currentOrderForIncome.id, {
        page: incomePage + 1,
        pageSize: 20,
        status: incomeStatus,
      });
      setIncomeRecords((prev) => [...prev, ...data.list]);
      setIncomePage((prev) => prev + 1);
      setIncomeTotal(data.pagination.total);
    } catch (error) {
      message.error('加载收益记录失败');
    } finally {
      setIncomeLoading(false);
    }
  }, [currentOrderForIncome, incomePage, incomeStatus, message]);

  /**
   * 收益状态筛选变化
   */
  const handleIncomeStatusChange = useCallback(async (status: IncomeStatus | undefined) => {
    if (!currentOrderForIncome) return;

    setIncomeStatus(status);
    setIncomePage(1);
    setIncomeLoading(true);

    try {
      const data = await fetchPositionOrderIncomes(currentOrderForIncome.id, {
        page: 1,
        pageSize: 20,
        status,
      });
      setIncomeRecords(data.list);
      setIncomeSummary(data.summary);
      setIncomeTotal(data.pagination.total);
    } catch (error) {
      message.error('加载收益记录失败');
    } finally {
      setIncomeLoading(false);
    }
  }, [currentOrderForIncome, message]);

  /**
   * 快捷筛选变化处理
   */
  const handleQuickFilterChange = useCallback((value: string | string[] | undefined) => {
    setQuickFilter(value as string | undefined);
  }, []);

  // 快捷筛选变化后触发刷新（在状态提交后执行，避免闭包过期）
  useEffect(() => {
    if (!quickFilterMounted.current) {
      quickFilterMounted.current = true;
      return;
    }
    actionRef.current?.reload();
  }, [quickFilter]);

  /**
   * 跳转到用户详情
   */
  const navigateToUser = useCallback((userId: number) => {
    router.push(`/users/${userId}`);
  }, [router]);

  /**
   * 关闭详情抽屉
   */
  const closeDetailDrawer = useCallback(() => {
    setDetailDrawerOpen(false);
    setCurrentOrder(null);
  }, []);

  /**
   * 关闭收益记录抽屉
   */
  const closeIncomeDrawer = useCallback(() => {
    setIncomeDrawerOpen(false);
    setCurrentOrderForIncome(null);
    setIncomeRecords([]);
    setIncomeSummary(null);
  }, []);

  /**
   * 终止单条持仓订单
   */
  const handleTerminate = useCallback((record: PositionOrderListItem) => {
    let terminateReason = '';

    modal.confirm({
      title: '终止持仓订单',
      width: 500,
      content: (
        <div>
          <Descriptions column={1} size="small" style={{ marginBottom: 12 }}>
            <Descriptions.Item label="订单号">{record.orderNo}</Descriptions.Item>
            <Descriptions.Item label="用户">{record.userPhone}</Descriptions.Item>
            <Descriptions.Item label="产品">{record.productName}</Descriptions.Item>
            <Descriptions.Item label="收益进度">{record.paidDays}/{record.cycleDays}天</Descriptions.Item>
            <Descriptions.Item label="已获收益">{record.earnedIncome}</Descriptions.Item>
          </Descriptions>
          <Input.TextArea
            placeholder="终止原因（可选）"
            rows={2}
            onChange={(e) => { terminateReason = e.target.value; }}
          />
          <Alert
            style={{ marginTop: 12 }}
            type="error"
            showIcon
            message="终止后：停止剩余收益发放 | 恢复限购资格 | 重新计算VIP等级 | 用户端不再显示"
          />
        </div>
      ),
      okText: '确认终止',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          const result = await terminatePositionOrder(record.id, { reason: terminateReason || undefined });
          message.success(`订单 ${result.orderNo} 已终止，取消了 ${result.cancelledIncomeCount} 条未发放收益`);
          actionRef.current?.reload();
        } catch (error: unknown) {
          message.error('终止失败：' + ((error as Error).message || '未知错误'));
        }
      },
    });
  }, [message, modal]);

  /**
   * 批量终止持仓订单
   */
  const handleBatchTerminate = useCallback((selectedKeys: React.Key[]) => {
    if (selectedKeys.length === 0) {
      message.warning('请选择要终止的订单');
      return;
    }

    if (selectedKeys.length > 50) {
      message.warning('单次最多终止50条订单');
      return;
    }

    let batchReason = '';

    modal.confirm({
      title: '批量终止持仓订单',
      width: 480,
      content: (
        <div>
          <Alert
            style={{ marginBottom: 12 }}
            type="warning"
            showIcon
            message={`即将终止 ${selectedKeys.length} 条持仓订单`}
            description="非进行中的订单将被自动跳过"
          />
          <Input.TextArea
            placeholder="统一终止原因（可选）"
            rows={2}
            onChange={(e) => { batchReason = e.target.value; }}
          />
          <Alert
            style={{ marginTop: 12 }}
            type="error"
            showIcon
            message="终止后：停止剩余收益发放 | 恢复限购资格 | 重新计算VIP等级 | 用户端不再显示"
          />
        </div>
      ),
      okText: '确认批量终止',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          const result = await batchTerminatePositionOrders({
            ids: selectedKeys.map(Number),
            reason: batchReason || undefined,
          });
          message.success(`成功终止 ${result.totalTerminated} 条，跳过 ${result.totalSkipped} 条`);
          actionRef.current?.reload();
          actionRef.current?.clearSelected?.();
        } catch (error: unknown) {
          message.error('批量终止失败：' + ((error as Error).message || '未知错误'));
        }
      },
    });
  }, [message, modal]);

  /**
   * 表格列配置
   * @description 依据：04.4.1-持仓订单列表页.md 第3节
   */
  const columns: ProColumns<PositionOrderListItem>[] = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      width: 200,
      fixed: 'left',
      hideInSearch: true,
      render: (_, record) => <OrderNoCopy orderNo={record.orderNo} />,
    },
    {
      title: '用户信息',
      dataIndex: 'userId',
      width: 150,
      hideInSearch: true,
      render: (_, record) => (
        <Link href={`/users/${record.userId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
          <Space direction="vertical" size={0}>
            <Text>{record.userId}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.userPhone}
            </Text>
          </Space>
        </Link>
      ),
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      width: 100,
      hideInSearch: true,
      render: (_, record) => (
        <Space size={4}>
          <Text>{record.productName}</Text>
          {record.isGift && (
            <Tooltip title="赠送订单">
              <RiGiftLine size={14} style={{ color: '#722ed1' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '产品系列',
      dataIndex: 'productSeries',
      key: 'productSeries_display',
      width: 90,
      hideInSearch: true,
      render: (_, record) => {
        const seriesOption = PRODUCT_SERIES_OPTIONS.find((o) => o.value === record.productSeries);
        return (
          <Tag color={seriesOption?.color || 'default'}>
            {seriesOption?.label || record.productSeries}
          </Tag>
        );
      },
    },
    {
      title: '订单类型',
      dataIndex: 'isGift',
      width: 80,
      hideInSearch: true,
      render: (_, record) =>
        record.isGift ? (
          <Tag color="purple">赠送</Tag>
        ) : (
          <Tag>购买</Tag>
        ),
    },
    {
      title: '购买金额',
      dataIndex: 'purchaseAmount',
      width: 120,
      hideInSearch: true,
      sorter: true,
      render: (_, record) => (
        <AmountDisplay value={record.purchaseAmount} style={{ textAlign: 'right' }} />
      ),
    },
    {
      title: '日收益',
      dataIndex: 'dailyIncome',
      width: 100,
      hideInSearch: true,
      render: (_, record) => <AmountDisplay value={record.dailyIncome} />,
    },
    {
      title: '收益进度',
      dataIndex: 'paidDays',
      width: 180,
      hideInSearch: true,
      render: (_, record) => {
        const percent = (record.paidDays / record.cycleDays) * 100;
        return (
          <Tooltip title={`已发放 ${record.paidDays} 天，剩余 ${record.cycleDays - record.paidDays} 天`}>
            <div>
              <Progress
                percent={percent}
                size="small"
                showInfo={false}
                strokeColor="#1677ff"
                style={{ marginBottom: 4 }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.paidDays}/{record.cycleDays}天
              </Text>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: '已获收益',
      dataIndex: 'earnedIncome',
      width: 120,
      hideInSearch: true,
      render: (_, record) => <AmountDisplay value={record.earnedIncome} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      valueType: 'select',
      fieldProps: {
        mode: 'multiple',
        options: POSITION_STATUS_OPTIONS,
      },
      render: (_, record) => <PositionStatusBadge status={record.status} />,
    },
    {
      title: '购买时间',
      dataIndex: 'startAt',
      width: 160,
      valueType: 'dateRange',
      render: (_, record) => <TimeDisplay value={record.startAt} format="YYYY-MM-DD HH:mm" />,
      search: {
        transform: (value) => ({
          startDate: value?.[0],
          endDate: value?.[1],
        }),
      },
    },
    {
      title: '下次发放',
      dataIndex: 'nextSettleAt',
      width: 160,
      hideInSearch: true,
      render: (_, record) =>
        record.nextSettleAt ? (
          <TimeDisplay value={record.nextSettleAt} format="YYYY-MM-DD HH:mm" />
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_, record) => [
        <a key="detail" onClick={() => handleViewDetail(record)}>
          查看详情
        </a>,
        <a key="income" onClick={() => handleViewIncomes(record)}>
          收益记录
        </a>,
        record.status === 'ACTIVE' && (
          <a key="terminate" style={{ color: '#ff4d4f' }} onClick={() => handleTerminate(record)}>
            终止
          </a>
        ),
      ],
    },
    // ================== 隐藏的搜索字段 ==================
    {
      title: '订单号',
      dataIndex: '_searchOrderNo',
      key: 'orderNo_search',
      hideInTable: true,
      order: 10,
      fieldProps: {
        placeholder: '输入订单号搜索',
      },
      search: {
        transform: (value: string) => ({ orderNo: value }),
      },
    },
    {
      title: '用户ID',
      dataIndex: '_searchUserId',
      key: 'userId_search',
      hideInTable: true,
      order: 9,
      valueType: 'digit',
      fieldProps: {
        placeholder: '输入用户ID',
        style: { width: '100%' },
      },
      search: {
        transform: (value: number) => ({ userId: value }),
      },
    },
    {
      title: '用户手机号',
      dataIndex: 'userPhone',
      hideInTable: true,
      order: 8,
      fieldProps: {
        placeholder: '输入手机号搜索',
      },
    },
    {
      title: '产品名称',
      dataIndex: 'productId',
      key: 'productId_search',
      hideInTable: true,
      order: 7,
      valueType: 'select',
      fieldProps: {
        mode: 'multiple',
        placeholder: '选择产品',
        options: productOptions.map((p) => ({ value: p.id, label: p.name })),
        maxTagCount: 2,
        showSearch: true,
        filterOption: (input: string, option?: { label: string }) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
      },
    },
    {
      title: '产品系列',
      dataIndex: '_searchProductSeries',
      key: 'productSeries_search',
      hideInTable: true,
      order: 6,
      valueType: 'select',
      fieldProps: {
        placeholder: '选择产品系列',
        options: PRODUCT_SERIES_OPTIONS,
        allowClear: true,
      },
      search: {
        transform: (value: string) => ({ productSeries: value }),
      },
    },
    {
      title: '订单类型',
      dataIndex: 'orderType',
      hideInTable: true,
      order: 5,
      valueType: 'select',
      fieldProps: {
        placeholder: '选择订单类型',
        options: ORDER_TYPE_OPTIONS,
        allowClear: true,
      },
    },
    {
      title: '金额范围',
      dataIndex: 'amountRange',
      hideInTable: true,
      order: 3,
      renderFormItem: () => (
        <Space>
          <InputNumber placeholder="最小值" min={0} precision={0} style={{ width: 100 }} />
          <span>-</span>
          <InputNumber placeholder="最大值" min={0} precision={0} style={{ width: 100 }} />
        </Space>
      ),
      search: {
        transform: (value) => {
          if (!value) return {};
          return {
            amountMin: value[0],
            amountMax: value[1],
          };
        },
      },
    },
  ];

  // 缓存 ProTable params，防止 setState 触发重渲染时创建新对象导致重复请求
  const proTableParams = useMemo(() => ({ quickFilter }), [quickFilter]);

  // 首次加载
  useEffect(() => {
    loadProductOptions();
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [loadProductOptions]);

  // 骨架屏
  if (initialLoading) {
    return (
      <div className="position-orders-page">
        <ListPageSkeleton showSearch searchCount={5} rows={10} columns={8} />
      </div>
    );
  }

  return (
    <div className="position-orders-page">
      {/* 快捷筛选区 */}
      <div
        style={{
          marginBottom: 16,
          padding: '16px 24px',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
        }}
      >
        <QuickFilters
          options={QUICK_FILTERS}
          value={quickFilter}
          onChange={handleQuickFilterChange}
          allowClear
        />
      </div>

      <ProTable<PositionOrderListItem>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 1800 }}
        rowSelection={{
          getCheckboxProps: (record) => ({
            disabled: record.status !== 'ACTIVE',
          }),
        }}
        tableAlertOptionRender={({ selectedRowKeys, onCleanSelected }) => (
          <Space>
            <Button danger size="small" onClick={() => handleBatchTerminate(selectedRowKeys)}>
              批量终止 ({selectedRowKeys.length})
            </Button>
            <a onClick={onCleanSelected}>取消选择</a>
          </Space>
        )}
        params={proTableParams}
        request={async (params) => {
          // 合并 URL 参数
          const initialParams = getInitialParams();

          // 合并快捷筛选参数
          const quickFilterParams = quickFilter ? QUICK_FILTER_PARAMS[quickFilter] : {};

          const mergedParams: PositionOrderListParams = {
            ...initialParams,
            page: params.current,
            pageSize: params.pageSize,
            orderNo: params.orderNo,
            userId: params.userId,
            userPhone: params.userPhone,
            productId: params.productId,
            productSeries: params.productSeries as ProductSeries,
            orderType: params.orderType as OrderType,
            status: params.status as PositionOrderStatus[],
            startDate: params.startDate,
            endDate: params.endDate,
            amountMin: params.amountMin,
            amountMax: params.amountMax,
            ...quickFilterParams,
          };

          try {
            const data = await fetchPositionOrderList(mergedParams);
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
          showTotal: (total) => `共 ${total} 条`,
        }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: true,
        }}
        headerTitle="持仓订单列表"
        toolBarRender={() => [
          <Button
            key="refresh"
            icon={<RiRefreshLine size={16} />}
            onClick={() => actionRef.current?.reload()}
          >
            刷新
          </Button>,
        ]}
      />

      {/* 订单详情抽屉 */}
      <DetailDrawer
        open={detailDrawerOpen}
        onClose={closeDetailDrawer}
        title="持仓订单详情"
        subtitle={currentOrder?.orderNo}
        status={currentOrder?.status === 'ACTIVE' ? 'processing' : currentOrder?.status === 'TERMINATED' ? 'error' : 'success'}
        statusText={currentOrder?.status === 'ACTIVE' ? '进行中' : currentOrder?.status === 'TERMINATED' ? '已终止' : '已完成'}
        loading={detailLoading}
        width={800}
      >
        {currentOrder && (
          <>
            {/* 用户信息卡片 */}
            <DetailSection title="用户信息">
              <UserInfoCard
                userId={currentOrder.userId}
                phone={currentOrder.userPhone}
                nickname={currentOrder.userNickname}
                clickable
                size="default"
              />
            </DetailSection>

            {/* 基本信息 */}
            <DetailSection title="基本信息">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="订单号">
                  <CopyButton text={currentOrder.orderNo} showText monospace />
                </Descriptions.Item>
                <Descriptions.Item label="产品名称">{currentOrder.productName}</Descriptions.Item>
                <Descriptions.Item label="产品系列">
                  {(() => {
                    const seriesOption = PRODUCT_SERIES_OPTIONS.find((o) => o.value === currentOrder.productSeries);
                    return (
                      <Tag color={seriesOption?.color || 'default'}>
                        {seriesOption?.label || currentOrder.productSeries}
                      </Tag>
                    );
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="订单类型">
                  {currentOrder.isGift ? (
                    <Space>
                      <Tag color="purple">赠送</Tag>
                      {currentOrder.giftedBy && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          赠送人: {currentOrder.giftedBy}
                        </Text>
                      )}
                    </Space>
                  ) : (
                    <Tag>购买</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="订单状态">
                  <PositionStatusBadge status={currentOrder.status} />
                </Descriptions.Item>
                <Descriptions.Item label="购买时间">
                  <TimeDisplay value={currentOrder.startAt} />
                </Descriptions.Item>
                <Descriptions.Item label="完结时间">
                  {currentOrder.endAt ? (
                    <TimeDisplay value={currentOrder.endAt} />
                  ) : (
                    <Text type="secondary">-</Text>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </DetailSection>

            {/* 收益信息 */}
            <DetailSection title="收益信息">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="购买金额">
                  <AmountDisplay value={currentOrder.purchaseAmount} />
                </Descriptions.Item>
                <Descriptions.Item label="日收益">
                  <AmountDisplay value={currentOrder.dailyIncome} />
                </Descriptions.Item>
                <Descriptions.Item label="周期天数">
                  {currentOrder.cycleDays} 天
                </Descriptions.Item>
                <Descriptions.Item label="总收益">
                  <AmountDisplay value={currentOrder.totalIncome} />
                </Descriptions.Item>
                <Descriptions.Item label="已获收益">
                  <AmountDisplay value={currentOrder.earnedIncome} highlight />
                </Descriptions.Item>
                <Descriptions.Item label="待发收益">
                  <AmountDisplay value={currentOrder.pendingIncome} />
                </Descriptions.Item>
                <Descriptions.Item label="发放进度" span={2}>
                  <div style={{ maxWidth: 300 }}>
                    <Progress
                      percent={Number(((currentOrder.paidDays / currentOrder.cycleDays) * 100).toFixed(1))}
                      strokeColor="#1677ff"
                      format={() => `${currentOrder.paidDays}/${currentOrder.cycleDays}天`}
                    />
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="下次发放">
                  {currentOrder.nextSettleAt ? (
                    <TimeDisplay value={currentOrder.nextSettleAt} />
                  ) : (
                    <Text type="secondary">-</Text>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </DetailSection>

            {/* 终止信息（仅 TERMINATED 状态显示） */}
            {currentOrder.status === 'TERMINATED' && (
              <DetailSection title="终止信息">
                <Alert
                  type="error"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message="该订单已被管理员终止"
                />
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="终止操作人">
                    {currentOrder.terminatedBy || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="终止时间">
                    {currentOrder.terminatedAt ? (
                      <TimeDisplay value={currentOrder.terminatedAt} />
                    ) : (
                      <Text type="secondary">-</Text>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="终止原因" span={2}>
                    {currentOrder.terminateReason || '未填写'}
                  </Descriptions.Item>
                </Descriptions>
              </DetailSection>
            )}
          </>
        )}
      </DetailDrawer>

      {/* 收益发放记录抽屉 */}
      <DetailDrawer
        open={incomeDrawerOpen}
        onClose={closeIncomeDrawer}
        title="收益发放记录"
        subtitle={currentOrderForIncome?.orderNo}
        loading={false}
        width={600}
      >
        {currentOrderForIncome && (
          <>
            {/* 汇总信息 */}
            {incomeSummary && (
              <div
                style={{
                  background: '#fafafa',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 24,
                }}
              >
                <Space size={32}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                      已发放金额
                    </Text>
                    <AmountDisplay value={incomeSummary.totalSettled} size="large" />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                      待发放笔数
                    </Text>
                    <Text strong style={{ fontSize: 20 }}>
                      {incomeSummary.pendingCount}
                    </Text>
                    <Text type="secondary"> 笔</Text>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                      失败笔数
                    </Text>
                    <Text
                      strong
                      style={{
                        fontSize: 20,
                        color: incomeSummary.failedCount > 0 ? '#ff4d4f' : undefined,
                      }}
                    >
                      {incomeSummary.failedCount}
                    </Text>
                    <Text type="secondary"> 笔</Text>
                  </div>
                </Space>
              </div>
            )}

            {/* 状态筛选 */}
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Text type="secondary">状态筛选:</Text>
                <Select
                  value={incomeStatus}
                  onChange={handleIncomeStatusChange}
                  placeholder="全部"
                  allowClear
                  style={{ width: 120 }}
                  options={INCOME_STATUS_OPTIONS}
                />
              </Space>
            </div>

            {/* 收益记录时间轴 */}
            {incomeLoading && incomeRecords.length === 0 ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : incomeRecords.length === 0 ? (
              <Empty description="暂无收益记录" />
            ) : (
              <>
                <Timeline
                  items={incomeRecords.map((record) => ({
                    color:
                      record.status === 'SETTLED'
                        ? 'green'
                        : record.status === 'FAILED'
                        ? 'red'
                        : 'blue',
                    children: (
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Space size={8}>
                            <Text strong>第 {record.settleSequence} 天</Text>
                            <IncomeStatusBadge status={record.status} />
                          </Space>
                          <AmountDisplay value={record.amount} />
                        </div>
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            计划时间: <TimeDisplay value={record.scheduleAt} format="MM-DD HH:mm" showTooltip={false} />
                          </Text>
                          {record.settledAt && (
                            <Text type="secondary" style={{ fontSize: 12, marginLeft: 16 }}>
                              发放时间: <TimeDisplay value={record.settledAt} format="MM-DD HH:mm" showTooltip={false} />
                            </Text>
                          )}
                          {record.status === 'FAILED' && record.retryCount > 0 && (
                            <Text type="danger" style={{ fontSize: 12, marginLeft: 16 }}>
                              重试次数: {record.retryCount}
                            </Text>
                          )}
                        </div>
                      </div>
                    ),
                  }))}
                />

                {/* 加载更多 */}
                {incomeRecords.length < incomeTotal && (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Button loading={incomeLoading} onClick={loadMoreIncomes}>
                      加载更多 ({incomeRecords.length}/{incomeTotal})
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </DetailDrawer>

      {/* 样式 */}
      <style jsx global>{`
        .position-orders-page .ant-pro-table-search {
          margin-bottom: 16px;
          padding: 20px 24px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
        .position-orders-page .ant-progress-text {
          font-size: 12px;
          color: #8c8c8c;
        }
      `}</style>
    </div>
  );
}
