/**
 * @file 管理员登录日志页面
 * @description 日志管理 - 查看管理员登录记录
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
  Row,
  Col,
  Statistic,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { RiRefreshLine, RiFileSearchLine } from '@remixicon/react';
import dayjs, { type Dayjs } from 'dayjs';

import { fetchAdminLoginLogs } from '@/services/logs';
import type { AdminLoginLogItem } from '@/types/logs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function AdminLoginLogPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<AdminLoginLogItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [statistics, setStatistics] = useState({
    todayTotal: 0,
    todayAdmins: 0,
    todayFailed: 0,
    todayFailRate: '0',
  });
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [usernameFilter, setUsernameFilter] = useState('');
  const [ipFilter, setIpFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'SUCCESS' | 'FAILED' | ''>('');
  const [apiReady, setApiReady] = useState(true);

  const loadData = useCallback(
    async (page = 1, pageSize = 20) => {
      setLoading(true);
      setApiReady(true);
      try {
        const params: Record<string, unknown> = { page, pageSize };
        if (dateRange?.[0]) params.startDate = dateRange[0].format('YYYY-MM-DD');
        if (dateRange?.[1]) params.endDate = dateRange[1].format('YYYY-MM-DD');
        if (usernameFilter) params.username = usernameFilter;
        if (ipFilter) params.ip = ipFilter;
        if (statusFilter) params.status = statusFilter;

        const res = await fetchAdminLoginLogs(params);
        setList(res.list);
        setPagination(res.pagination);
        setStatistics(res.statistics);
      } catch (error) {
        console.error('加载管理员登录日志失败:', error);
        setList([]);
        setPagination({ page: 1, pageSize: 20, total: 0 });
        setApiReady(false);
        message.warning('后端接口未就绪，请稍后再试');
      } finally {
        setLoading(false);
      }
    },
    [dateRange, usernameFilter, ipFilter, statusFilter, message]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: ColumnsType<AdminLoginLogItem> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    {
      title: '用户名',
      dataIndex: 'username',
      width: 120,
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      width: 140,
      render: (ip: string, record) => (
        <div>
          <Text>{ip}</Text>
          {record.ipLocation && (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.ipLocation}
              </Text>
            </>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (status: string) =>
        status === 'SUCCESS' ? (
          <Tag color="success">成功</Tag>
        ) : (
          <Tag color="error">失败</Tag>
        ),
    },
    {
      title: '失败原因',
      dataIndex: 'failReason',
      width: 150,
      ellipsis: true,
    },
    {
      title: '设备',
      dataIndex: 'deviceInfo',
      width: 120,
      ellipsis: true,
    },
    {
      title: '登录时间',
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
            管理员登录日志
          </Title>
          <Text type="secondary">查看管理员登录记录</Text>
        </div>
        <Button icon={<RiRefreshLine size={16} />} onClick={() => loadData()}>
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      {apiReady && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="今日登录次数" value={statistics.todayTotal} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="今日活跃管理员" value={statistics.todayAdmins} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="今日失败次数" value={statistics.todayFailed} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="今日失败率" value={statistics.todayFailRate} suffix="%" />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Text>日期范围：</Text>
            <RangePicker
              value={dateRange as [Dayjs, Dayjs] | undefined}
              onChange={(dates) => setDateRange(dates)}
            />
            <Text>用户名：</Text>
            <Input
              value={usernameFilter}
              onChange={(e) => setUsernameFilter(e.target.value)}
              placeholder="用户名"
              style={{ width: 120 }}
              allowClear
            />
            <Text>IP：</Text>
            <Input
              value={ipFilter}
              onChange={(e) => setIpFilter(e.target.value)}
              placeholder="IP地址"
              style={{ width: 130 }}
              allowClear
            />
            <Text>状态：</Text>
            <Select
              value={statusFilter || undefined}
              onChange={setStatusFilter}
              options={[
                { value: '', label: '全部' },
                { value: 'SUCCESS', label: '成功' },
                { value: 'FAILED', label: '失败' },
              ]}
              style={{ width: 100 }}
              allowClear
              placeholder="全部"
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
