/**
 * @file 所有帖子页面
 * @description 广场管理 - 查看所有社区帖子，支持状态筛选和删除
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  App,
  Image,
  Tabs,
  Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  RiRefreshLine,
  RiDeleteBinLine,
} from '@remixicon/react';
import dayjs from 'dayjs';

import { get, del } from '@/utils/request';
import { AmountDisplay } from '@/components/common';

const { Title, Text } = Typography;

interface CommunityPost {
  id: number;
  userId: number;
  userPhone: string;
  withdrawAmount: string;
  images: string[];
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason: string | null;
  rewardAmount: string | null;
  createdAt: string;
}

interface PostListResponse {
  list: CommunityPost[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

const STATUS_MAP: Record<string, { color: string; text: string }> = {
  PENDING: { color: 'warning', text: '待审核' },
  APPROVED: { color: 'success', text: '已通过' },
  REJECTED: { color: 'error', text: '已拒绝' },
};

export default function CommunityPostsPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('');

  const loadPosts = useCallback(async (page = 1, pageSize = 20, status?: string) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (status) params.status = status;
      const res = await get<PostListResponse>('/community/posts', params);
      setPosts(res.list);
      setPagination(res.pagination);
    } catch (error) {
      console.error('加载帖子列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts(1, 20, statusFilter || undefined);
  }, [loadPosts, statusFilter]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await del(`/community/posts/${id}`);
      message.success('删除成功');
      loadPosts(pagination.page, pagination.pageSize, statusFilter || undefined);
    } catch (error) {
      console.error('删除失败:', error);
    }
  }, [message, loadPosts, pagination, statusFilter]);

  const columns: ColumnsType<CommunityPost> = [
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
      title: '提现金额',
      dataIndex: 'withdrawAmount',
      width: 120,
      render: (val: string) => <AmountDisplay value={val} />,
    },
    {
      title: '图片',
      dataIndex: 'images',
      width: 120,
      render: (images: string[]) => {
        if (!images || images.length === 0) {
          return <Text type="secondary">无图片</Text>;
        }
        return (
          <Image.PreviewGroup items={images}>
            <Space>
              <Image
                src={images[0]}
                width={48}
                height={48}
                style={{ objectFit: 'cover', borderRadius: 4 }}
              />
              {images.length > 1 && <Tag>+{images.length - 1}</Tag>}
            </Space>
          </Image.PreviewGroup>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const info = STATUS_MAP[status] || { color: 'default', text: status };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '奖励金额',
      dataIndex: 'rewardAmount',
      width: 120,
      render: (val: string | null) => val ? <AmountDisplay value={val} /> : '-',
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title="确定删除此帖子？"
          onConfirm={() => handleDelete(record.id)}
        >
          <Button
            type="text"
            danger
            size="small"
            icon={<RiDeleteBinLine size={14} />}
          >
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>所有帖子</Title>
          <Text type="secondary">查看和管理所有社区帖子</Text>
        </div>
        <Button icon={<RiRefreshLine size={16} />} onClick={() => loadPosts(1, 20, statusFilter || undefined)}>
          刷新
        </Button>
      </div>

      <Card>
        <Tabs
          activeKey={statusFilter || 'ALL'}
          onChange={(key) => setStatusFilter(key === 'ALL' ? '' : key)}
          items={[
            { key: 'ALL', label: '全部' },
            { key: 'PENDING', label: '待审核' },
            { key: 'APPROVED', label: '已通过' },
            { key: 'REJECTED', label: '已拒绝' },
          ]}
          style={{ marginBottom: 16 }}
        />
        <Table
          rowKey="id"
          columns={columns}
          dataSource={posts}
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => loadPosts(page, pageSize, statusFilter || undefined),
          }}
        />
      </Card>
    </div>
  );
}
