/**
 * @file SVIP状态查询页面
 * @description SVIP管理 - 按用户查询SVIP资格、持仓和奖励历史
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  App,
  Input,
  Table,
  Descriptions,
  Tag,
  Empty,
  Spin,
  Divider,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  RiSearchLine,
  RiVipCrownFill,
} from '@remixicon/react';
import dayjs from 'dayjs';

import { get } from '@/utils/request';
import { AmountDisplay } from '@/components/common';

const { Title, Text } = Typography;

interface SvipQualification {
  level: number;
  productName: string;
  activatedAt: string;
  expiresAt: string | null;
  isActive: boolean;
}

interface ActivePosition {
  id: number;
  productName: string;
  productCode: string;
  svipLevel: number;
  dailyReward: string;
  startDate: string;
  endDate: string;
}

interface RewardHistory {
  id: number;
  svipLevel: number;
  amount: string;
  productName: string;
  createdAt: string;
}

interface SvipStatusResponse {
  user: {
    id: number;
    phone: string;
    svipLevel: number;
  };
  qualifications: SvipQualification[];
  activePositions: ActivePosition[];
  recentRewards: RewardHistory[];
}

const SVIP_COLORS: Record<number, string> = {
  1: 'blue', 2: 'cyan', 3: 'green', 4: 'lime',
  5: 'gold', 6: 'orange', 7: 'red', 8: 'purple',
};

export default function SvipStatusPage() {
  const { message } = App.useApp();
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SvipStatusResponse | null>(null);

  const handleSearch = useCallback(async () => {
    if (!searchValue.trim()) {
      message.warning('请输入用户ID或手机号');
      return;
    }
    setLoading(true);
    try {
      const res = await get<SvipStatusResponse>('/svip/status', { query: searchValue.trim() });
      setData(res);
    } catch (error) {
      console.error('查询失败:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [searchValue, message]);

  const positionColumns: ColumnsType<ActivePosition> = [
    { title: '持仓ID', dataIndex: 'id', width: 80 },
    { title: '产品', dataIndex: 'productName' },
    { title: '产品编码', dataIndex: 'productCode', width: 100 },
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
      title: '每日奖励',
      dataIndex: 'dailyReward',
      render: (val: string) => <AmountDisplay value={val} highlight />,
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      width: 120,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD'),
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      width: 120,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD'),
    },
  ];

  const rewardColumns: ColumnsType<RewardHistory> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    {
      title: 'SVIP等级',
      dataIndex: 'svipLevel',
      width: 110,
      render: (level: number) => (
        <Tag color={SVIP_COLORS[level] || 'default'}>SVIP{level}</Tag>
      ),
    },
    { title: '产品', dataIndex: 'productName' },
    {
      title: '金额',
      dataIndex: 'amount',
      render: (val: string) => <AmountDisplay value={val} />,
    },
    {
      title: '发放时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>SVIP状态查询</Title>
        <Text type="secondary">按用户ID或手机号查询SVIP资格和奖励详情</Text>
      </div>

      {/* 搜索区域 */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Input
            placeholder="输入用户ID或手机号"
            prefix={<RiSearchLine size={16} style={{ color: '#bfbfbf' }} />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 300 }}
            allowClear
          />
          <Button type="primary" onClick={handleSearch} loading={loading}>
            查询
          </Button>
        </Space>
      </Card>

      <Spin spinning={loading}>
        {data ? (
          <>
            {/* 用户基本信息 */}
            <Card title="用户信息" style={{ marginBottom: 24 }}>
              <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
                <Descriptions.Item label="用户ID">{data.user.id}</Descriptions.Item>
                <Descriptions.Item label="手机号">{data.user.phone}</Descriptions.Item>
                <Descriptions.Item label="当前SVIP等级">
                  {data.user.svipLevel > 0 ? (
                    <Tag color={SVIP_COLORS[data.user.svipLevel] || 'default'} icon={<RiVipCrownFill size={12} />}>
                      SVIP{data.user.svipLevel}
                    </Tag>
                  ) : (
                    <Tag>无SVIP</Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* SVIP资格列表 */}
            <Card title="SVIP资格" style={{ marginBottom: 24 }}>
              {data.qualifications.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {data.qualifications.map((q, i) => (
                    <Card
                      key={i}
                      size="small"
                      style={{
                        width: 260,
                        border: q.isActive ? '1px solid #52c41a' : '1px solid #d9d9d9',
                        opacity: q.isActive ? 1 : 0.6,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Tag color={SVIP_COLORS[q.level] || 'default'} icon={<RiVipCrownFill size={12} />}>
                          SVIP{q.level}
                        </Tag>
                        <Tag color={q.isActive ? 'success' : 'default'}>
                          {q.isActive ? '有效' : '已过期'}
                        </Tag>
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        产品：{q.productName}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        激活：{dayjs(q.activatedAt).format('YYYY-MM-DD')}
                        {q.expiresAt && ` · 到期：${dayjs(q.expiresAt).format('YYYY-MM-DD')}`}
                      </Text>
                    </Card>
                  ))}
                </div>
              ) : (
                <Empty description="暂无SVIP资格" />
              )}
            </Card>

            {/* 活跃持仓 */}
            <Card title="活跃持仓（产生SVIP奖励）" style={{ marginBottom: 24 }}>
              <Table
                rowKey="id"
                columns={positionColumns}
                dataSource={data.activePositions}
                pagination={false}
                locale={{ emptyText: '暂无活跃SVIP持仓' }}
              />
            </Card>

            {/* 最近奖励 */}
            <Card title="最近奖励记录">
              <Table
                rowKey="id"
                columns={rewardColumns}
                dataSource={data.recentRewards}
                pagination={false}
                locale={{ emptyText: '暂无奖励记录' }}
              />
            </Card>
          </>
        ) : !loading && (
          <Card>
            <Empty description="请输入用户ID或手机号进行查询" />
          </Card>
        )}
      </Spin>
    </div>
  );
}
