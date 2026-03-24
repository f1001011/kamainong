/**
 * @file 收益发放记录查询页
 * @description 后台管理系统收益发放记录查询页面，支持搜索筛选、状态统计
 * @depends 开发文档/开发文档.md 第13.13.2节 - 收益发放记录查询
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第18节
 */

'use client';

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Tag,
  Space,
  Button,
  Typography,
  App,
  Tooltip,
} from 'antd';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import {
  RiRefreshLine,
  RiMoneyDollarCircleLine,
  RiTimeLine,
  RiCloseCircleLine,
} from '@remixicon/react';
import Link from 'next/link';

import { fetchIncomeRecordList } from '@/services/income-records';
import {
  AmountDisplay,
  TimeDisplay,
  IncomeStatusBadge,
  StatisticCard,
  StatisticCardGroup,
} from '@/components/common';
import { QuickFilters, ListPageSkeleton } from '@/components/tables';
import type { FilterOption } from '@/components/tables';
import { UserInfoCard } from '@/components/business';
import { getIncomeRowClassName } from '@/components/tables/HighlightRow';
import type {
  IncomeRecordListItem,
  IncomeRecordListParams,
  IncomeRecordSummary,
  IncomeRecordStatus,
} from '@/types/income-records';
import {
  RECORD_QUICK_FILTERS,
  RECORD_QUICK_FILTER_PARAMS,
  INCOME_RECORD_STATUS_OPTIONS,
} from '@/types/income-records';

const { Text } = Typography;

/**
 * 快捷筛选配置
 */
const QUICK_FILTERS: FilterOption<string>[] = [
  { value: 'pending', label: '待发放', badgeColor: '#1677ff' },
  { value: 'settled', label: '已发放', badgeColor: '#52c41a' },
  { value: 'failed', label: '失败', badgeColor: '#ff4d4f' },
];

/**
 * 收益发放记录查询页面
 * @description 依据：开发文档.md 第13.13.2节
 */
