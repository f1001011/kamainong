/**
 * @file 操作日志页面
 * @description 日志管理 - 查看管理员操作日志
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  App,
  DatePicker,
  Input,
  Select,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { RiRefreshLine, RiFileSearchLine } from '@remixicon/react';
import dayjs, { type Dayjs } from 'dayjs';

import { fetchOperationLogs } from '@/services/logs';
import type { OperationLogItem } from '@/types/logs';
import { MODULE_OPTIONS, ACTION_OPTIONS } from '@/types/logs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

/** 获取模块标签颜色 */
function getModuleColor(module: string): string {
  const opt = MODULE_OPTIONS.find((o) => o.value === module);
  return opt?.color ?? 'default';
}

export default function OperationLogPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<OperationLogItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [moduleFilter, setModuleFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [keywordFilter, setKeywordFilter] = useState('');
  const [apiReady, setApiReady] = useState(true);

  const loadData = useCallback(
    async (page = 1, pageSize = 20) => {
      setLoading(true);
      setApiReady(true);
      try {
        const params: Record<string, unknown> = { page, pageSize };
        if (dateRange?.[0]) params.startDate = dateRange[0].format('YYYY-MM-DD');
        if (dateRange?.[1]) params.endDate = dateRange[1].format('YYYY-MM-DD');
        if (moduleFilter) params.module = moduleFilter;
        if (actionFilter) params.action = actionFilter;
        if (keywordFilter) params.targetId = keywordFilter;

        const res = await fetchOperationLogs(params);
        setList(res.list);
        setPagination(res.pagination);
      } catch (error) {
        console.error('加载操作日志失败:', error);
        setList([]);
        setPagination({ page: 1, pageSize: 20, total: 0 });
        setApiReady(false);
        message.warning('后端接口未就绪，请稍后再试');
      } finally {
        setLoading(false);
      }
    },
    [dateRange, moduleFilter, actionFilter, keywordFilter, message]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: ColumnsType<OperationLogItem> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    {
      title: '操作人',
      dataIndex: 'adminName',
      width: 120,
      render: (name: string, record) => (
        <div>
          <Text>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            ID: {record.adminId}
          </Text>
        </div>
      ),
    },
    {
      title: '模块',
      dataIndex: 'module',
      width: 100,
      render: (module: string) => {
        const label = MODULE_OPTIONS.find((o) => o.value === module)?.label ?? module;
        return <Tag color={getModuleColor(module)}>{label}</Tag>;
      },
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      width: 100,
      render: (action: string) => {
        const label = ACTION_OPTIONS.find((o) => o.value === action)?.label ?? action;
        return <Text>{label}</Text>;
      },
    },
    {
      title: '对象',
      dataIndex: 'targetType',
      width: 120,
      render: (targetType: string | null, record) => (
        <div>
          {targetType && <Text>{targetType}</Text>}
          {record.targetId && (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                ID: {record.targetId}
              </Text>
            </>
          )}
        </div>
      ),
    },
    { title: 'IP', dataIndex: 'ip', width: 120 },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            操作日志
          </Title>
          <Text type="secondary">查看管理员操作记录</Text>
        </div>
        <Button icon={<RiRefreshLine size={16} />} onClick={() => loadData()}>
          刷新
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Text>日期范围：</Text>
            <RangePicker
              value={dateRange as [Dayjs, Dayjs] | undefined}
              onChange={(dates) => setDateRange(dates)}
            />
            <Text>模块：</Text>
            <Select
              value={moduleFilter || undefined}
              onChange={setModuleFilter}
              options={[
                { value: '', label: '全部' },
                ...MODULE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
              ]}
              style={{ width: 140 }}
              allowClear
              placeholder="全部"
            />
            <Text>操作类型：</Text>
            <Select
              value={actionFilter || undefined}
              onChange={setActionFilter}
              options={[
                { value: '', label: '全部' },
                ...ACTION_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
              ]}
              style={{ width: 120 }}
              allowClear
              placeholder="全部"
            />
            <Text>关键词（对象ID）：</Text>
            <Input
              value={keywordFilter}
              onChange={(e) => setKeywordFilter(e.target.value)}
              placeholder="对象ID"
              style={{ width: 140 }}
              allowClear
            />
            <Button type="primary" onClick={() => loadData()}>
              查询
            </Button>
          </Space>
        </div>
        {!apiReady && (
          <div style={{ marginBottom: 12, color: 'var(--ant-color-warning)' }}>
            <RiFileSearchLine size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            功能开发中，后端接口暂未就绪
          </div>
        )}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={list}
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => loadData(page, pageSize),
          }}
          locale={{ emptyText: apiReady ? '暂无数据' : '暂无数据（接口未就绪）' }}
        />
      </Card>
    </div>
  );
}
