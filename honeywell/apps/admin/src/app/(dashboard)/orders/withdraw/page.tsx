/**
 * @file 提现订单列表页
 * @description 后台管理系统提现订单审核页面，支持单条/批量审核、状态筛选、详情查看
 * @depends 开发文档/04-后台管理端/04.4-订单管理/04.4.3-提现订单列表页.md
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第5节
 */

'use client';

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Row,
  Col,
  Card,
  Divider,
} from 'antd';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import {
  RiRefreshLine,
  RiCheckLine,
  RiCloseLine,
  RiEyeLine,
  RiDownloadLine,
  RiErrorWarningLine,
  RiAlertLine,
  RiUserLine,
  RiSearchLine,
  RiBankLine,
} from '@remixicon/react';
import Link from 'next/link';

import {
  fetchWithdrawOrderList,
  fetchWithdrawOrderDetail,
  fetchBankOptions,
  fetchAdminOptions,
  approveWithdrawOrder,
  rejectWithdrawOrder,
  batchApproveWithdraw,
  batchRejectWithdraw,
  queryUpstreamStatus,
  dismissPayoutFailed,
  retryPayout,
  fetchTransferChannels,
} from '@/services/withdraw-orders';
import {
  CopyButton,
  AmountDisplay,
  TimeDisplay,
  WithdrawStatusBadge,
} from '@/components/common';
import { StatisticCard, StatisticCardGroup } from '@/components/common/StatisticCard';
import { QuickFilters, ListPageSkeleton, BatchOperationBar, getWithdrawRowClassName, HIGHLIGHT_ROW_STYLES } from '@/components/tables';
import type { FilterOption } from '@/components/tables';
import { DetailDrawer, DetailSection, BatchResultModal, ConfirmModal } from '@/components/modals';
import { UserInfoCard } from '@/components/business';
import type {
  WithdrawOrderListItem,
  WithdrawOrderListParams,
  WithdrawOrderDetail,
  WithdrawOrderSummary,
  WithdrawOrderStatus,
  BankOption,
  AdminOption,
  TransferChannelOption,
} from '@/types/withdraw-orders';
import { WITHDRAW_STATUS_OPTIONS, COMMON_REJECT_REASONS, COMMON_DISMISS_REASONS } from '@/types/withdraw-orders';

const { Text, Paragraph } = Typography;

/**
 * 状态Tab快捷筛选配置
 * @description 依据：04.4.3-提现订单列表页.md 第2.2节
 */
interface StatusTabOption extends FilterOption<string> {
  badgeColor?: string;
}

/**
 * 提现订单列表页面
 * @description 依据：04.4.3-提现订单列表页.md
 */
