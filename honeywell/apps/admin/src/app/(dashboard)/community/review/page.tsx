/**
 * @file 帖子审核页面
 * @description 广场管理 - 审核待审核的社区帖子，支持批量审核
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
  Modal,
  Input,
  Spin,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  RiCheckLine,
  RiCloseLine,
  RiRefreshLine,
  RiImageLine,
} from '@remixicon/react';
import dayjs from 'dayjs';

import { get, put } from '@/utils/request';
import { AmountDisplay } from '@/components/common';

const { Title, Text } = Typography;
const { TextArea } = Input;

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

export default function CommunityReviewPage() {
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadPosts = useCallback(async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const res = await get<PostListResponse>('/community/posts', {
        status: 'PENDING',
        page,
        pageSize,
      });
      setPosts(res.list);
      setPagination(res.pagination);
    } catch (error) {
      console.error('加载帖子列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleApprove = useCallback(async (id: number) => {
    setActionLoading(true);
    try {
      await put(`/community/posts/${id}/approve`);
      message.success('审核通过');
      loadPosts(pagination.page, pagination.pageSize);
    } catch (error) {
      console.error('审核失败:', error);
    } finally {
      setActionLoading(false);
    }
  }, [message, loadPosts, pagination]);

  const handleReject = useCallback(async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      message.warning('请输入拒绝原因');
      return;
    }
    setActionLoading(true);
    try {
      await put(`/community/posts/${rejectTarget}/reject`, { reason: rejectReason });
      message.success('已拒绝');
      setRejectModalOpen(false);
      setRejectTarget(null);
      setRejectReason('');
      loadPosts(pagination.page, pagination.pageSize);
    } catch (error) {
      console.error('拒绝失败:', error);
    } finally {
      setActionLoading(false);
    }
  }, [rejectTarget, rejectReason, message, loadPosts, pagination]);

  const handleBatchApprove = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择帖子');
      return;
    }
    modal.confirm({
      title: '批量通过',
      content: `确定通过选中的 ${selectedRowKeys.length} 条帖子吗？`,
      onOk: async () => {
        try {
          for (const id of selectedRowKeys) {
            await put(`/community/posts/${id}/approve`);
          }
          message.success(`已批量通过 ${selectedRowKeys.length} 条帖子`);
          setSelectedRowKeys([]);
          loadPosts(pagination.page, pagination.pageSize);
        } catch (error) {
          console.error('批量审核失败:', error);
        }
      },
    });
  }, [selectedRowKeys, message, modal, loadPosts, pagination]);

  const handleBatchReject = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择帖子');
      return;
    }
    const reason = await new Promise<string | null>((resolve) => {
      let inputVal = '';
      modal.confirm({
        title: '批量拒绝',
        content: (
          <div>
            <Text>确定拒绝选中的 {selectedRowKeys.length} 条帖子吗？</Text>
            <TextArea
              placeholder="请输入拒绝原因"
              rows={3}
              style={{ marginTop: 12 }}
              onChange={(e) => { inputVal = e.target.value; }}
            />
          </div>
        ),
        onOk: () => resolve(inputVal),
        onCancel: () => resolve(null),
      });
    });
    if (reason === null) return;
    if (!reason.trim()) {
      message.warning('请输入拒绝原因');
      return;
    }
    try {
      for (const id of selectedRowKeys) {
        await put(`/community/posts/${id}/reject`, { reason });
      }
      message.success(`已批量拒绝 ${selectedRowKeys.length} 条帖子`);
      setSelectedRowKeys([]);
      loadPosts(pagination.page, pagination.pageSize);
    } catch (error) {
      console.error('批量拒绝失败:', error);
    }
  }, [selectedRowKeys, message, modal, loadPosts, pagination]);

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
          <Space>
            <Image.PreviewGroup items={images}>
              <Image
                src={images[0]}
                width={48}
                height={48}
                style={{ objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
              />
            </Image.PreviewGroup>
            {images.length > 1 && (
              <Tag
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setPreviewImages(images);
                  setPreviewVisible(true);
                }}
              >
                +{images.length - 1}
              </Tag>
            )}
          </Space>
        );
      },
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
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<RiCheckLine size={14} />}
            loading={actionLoading}
            onClick={() => handleApprove(record.id)}
          >
            通过
          </Button>
          <Button
            danger
            size="small"
            icon={<RiCloseLine size={14} />}
            onClick={() => {
              setRejectTarget(record.id);
              setRejectModalOpen(true);
            }}
          >
            拒绝
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>帖子审核</Title>
          <Text type="secondary">审核待审核的社区提现晒单帖子</Text>
        </div>
        <Space>
          {selectedRowKeys.length > 0 && (
            <>
              <Text type="secondary">已选择 {selectedRowKeys.length} 项</Text>
              <Button type="primary" size="small" onClick={handleBatchApprove}>
                批量通过
              </Button>
              <Button danger size="small" onClick={handleBatchReject}>
                批量拒绝
              </Button>
            </>
          )}
          <Button icon={<RiRefreshLine size={16} />} onClick={() => loadPosts()}>
            刷新
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={posts}
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => loadPosts(page, pageSize),
          }}
        />
      </Card>

      <Modal
        title="拒绝原因"
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectTarget(null);
          setRejectReason('');
        }}
        confirmLoading={actionLoading}
      >
        <TextArea
          placeholder="请输入拒绝原因"
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>

      {previewImages.length > 0 && (
        <Image.PreviewGroup
          preview={{
            visible: previewVisible,
            onVisibleChange: setPreviewVisible,
          }}
          items={previewImages}
        >
          <div style={{ display: 'none' }} />
        </Image.PreviewGroup>
      )}
    </div>
  );
}
