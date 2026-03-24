/**
 * @file 周薪记录页面
 * @description 活动管理 - 查看周薪发放记录
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

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface WeeklySalaryRecord {
  id: number;
  userId: number;
  userPhone: string;
  teamRecharge: string;
  matchedTier: string;
  amount: string;
  weekStart: string;
  weekEnd: string;
  claimedAt: string;
}

interface RecordResponse {
  list: WeeklySalaryRecord[];
  pagination: { page: number; pageSize: number; total: number };
}

export default function WeeklySalaryRecordsPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<WeeklySalaryRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const loadRecords = useCallback(async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (dateRange?.[0]) params.startDate = dateRange[0].format('YYYY-MM-DD');
      if (dateRange?.[1]) params.endDate = dateRange[1].format('YYYY-MM-DD');

      const res = await get<RecordResponse>('/weekly-salary/claims', params);
      setRecords(res.list);
      setPagination(res.pagination);
    } catch (error) {
      console.error('加载周薪记录失败:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const columns: ColumnsType<WeeklySalaryRecord> = [
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
    {
      title: '团队充值',
      dataIndex: 'teamRecharge',
      render: (val: string) => <AmountDisplay value={val} />,
    },
    { title: '匹配档位', dataIndex: 'matchedTier', width: 120 },
    {
      title: '奖励金额',
      dataIndex: 'amount',
      render: (val: string) => <AmountDisplay value={val} highlight />,
    },
    {
      title: '周期',
      key: 'week',
      width: 200,
      render: (_, record) => (
        <Text type="secondary">
          {dayjs(record.weekStart).format('MM-DD')} ~ {dayjs(record.weekEnd).format('MM-DD')}
        </Text>
      ),
    },
    {
      title: '领取时间',
      dataIndex: 'claimedAt',
      width: 170,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>周薪记录</Title>
          <Text type="secondary">查看周薪活动发放记录</Text>
        </div>
        <Space>
          <Button icon={<RiArrowLeftLine size={16} />} onClick={() => router.push('/activities/weekly-salary')}>
            返回配置
          </Button>
          <Button icon={<RiRefreshLine size={16} />} onClick={() => loadRecords()}>刷新</Button>
        </Space>
      </div>

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