export default function WithdrawOrdersPage() {
  const searchParams = useSearchParams();
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const [rejectForm] = Form.useForm();

  // 首次加载状态（用于骨架屏）
  const [initialLoading, setInitialLoading] = useState(true);

  // 快捷筛选状态（状态Tab）
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_REVIEW');
  const statusFilterMounted = useRef(false);

  // 汇总统计数据
  const [summary, setSummary] = useState<WithdrawOrderSummary>({
    pendingCount: 0,
    pendingAmount: '0',
    payoutFailedCount: 0,
    payoutFailedAmount: '0',
    todayCompletedCount: 0,
    todayCompletedAmount: '0',
    todayRejectedCount: 0,
  });

  // 银行选项
  const [bankOptions, setBankOptions] = useState<BankOption[]>([]);

  // 管理员选项（审核人筛选）
  const [adminOptions, setAdminOptions] = useState<AdminOption[]>([]);

  // 选中的行
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<WithdrawOrderListItem[]>([]);

  // 详情抽屉状态
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<WithdrawOrderDetail | null>(null);

  // 审核确认弹窗
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [currentReviewOrder, setCurrentReviewOrder] = useState<WithdrawOrderListItem | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  // 批量审核确认弹窗
  const [batchApproveModalOpen, setBatchApproveModalOpen] = useState(false);
  const [batchRejectModalOpen, setBatchRejectModalOpen] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  // 批量结果弹窗
  const [batchResultOpen, setBatchResultOpen] = useState(false);
  const [batchResultData, setBatchResultData] = useState<{
    operationName: string;
    total: number;
    successCount: number;
    failedCount: number;
    failedRecords: { id: string | number; name?: string; reason: string }[];
  } | null>(null);

  // 查询上游状态
  const [queryingUpstream, setQueryingUpstream] = useState<number | null>(null);

  // 驳回代付失败弹窗
  const [dismissModalOpen, setDismissModalOpen] = useState(false);
  const [currentDismissOrder, setCurrentDismissOrder] = useState<WithdrawOrderListItem | null>(null);
  const [dismissLoading, setDismissLoading] = useState(false);
  const [dismissForm] = Form.useForm();

  // 重试代付弹窗
  const [retryModalOpen, setRetryModalOpen] = useState(false);
  const [currentRetryOrder, setCurrentRetryOrder] = useState<WithdrawOrderListItem | null>(null);
  const [retryLoading, setRetryLoading] = useState(false);
  const [transferChannels, setTransferChannels] = useState<TransferChannelOption[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [channelsLoading, setChannelsLoading] = useState(false);

  /**
   * 状态Tab选项
   */
  const statusTabOptions = useMemo((): StatusTabOption[] => {
    return [
      { value: '', label: '全部' },
      {
        value: 'PENDING_REVIEW',
        label: '待审核',
        count: summary.pendingCount,
        badgeColor: '#ff4d4f',
      },
      { value: 'APPROVED', label: '已通过' },
      {
        value: 'PAYOUT_FAILED',
        label: '代付失败',
        count: summary.payoutFailedCount,
        badgeColor: '#fa541c',
      },
      { value: 'COMPLETED', label: '已完成' },
      { value: 'FAILED', label: '已退款' },
      { value: 'REJECTED', label: '已拒绝' },
    ];
  }, [summary.pendingCount, summary.payoutFailedCount]);

  /**
   * 从 URL 参数获取初始筛选条件
   */
  const getInitialParams = useCallback((): Partial<WithdrawOrderListParams> => {
    const params: Partial<WithdrawOrderListParams> = {};

    // 用户ID（支持从用户详情页跳转过来）
    const userId = searchParams.get('userId');
    if (userId) {
      params.userId = Number(userId);
    }

    return params;
  }, [searchParams]);

  /**
   * 加载银行和管理员选项
   */
  const loadOptions = useCallback(async () => {
    try {
      const [banksRes, adminsRes] = await Promise.all([
        fetchBankOptions(),
        fetchAdminOptions(),
      ]);
      setBankOptions(banksRes.list);
      setAdminOptions(adminsRes.list);
    } catch (error) {
      console.error('加载筛选选项失败:', error);
    }
  }, []);

  /**
   * 查看订单详情
   */
  const handleViewDetail = useCallback(async (record: WithdrawOrderListItem) => {
    setDetailDrawerOpen(true);
    setDetailLoading(true);
    try {
      const detail = await fetchWithdrawOrderDetail(record.id);
      setCurrentOrder(detail);
    } catch (error) {
      message.error('加载订单详情失败');
      console.error('加载订单详情失败:', error);
    } finally {
      setDetailLoading(false);
    }
  }, [message]);

  /**
   * 打开审核通过确认弹窗
   */
  const openApproveModal = useCallback((record: WithdrawOrderListItem) => {
    setCurrentReviewOrder(record);
    setApproveModalOpen(true);
  }, []);

  /**
   * 打开审核拒绝弹窗
   */
  const openRejectModal = useCallback((record: WithdrawOrderListItem) => {
    setCurrentReviewOrder(record);
    rejectForm.resetFields();
    setRejectModalOpen(true);
  }, [rejectForm]);

  /**
   * 执行审核通过
   */
  const handleApprove = useCallback(async () => {
    if (!currentReviewOrder) return;

    setReviewLoading(true);
    try {
      await approveWithdrawOrder({ id: currentReviewOrder.id });
      message.success('审核通过，已提交代付');
      setApproveModalOpen(false);
      setCurrentReviewOrder(null);
      actionRef.current?.reload();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '审核失败';
      message.error(errorMessage);
    } finally {
      setReviewLoading(false);
    }
  }, [currentReviewOrder, message]);

  /**
   * 执行审核拒绝
   */
  const handleReject = useCallback(async () => {
    if (!currentReviewOrder) return;

    const values = await rejectForm.validateFields();

    setReviewLoading(true);
    try {
      await rejectWithdrawOrder({
        id: currentReviewOrder.id,
        reason: values.reason,
      });
      message.success('已拒绝，余额已退回');
      setRejectModalOpen(false);
      setCurrentReviewOrder(null);
      rejectForm.resetFields();
      actionRef.current?.reload();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '审核失败';
      message.error(errorMessage);
    } finally {
      setReviewLoading(false);
    }
  }, [currentReviewOrder, rejectForm, message]);

  /**
   * 在详情抽屉中执行审核
   */
  const handleDetailApprove = useCallback(async () => {
    if (!currentOrder) return;
    
    setReviewLoading(true);
    try {
      await approveWithdrawOrder({ id: currentOrder.id });
      message.success('审核通过，已提交代付');
      setDetailDrawerOpen(false);
      setCurrentOrder(null);
      actionRef.current?.reload();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '审核失败';
      message.error(errorMessage);
    } finally {
      setReviewLoading(false);
    }
  }, [currentOrder, message]);

  const handleDetailReject = useCallback(async () => {
    if (!currentOrder) return;
    
    // 打开拒绝弹窗
    setCurrentReviewOrder(currentOrder as WithdrawOrderListItem);
    setDetailDrawerOpen(false);
    rejectForm.resetFields();
    setRejectModalOpen(true);
  }, [currentOrder, rejectForm]);

  /**
   * 批量审核通过
   */
  const handleBatchApprove = useCallback(async () => {
    setBatchLoading(true);
    try {
      const result = await batchApproveWithdraw({ ids: selectedRowKeys.map(Number) });
      setBatchApproveModalOpen(false);

      setBatchResultData({
        operationName: '批量审核通过',
        total: result.total,
        successCount: result.succeeded,
        failedCount: result.failed,
        failedRecords: result.results
          .filter((r) => !r.success)
          .map((r) => ({
            id: r.id,
            name: r.orderNo,
            reason: r.error?.message || '未知错误',
          })),
      });
      setBatchResultOpen(true);

      // 清空选中
      setSelectedRowKeys([]);
      setSelectedRows([]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '批量审核失败';
      message.error(errorMessage);
    } finally {
      setBatchLoading(false);
    }
  }, [selectedRowKeys, message]);

  /**
   * 批量审核拒绝
   */
  const handleBatchReject = useCallback(async () => {
    const values = await rejectForm.validateFields();

    setBatchLoading(true);
    try {
      const result = await batchRejectWithdraw({
        ids: selectedRowKeys.map(Number),
        reason: values.reason,
      });
      setBatchRejectModalOpen(false);
      rejectForm.resetFields();

      setBatchResultData({
        operationName: '批量审核拒绝',
        total: result.total,
        successCount: result.succeeded,
        failedCount: result.failed,
        failedRecords: result.results
          .filter((r) => !r.success)
          .map((r) => ({
            id: r.id,
            name: r.orderNo,
            reason: r.error?.message || '未知错误',
          })),
      });
      setBatchResultOpen(true);

      // 清空选中
      setSelectedRowKeys([]);
      setSelectedRows([]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '批量审核失败';
      message.error(errorMessage);
    } finally {
      setBatchLoading(false);
    }
  }, [selectedRowKeys, rejectForm, message]);

  /**
   * 查询上游状态
   */
  const handleQueryUpstream = useCallback(async (record: WithdrawOrderListItem) => {
    setQueryingUpstream(record.id);
    try {
      const result = await queryUpstreamStatus(record.id);

      if (result.updated) {
        if (result.newStatus === 'COMPLETED') {
          message.success('代付已完成');
        } else if (result.newStatus === 'FAILED') {
          message.warning(`代付失败: ${result.errorMessage || '未知原因'}`);
        }
        actionRef.current?.reload();
      } else {
        message.info('订单仍在处理中');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '查询上游状态失败';
      message.error(errorMessage);
    } finally {
      setQueryingUpstream(null);
    }
  }, [message]);

  /**
   * 打开驳回代付失败弹窗
   */
  const openDismissModal = useCallback((record: WithdrawOrderListItem) => {
    setCurrentDismissOrder(record);
    dismissForm.resetFields();
    setDismissModalOpen(true);
  }, [dismissForm]);

  /**
   * 执行驳回代付失败
   */
  const handleDismiss = useCallback(async () => {
    if (!currentDismissOrder) return;
    const values = await dismissForm.validateFields().catch(() => ({ reason: undefined }));
    setDismissLoading(true);
    try {
      await dismissPayoutFailed({ id: currentDismissOrder.id, reason: values.reason });
      message.success('已驳回，余额已退回用户');
      setDismissModalOpen(false);
      setCurrentDismissOrder(null);
      dismissForm.resetFields();
      actionRef.current?.reload();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '驳回失败';
      message.error(errorMessage);
    } finally {
      setDismissLoading(false);
    }
  }, [currentDismissOrder, dismissForm, message]);

  /**
   * 打开重试代付弹窗
   */
  const openRetryModal = useCallback(async (record: WithdrawOrderListItem) => {
    setCurrentRetryOrder(record);
    setSelectedChannelId(null);
    setRetryModalOpen(true);
    // 加载可用通道列表
    setChannelsLoading(true);
    try {
      const res = await fetchTransferChannels(
        record.channelCode ? undefined : undefined
      );
      setTransferChannels(res.list);
    } catch {
      message.error('获取代付通道列表失败');
    } finally {
      setChannelsLoading(false);
    }
  }, [message]);

  /**
   * 执行重试代付
   */
  const handleRetry = useCallback(async () => {
    if (!currentRetryOrder || !selectedChannelId) return;
    setRetryLoading(true);
    try {
      await retryPayout({ id: currentRetryOrder.id, channelId: selectedChannelId });
      message.success('已重新提交代付');
      setRetryModalOpen(false);
      setCurrentRetryOrder(null);
      setSelectedChannelId(null);
      actionRef.current?.reload();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '重试失败';
      message.error(errorMessage);
    } finally {
      setRetryLoading(false);
    }
  }, [currentRetryOrder, selectedChannelId, message]);

  /**
   * 状态Tab变化处理
   */
  const handleStatusFilterChange = useCallback((value: string | string[] | undefined) => {
    setStatusFilter((value as string) || '');
  }, []);

  useEffect(() => {
    if (!statusFilterMounted.current) {
      statusFilterMounted.current = true;
      return;
    }
    actionRef.current?.reload();
  }, [statusFilter]);

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
   * 计算选中订单的总金额
   */
  const selectedTotalAmount = useMemo(() => {
    return selectedRows.reduce((sum, row) => sum + parseFloat(row.amount || '0'), 0);
  }, [selectedRows]);

  const selectedTotalActualAmount = useMemo(() => {
    return selectedRows.reduce((sum, row) => sum + parseFloat(row.actualAmount || '0'), 0);
  }, [selectedRows]);

  /**
   * 表格列配置
   * @description 依据：04.4.3-提现订单列表页.md 第3节
   */
  const columns: ProColumns<WithdrawOrderListItem>[] = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      width: 200,
      fixed: 'left',
      hideInSearch: true,
      render: (_, record) => (
        <CopyButton text={record.orderNo} showText monospace maxLength={20} />
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
      title: '申请金额',
      dataIndex: 'amount',
      width: 120,
      align: 'right',
      sorter: true,
      hideInSearch: true,
      render: (_, record) => (
        <AmountDisplay value={record.amount} style={{ color: '#ff4d4f', fontWeight: 500 }} />
      ),
    },
    {
      title: '手续费',
      dataIndex: 'fee',
      width: 100,
      align: 'right',
      hideInSearch: true,
      render: (_, record) => <AmountDisplay value={record.fee} />,
    },
    {
      title: '实际到账',
      dataIndex: 'actualAmount',
      width: 120,
      align: 'right',
      hideInSearch: true,
      render: (_, record) => (
        <AmountDisplay value={record.actualAmount} style={{ color: '#52c41a' }} />
      ),
    },
    {
      title: '收款信息',
      dataIndex: 'bankCardSnapshot',
      width: 200,
      hideInSearch: true,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 13 }}>{record.bankCardSnapshot?.bankName || '-'}</Text>
          <Text type="secondary" style={{ fontSize: 12, fontFamily: 'Roboto Mono, monospace' }}>
            {record.bankCardSnapshot?.accountNoMask || '-'}
          </Text>
        </Space>
      ),
    },
    {
      title: '免审标记',
      dataIndex: 'isAutoApproved',
      width: 80,
      align: 'center',
      hideInSearch: true,
      render: (_, record) =>
        record.isAutoApproved ? (
          <Tag color="green">免审</Tag>
        ) : null,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center',
      valueType: 'select',
      fieldProps: {
        mode: 'multiple',
        options: WITHDRAW_STATUS_OPTIONS,
      },
      render: (_, record) => <WithdrawStatusBadge status={record.status} />,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      valueType: 'dateRange',
      sorter: true,
      render: (_, record) => <TimeDisplay value={record.createdAt} format="YYYY-MM-DD HH:mm" />,
      search: {
        transform: (value) => ({
          startDate: value?.[0],
          endDate: value?.[1],
        }),
      },
    },
    {
      title: '审核时间',
      dataIndex: 'reviewedAt',
      width: 160,
      hideInSearch: true,
      sorter: true,
      render: (_, record) =>
        record.reviewedAt ? (
          <TimeDisplay value={record.reviewedAt} format="YYYY-MM-DD HH:mm" />
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: '审核人',
      dataIndex: 'reviewedByName',
      width: 100,
      align: 'center',
      hideInSearch: true,
      render: (_, record) =>
        record.reviewedByName ? (
          <Text>{record.reviewedByName}</Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: '代付信息',
      dataIndex: 'channelName',
      width: 200,
      hideInSearch: true,
      render: (_, record) => {
        if (!record.channelName) return <Text type="secondary">-</Text>;
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: 13 }}>{record.channelName}</Text>
            {record.channelOrderNo && record.channelOrderNo !== record.orderNo && (
              <CopyButton text={record.channelOrderNo} showText monospace maxLength={20} />
            )}
            {record.thirdOrderNo && (
              <CopyButton text={record.thirdOrderNo} showText monospace maxLength={25} />
            )}
          </Space>
        );
      },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      fixed: 'right',
      render: (_, record) => {
        const actions = [
          <a key="detail" onClick={() => handleViewDetail(record)}>
            详情
          </a>,
        ];

        // 待审核状态显示通过/拒绝按钮
        if (record.status === 'PENDING_REVIEW') {
          actions.push(
            <a key="approve" style={{ color: '#52c41a' }} onClick={() => openApproveModal(record)}>
              通过
            </a>,
            <a key="reject" style={{ color: '#ff4d4f' }} onClick={() => openRejectModal(record)}>
              拒绝
            </a>
          );
        }

        // 已通过状态显示查询代付按钮
        if (record.status === 'APPROVED') {
          // 有通道信息：显示查询代付按钮
          if (record.channelName) {
            actions.push(
              <a
                key="query"
                onClick={() => handleQueryUpstream(record)}
                style={{ color: queryingUpstream === record.id ? '#8c8c8c' : undefined }}
              >
                {queryingUpstream === record.id ? '查询中...' : '查询代付'}
              </a>
            );
          } else {
            // 无通道信息：代付提交失败，显示重试代付按钮
            actions.push(
              <a key="retry" style={{ color: '#1677ff' }} onClick={() => openRetryModal(record)}>
                重试代付
              </a>
            );
          }
        }

        // 代付失败状态显示驳回退款和重试代付按钮
        if (record.status === 'PAYOUT_FAILED') {
          actions.push(
            <a key="retry" style={{ color: '#1677ff' }} onClick={() => openRetryModal(record)}>
              重试代付
            </a>,
            <a key="dismiss" style={{ color: '#ff4d4f' }} onClick={() => openDismissModal(record)}>
              驳回退款
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
      title: '收款银行',
      dataIndex: 'bankCode',
      key: 'bankCode_search',
      hideInTable: true,
      order: 7,
      valueType: 'select',
      fieldProps: {
        mode: 'multiple',
        placeholder: '选择银行',
        options: bankOptions.map((b) => ({ value: b.code, label: b.name })),
        maxTagCount: 2,
      },
    },
    {
      title: '收款账号',
      dataIndex: 'accountNo',
      hideInTable: true,
      order: 6,
      fieldProps: {
        placeholder: '输入收款账号',
      },
    },
    {
      title: '是否免审',
      dataIndex: '_searchIsAutoApproved',
      key: 'isAutoApproved_search',
      hideInTable: true,
      order: 5,
      valueType: 'select',
      fieldProps: {
        placeholder: '全部',
        options: [
          { value: true, label: '是' },
          { value: false, label: '否' },
        ],
      },
      search: {
        transform: (value: boolean) => ({ isAutoApproved: value }),
      },
    },
    {
      title: '审核人',
      dataIndex: 'reviewedBy',
      key: 'reviewedBy_search',
      hideInTable: true,
      order: 4,
      valueType: 'select',
      fieldProps: {
        placeholder: '选择审核人',
        options: adminOptions.map((a) => ({ value: a.id, label: a.name })),
        showSearch: true,
        optionFilterProp: 'label',
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

  // 缓存 ProTable params，防止 setSummary 触发重渲染时创建新对象导致重复请求
  const proTableParams = useMemo(() => ({ statusFilter }), [statusFilter]);

  // 首次加载
  useEffect(() => {
    loadOptions();
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [loadOptions]);

  // 骨架屏
  if (initialLoading) {
    return (
      <div className="withdraw-orders-page">
        <ListPageSkeleton showSearch searchCount={8} rows={10} columns={10} />
      </div>
    );
  }

  return (
    <div className="withdraw-orders-page">
      {/* 统计卡片区 */}
      <StatisticCardGroup columns={5} gap={16} style={{ marginBottom: 16 }}>
        {/* 待审核数量 - 红色高亮 */}
        <StatisticCard
          title="待审核数量"
          value={summary.pendingCount}
          suffix="笔"
          size="large"
          valueStyle={{
            color: summary.pendingCount > 0 ? '#ff4d4f' : '#262626',
          }}
          prefix={<RiAlertLine size={20} style={{ color: summary.pendingCount > 0 ? '#ff4d4f' : '#8c8c8c' }} />}
          style={{
            background: summary.pendingCount > 0 
              ? 'linear-gradient(135deg, #fff1f0 0%, #fff 100%)'
              : undefined,
            borderColor: summary.pendingCount > 0 ? '#ffccc7' : undefined,
          }}
          onClick={() => {
            setStatusFilter('PENDING_REVIEW');
          }}
        />
        {/* 待审核金额 */}
        <StatisticCard
          title="待审核金额"
          value={summary.pendingAmount}
          isCurrency
          size="large"
          valueStyle={{ color: '#fa8c16' }}
          style={{
            borderLeft: '3px solid #fa8c16',
          }}
        />
        {/* 代付失败待处理 */}
        <StatisticCard
          title="代付失败"
          value={summary.payoutFailedCount || 0}
          suffix="笔"
          size="large"
          valueStyle={{
            color: (summary.payoutFailedCount || 0) > 0 ? '#fa541c' : '#262626',
          }}
          prefix={<RiErrorWarningLine size={20} style={{ color: (summary.payoutFailedCount || 0) > 0 ? '#fa541c' : '#8c8c8c' }} />}
          style={{
            background: (summary.payoutFailedCount || 0) > 0
              ? 'linear-gradient(135deg, #fff2e8 0%, #fff 100%)'
              : undefined,
            borderColor: (summary.payoutFailedCount || 0) > 0 ? '#ffd8bf' : undefined,
          }}
          onClick={() => {
            setStatusFilter('PAYOUT_FAILED');
          }}
        />
        {/* 今日完成 */}
        <StatisticCard
          title="今日完成"
          value={summary.todayCompletedCount || 0}
          suffix="笔"
          size="large"
          valueStyle={{ color: '#52c41a' }}
          tooltip="今日审核通过并代付成功的订单"
        />
        {/* 今日拒绝 */}
        <StatisticCard
          title="今日拒绝"
          value={summary.todayRejectedCount || 0}
          suffix="笔"
          size="large"
          valueStyle={{ color: '#8c8c8c' }}
        />
      </StatisticCardGroup>

      {/* 状态Tab快捷筛选 */}
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
          options={statusTabOptions}
          value={statusFilter}
          onChange={handleStatusFilterChange}
        />
      </div>

      <ProTable<WithdrawOrderListItem>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 1800 }}
        rowClassName={(record) => getWithdrawRowClassName(record, 0)}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys, rows) => {
            setSelectedRowKeys(keys);
            setSelectedRows(rows);
          },
          preserveSelectedRowKeys: true,
          // 仅待审核状态可选
          getCheckboxProps: (record) => ({
            disabled: record.status !== 'PENDING_REVIEW',
          }),
        }}
        tableAlertRender={false}
        params={proTableParams}
        request={async (params, sort) => {
          // 合并 URL 参数
          const initialParams = getInitialParams();

          const mergedParams: WithdrawOrderListParams = {
            ...initialParams,
            page: params.current,
            pageSize: params.pageSize,
            orderNo: params.orderNo,
            userId: params.userId,
            userPhone: params.userPhone,
            bankCode: params.bankCode,
            accountNo: params.accountNo,
            status: statusFilter
              ? [statusFilter as WithdrawOrderStatus]
              : (params.status as WithdrawOrderStatus[]),
            reviewedBy: params.reviewedBy,
            isAutoApproved: params.isAutoApproved,
            startDate: params.startDate,
            endDate: params.endDate,
            amountMin: params.amountMin,
            amountMax: params.amountMax,
          };

          try {
            const data = await fetchWithdrawOrderList(mergedParams);
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
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total) => `共 ${total} 条`,
        }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: true,
        }}
        headerTitle="提现订单列表"
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
              key: 'approve',
              label: '批量通过',
              icon: <RiCheckLine size={16} />,
              onClick: () => setBatchApproveModalOpen(true),
              loading: batchLoading,
            },
            {
              key: 'reject',
              label: '批量拒绝',
              danger: true,
              icon: <RiCloseLine size={16} />,
              onClick: () => {
                rejectForm.resetFields();
                setBatchRejectModalOpen(true);
              },
              loading: batchLoading,
            },
          ]}
        />
      )}

      {/* 订单详情抽屉 */}
      <DetailDrawer
        open={detailDrawerOpen}
        onClose={closeDetailDrawer}
        title="提现订单详情"
        subtitle={currentOrder?.orderNo}
        status={
          currentOrder?.status === 'COMPLETED'
            ? 'success'
            : currentOrder?.status === 'PENDING_REVIEW'
              ? 'warning'
              : currentOrder?.status === 'APPROVED'
                ? 'pending'
                : currentOrder?.status === 'PAYOUT_FAILED'
                  ? 'warning'
                  : currentOrder?.status === 'FAILED' || currentOrder?.status === 'REJECTED'
                    ? 'error'
                    : 'info'
        }
        statusText={
          WITHDRAW_STATUS_OPTIONS.find((o) => o.value === currentOrder?.status)?.label || ''
        }
        loading={detailLoading}
        width={700}
        footer={
          currentOrder?.status === 'PENDING_REVIEW' ? (
            <Space>
              <Button onClick={closeDetailDrawer}>取消</Button>
              <Button danger onClick={handleDetailReject} loading={reviewLoading}>
                拒绝
              </Button>
              <Button type="primary" onClick={handleDetailApprove} loading={reviewLoading}>
                通过
              </Button>
            </Space>
          ) : currentOrder?.status === 'PAYOUT_FAILED' ? (
            <Space>
              <Button onClick={closeDetailDrawer}>取消</Button>
              <Button danger onClick={() => {
                setDetailDrawerOpen(false);
                if (currentOrder) openDismissModal(currentOrder as unknown as WithdrawOrderListItem);
              }}>
                驳回退款
              </Button>
              <Button type="primary" onClick={() => {
                setDetailDrawerOpen(false);
                if (currentOrder) openRetryModal(currentOrder as unknown as WithdrawOrderListItem);
              }}>
                重试代付
              </Button>
            </Space>
          ) : null
        }
      >
        {currentOrder && (
          <>
            {/* 订单信息 */}
            <DetailSection title="订单信息">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="订单号">
                  <CopyButton text={currentOrder.orderNo} showText monospace />
                </Descriptions.Item>
                <Descriptions.Item label="用户信息">
                  <Link href={`/users/${currentOrder.userId}`}>
                    {currentOrder.userId} / {currentOrder.userPhone}
                  </Link>
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  <TimeDisplay value={currentOrder.createdAt} />
                </Descriptions.Item>
                <Descriptions.Item label="创建IP">{currentOrder.createIp}</Descriptions.Item>
                <Descriptions.Item label="是否免审">
                  {currentOrder.isAutoApproved ? (
                    <Tag color="green">是</Tag>
                  ) : (
                    <Text type="secondary">否</Text>
                  )}
                </Descriptions.Item>
                {currentOrder.isAutoApproved && currentOrder.autoApproveReason && (
                  <Descriptions.Item label="免审原因">
                    {currentOrder.autoApproveReason}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </DetailSection>

            {/* 金额信息 */}
            <DetailSection title="金额信息">
              <Descriptions column={3} size="small">
                <Descriptions.Item label="申请金额">
                  <AmountDisplay value={currentOrder.amount} style={{ color: '#ff4d4f', fontWeight: 500 }} />
                </Descriptions.Item>
                <Descriptions.Item label="手续费">
                  <AmountDisplay value={currentOrder.fee} />
                </Descriptions.Item>
                <Descriptions.Item label="实际到账">
                  <AmountDisplay value={currentOrder.actualAmount} style={{ color: '#52c41a', fontWeight: 500 }} />
                </Descriptions.Item>
              </Descriptions>
            </DetailSection>

            {/* 收款银行卡信息（申请时快照） */}
            <DetailSection title="收款银行卡（申请时快照）">
              <div
                style={{
                  background: '#fafafa',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 8,
                }}
              >
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="银行名称">
                    {currentOrder.bankCardSnapshot.bankName}
                  </Descriptions.Item>
                  <Descriptions.Item label="银行编码">
                    {currentOrder.bankCardSnapshot.bankCode}
                  </Descriptions.Item>
                  <Descriptions.Item label="收款人姓名">
                    {currentOrder.bankCardSnapshot.accountName}
                  </Descriptions.Item>
                  <Descriptions.Item label="收款账号">
                    <CopyButton text={currentOrder.bankCardSnapshot.accountNo} showText monospace />
                  </Descriptions.Item>
                  {currentOrder.bankCardSnapshot.phone && (
                    <Descriptions.Item label="收款手机">
                      {currentOrder.bankCardSnapshot.phone}
                    </Descriptions.Item>
                  )}
                  {currentOrder.bankCardSnapshot.documentType && (
                    <Descriptions.Item label="证件类型">
                      {currentOrder.bankCardSnapshot.documentType}
                    </Descriptions.Item>
                  )}
                  {currentOrder.bankCardSnapshot.documentNo && (
                    <Descriptions.Item label="证件号码">
                      {currentOrder.bankCardSnapshot.documentNo}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                此处显示的是用户申请提现时的银行卡信息快照，用于审计追溯
              </Text>
            </DetailSection>

            {/* 审核信息 */}
            <DetailSection title="审核信息">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="审核状态">
                  <WithdrawStatusBadge status={currentOrder.status} />
                </Descriptions.Item>
                <Descriptions.Item label="审核人">
                  {currentOrder.reviewedByName || <Text type="secondary">-</Text>}
                </Descriptions.Item>
                <Descriptions.Item label="审核时间">
                  {currentOrder.reviewedAt ? (
                    <TimeDisplay value={currentOrder.reviewedAt} />
                  ) : (
                    <Text type="secondary">-</Text>
                  )}
                </Descriptions.Item>
                {currentOrder.rejectReason && (
                  <Descriptions.Item label="拒绝原因" span={2}>
                    <Text type="danger">{currentOrder.rejectReason}</Text>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </DetailSection>

            {/* 代付信息（审核通过后显示） */}
            {(currentOrder.status === 'APPROVED' ||
              currentOrder.status === 'PAYOUT_FAILED' ||
              currentOrder.status === 'COMPLETED' ||
              currentOrder.status === 'FAILED') && (
              <DetailSection title="代付信息">
                <Descriptions column={2} size="small">
                  {currentOrder.channelName && (
                    <Descriptions.Item label="代付通道">
                      {currentOrder.channelName}
                    </Descriptions.Item>
                  )}
                  {currentOrder.thirdOrderNo && (
                    <Descriptions.Item label="第三方订单号">
                      <CopyButton text={currentOrder.thirdOrderNo} showText monospace />
                    </Descriptions.Item>
                  )}
                  {currentOrder.callbackAt && (
                    <Descriptions.Item label="回调时间">
                      <TimeDisplay value={currentOrder.callbackAt} />
                    </Descriptions.Item>
                  )}
                  {currentOrder.retryCount !== undefined && currentOrder.retryCount > 0 && (
                    <Descriptions.Item label="重试次数">
                      <Tag color="orange">{currentOrder.retryCount} 次</Tag>
                    </Descriptions.Item>
                  )}
                </Descriptions>
                {/* 代付失败原因（PAYOUT_FAILED 状态显示） */}
                {currentOrder.status === 'PAYOUT_FAILED' && currentOrder.payoutFailReason && (
                  <div style={{ marginTop: 12, padding: '8px 12px', background: '#fff2e8', borderRadius: 6, border: '1px solid #ffd8bf' }}>
                    <Text type="warning" style={{ fontSize: 13 }}>
                      <RiErrorWarningLine size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />
                      代付失败原因：{currentOrder.payoutFailReason}
                    </Text>
                  </div>
                )}
                {/* 代付尝试历史 */}
                {currentOrder.payoutAttempts && currentOrder.payoutAttempts.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <Text strong style={{ fontSize: 13, marginBottom: 8, display: 'block' }}>代付尝试记录</Text>
                    {currentOrder.payoutAttempts.map((attempt, idx) => (
                      <div key={idx} style={{ padding: '6px 12px', background: '#fafafa', borderRadius: 4, marginBottom: 4, fontSize: 12 }}>
                        <Space size={12}>
                          <span>#{attempt.attemptNo}</span>
                          <span>{attempt.channelCode || attempt.channelName}</span>
                          <Tag color={attempt.status === 'SUCCESS' ? 'green' : attempt.status === 'FAILED' ? 'red' : 'blue'} style={{ margin: 0 }}>
                            {attempt.status === 'SUCCESS' ? '成功' : attempt.status === 'FAILED' ? '失败' : '处理中'}
                          </Tag>
                          {attempt.failReason && <Text type="secondary">{attempt.failReason}</Text>}
                          {attempt.submittedAt && <Text type="secondary">{attempt.submittedAt.substring(0, 19).replace('T', ' ')}</Text>}
                        </Space>
                      </div>
                    ))}
                  </div>
                )}
              </DetailSection>
            )}
          </>
        )}
      </DetailDrawer>

      {/* 审核通过确认弹窗 */}
      <ConfirmModal
        open={approveModalOpen}
        onClose={() => {
          setApproveModalOpen(false);
          setCurrentReviewOrder(null);
        }}
        onConfirm={handleApprove}
        title="确认审核通过？"
        type="confirm"
        confirmText="确认通过"
        loading={reviewLoading}
        content={
          currentReviewOrder && (
            <div style={{ textAlign: 'left' }}>
              <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="订单号">
                  {currentReviewOrder.orderNo}
                </Descriptions.Item>
                <Descriptions.Item label="用户">
                  {currentReviewOrder.userPhone}
                </Descriptions.Item>
                <Descriptions.Item label="申请金额">
                  <AmountDisplay value={currentReviewOrder.amount} />
                </Descriptions.Item>
                <Descriptions.Item label="实际到账">
                  <AmountDisplay value={currentReviewOrder.actualAmount} />
                </Descriptions.Item>
                <Descriptions.Item label="收款银行">
                  {currentReviewOrder.bankCardSnapshot.bankName}
                </Descriptions.Item>
                <Descriptions.Item label="收款账号">
                  {currentReviewOrder.bankCardSnapshot.accountNoMask}
                </Descriptions.Item>
              </Descriptions>
              <Text type="secondary">审核通过后将自动提交代付通道处理</Text>
            </div>
          )
        }
      />

      {/* 审核拒绝弹窗 */}
      <ConfirmModal
        open={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setCurrentReviewOrder(null);
          rejectForm.resetFields();
        }}
        onConfirm={handleReject}
        title="审核拒绝"
        type="warning"
        danger
        confirmText="确认拒绝"
        loading={reviewLoading}
        content={
          <div style={{ textAlign: 'left' }}>
            {currentReviewOrder && (
              <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="订单号">
                  {currentReviewOrder.orderNo}
                </Descriptions.Item>
                <Descriptions.Item label="申请金额">
                  <AmountDisplay value={currentReviewOrder.amount} />
                </Descriptions.Item>
              </Descriptions>
            )}
            <Form form={rejectForm} layout="vertical">
              <Form.Item
                name="reason"
                label="拒绝原因（选填，用户可见）"
              >
                <Input.TextArea rows={3} placeholder="请输入拒绝原因" />
              </Form.Item>
              <div style={{ marginTop: -8, marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>常用原因：</Text>
                <Space size={4} wrap style={{ marginTop: 4 }}>
                  {COMMON_REJECT_REASONS.map((reason) => (
                    <Tag
                      key={reason}
                      style={{ cursor: 'pointer' }}
                      onClick={() => rejectForm.setFieldsValue({ reason })}
                    >
                      {reason}
                    </Tag>
                  ))}
                </Space>
              </div>
            </Form>
            <Text type="secondary">拒绝后冻结金额将自动退回用户可用余额</Text>
          </div>
        }
      />

      {/* 批量通过确认弹窗 */}
      <ConfirmModal
        open={batchApproveModalOpen}
        onClose={() => setBatchApproveModalOpen(false)}
        onConfirm={handleBatchApprove}
        title="确认批量审核通过？"
        type="confirm"
        confirmText="确认批量通过"
        loading={batchLoading}
        content={
          <div style={{ textAlign: 'left' }}>
            <Paragraph>
              已选择 <Text strong>{selectedRowKeys.length}</Text> 笔订单
            </Paragraph>
            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="总申请金额">
                <AmountDisplay value={selectedTotalAmount.toFixed(2)} />
              </Descriptions.Item>
              <Descriptions.Item label="总实际到账">
                <AmountDisplay value={selectedTotalActualAmount.toFixed(2)} />
              </Descriptions.Item>
            </Descriptions>
            <Text type="secondary">审核通过后将自动提交代付通道处理</Text>
          </div>
        }
      />

      {/* 批量拒绝弹窗 */}
      <ConfirmModal
        open={batchRejectModalOpen}
        onClose={() => {
          setBatchRejectModalOpen(false);
          rejectForm.resetFields();
        }}
        onConfirm={handleBatchReject}
        title="批量审核拒绝"
        type="warning"
        danger
        confirmText="确认批量拒绝"
        loading={batchLoading}
        content={
          <div style={{ textAlign: 'left' }}>
            <Paragraph>
              已选择 <Text strong>{selectedRowKeys.length}</Text> 笔订单，
              总金额 <AmountDisplay value={selectedTotalAmount.toFixed(2)} />
            </Paragraph>
            <Form form={rejectForm} layout="vertical">
              <Form.Item
                name="reason"
                label="统一拒绝原因（选填，用户可见）"
              >
                <Input.TextArea rows={3} placeholder="请输入拒绝原因" />
              </Form.Item>
              <div style={{ marginTop: -8, marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>常用原因：</Text>
                <Space size={4} wrap style={{ marginTop: 4 }}>
                  {COMMON_REJECT_REASONS.map((reason) => (
                    <Tag
                      key={reason}
                      style={{ cursor: 'pointer' }}
                      onClick={() => rejectForm.setFieldsValue({ reason })}
                    >
                      {reason}
                    </Tag>
                  ))}
                </Space>
              </div>
            </Form>
            <Text type="secondary">拒绝后冻结金额将自动退回用户可用余额</Text>
          </div>
        }
      />

      {/* 批量操作结果弹窗 */}
      <BatchResultModal
        open={batchResultOpen}
        onClose={() => setBatchResultOpen(false)}
        onRefresh={closeBatchResultAndRefresh}
        operationName={batchResultData?.operationName || '批量操作'}
        total={batchResultData?.total || 0}
        successCount={batchResultData?.successCount || 0}
        failedCount={batchResultData?.failedCount || 0}
        failedRecords={batchResultData?.failedRecords || []}
      />

      {/* 驳回代付失败弹窗 */}
      <ConfirmModal
        open={dismissModalOpen}
        onClose={() => {
          setDismissModalOpen(false);
          setCurrentDismissOrder(null);
          dismissForm.resetFields();
        }}
        onConfirm={handleDismiss}
        title="驳回代付失败订单"
        type="warning"
        danger
        confirmText="确认驳回退款"
        loading={dismissLoading}
        content={
          <div style={{ textAlign: 'left' }}>
            {currentDismissOrder && (
              <Descriptions column={1} size="small" style={{ marginBottom: 12 }}>
                <Descriptions.Item label="订单号">{currentDismissOrder.orderNo}</Descriptions.Item>
                <Descriptions.Item label="申请金额"><AmountDisplay value={currentDismissOrder.amount} /></Descriptions.Item>
                {currentDismissOrder.payoutFailReason && (
                  <Descriptions.Item label="失败原因">
                    <Text type="danger">{currentDismissOrder.payoutFailReason}</Text>
                  </Descriptions.Item>
                )}
                {currentDismissOrder.retryCount !== undefined && currentDismissOrder.retryCount > 0 && (
                  <Descriptions.Item label="已重试">{currentDismissOrder.retryCount} 次</Descriptions.Item>
                )}
              </Descriptions>
            )}
            <Form form={dismissForm} layout="vertical">
              <Form.Item name="reason" label="驳回原因（选填，用户可见）">
                <Input.TextArea rows={2} placeholder="请输入驳回原因" />
              </Form.Item>
              <div style={{ marginTop: -8, marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>常用原因：</Text>
                <Space size={4} wrap style={{ marginTop: 4 }}>
                  {COMMON_DISMISS_REASONS.map((reason) => (
                    <Tag key={reason} style={{ cursor: 'pointer' }} onClick={() => dismissForm.setFieldsValue({ reason })}>
                      {reason}
                    </Tag>
                  ))}
                </Space>
              </div>
            </Form>
            <Text type="secondary">确认后冻结金额将退回用户可用余额</Text>
          </div>
        }
      />

      {/* 重试代付弹窗 */}
      <ConfirmModal
        open={retryModalOpen}
        onClose={() => {
          setRetryModalOpen(false);
          setCurrentRetryOrder(null);
          setSelectedChannelId(null);
        }}
        onConfirm={handleRetry}
        title="选择通道重试代付"
        type="confirm"
        confirmText="确认重试"
        loading={retryLoading}
        content={
          <div style={{ textAlign: 'left' }}>
            {currentRetryOrder && (
              <>
                <Descriptions column={1} size="small" style={{ marginBottom: 12 }}>
                  <Descriptions.Item label="订单号">{currentRetryOrder.orderNo}</Descriptions.Item>
                  <Descriptions.Item label="实际到账"><AmountDisplay value={currentRetryOrder.actualAmount} /></Descriptions.Item>
                  {currentRetryOrder.payoutFailReason && (
                    <Descriptions.Item label="失败原因">
                      <Text type="danger">{currentRetryOrder.payoutFailReason}</Text>
                    </Descriptions.Item>
                  )}
                  {currentRetryOrder.channelName && (
                    <Descriptions.Item label="上次通道">{currentRetryOrder.channelName}</Descriptions.Item>
                  )}
                  {currentRetryOrder.retryCount !== undefined && (
                    <Descriptions.Item label="已重试">{currentRetryOrder.retryCount} / 5 次</Descriptions.Item>
                  )}
                </Descriptions>
                <Divider style={{ margin: '12px 0' }} />
              </>
            )}
            <div style={{ marginBottom: 8 }}>
              <Text strong>选择代付通道：</Text>
            </div>
            {channelsLoading ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Text type="secondary">加载通道列表...</Text>
              </div>
            ) : transferChannels.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Text type="secondary">暂无可用代付通道</Text>
              </div>
            ) : (
              <Select
                style={{ width: '100%' }}
                placeholder="请选择代付通道"
                value={selectedChannelId}
                onChange={(val) => setSelectedChannelId(val)}
                options={transferChannels.map((ch) => ({
                  value: ch.id,
                  label: (
                    <Space>
                      <span>{ch.name} ({ch.code})</span>
                      {ch.isCurrentFailed && <Tag color="red" style={{ margin: 0 }}>上次失败</Tag>}
                      {ch.channelStatus === 'WARNING' && <Tag color="orange" style={{ margin: 0 }}>警告</Tag>}
                      {ch.balance && <Text type="secondary" style={{ fontSize: 12 }}>余额: {ch.balance}</Text>}
                      {ch.hourlySuccessRate && <Text type="secondary" style={{ fontSize: 12 }}>成功率: {ch.hourlySuccessRate}%</Text>}
                    </Space>
                  ),
                }))}
              />
            )}
            {!selectedChannelId && (
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                请选择一个代付通道后点击确认重试
              </Text>
            )}
          </div>
        }
      />

      {/* 高亮行样式 */}
      <style jsx global>{`
        ${HIGHLIGHT_ROW_STYLES}
        
        .withdraw-orders-page .ant-pro-table-search {
          margin-bottom: 16px;
          padding: 20px 24px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
      `}</style>
    </div>
  );
}
