/**
 * @file 收益发放异常列表页
 * @description 后台管理系统收益发放异常列表页面，支持搜索筛选、手动补发、批量操作
 * @depends 开发文档/开发文档.md 第13.13.1节 - 收益发放异常列表
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第18节
 */

'use client';

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Tag,
  Space,
  Button,
  Typography,
  App,
  Tooltip,
  Badge,
  Input,
} from 'antd';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import {
  RiRefreshLine,
  RiPlayCircleLine,
  RiCheckboxCircleLine,
  RiAlertLine,
  RiErrorWarningLine,
} from '@remixicon/react';
import Link from 'next/link';

import {
  fetchIncomeExceptionList,
  retryIncomeRecord,
  markIncomeHandled,
  batchRetryIncome,
  batchMarkIncomeHandled,
  fetchProductOptions,
} from '@/services/income-records';
import {
  AmountDisplay,
  TimeDisplay,
  IncomeStatusBadge,
  StatisticCard,
  StatisticCardGroup,
} from '@/components/common';
import { QuickFilters, ListPageSkeleton, BatchOperationBar } from '@/components/tables';
import type { FilterOption } from '@/components/tables';
import { ConfirmModal, BatchResultModal } from '@/components/modals';
import type { FailedRecord } from '@/components/modals';
import { UserInfoCard } from '@/components/business';
import { HIGHLIGHT_ROW_CLASSES } from '@/components/tables/HighlightRow';
import type {
  IncomeExceptionListItem,
  IncomeExceptionListParams,
  IncomeExceptionSummary,
} from '@/types/income-records';
import type { ProductOption } from '@/types/position-orders';
import {
  EXCEPTION_QUICK_FILTERS,
  EXCEPTION_QUICK_FILTER_PARAMS,
  HANDLED_STATUS_OPTIONS,
} from '@/types/income-records';

const { Text, Title } = Typography;
const { TextArea } = Input;

/**
 * 快捷筛选配置
 */
const QUICK_FILTERS: FilterOption<string>[] = [
  { value: 'unhandled', label: '未处理', badgeColor: '#ff4d4f' },
  { value: 'handled', label: '已处理' },
];

/**
 * 收益发放异常列表页面
 * @description 依据：开发文档.md 第13.13.1节
 */
