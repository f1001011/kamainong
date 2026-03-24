/**
 * @file 充值订单列表页
 * @description 后台管理系统充值订单列表页面，支持搜索筛选、手动充值、批量查询上游
 * @depends 开发文档/04-后台管理端/04.4-订单管理/04.4.2-充值订单列表页.md
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第4节
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
  Select,
  Descriptions,
  Form,
  Input,
  Modal,
  Statistic,
  Card,
  Divider,
  Spin,
  Result,
} from 'antd';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import {
  RiRefreshLine,
  RiEyeLine,
  RiSearchLine,
  RiAddLine,
  RiFileCopyLine,
  RiLinkM,
  RiUser3Line,
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiQuestionLine,
} from '@remixicon/react';
import Link from 'next/link';

import {
  fetchRechargeOrderList,
  fetchRechargeOrderDetail,
  createManualRecharge,
  queryUpstreamStatus,
  batchQueryUpstream,
  fetchChannelOptions,
  searchUserForRecharge,
} from '@/services/recharge-orders';
import {
  CopyButton,
  OrderNoCopy,
  AmountDisplay,
  TimeDisplay,
  RechargeStatusBadge,
} from '@/components/common';
import { QuickFilters, ListPageSkeleton, BatchOperationBar } from '@/components/tables';
import type { FilterOption } from '@/components/tables';
import { DetailDrawer, DetailSection, BatchResultModal, ConfirmModal } from '@/components/modals';
import { UserInfoCard } from '@/components/business';
import type {
  RechargeOrderListItem,
  RechargeOrderListParams,
  RechargeOrderDetail,
  RechargeOrderSummary,
  RechargeOrderStatus,
  ChannelOption,
  UserSearchResult,
  ManualRechargeResult,
  BatchQueryUpstreamResultItem,
} from '@/types/recharge-orders';
import { RECHARGE_STATUS_OPTIONS } from '@/types/recharge-orders';
import { useGlobalConfig } from '@/hooks/useGlobalConfig';
import { getSystemTimezone } from '@/utils/timezone';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import tz from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(tz);

const { Text, Title, Paragraph } = Typography;

/**
 * 快捷筛选配置
 */
const QUICK_FILTERS: FilterOption<string>[] = [
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'today', label: '今日' },
  { value: 'yesterday', label: '昨日' },
];

/**
 * 获取今日/昨日日期范围
 */
function getDateRange(type: 'today' | 'yesterday'): { startDate: string; endDate: string } {
  const systemTz = getSystemTimezone();
  const today = dayjs().tz(systemTz).startOf('day');
  
  if (type === 'today') {
    return {
      startDate: today.format('YYYY-MM-DD'),
      endDate: today.format('YYYY-MM-DD'),
    };
  }
  
  const yesterday = today.subtract(1, 'day');
  return {
    startDate: yesterday.format('YYYY-MM-DD'),
    endDate: yesterday.format('YYYY-MM-DD'),
  };
}

/**
 * 快捷筛选到参数的映射
 */
function getQuickFilterParams(filter: string): Partial<RechargeOrderListParams> {
  switch (filter) {
    case 'pending':
      return { status: ['PENDING_PAYMENT'] };
    case 'paid':
      return { status: ['PAID'] };
    case 'today':
      return getDateRange('today');
    case 'yesterday':
      return getDateRange('yesterday');
    default:
      return {};
  }
}

/**
 * 充值订单列表页面
 * @description 依据：04.4.2-充值订单列表页.md
 */
