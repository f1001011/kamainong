/**
 * @file 社区奖励配置页面
 * @description 广场管理 - 配置社区提现晒单的奖励档位
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
  Modal,
  Form,
  InputNumber,
  Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiRefreshLine,
} from '@remixicon/react';

import { get, post, put, del } from '@/utils/request';
import { AmountDisplay } from '@/components/common';
import { useGlobalConfig } from '@/hooks/useGlobalConfig';

const { Title, Text } = Typography;

interface RewardTier {
  id: number;
  minAmount: string;
  maxAmount: string;
  rewardAmount: string;
  sortOrder: number;
}

export default function CommunityConfigPage() {
  const { message } = App.useApp();
  const globalConfig = useGlobalConfig();
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState<RewardTier[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<RewardTier | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const loadTiers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<{ list: RewardTier[] }>('/community/reward-tiers');
      setTiers(res.list);
    } catch (error) {
      console.error('加载奖励档位失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTiers();
  }, [loadTiers]);

  const handleOpenModal = useCallback((tier?: RewardTier) => {
    if (tier) {
      setEditingTier(tier);
      form.setFieldsValue({
        minAmount: Number(tier.minAmount),
        maxAmount: Number(tier.maxAmount),
        rewardAmount: Number(tier.rewardAmount),
        sortOrder: tier.sortOrder,
      });
    } else {
      setEditingTier(null);
      form.resetFields();
    }
    setModalOpen(true);
  }, [form]);

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (editingTier) {
        await put(`/community/reward-tiers/${editingTier.id}`, values);
        message.success('更新成功');
      } else {
        await post('/community/reward-tiers', values);
        message.success('创建成功');
      }

      setModalOpen(false);
      setEditingTier(null);
      form.resetFields();
      loadTiers();
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setSaving(false);
    }
  }, [form, editingTier, message, loadTiers]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await del(`/community/reward-tiers/${id}`);
      message.success('删除成功');
      loadTiers();
    } catch (error) {
      console.error('删除失败:', error);
    }
  }, [message, loadTiers]);

  const columns: ColumnsType<RewardTier> = [
    {
      title: '最低金额',
      dataIndex: 'minAmount',
      render: (val: string) => <AmountDisplay value={val} />,
    },
    {
      title: '最高金额',
      dataIndex: 'maxAmount',
      render: (val: string) => <AmountDisplay value={val} />,
    },
    {
      title: '奖励金额',
      dataIndex: 'rewardAmount',
      render: (val: string) => <AmountDisplay value={val} highlight />,
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      width: 80,
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<RiEditLine size={14} />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除此档位？" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger size="small" icon={<RiDeleteBinLine size={14} />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>奖励配置</Title>
          <Text type="secondary">管理社区提现晒单的奖励档位</Text>
        </div>
        <Space>
          <Button icon={<RiRefreshLine size={16} />} onClick={loadTiers}>刷新</Button>
          <Button type="primary" icon={<RiAddLine size={16} />} onClick={() => handleOpenModal()}>
            添加档位
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={tiers}
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title={editingTier ? '编辑档位' : '添加档位'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => {
          setModalOpen(false);
          setEditingTier(null);
          form.resetFields();
        }}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="最低金额"
            name="minAmount"
            rules={[{ required: true, message: '请输入最低金额' }]}
          >
            <InputNumber min={0} precision={2} prefix={globalConfig.currencySymbol} style={{ width: '100%' }} placeholder="请输入最低金额" />
          </Form.Item>
          <Form.Item
            label="最高金额"
            name="maxAmount"
            rules={[{ required: true, message: '请输入最高金额' }]}
          >
            <InputNumber min={0} precision={2} prefix={globalConfig.currencySymbol} style={{ width: '100%' }} placeholder="请输入最高金额" />
          </Form.Item>
          <Form.Item
            label="奖励金额"
            name="rewardAmount"
            rules={[{ required: true, message: '请输入奖励金额' }]}
          >
            <InputNumber min={0} precision={2} prefix={globalConfig.currencySymbol} style={{ width: '100%' }} placeholder="请输入奖励金额" />
          </Form.Item>
          <Form.Item
            label="排序"
            name="sortOrder"
            rules={[{ required: true, message: '请输入排序' }]}
            initialValue={0}
          >
            <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder="数值越小越靠前" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
