/**
 * @file SVIP奖励记录页面
 * @description SVIP管理 - 查看SVIP每日奖励发放记录
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
  Select,
  Row,
  Col,
  Statistic,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  RiRefreshLine,
  RiVipCrownFill,
} from '@remixicon/react';
import dayjs, { Dayjs } from 'dayjs';

import { get } from '@/utils/request';
import { AmountDisplay } from '@/components/common';
import useGlobalConfig from '@/hooks/useGlobalConfig';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface SvipRecord {
  id: number;
  userId: number;
  userPhone: string;
  productName: string;
  svipLevel: number;
  amount: string;
  status: string;
  createdAt: string;
}

interface SvipRecordResponse {
  list: SvipRecord[];
  pagination: { page: number; pageSize: number; total: number };
  stats: {
    todayTotal: string;
    cumulativeTotal: string;
  };
}

const SVIP_LEVEL_OPTIONS = [
  { value: '', label: '全部等级' },
  { value: 1, label: 'SVIP1' },
  { value: 2, label: 'SVIP2' },
  { value: 3, label: 'SVIP3' },
  { value: 4, label: 'SVIP4' },
  { value: 5, label: 'SVIP5' },
  { value: 6, label: 'SVIP6' },
  { value: 7, label: 'SVIP7' },
  { value: 8, label: 'SVIP8' },
];

const SVIP_COLORS: Record<number, string> = {
  1: 'blue', 2: 'cyan', 3: 'green', 4: 'lime',
  5: 'gold', 6: 'orange', 7: 'red', 8: 'purple',
};

export default function SvipRecordsPage() {
  const { message } = App.useApp();
  const config = useGlobalConfig();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<SvipRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [stats, setStats] = useState({ todayTotal: '0', cumulativeTotal: '0' });
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [levelFilter, setLevelFilter] = useState<number | string>('');

  const loadRecords = useCallback(async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (dateRange?.[0]) params.startDate = dateRange[0].format('YYYY-MM-DD');
      if (dateRange?.[1]) params.endDate = dateRange[1].format('YYYY-MM-DD');
      if (levelFilter) params.svipLevel = levelFilter;

      const res = await get<SvipRecordResponse>('/svip/records', params);
      setRecords(res.list);
      setPagination(res.pagination);
      if (res.stats) setStats(res.stats);
    } catch (error) {
      console.error('加载SVIP记录失败:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, levelFilter]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const columns: ColumnsType<SvipRecord> = [
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
    { title: '产品', dataIndex: 'productName', width: 150 },
    {
      title: 'SVIP等级',
      dataIndex: 'svipLevel',
      width: 110,
      render: (level: number) => (
        <Tag color={SVIP_COLORS[level] || 'default'} icon={<RiVipCrownFill size={12} />}>
          SVIP{level}
        </Tag>
      ),
    },
    {
      title: '奖励金额',
      dataIndex: 'amount',
      render: (val: string) => <AmountDisplay value={val} highlight />,
    },
    {
      title: '领取方式',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'CLAIMED' ? 'green' : status === 'SETTLED' ? 'blue' : 'default'}>
          {status === 'CLAIMED' ? '手动领取' : status === 'SETTLED' ? '自动发放' : status}
        </Tag>
      ),
    },
    {
      title: '领取时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>SVIP奖励记录</Title>
          <Text type="secondary">查看SVIP每日奖励领取记录（手动领取/历史自动发放）</Text>
        </div>
        <Button icon={<RiRefreshLine size={16} />} onClick={() => loadRecords()}>刷新</Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="今日发放总额" value={stats.todayTotal} prefix={config.currencySymbol} precision={0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="累计发放总额" value={stats.cumulativeTotal} prefix={config.currencySymbol} precision={0} />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Text>SVIP等级：</Text>
            <Select
              value={levelFilter}
              onChange={setLevelFilter}
              options={SVIP_LEVEL_OPTIONS}
              style={{ width: 140 }}
              allowClear
              placeholder="全部等级"
            />
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