export default function IncomeRecordsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();

  // 首次加载状态（用于骨架屏）
  const [initialLoading, setInitialLoading] = useState(true);

  // 快捷筛选状态
  const [quickFilter, setQuickFilter] = useState<string | undefined>();
  const quickFilterMounted = useRef(false);

  // 汇总统计
  const [summary, setSummary] = useState<IncomeRecordSummary>({
    totalSettled: '0.00',
    pendingCount: 0,
    failedCount: 0,
  });

  /**
   * 从 URL 参数获取初始筛选条件
   */
  const getInitialParams = useCallback((): Partial<IncomeRecordListParams> => {
    const params: Partial<IncomeRecordListParams> = {};

    // 用户ID（支持从用户详情页跳转过来）
    const userId = searchParams.get('userId');
    if (userId) {
      params.userId = Number(userId);
    }

    // 持仓订单号（支持从订单详情页跳转过来）
    const orderNo = searchParams.get('positionOrderNo');
    if (orderNo) {
      params.positionOrderNo = orderNo;
    }

    // 状态筛选
    const status = searchParams.get('status');
    if (status) {
      params.status = status.split(',') as IncomeRecordStatus[];
      // 设置对应的快捷筛选
      if (params.status.length === 1) {
        const statusMap: Record<string, string> = {
          PENDING: 'pending',
          SETTLED: 'settled',
          FAILED: 'failed',
        };
        setQuickFilter(statusMap[params.status[0]]);
      }
    }

    return params;
  }, [searchParams]);

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
   * 刷新列表
   */
  const handleRefresh = useCallback(() => {
    actionRef.current?.reload();
  }, []);

  /**
   * 获取行类名（高亮失败记录）
   */
  const getRowClassName = useCallback((record: IncomeRecordListItem, index: number): string => {
    return getIncomeRowClassName({ status: record.status }, index);
  }, []);

  /**
   * 表格列配置
   * @description 依据：开发文档.md 第13.13.2节
   */
  const columns: ProColumns<IncomeRecordListItem>[] = [
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
      width: 90,
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
        <AmountDisplay value={record.amount} />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      valueType: 'select',
      fieldProps: {
        mode: 'multiple',
        options: INCOME_RECORD_STATUS_OPTIONS,
      },
      render: (_, record) => <IncomeStatusBadge status={record.status} />,
    },
    {
      title: '计划发放时间',
      dataIndex: 'scheduleAt',
      width: 160,
      valueType: 'dateRange',
      render: (_, record) => <TimeDisplay value={record.scheduleAt} format="YYYY-MM-DD HH:mm" />,
      search: {
        transform: (value) => ({
          scheduleStartDate: value?.[0],
          scheduleEndDate: value?.[1],
        }),
      },
    },
    {
      title: '实际发放时间',
      dataIndex: 'settledAt',
      width: 160,
      valueType: 'dateRange',
      render: (_, record) =>
        record.settledAt ? (
          <TimeDisplay value={record.settledAt} format="YYYY-MM-DD HH:mm" />
        ) : (
          <Text type="secondary">-</Text>
        ),
      search: {
        transform: (value) => ({
          settledStartDate: value?.[0],
          settledEndDate: value?.[1],
        }),
      },
    },
    {
      title: '重试次数',
      dataIndex: 'retryCount',
      width: 90,
      hideInSearch: true,
      render: (_, record) =>
        record.retryCount > 0 ? (
          <Tooltip title={record.lastError || '查看失败详情'}>
            <Tag color="orange">{record.retryCount} 次</Tag>
          </Tooltip>
        ) : (
          <Text type="secondary">-</Text>
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
  ];

  // 缓存 ProTable params，防止 setSummary 触发重渲染时创建新对象导致重复请求
  const proTableParams = useMemo(() => ({ quickFilter }), [quickFilter]);

  // 首次加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // 骨架屏
  if (initialLoading) {
    return (
      <div className="income-records-page">
        <ListPageSkeleton showSearch searchCount={5} rows={10} columns={7} />
      </div>
    );
  }

  return (
    <div className="income-records-page">
      {/* 统计卡片区 */}
      <StatisticCardGroup columns={3} gap={16} style={{ marginBottom: 16 }}>
        <StatisticCard
          title="已发放总额"
          value={summary.totalSettled}
          prefix={<RiMoneyDollarCircleLine size={20} style={{ color: '#52c41a' }} />}
          isCurrency
          valueStyle={{ color: '#52c41a' }}
          onClick={() => handleQuickFilterChange('settled')}
          tooltip="点击筛选已发放记录"
        />
        <StatisticCard
          title="待发放笔数"
          value={summary.pendingCount}
          prefix={<RiTimeLine size={20} style={{ color: '#1677ff' }} />}
          suffix="笔"
          valueStyle={{ color: summary.pendingCount > 0 ? '#1677ff' : undefined }}
          onClick={() => handleQuickFilterChange('pending')}
          tooltip="点击筛选待发放记录"
        />
        <StatisticCard
          title="失败笔数"
          value={summary.failedCount}
          prefix={<RiCloseCircleLine size={20} style={{ color: '#ff4d4f' }} />}
          suffix="笔"
          valueStyle={{ color: summary.failedCount > 0 ? '#ff4d4f' : undefined }}
          onClick={() => handleQuickFilterChange('failed')}
          tooltip="点击筛选失败记录"
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

      <ProTable<IncomeRecordListItem>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 1400 }}
        rowClassName={getRowClassName}
        params={proTableParams}
        request={async (params) => {
          // 合并 URL 参数
          const initialParams = getInitialParams();

          // 合并快捷筛选参数
          const quickFilterParams = quickFilter ? RECORD_QUICK_FILTER_PARAMS[quickFilter] : {};

          const mergedParams: IncomeRecordListParams = {
            ...initialParams,
            page: params.current,
            pageSize: params.pageSize,
            userId: params.userId,
            userPhone: params.userPhone,
            positionOrderNo: params.positionOrderNo,
            status: params.status as IncomeRecordStatus[],
            scheduleStartDate: params.scheduleStartDate,
            scheduleEndDate: params.scheduleEndDate,
            settledStartDate: params.settledStartDate,
            settledEndDate: params.settledEndDate,
            ...quickFilterParams,
          };

          try {
            const data = await fetchIncomeRecordList(mergedParams);
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
        headerTitle="收益发放记录"
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

      {/* 样式 */}
      <style jsx global>{`
        .income-records-page .ant-pro-table-search {
          margin-bottom: 16px;
          padding: 20px 24px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
        
        /* 高亮行样式 */
        .highlight-row-warning {
          background-color: rgba(255, 152, 0, 0.08) !important;
        }
        .highlight-row-warning:hover > td {
          background-color: rgba(255, 152, 0, 0.12) !important;
        }
        
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
