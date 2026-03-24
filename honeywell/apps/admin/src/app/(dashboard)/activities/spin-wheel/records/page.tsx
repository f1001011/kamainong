/**
 * @file 抽奖记录页面
 * @description 活动管理 - 查看幸运转盘抽奖记录
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
  Row,
  Col,
  Statistic,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  RiRefreshLine,
  RiArrowLeftLine,
} from '@remixicon/react';
import { useRouter } from 'next/navigation';
import dayjs, { Dayjs } from 'dayjs';

import { get } from '@/utils/request';
import { AmountDisplay } from '@/components/common';
import useGlobalConfig from '@/hooks/useGlobalConfig';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface SpinRecord {
  id: number;
  userId: number;
  userPhone: string;
  prizeName: string;
  amount: string;
  sourceType: string;
  createdAt: string;
}

interface SpinRecordResponse {
  list: SpinRecord[];
  pagination: { page: number; pageSize: number; total: number };
  stats: {
    todayCount: number;
    todayAmount: string;
    totalCount: number;
    totalAmount: string;
  };
}

export default function SpinWheelRecordsPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const config = useGlobalConfig();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<SpinRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [stats, setStats] = useState({ todayCount: 0, todayAmount: '0', totalCount: 0, totalAmount: '0' });
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const loadRecords = useCallback(async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (dateRange?.[0]) params.startDate = dateRange[0].format('YYYY-MM-DD');
      if (dateRange?.[1]) params.endDate = dateRange[1].format('YYYY-MM-DD');

      const res = await get<SpinRecordResponse>('/spin-wheel/records', params);
      setRecords(res.list);
      setPagination(res.pagination);
      if (res.stats) setStats(res.stats);
    } catch (error) {
      console.error('加载抽奖记录失败:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const columns: ColumnsType<SpinRecord> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    {
      title: '用户',
      dataIndex: 'userPhone',
      width: 140,
      render: (phone: string, record) => (
        <div>
          <Text>{phone}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>ID: {record.userId}</Text>
        </div>
      ),
    },
    { title: '奖品名称', dataIndex: 'prizeName' },
    {
      title: '金额',
      dataIndex: 'amount',
      render: (val: string) => <AmountDisplay value={val} />,
    },
    { title: '来源', dataIndex: 'sourceType', width: 100 },
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>抽奖记录</Title>
          <Text type="secondary">查看幸运转盘抽奖记录</Text>
        </div>
        <Space>
          <Button icon={<RiArrowLeftLine size={16} />} onClick={() => router.push('/activities/spin-wheel')}>
            返回配置
          </Button>
          <Button icon={<RiRefreshLine size={16} />} onClick={() => loadRecords()}>刷新</Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card><Statistic title="今日抽奖次数" value={stats.todayCount} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card><Statistic title="今日发放金额" value={stats.todayAmount} prefix={config.currencySymbol} precision={0} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card><Statistic title="累计抽奖次数" value={stats.totalCount} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card><Statistic title="累计发放金额" value={stats.totalAmount} prefix={config.currencySymbol} precision={0} /></Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Text>日期范围：</Text>
            <RangePicker
              value={dateRange as [Dayjs, Dayjs] | undefined}
              onChange={(dates) => setDateRange(dates)}
            />
            <Button type="primary" onClick={() => loadRecords()}>查询</Button>
          </Space>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={records}
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => loadRecords(page, pageSize),
          }}
        />
      </Card>
    </div>
  );
}