export default function IncomeExceptionsPage() {
  const router = useRouter();
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();

  // 首次加载状态（用于骨架屏）
  const [initialLoading, setInitialLoading] = useState(true);

  // 快捷筛选状态
  const [quickFilter, setQuickFilter] = useState<string | undefined>('unhandled');
  const quickFilterMounted = useRef(false);

  // 产品选项
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);

  // 汇总统计
  const [summary, setSummary] = useState<IncomeExceptionSummary>({
    unhandledCount: 0,
    totalFailedAmount: '0.00',
  });

  // 选中行
  const [selectedRows, setSelectedRows] = useState<IncomeExceptionListItem[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 补发确认弹窗状态
  const [retryModalOpen, setRetryModalOpen] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<IncomeExceptionListItem | null>(null);

  // 标记已处理弹窗状态
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [markLoading, setMarkLoading] = useState(false);
  const [markRemark, setMarkRemark] = useState('');

  // 批量操作结果弹窗状态
  const [batchResultOpen, setBatchResultOpen] = useState(false);
  const [batchResultData, setBatchResultData] = useState({
    operationName: '',
    total: 0,
    successCount: 0,
    failedCount: 0,
    failedRecords: [] as FailedRecord[],
  });

  // 批量操作加载状态
  const [batchRetryLoading, setBatchRetryLoading] = useState(false);
  const [batchMarkLoading, setBatchMarkLoading] = useState(false);

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
   * 打开补发确认弹窗
   */
  const handleOpenRetryModal = useCallback((record: IncomeExceptionListItem) => {
    setCurrentRecord(record);
    setRetryModalOpen(true);
  }, []);

  /**
   * 确认补发
   */
  const handleConfirmRetry = useCallback(async () => {
    if (!currentRecord) return;

    setRetryLoading(true);
    try {
      await retryIncomeRecord(currentRecord.id);
      message.success('补发成功');
      setRetryModalOpen(false);
      setCurrentRecord(null);
      actionRef.current?.reload();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '补发失败，请重试';
      message.error(errorMessage);
    } finally {
      setRetryLoading(false);
    }
  }, [currentRecord, message]);

  /**
   * 打开标记已处理弹窗
   */
  const handleOpenMarkModal = useCallback((record: IncomeExceptionListItem) => {
    setCurrentRecord(record);
    setMarkRemark('');
    setMarkModalOpen(true);
  }, []);

  /**
   * 确认标记已处理
   */
  const handleConfirmMark = useCallback(async () => {
    if (!currentRecord) return;

    setMarkLoading(true);
    try {
      await markIncomeHandled(currentRecord.id, { remark: markRemark || undefined });
      message.success('已标记为已处理');
      setMarkModalOpen(false);
      setCurrentRecord(null);
      setMarkRemark('');
      actionRef.current?.reload();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '标记失败，请重试';
      message.error(errorMessage);
    } finally {
      setMarkLoading(false);
    }
  }, [currentRecord, markRemark, message]);

  /**
   * 批量补发
   */
  const handleBatchRetry = useCallback(async () => {
    if (selectedRows.length === 0) {
      message.warning('请先选择要补发的记录');
      return;
    }

    setBatchRetryLoading(true);
    try {
      const result = await batchRetryIncome({
        ids: selectedRows.map((r) => r.id),
      });

      // 构建失败记录列表
      const failedRecords: FailedRecord[] = result.results
        .filter((r) => !r.success)
        .map((r) => {
          const record = selectedRows.find((row) => row.id === r.id);
          return {
            id: r.id,
            name: record ? `${record.userPhone} - 第${record.settleSequence}次` : `#${r.id}`,
            reason: r.error?.message || '未知错误',
          };
        });

      setBatchResultData({
        operationName: '批量补发',
        total: result.total,
        successCount: result.succeeded,
        failedCount: result.failed,
        failedRecords,
      });
      setBatchResultOpen(true);

      // 清空选中
      setSelectedRows([]);
      setSelectedRowKeys([]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '批量补发失败';
      message.error(errorMessage);
    } finally {
      setBatchRetryLoading(false);
    }
  }, [selectedRows, message]);

  /**
   * 批量标记已处理
   */
  const handleBatchMark = useCallback(async () => {
    if (selectedRows.length === 0) {
      message.warning('请先选择要标记的记录');
      return;
    }

    setBatchMarkLoading(true);
    try {
      const result = await batchMarkIncomeHandled({
        ids: selectedRows.map((r) => r.id),
      });

      // 构建失败记录列表
      const failedRecords: FailedRecord[] = result.results
        .filter((r) => !r.success)
        .map((r) => {
          const record = selectedRows.find((row) => row.id === r.id);
          return {
            id: r.id,
            name: record ? `${record.userPhone} - 第${record.settleSequence}次` : `#${r.id}`,
            reason: r.error?.message || '未知错误',
          };
        });

      setBatchResultData({
        operationName: '批量标记已处理',
        total: result.total,
        successCount: result.succeeded,
        failedCount: result.failed,
        failedRecords,
      });
      setBatchResultOpen(true);

      // 清空选中
      setSelectedRows([]);
      setSelectedRowKeys([]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '批量标记失败';
      message.error(errorMessage);
    } finally {
      setBatchMarkLoading(false);
    }
  }, [selectedRows, message]);

  /**
   * 刷新列表
   */
  const handleRefresh = useCallback(() => {
    actionRef.current?.reload();
  }, []);

  /**
   * 获取行类名（高亮未处理记录）
   */
  const getRowClassName = useCallback((record: IncomeExceptionListItem): string => {
    if (!record.isHandled) {
      return HIGHLIGHT_ROW_CLASSES.danger;
    }
    return '';
  }, []);

  /**
   * 表格列配置
   * @description 依据：开发文档.md 第13.13.1节
   */
  const columns: ProColumns<IncomeExceptionListItem>[] = [
    {
      title: '用户信息',
      dataIndex: 'userId',
      width: 180,
      fixed: 'left',
      hideInSearch: true,
      render: (_, record) => (
        <UserInfoCard
          userId={record.userId}
          phone={record.userPhone}
          nickname={record.userNickname}
          avatarUrl={record.userAvatarUrl}
          vipLevel={record.userVipLevel}
          status={record.userStatus}
          showVip
          showStatus
          clickable
          size="small"
        />
      ),
    },
    {
      title: '持仓订单',
      dataIndex: 'positionOrderNo',
      width: 180,
      hideInSearch: true,
      render: (_, record) => (
        <Link
          href={`/orders/positions?orderNo=${record.positionOrderNo}`}
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
      title: '产品名称',
      dataIndex: 'productName',
      width: 100,
      hideInSearch: true,
    },
    {
      title: '发放序号',
      dataIndex: 'settleSequence',
      width: 80,
      hideInSearch: true,
      render: (_, record) => (
        <Tag color="blue">第 {record.settleSequence} 次</Tag>
      ),
    },
    {
      title: '发放金额',
      dataIndex: 'amount',
      width: 120,
      hideInSearch: true,
      sorter: true,
      render: (_, record) => (
        <AmountDisplay value={record.amount} highlight />
      ),
    },
    {
      title: '失败原因',
      dataIndex: 'lastError',
      width: 200,
      hideInSearch: true,
      ellipsis: true,
      render: (_, record) => (
        <Tooltip title={record.lastError}>
          <Text type="danger" ellipsis style={{ maxWidth: 180 }}>
            {record.lastError || '-'}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: '重试次数',
      dataIndex: 'retryCount',
      width: 90,
      hideInSearch: true,
      render: (_, record) => (
        <Badge
          count={record.retryCount}
          showZero
          color={record.retryCount >= 3 ? '#ff4d4f' : '#8c8c8c'}
          style={{ fontWeight: 600 }}
        />
      ),
    },
    {
      title: '失败时间',
      dataIndex: 'scheduleAt',
      width: 160,
      valueType: 'dateRange',
      render: (_, record) => <TimeDisplay value={record.scheduleAt} format="YYYY-MM-DD HH:mm" />,
      search: {
        transform: (value) => ({
          startDate: value?.[0],
          endDate: value?.[1],
        }),
      },
    },
    {
      title: '处理状态',
      dataIndex: 'isHandled',
      width: 100,
      valueType: 'select',
      fieldProps: {
        options: HANDLED_STATUS_OPTIONS,
      },
      render: (_, record) =>
        record.isHandled ? (
          <Tooltip title={`${record.handledByName} 于 ${record.handledAt} 处理`}>
            <Tag color="green" icon={<RiCheckboxCircleLine size={14} />}>
              已处理
            </Tag>
          </Tooltip>
        ) : (
          <Tag color="red" icon={<RiAlertLine size={14} />}>
            未处理
          </Tag>
        ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 160,
      fixed: 'right',
      render: (_, record) =>
        record.isHandled ? (
          <Text type="secondary">-</Text>
        ) : (
          <Space size={8}>
            <a onClick={() => handleOpenRetryModal(record)}>
              <RiPlayCircleLine size={14} style={{ marginRight: 4 }} />
              补发
            </a>
            <a onClick={() => handleOpenMarkModal(record)}>
              <RiCheckboxCircleLine size={14} style={{ marginRight: 4 }} />
              标记
            </a>
          </Space>
        ),
    },
    // ================== 隐藏的搜索字段 ==================
    {
      title: '用户ID',
      dataIndex: '_searchUserId',
      key: 'userId_search',
      hideInTable: true,
      order: 10,
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
      order: 9,
      fieldProps: {
        placeholder: '输入手机号搜索',
      },
    },
    {
      title: '持仓订单号',
      dataIndex: '_searchPositionOrderNo',
      key: 'positionOrderNo_search',
      hideInTable: true,
      order: 8,
      fieldProps: {
        placeholder: '输入订单号搜索',
      },
      search: {
        transform: (value: string) => ({ positionOrderNo: value }),
      },
    },
    {
      title: '产品',
      dataIndex: 'productId',
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
  ];

  // 缓存 ProTable params，防止 setSummary 触发重渲染时创建新对象导致重复请求
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
      <div className="income-exceptions-page">
        <ListPageSkeleton showSearch searchCount={5} rows={10} columns={8} />
      </div>
    );
  }

  return (
    <div className="income-exceptions-page">
      {/* 统计卡片区 */}
      <StatisticCardGroup columns={2} gap={16} style={{ marginBottom: 16 }}>
        <StatisticCard
          title="未处理数量"
          value={summary.unhandledCount}
          prefix={<RiErrorWarningLine size={20} style={{ color: '#ff4d4f' }} />}
          suffix="条"
          valueStyle={{ color: summary.unhandledCount > 0 ? '#ff4d4f' : undefined }}
          onClick={() => handleQuickFilterChange('unhandled')}
          tooltip="点击筛选未处理记录"
        />
        <StatisticCard
          title="失败总金额"
          value={summary.totalFailedAmount}
          prefix={<RiAlertLine size={20} style={{ color: '#faad14' }} />}
          isCurrency
          valueStyle={{ color: Number(summary.totalFailedAmount) > 0 ? '#faad14' : undefined }}
        />
      </StatisticCardGroup>

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

      <ProTable<IncomeExceptionListItem>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 1600 }}
        rowClassName={getRowClassName}
        params={proTableParams}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys, rows) => {
            setSelectedRowKeys(keys);
            setSelectedRows(rows);
          },
          getCheckboxProps: (record) => ({
            disabled: record.isHandled,
          }),
        }}
        tableAlertRender={false}
        tableAlertOptionRender={false}
        request={async (params) => {
          // 合并快捷筛选参数
          const quickFilterParams = quickFilter ? EXCEPTION_QUICK_FILTER_PARAMS[quickFilter] : {};

          const mergedParams: IncomeExceptionListParams = {
            page: params.current,
            pageSize: params.pageSize,
            userId: params.userId,
            userPhone: params.userPhone,
            positionOrderNo: params.positionOrderNo,
            productId: params.productId,
            startDate: params.startDate,
            endDate: params.endDate,
            isHandled: params.isHandled === '' ? undefined : params.isHandled === 'true',
            ...quickFilterParams,
          };

          try {
            const data = await fetchIncomeExceptionList(mergedParams);
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
        headerTitle="收益发放异常列表"
        toolBarRender={() => [
          <Button
            key="refresh"
            icon={<RiRefreshLine size={16} />}
            onClick={handleRefresh}
          >
            刷新
          </Button>,
        ]}
      />

      {/* 批量操作栏 */}
      {selectedRows.length > 0 && (
        <BatchOperationBar
          selectedCount={selectedRows.length}
          onCancel={() => {
            setSelectedRows([]);
            setSelectedRowKeys([]);
          }}
          actions={[
            {
              key: 'batch-retry',
              label: '批量补发',
              loading: batchRetryLoading,
              onClick: handleBatchRetry,
            },
            {
              key: 'batch-mark',
              label: '批量标记已处理',
              loading: batchMarkLoading,
              onClick: handleBatchMark,
            },
          ]}
        />
      )}

      {/* 补发确认弹窗 */}
      <ConfirmModal
        open={retryModalOpen}
        onClose={() => {
          setRetryModalOpen(false);
          setCurrentRecord(null);
        }}
        onConfirm={handleConfirmRetry}
        title="确认补发收益"
        type="confirm"
        loading={retryLoading}
        confirmText="确认补发"
        content={
          currentRecord && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary">用户将收到：</Text>
              </div>
              <div
                style={{
                  background: '#f6ffed',
                  borderRadius: 8,
                  padding: '12px 16px',
                  textAlign: 'center',
                }}
              >
                <AmountDisplay value={currentRecord.amount} size="large" highlight />
              </div>
              <div style={{ marginTop: 12, color: '#8c8c8c', fontSize: 12 }}>
                用户手机号：{currentRecord.userPhone}
                <br />
                持仓订单：{currentRecord.positionOrderNo}
                <br />
                发放序号：第 {currentRecord.settleSequence} 次
              </div>
            </div>
          )
        }
      />

      {/* 标记已处理弹窗 */}
      <ConfirmModal
        open={markModalOpen}
        onClose={() => {
          setMarkModalOpen(false);
          setCurrentRecord(null);
          setMarkRemark('');
        }}
        onConfirm={handleConfirmMark}
        title="标记为已处理"
        type="warning"
        loading={markLoading}
        confirmText="确认标记"
        content={
          <div style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary">标记后该记录将不再显示在未处理列表中</Text>
            </div>
            <TextArea
              placeholder="请输入处理备注（可选）"
              value={markRemark}
              onChange={(e) => setMarkRemark(e.target.value)}
              rows={3}
              maxLength={200}
              showCount
            />
          </div>
        }
      />

      {/* 批量操作结果弹窗 */}
      <BatchResultModal
        open={batchResultOpen}
        onClose={() => setBatchResultOpen(false)}
        onRefresh={handleRefresh}
        operationName={batchResultData.operationName}
        total={batchResultData.total}
        successCount={batchResultData.successCount}
        failedCount={batchResultData.failedCount}
        failedRecords={batchResultData.failedRecords}
      />

      {/* 样式 */}
      <style jsx global>{`
        .income-exceptions-page .ant-pro-table-search {
          margin-bottom: 16px;
          padding: 20px 24px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
        
        /* 高亮行样式 */
        .highlight-row-danger {
          background-color: rgba(255, 77, 79, 0.08) !important;
        }
        .highlight-row-danger:hover > td {
          background-color: rgba(255, 77, 79, 0.12) !important;
        }
      `}</style>
    </div>
  );
}
