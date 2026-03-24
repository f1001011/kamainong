/**
 * @file 用户登录日志页面
 * @description 日志管理 - 查看用户登录记录
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

import { fetchUserLoginLogs } from '@/services/logs';
import type { UserLoginLogItem } from '@/types/logs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const DEVICE_TYPE_LABELS: Record<string, string> = {
  mobile: '手机',
  desktop: '电脑',
  tablet: '平板',
};

export default function UserLoginLogPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<UserLoginLogItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [statistics, setStatistics] = useState({
    todayTotal: 0,
    todayUsers: 0,
    todayFailed: 0,
    todayFailRate: '0',
  });
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [phoneFilter, setPhoneFilter] = useState('');
  const [ipFilter, setIpFilter] = useState('');
  const [successFilter, setSuccessFilter] = useState<boolean | ''>('');
  const [deviceFilter, setDeviceFilter] = useState<string>('');
  const [apiReady, setApiReady] = useState(true);

  const loadData = useCallback(
    async (page = 1, pageSize = 20) => {
      setLoading(true);
      setApiReady(true);
      try {
        const params: Record<string, unknown> = { page, pageSize };
        if (dateRange?.[0]) params.startDate = dateRange[0].format('YYYY-MM-DD');
        if (dateRange?.[1]) params.endDate = dateRange[1].format('YYYY-MM-DD');
        if (phoneFilter) params.phone = phoneFilter;
        if (ipFilter) params.ip = ipFilter;
        if (successFilter !== '') params.success = successFilter;
        if (deviceFilter) params.deviceType = deviceFilter;

        const res = await fetchUserLoginLogs(params);
        setList(res.list);
        setPagination(res.pagination);
        setStatistics(res.statistics);
      } catch (error) {
        console.error('加载用户登录日志失败:', error);
        setList([]);
        setPagination({ page: 1, pageSize: 20, total: 0 });
        setApiReady(false);
        message.warning('后端接口未就绪，请稍后再试');
      } finally {
        setLoading(false);
      }
    },
    [dateRange, phoneFilter, ipFilter, successFilter, deviceFilter, message]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: ColumnsType<UserLoginLogItem> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    {
      title: '用户',
      dataIndex: 'phone',
      width: 140,
      render: (phone: string, record) => (
        <div>
          <Text>{phone}</Text>
          {record.userId && (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                ID: {record.userId}
              </Text>
            </>
          )}
        </div>
      ),
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
      dataIndex: 'success',
      width: 90,
      render: (success: boolean) =>
        success ? <Tag color="success">成功</Tag> : <Tag color="error">失败</Tag>,
    },
    {
      title: '设备',
      dataIndex: 'deviceType',
      width: 90,
      render: (deviceType: string | null) =>
        deviceType ? DEVICE_TYPE_LABELS[deviceType] || deviceType : '-',
    },
    {
      title: '失败原因',
      dataIndex: 'failReason',
      width: 150,
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
            用户登录日志
          </Title>
          <Text type="secondary">查看用户登录记录</Text>
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
              <Statistic title="今日登录用户数" value={statistics.todayUsers} />
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
            <Text>手机号：</Text>
            <Input
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              placeholder="手机号"
              style={{ width: 130 }}
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
              value={successFilter === '' ? undefined : successFilter}
              onChange={setSuccessFilter}
              options={[
                { value: '', label: '全部' },
                { value: true, label: '成功' },
                { value: false, label: '失败' },
              ]}
              style={{ width: 100 }}
              allowClear
              placeholder="全部"
            />
            <Text>设备：</Text>
            <Select
              value={deviceFilter || undefined}
              onChange={setDeviceFilter}
              options={[
                { value: '', label: '全部' },
                { value: 'mobile', label: '手机' },
                { value: 'desktop', label: '电脑' },
                { value: 'tablet', label: '平板' },
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
