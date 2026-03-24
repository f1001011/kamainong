/**
 * @file 礼品码详情页
 * @description 展示礼品码信息 + 领取记录列表
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Descriptions,
  Tag,
  Spin,
  Progress,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { RiArrowLeftLine, RiRefreshLine } from '@remixicon/react';
import { get } from '@/utils/request';
import { AmountDisplay } from '@/components/common';
import { formatSystemTime } from '@/utils/timezone';

const { Title, Text } = Typography;

interface ClaimRecord {
  id: number;
  userId: number;
  phone: string;
  nickname: string | null;
  amount: string;
  createdAt: string;
}

interface GiftCodeDetail {
  id: number;
  code: string;
  name: string;
  amountType: 'FIXED' | 'RANDOM';
  requirement: 'NONE' | 'MUST_PURCHASE';
  fixedAmount: string | null;
  totalAmount: string;
  remainAmount: string;
  minAmount: string | null;
  maxAmount: string | null;
  totalCount: number;
  claimedCount: number;
  status: string;
  startAt: string | null;
  expireAt: string | null;
  createdBy: string;
  remark: string | null;
  createdAt: string;
  claims: ClaimRecord[];
}

export default function GiftCodeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<GiftCodeDetail | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<GiftCodeDetail>(`/gift-codes/${id}`);
      setDetail(res);
    } catch (error) {
      console.error('加载详情失败:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const statusTagMap: Record<string, { color: string; text: string }> = {
    ACTIVE: { color: 'green', text: '进行中' },
    DISABLED: { color: 'default', text: '已禁用' },
    EXPIRED: { color: 'orange', text: '已过期' },
    EXHAUSTED: { color: 'red', text: '已领完' },
  };

  const claimColumns: ColumnsType<ClaimRecord> = [
    { title: '用户ID', dataIndex: 'userId', width: 80 },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 140,
      render: (phone: string) => phone?.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'),
    },
    { title: '昵称', dataIndex: 'nickname', width: 120, render: (v: string | null) => v || '-' },
    {
      title: '领取金额',
      dataIndex: 'amount',
      width: 140,
      render: (v: string) => <AmountDisplay value={v} />,
    },
    {
      title: '领取时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (v: string) => formatSystemTime(v, 'YYYY-MM-DD HH:mm:ss'),
    },
  ];

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  if (!detail) {
    return <div style={{ padding: 24 }}><Text>礼品码不存在</Text></div>;
  }

  const statusInfo = statusTagMap[detail.status] || { color: 'default', text: detail.status };
  const progressPercent = detail.totalCount > 0
    ? Math.round((detail.claimedCount / detail.totalCount) * 100)
    : 0;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Space>
          <Button icon={<RiArrowLeftLine size={16} />} onClick={() => router.back()}>返回</Button>
          <Title level={4} style={{ margin: 0 }}>礼品码详情</Title>
        </Space>
        <Button icon={<RiRefreshLine size={16} />} onClick={loadData}>刷新</Button>
      </div>

      {/* 基本信息 */}
      <Card title="基本信息" style={{ marginBottom: 24 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="small">
          <Descriptions.Item label="礼品码">
            <Text code copyable>{detail.code}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="名称">{detail.name}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="类型">
            <Tag color={detail.amountType === 'FIXED' ? 'blue' : 'purple'}>
              {detail.amountType === 'FIXED' ? '固定金额' : '拼手气红包'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="前置条件">
            {detail.requirement === 'MUST_PURCHASE' ? <Tag color="orange">需购买产品</Tag> : '无'}
          </Descriptions.Item>
          <Descriptions.Item label="创建人">{detail.createdBy}</Descriptions.Item>
          {detail.amountType === 'FIXED' ? (
            <Descriptions.Item label="每人金额"><AmountDisplay value={detail.fixedAmount} /></Descriptions.Item>
          ) : (
            <>
              <Descriptions.Item label="随机范围">
                <AmountDisplay value={detail.minAmount} /> ~ <AmountDisplay value={detail.maxAmount} />
              </Descriptions.Item>
            </>
          )}
          <Descriptions.Item label="总金额"><AmountDisplay value={detail.totalAmount} /></Descriptions.Item>
          <Descriptions.Item label="剩余金额"><AmountDisplay value={detail.remainAmount} /></Descriptions.Item>
          <Descriptions.Item label="领取进度" span={2}>
            <Space>
              <Progress
                percent={progressPercent}
                size="small"
                style={{ width: 120 }}
                status={detail.status === 'EXHAUSTED' ? 'exception' : 'active'}
              />
              <Text>{detail.claimedCount} / {detail.totalCount}</Text>
            </Space>
          </Descriptions.Item>
          {detail.startAt && (
            <Descriptions.Item label="生效时间">{formatSystemTime(detail.startAt, 'YYYY-MM-DD HH:mm')}</Descriptions.Item>
          )}
          {detail.expireAt && (
            <Descriptions.Item label="过期时间">{formatSystemTime(detail.expireAt, 'YYYY-MM-DD HH:mm')}</Descriptions.Item>
          )}
          <Descriptions.Item label="创建时间">{formatSystemTime(detail.createdAt, 'YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
          {detail.remark && (
            <Descriptions.Item label="备注" span={3}>{detail.remark}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* 领取记录 */}
      <Card title={`领取记录（${detail.claims.length} 条）`}>
        <Table
          rowKey="id"
          columns={claimColumns}
          dataSource={detail.claims}
          pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>
    </div>
  );
}