export default function RechargeOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const globalConfig = useGlobalConfig();

  // 首次加载状态（用于骨架屏）
  const [initialLoading, setInitialLoading] = useState(true);

  // 快捷筛选状态
  const [quickFilter, setQuickFilter] = useState<string | undefined>();
  const quickFilterMounted = useRef(false);

  // 汇总统计数据
  const [summary, setSummary] = useState<RechargeOrderSummary>({ totalAmount: '0', totalCount: 0 });

  // 支付通道选项
  const [channelOptions, setChannelOptions] = useState<ChannelOption[]>([]);

  // 选中的行
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<RechargeOrderListItem[]>([]);

  // 详情抽屉状态
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<RechargeOrderDetail | null>(null);

  // 手动充值弹窗状态
  const [manualRechargeOpen, setManualRechargeOpen] = useState(false);
  const [manualRechargeLoading, setManualRechargeLoading] = useState(false);
  const [searchingUser, setSearchingUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [manualRechargeResult, setManualRechargeResult] = useState<ManualRechargeResult | null>(null);

  // 查询上游状态
  const [queryingUpstream, setQueryingUpstream] = useState<number | null>(null);

  // 批量查询上游结果弹窗
  const [batchResultOpen, setBatchResultOpen] = useState(false);
  const [batchResultData, setBatchResultData] = useState<{
    total: number;
    successCount: number;
    failedCount: number;
    results: BatchQueryUpstreamResultItem[];
    /** 保存订单号映射，用于结果展示 */
    orderNoMap: Record<number, string>;
  } | null>(null);

  // 批量操作确认弹窗
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);
  const [batchOperating, setBatchOperating] = useState(false);

  /**
   * 从 URL 参数获取初始筛选条件
   */
  const getInitialParams = useCallback((): Partial<RechargeOrderListParams> => {
    const params: Partial<RechargeOrderListParams> = {};

    // 用户ID（支持从用户详情页跳转过来）
    const userId = searchParams.get('userId');
    if (userId) {
      params.userId = Number(userId);
    }

    // 订单状态
    const status = searchParams.get('status');
    if (status) {
      params.status = status.split(',') as RechargeOrderStatus[];
    }

    return params;
  }, [searchParams]);

  /**
   * 加载支付通道选项
   */
  const loadChannelOptions = useCallback(async () => {
    try {
      const data = await fetchChannelOptions();
      setChannelOptions(data.list);
    } catch (error) {
      console.error('加载支付通道选项失败:', error);
    }
  }, []);

  /**
   * 查看订单详情
   */
  const handleViewDetail = useCallback(async (record: RechargeOrderListItem) => {
    setDetailDrawerOpen(true);
    setDetailLoading(true);
    try {
      const detail = await fetchRechargeOrderDetail(record.id);
      setCurrentOrder(detail);
    } catch (error) {
      message.error('加载订单详情失败');
      console.error('加载订单详情失败:', error);
    } finally {
      setDetailLoading(false);
    }
  }, [message]);

  /**
   * 查询上游状态（单条）
   */
  const handleQueryUpstream = useCallback(async (record: RechargeOrderListItem) => {
    setQueryingUpstream(record.id);
    try {
      const result = await queryUpstreamStatus(record.id);
      
      if (result.upstreamStatus === 'PAID' && result.compensated) {
        message.success(`上游已支付，已补单到账，实际金额: ${result.actualAmount || record.amount}`);
      } else if (result.upstreamStatus === 'PAID') {
        message.success('上游已支付');
      } else if (result.upstreamStatus === 'PENDING') {
        message.info('上游仍为待支付状态');
      } else {
        message.warning('上游状态未知');
      }
      
      // 刷新列表
      actionRef.current?.reload();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '查询上游状态失败';
      message.error(errorMessage);
    } finally {
      setQueryingUpstream(null);
    }
  }, [message]);

  /**
   * 复制支付链接
   */
  const handleCopyPayUrl = useCallback(async (payUrl: string) => {
    try {
      await navigator.clipboard.writeText(payUrl);
      message.success('支付链接已复制');
    } catch {
      message.error('复制失败');
    }
  }, [message]);

  /**
   * 批量查询上游确认
   */
  const handleBatchQueryUpstreamConfirm = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择订单');
      return;
    }
    if (selectedRowKeys.length > 100) {
      message.warning('单次最多处理100条');
      return;
    }
    setBatchConfirmOpen(true);
  }, [selectedRowKeys, message]);

  /**
   * 执行批量查询上游
   */
  const handleBatchQueryUpstream = useCallback(async () => {
    setBatchConfirmOpen(false);
    setBatchOperating(true);
    
    // 先保存订单号映射，因为清空选中后 selectedRows 会丢失
    const orderNoMap: Record<number, string> = {};
    selectedRows.forEach((row) => {
      orderNoMap[row.id] = row.orderNo;
    });
    
    try {
      const result = await batchQueryUpstream(selectedRowKeys.map(Number));
      
      setBatchResultData({
        total: result.total,
        successCount: result.succeeded,
        failedCount: result.failed,
        results: result.results,
        orderNoMap, // 保存订单号映射
      });
      setBatchResultOpen(true);
      
      // 清空选中
      setSelectedRowKeys([]);
      setSelectedRows([]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '批量查询上游失败';
      message.error(errorMessage);
    } finally {
      setBatchOperating(false);
    }
  }, [selectedRowKeys, selectedRows, message]);

  /**
   * 快捷筛选变化处理
   */
  const handleQuickFilterChange = useCallback((value: string | string[] | undefined) => {
    setQuickFilter(value as string | undefined);
  }, []);

  useEffect(() => {
    if (!quickFilterMounted.current) {
      quickFilterMounted.current = true;
      return;
    }
    actionRef.current?.reload();
  }, [quickFilter]);

  /**
   * 打开手动充值弹窗
   */
  const openManualRecharge = useCallback(() => {
    setManualRechargeOpen(true);
    setSelectedUser(null);
    setManualRechargeResult(null);
    form.resetFields();
  }, [form]);

  /**
   * 搜索用户
   */
  const handleSearchUser = useCallback(async () => {
    const keyword = form.getFieldValue('userKeyword');
    if (!keyword) {
      message.warning('请输入用户ID或手机号');
      return;
    }

    setSearchingUser(true);
    setSelectedUser(null);

    try {
      const user = await searchUserForRecharge(keyword);
      if (user) {
        setSelectedUser(user);
        form.setFieldsValue({ userId: user.id });
      } else {
        message.warning('未找到该用户');
      }
    } catch {
      message.error('搜索用户失败');
    } finally {
      setSearchingUser(false);
    }
  }, [form, message]);

  /**
   * 提交手动充值
   */
  const handleManualRechargeSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields(['userId', 'channelId', 'amount']);
      
      if (!selectedUser) {
        message.warning('请先搜索并确认用户');
        return;
      }

      if (selectedUser.status === 'BANNED') {
        message.error('该用户已被封禁，无法充值');
        return;
      }

      setManualRechargeLoading(true);

      const result = await createManualRecharge({
        userId: values.userId,
        channelId: values.channelId,
        amount: String(values.amount),
      });

      setManualRechargeResult(result);
      message.success('充值订单已生成');
      
      // 刷新列表
      actionRef.current?.reload();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        // 表单验证错误
        return;
      }
      const errorMessage = error instanceof Error ? error.message : '创建充值订单失败';
      message.error(errorMessage);
    } finally {
      setManualRechargeLoading(false);
    }
  }, [form, selectedUser, message]);

  /**
   * 关闭手动充值弹窗
   */
  const closeManualRecharge = useCallback(() => {
    setManualRechargeOpen(false);
    setSelectedUser(null);
    setManualRechargeResult(null);
    form.resetFields();
  }, [form]);

  /**
   * 关闭详情抽屉
   */
  const closeDetailDrawer = useCallback(() => {
    setDetailDrawerOpen(false);
    setCurrentOrder(null);
  }, []);

  /**
   * 关闭批量结果弹窗并刷新
   */
  const closeBatchResultAndRefresh = useCallback(() => {
    setBatchResultOpen(false);
    setBatchResultData(null);
    actionRef.current?.reload();
  }, []);

  /**
   * 表格列配置
   * @description 依据：04.4.2-充值订单列表页.md 第5节
   */
  const columns: ProColumns<RechargeOrderListItem>[] = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      width: 200,
      fixed: 'left',
      hideInSearch: true,
      render: (_, record) => <OrderNoCopy orderNo={record.orderNo} />,
    },
    {
      title: '第三方订单号',
      dataIndex: 'thirdOrderNo',
      width: 180,
      hideInSearch: true,
      render: (_, record) =>
        record.thirdOrderNo ? (
          <CopyButton text={record.thirdOrderNo} showText monospace maxLength={16} />
        ) : (
          <Text type="secondary">-</Text>
        ),
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
      title: '支付通道',
      dataIndex: 'channelName',
      width: 100,
      hideInSearch: true,
      render: (_, record) => <Tag>{record.channelName}</Tag>,
    },
    {
      title: '请求金额',
      dataIndex: 'amount',
      width: 120,
      hideInSearch: true,
      render: (_, record) => <AmountDisplay value={record.amount} />,
    },
    {
      title: '实付金额',
      dataIndex: 'actualAmount',
      width: 120,
      hideInSearch: true,
      render: (_, record) => {
        if (!record.actualAmount || record.status !== 'PAID') {
          return <Text type="secondary">-</Text>;
        }
        // 判断金额是否有差异
        const isDiff = record.actualAmount !== record.amount;
        return (
          <AmountDisplay
            value={record.actualAmount}
            style={{ color: isDiff ? '#faad14' : undefined }}
          />
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      valueType: 'select',
      fieldProps: {
        mode: 'multiple',
        options: RECHARGE_STATUS_OPTIONS,
      },
      render: (_, record) => <RechargeStatusBadge status={record.status} />,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      valueType: 'dateRange',
      render: (_, record) => <TimeDisplay value={record.createdAt} format="YYYY-MM-DD HH:mm" />,
      search: {
        transform: (value) => ({
          startDate: value?.[0],
          endDate: value?.[1],
        }),
      },
    },
    {
      title: '支付时间',
      dataIndex: 'callbackAt',
      width: 160,
      hideInSearch: true,
      render: (_, record) =>
        record.callbackAt ? (
          <TimeDisplay value={record.callbackAt} format="YYYY-MM-DD HH:mm" />
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: '创建IP',
      dataIndex: 'createIp',
      width: 120,
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        const actions = [
          <a key="detail" onClick={() => handleViewDetail(record)}>
            详情
          </a>,
        ];

        // 待支付或已取消订单可查询上游
        if (record.status === 'PENDING_PAYMENT' || record.status === 'CANCELLED') {
          actions.push(
            <a
              key="query"
              onClick={() => handleQueryUpstream(record)}
              style={{ color: queryingUpstream === record.id ? '#8c8c8c' : undefined }}
            >
              {queryingUpstream === record.id ? '查询中...' : '查询上游'}
            </a>
          );
        }

        // 待支付且有支付链接时可复制
        if (record.status === 'PENDING_PAYMENT' && record.payUrl) {
          actions.push(
            <a key="copy" onClick={() => handleCopyPayUrl(record.payUrl!)}>
              复制链接
            </a>
          );
        }

        return actions;
      },
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
      title: '第三方订单号',
      dataIndex: '_searchThirdOrderNo',
      key: 'thirdOrderNo_search',
      hideInTable: true,
      order: 9,
      fieldProps: {
        placeholder: '输入第三方订单号',
      },
      search: {
        transform: (value: string) => ({ thirdOrderNo: value }),
      },
    },
    {
      title: '用户ID',
      dataIndex: '_searchUserId',
      key: 'userId_search',
      hideInTable: true,
      order: 8,
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
      order: 7,
      fieldProps: {
        placeholder: '输入手机号搜索',
      },
    },
    {
      title: '支付通道',
      dataIndex: 'channelId',
      key: 'channelId_search',
      hideInTable: true,
      order: 6,
      valueType: 'select',
      fieldProps: {
        mode: 'multiple',
        placeholder: '选择支付通道',
        options: channelOptions.map((c) => ({ value: c.id, label: c.name })),
        maxTagCount: 2,
      },
    },
    {
      title: '创建IP',
      dataIndex: '_searchCreateIp',
      key: 'createIp_search',
      hideInTable: true,
      order: 3,
      fieldProps: {
        placeholder: '输入创建IP',
      },
      search: {
        transform: (value: string) => ({ createIp: value }),
      },
    },
    {
      title: '金额范围',
      dataIndex: 'amountRange',
      hideInTable: true,
      order: 2,
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

  // 缓存 ProTable params，防止 setSummary 触发重渲染时创建新对象导致重复请求
  const proTableParams = useMemo(() => ({ quickFilter }), [quickFilter]);

  // 首次加载
  useEffect(() => {
    loadChannelOptions();
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [loadChannelOptions]);

  // 骨架屏
  if (initialLoading) {
    return (
      <div className="recharge-orders-page">
        <ListPageSkeleton showSearch searchCount={6} rows={10} columns={8} />
      </div>
    );
  }

  return (
    <div className="recharge-orders-page">
      {/* 汇总统计区 */}
      <div
        style={{
          marginBottom: 16,
          padding: '20px 24px',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
        }}
      >
        <Space size={48}>
          <Statistic
            title="充值总额"
            value={summary.totalAmount}
            prefix={globalConfig.currencySymbol}
            precision={0}
            valueStyle={{ fontSize: 28, fontWeight: 600, color: '#1677ff' }}
          />
          <Statistic
            title="充值笔数"
            value={summary.totalCount}
            suffix="笔"
            valueStyle={{ fontSize: 28, fontWeight: 600 }}
          />
        </Space>
        <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
          统计数据随筛选条件实时更新
        </Text>
      </div>

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

      <ProTable<RechargeOrderListItem>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 1800 }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys, rows) => {
            setSelectedRowKeys(keys);
            setSelectedRows(rows);
          },
          preserveSelectedRowKeys: true,
          fixed: true, // 选择框左固定（文档要求）
          columnWidth: 50, // 文档要求 50px
        }}
        tableAlertRender={false}
        params={proTableParams}
        request={async (params) => {
          // 合并 URL 参数
          const initialParams = getInitialParams();

          // 合并快捷筛选参数
          const quickFilterParams = quickFilter ? getQuickFilterParams(quickFilter) : {};

          const mergedParams: RechargeOrderListParams = {
            ...initialParams,
            page: params.current,
            pageSize: params.pageSize,
            orderNo: params.orderNo,
            thirdOrderNo: params.thirdOrderNo,
            userId: params.userId,
            userPhone: params.userPhone,
            channelId: params.channelId,
            status: params.status as RechargeOrderStatus[],
            startDate: params.startDate,
            endDate: params.endDate,
            amountMin: params.amountMin,
            amountMax: params.amountMax,
            createIp: params.createIp,
            ...quickFilterParams,
          };

          try {
            const data = await fetchRechargeOrderList(mergedParams);
            // 更新汇总统计
            setSummary(data.summary);
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
        headerTitle={
          <Space>
            <span>充值订单列表</span>
            {selectedRowKeys.length > 0 && (
              <Button
                size="small"
                icon={<RiSearchLine size={14} />}
                onClick={handleBatchQueryUpstreamConfirm}
                loading={batchOperating}
              >
                批量查询上游 ({selectedRowKeys.length})
              </Button>
            )}
          </Space>
        }
        toolBarRender={() => [
          <Button
            key="manual"
            type="primary"
            icon={<RiAddLine size={16} />}
            onClick={openManualRecharge}
          >
            手动充值
          </Button>,
          <Button
            key="refresh"
            icon={<RiRefreshLine size={16} />}
            onClick={() => actionRef.current?.reload()}
          >
            刷新
          </Button>,
        ]}
      />

      {/* 批量操作栏 */}
      {selectedRowKeys.length > 0 && (
        <BatchOperationBar
          selectedCount={selectedRowKeys.length}
          onCancel={() => {
            setSelectedRowKeys([]);
            setSelectedRows([]);
          }}
          actions={[
            {
              key: 'query',
              label: '批量查询上游',
              onClick: handleBatchQueryUpstreamConfirm,
              loading: batchOperating,
            },
          ]}
        />
      )}

      {/* 订单详情抽屉 */}
      <DetailDrawer
        open={detailDrawerOpen}
        onClose={closeDetailDrawer}
        title="充值订单详情"
        subtitle={currentOrder?.orderNo}
        status={
          currentOrder?.status === 'PAID'
            ? 'success'
            : currentOrder?.status === 'PENDING_PAYMENT'
            ? 'warning'
            : currentOrder?.status === 'FAILED'
            ? 'error'
            : 'info'
        }
        statusText={
          currentOrder?.status === 'PAID'
            ? '已支付'
            : currentOrder?.status === 'PENDING_PAYMENT'
            ? '待支付'
            : currentOrder?.status === 'FAILED'
            ? '已失败'
            : '已取消'
        }
        loading={detailLoading}
        width={700}
      >
        {currentOrder && (
          <>
            {/* 基本信息 */}
            <DetailSection title="基本信息">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="订单号">
                  <CopyButton text={currentOrder.orderNo} showText monospace />
                </Descriptions.Item>
                <Descriptions.Item label="第三方订单号">
                  {currentOrder.thirdOrderNo ? (
                    <CopyButton text={currentOrder.thirdOrderNo} showText monospace />
                  ) : (
                    <Text type="secondary">-</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="用户信息">
                  <Link href={`/users/${currentOrder.userId}`}>
                    {currentOrder.userId} / {currentOrder.userPhone}
                  </Link>
                </Descriptions.Item>
                <Descriptions.Item label="支付通道">{currentOrder.channelName}</Descriptions.Item>
                <Descriptions.Item label="订单状态">
                  <RechargeStatusBadge status={currentOrder.status} />
                </Descriptions.Item>
              </Descriptions>
            </DetailSection>

            {/* 金额信息 */}
            <DetailSection title="金额信息">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="请求金额">
                  <AmountDisplay value={currentOrder.amount} />
                </Descriptions.Item>
                <Descriptions.Item label="实付金额">
                  {currentOrder.actualAmount ? (
                    <AmountDisplay
                      value={currentOrder.actualAmount}
                      style={{
                        color: currentOrder.actualAmount !== currentOrder.amount ? '#faad14' : undefined,
                      }}
                    />
                  ) : (
                    <Text type="secondary">-</Text>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </DetailSection>

            {/* 时间信息 */}
            <DetailSection title="时间信息">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="创建时间">
                  <TimeDisplay value={currentOrder.createdAt} />
                </Descriptions.Item>
                <Descriptions.Item label="支付时间">
                  {currentOrder.callbackAt ? (
                    <TimeDisplay value={currentOrder.callbackAt} />
                  ) : (
                    <Text type="secondary">-</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="创建IP">{currentOrder.createIp}</Descriptions.Item>
              </Descriptions>
            </DetailSection>

            {/* 支付链接（待支付订单显示） */}
            {currentOrder.status === 'PENDING_PAYMENT' && currentOrder.payUrl && (
              <DetailSection title="支付链接">
                <div
                  style={{
                    background: '#fafafa',
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <Paragraph
                    copyable={{ text: currentOrder.payUrl }}
                    ellipsis={{ rows: 2, expandable: true }}
                    style={{ marginBottom: 0, wordBreak: 'break-all' }}
                  >
                    {currentOrder.payUrl}
                  </Paragraph>
                </div>
              </DetailSection>
            )}
          </>
        )}
      </DetailDrawer>

      {/* 手动充值弹窗 */}
      <Modal
        title="手动充值"
        open={manualRechargeOpen}
        onCancel={closeManualRecharge}
        footer={
          manualRechargeResult
            ? [
                <Button key="close" onClick={closeManualRecharge}>
                  关闭
                </Button>,
              ]
            : [
                <Button key="cancel" onClick={closeManualRecharge}>
                  取消
                </Button>,
                <Button
                  key="submit"
                  type="primary"
                  loading={manualRechargeLoading}
                  onClick={handleManualRechargeSubmit}
                  disabled={!selectedUser}
                >
                  生成订单
                </Button>,
              ]
        }
        width={560}
        destroyOnHidden
      >
        {manualRechargeResult ? (
          // 生成成功结果
          <div style={{ padding: '24px 0' }}>
            <Result
              status="success"
              title="充值订单已生成"
              subTitle={
                <Space direction="vertical" size={4}>
                  <Text>订单号：{manualRechargeResult.orderNo}</Text>
                  <Text>用户：{selectedUser?.phone}（ID: {selectedUser?.id}）</Text>
                  <Text>金额：<AmountDisplay value={form.getFieldValue('amount')} /></Text>
                </Space>
              }
            />
            
            <Divider>支付链接</Divider>
            
            <div
              style={{
                background: '#f5f5f5',
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Paragraph
                copyable={{ text: manualRechargeResult.payUrl }}
                ellipsis={{ rows: 3, expandable: true }}
                style={{ marginBottom: 0, wordBreak: 'break-all', fontSize: 13 }}
              >
                {manualRechargeResult.payUrl}
              </Paragraph>
            </div>
            
            <Text type="secondary" style={{ fontSize: 13 }}>
              请将支付链接发送给用户，用户完成支付后余额将自动到账。
              <br />
              订单有效期：15分钟
            </Text>
          </div>
        ) : (
          // 表单
          <Form form={form} layout="vertical">
            {/* 用户搜索 */}
            <Form.Item
              label="用户"
              required
              help="输入用户ID或手机号搜索"
            >
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item name="userKeyword" noStyle>
                  <Input
                    placeholder="输入用户ID或手机号"
                    onPressEnter={handleSearchUser}
                    style={{ width: 'calc(100% - 80px)' }}
                  />
                </Form.Item>
                <Button
                  type="primary"
                  icon={<RiSearchLine size={14} />}
                  onClick={handleSearchUser}
                  loading={searchingUser}
                >
                  搜索
                </Button>
              </Space.Compact>
            </Form.Item>
            <Form.Item name="userId" hidden>
              <Input />
            </Form.Item>

            {/* 用户信息预览 */}
            {selectedUser && (
              <div
                style={{
                  background: selectedUser.status === 'BANNED' ? '#fff2f0' : '#f6ffed',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 24,
                  border: `1px solid ${selectedUser.status === 'BANNED' ? '#ffccc7' : '#b7eb8f'}`,
                }}
              >
                <UserInfoCard
                  userId={selectedUser.id}
                  phone={selectedUser.phone}
                  nickname={selectedUser.nickname}
                  avatarUrl={selectedUser.avatarUrl}
                  vipLevel={selectedUser.vipLevel}
                  status={selectedUser.status}
                  clickable={false}
                />
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    当前余额：<AmountDisplay value={selectedUser.availableBalance} />
                  </Text>
                </div>
                {selectedUser.status === 'BANNED' && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="danger" style={{ fontSize: 13 }}>
                      <RiCloseCircleFill size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      该用户已被封禁，无法充值
                    </Text>
                  </div>
                )}
              </div>
            )}

            {/* 支付通道 */}
            <Form.Item
              name="channelId"
              label="支付通道"
              rules={[{ required: true, message: '请选择支付通道' }]}
              help="选择用于生成订单的支付通道"
            >
              <Select
                placeholder="请选择支付通道"
                options={channelOptions.map((c) => ({ value: c.id, label: c.name }))}
              />
            </Form.Item>

            {/* 充值金额 */}
            <Form.Item
              name="amount"
              label="充值金额"
              rules={[
                { required: true, message: '请输入充值金额' },
                { type: 'number', min: 10, message: '最小充值金额为10' },
              ]}
              help="请输入充值金额（最小10）"
            >
              <InputNumber
                prefix={globalConfig.currencySymbol}
                placeholder="请输入金额"
                min={10}
                precision={0}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* 批量查询上游确认弹窗 */}
      <ConfirmModal
        open={batchConfirmOpen}
        onClose={() => setBatchConfirmOpen(false)}
        onConfirm={handleBatchQueryUpstream}
        title="确认批量查询上游"
        content={
          <div>
            <Paragraph>
              即将对 <Text strong>{selectedRowKeys.length}</Text> 笔订单进行上游状态查询。
            </Paragraph>
            <Paragraph type="secondary">
              已支付的订单将自动补单到账。
            </Paragraph>
            <Paragraph>是否继续？</Paragraph>
          </div>
        }
        confirmText="确认查询"
        loading={batchOperating}
      />

      {/* 批量查询上游结果弹窗 */}
      <BatchResultModal
        open={batchResultOpen}
        onClose={() => setBatchResultOpen(false)}
        onRefresh={closeBatchResultAndRefresh}
        operationName="批量查询上游"
        total={batchResultData?.total || 0}
        successCount={batchResultData?.successCount || 0}
        failedCount={batchResultData?.failedCount || 0}
        failedRecords={
          batchResultData?.results
            .filter((r) => !r.success)
            .map((r) => ({
              id: r.id,
              // 使用保存的订单号映射
              name: batchResultData.orderNoMap[r.id] || `订单 #${r.id}`,
              reason: r.error?.message || '未知错误',
            })) || []
        }
      />

      {/* 样式 */}
      <style jsx global>{`
        .recharge-orders-page .ant-pro-table-search {
          margin-bottom: 16px;
          padding: 20px 24px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
        .recharge-orders-page .ant-statistic-title {
          color: #8c8c8c;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
