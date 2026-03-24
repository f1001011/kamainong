/**
 * @file 奖池配置页面
 * @description 活动管理 - 奖池配置，包含全局设置、今日状态和档位管理
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Switch,
  Popconfirm,
  Row,
  Col,
  Spin,
  Statistic,
  Progress,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiRefreshLine,
  RiFileListLine,
  RiSettings3Line,
  RiLoopLeftLine,
} from '@remixicon/react';

import { get, post, put, del } from '@/utils/request';
import { AmountDisplay } from '@/components/common';
import { useGlobalConfig } from '@/hooks/useGlobalConfig';

const { Title, Text } = Typography;

interface PrizePoolConfig {
  prize_pool_enabled: boolean;
  prize_pool_daily_amount: number;
}

interface PrizePoolStatus {
  remaining: string;
  total: string;
  claimedCount: number;
}

interface PrizePoolTier {
  id: number;
  requiredInvites: number;
  rewardAmount: string;
  sortOrder: number;
}

export default function PrizePoolConfigPage() {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const globalConfig = useGlobalConfig();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<PrizePoolConfig | null>(null);
  const [status, setStatus] = useState<PrizePoolStatus | null>(null);
  const [tiers, setTiers] = useState<PrizePoolTier[]>([]);
  const [saving, setSaving] = useState(false);
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<PrizePoolTier | null>(null);

  const [configForm] = Form.useForm();
  const [tierForm] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, tiersRes] = await Promise.all([
        get<PrizePoolConfig>('/prize-pool/config'),
        get<{ list: PrizePoolTier[] }>('/prize-pool/tiers'),
      ]);
      setConfig(configRes);
      setStatus({
        remaining: String(configRes.prize_pool_daily_amount || 0),
        total: String(configRes.prize_pool_daily_amount || 0),
        claimedCount: 0,
      });
      setTiers(tiersRes.list);
      configForm.setFieldsValue(configRes);
    } catch (error) {
      console.error('加载奖池配置失败:', error);
    } finally {
      setLoading(false);
    }
  }, [configForm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveConfig = useCallback(async () => {
    try {
      const values = await configForm.validateFields();
      setSaving(true);
      await put('/prize-pool/config', values);
      message.success('配置已保存');
      setConfig(values);
    } catch (error) {
      console.error('保存配置失败:', error);
    } finally {
      setSaving(false);
    }
  }, [configForm, message]);

  const handleToggleEnabled = useCallback(async (enabled: boolean) => {
    try {
      await put('/prize-pool/config', { prize_pool_enabled: enabled });
      setConfig((prev) => prev ? { ...prev, prize_pool_enabled: enabled } : prev);
      configForm.setFieldValue('prize_pool_enabled', enabled);
      message.success(enabled ? '奖池已启用' : '奖池已禁用');
    } catch (error) {
      console.error('切换状态失败:', error);
    }
  }, [configForm, message]);

  const handleManualReset = useCallback(() => {
    modal.confirm({
      title: '手动重置奖池',
      content: '确定要重置今日奖池吗？此操作不可撤销。',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await post('/prize-pool/reset');
          message.success('奖池已重置');
          loadData();
        } catch (error) {
          console.error('重置失败:', error);
        }
      },
    });
  }, [modal, message, loadData]);

  const handleOpenTierModal = useCallback((tier?: PrizePoolTier) => {
    if (tier) {
      setEditingTier(tier);
      tierForm.setFieldsValue({
        requiredInvites: tier.requiredInvites,
        rewardAmount: Number(tier.rewardAmount),
        sortOrder: tier.sortOrder,
      });
    } else {
      setEditingTier(null);
      tierForm.resetFields();
    }
    setTierModalOpen(true);
  }, [tierForm]);

  const handleSaveTier = useCallback(async () => {
    try {
      const values = await tierForm.validateFields();
      setSaving(true);

      if (editingTier) {
        await put(`/prize-pool/tiers/${editingTier.id}`, values);
        message.success('档位更新成功');
      } else {
        await post('/prize-pool/tiers', values);
        message.success('档位创建成功');
      }

      setTierModalOpen(false);
      setEditingTier(null);
      tierForm.resetFields();
      loadData();
    } catch (error) {
      console.error('保存档位失败:', error);
    } finally {
      setSaving(false);
    }
  }, [tierForm, editingTier, message, loadData]);

  const handleDeleteTier = useCallback(async (id: number) => {
    try {
      await del(`/prize-pool/tiers/${id}`);
      message.success('档位已删除');
      loadData();
    } catch (error) {
      console.error('删除档位失败:', error);
    }
  }, [message, loadData]);

  const tierColumns: ColumnsType<PrizePoolTier> = [
    { title: '所需邀请人数', dataIndex: 'requiredInvites', render: (val: number) => `${val} 人` },
    {
      title: '奖励金额',
      dataIndex: 'rewardAmount',
      render: (val: string) => <AmountDisplay value={val} highlight />,
    },
    { title: '排序', dataIndex: 'sortOrder', width: 80 },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<RiEditLine size={14} />} onClick={() => handleOpenTierModal(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此档位？" onConfirm={() => handleDeleteTier(record.id)}>
            <Button type="text" danger size="small" icon={<RiDeleteBinLine size={14} />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  const poolUsedPercent = status
    ? Math.round(((Number(status.total) - Number(status.remaining)) / Number(status.total)) * 100) || 0
    : 0;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>奖池配置</Title>
          <Text type="secondary">管理奖池的全局设置和档位配置</Text>
        </div>
        <Space>
          <Button icon={<RiFileListLine size={16} />} onClick={() => router.push('/activities/prize-pool/records')}>
            领取记录
          </Button>
          <Button danger icon={<RiLoopLeftLine size={16} />} onClick={handleManualReset}>
            手动重置
          </Button>
        </Space>
      </div>

      {/* 全局设置 */}
      <Card title={<Space><RiSettings3Line size={16} />全局设置</Space>} style={{ marginBottom: 24 }}>
        <Form form={configForm} layout="vertical">
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item label="奖池开关" name="prize_pool_enabled" valuePropName="checked">
                <Switch checkedChildren="开启" unCheckedChildren="关闭" onChange={handleToggleEnabled} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="每日总金额" name="prize_pool_daily_amount" rules={[{ required: true, message: '请输入' }]}>
                <InputNumber min={0} precision={2} prefix={globalConfig.currencySymbol} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" loading={saving} onClick={handleSaveConfig}>
            保存设置
          </Button>
        </Form>
      </Card>

      {/* 今日状态 */}
      {status && (
        <Card title="今日状态" style={{ marginBottom: 24 }}>
          <Row gutter={24} align="middle">
            <Col xs={12} md={6}>
              <Statistic title="今日总额" value={status.total} prefix={globalConfig.currencySymbol} precision={0} />
            </Col>
            <Col xs={12} md={6}>
              <Statistic title="剩余金额" value={status.remaining} prefix={globalConfig.currencySymbol} precision={0} />
            </Col>
            <Col xs={12} md={6}>
              <Statistic title="已领取人次" value={status.claimedCount} />
            </Col>
            <Col xs={12} md={6}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>使用进度</Text>
                <Progress percent={poolUsedPercent} status={poolUsedPercent >= 90 ? 'exception' : 'active'} />
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* 档位管理 */}
      <Card
        title="档位列表"
        extra={
          <Space>
            <Button icon={<RiRefreshLine size={16} />} onClick={loadData}>刷新</Button>
            <Button type="primary" icon={<RiAddLine size={16} />} onClick={() => handleOpenTierModal()}>
              添加档位
            </Button>
          </Space>
        }
      >
        <Table rowKey="id" columns={tierColumns} dataSource={tiers} pagination={false} />
      </Card>

      <Modal
        title={editingTier ? '编辑档位' : '添加档位'}
        open={tierModalOpen}
        onOk={handleSaveTier}
        onCancel={() => {
          setTierModalOpen(false);
          setEditingTier(null);
          tierForm.resetFields();
        }}
        confirmLoading={saving}
      >
        <Form form={tierForm} layout="vertical">
          <Form.Item label="所需邀请人数" name="requiredInvites" rules={[{ required: true, message: '请输入邀请人数' }]}>
            <InputNumber min={1} precision={0} addonAfter="人" style={{ width: '100%' }} placeholder="邀请人数达到此数量可领取" />
          </Form.Item>
          <Form.Item label="奖励金额" name="rewardAmount" rules={[{ required: true, message: '请输入奖励金额' }]}>
            <InputNumber min={0} precision={2} prefix={globalConfig.currencySymbol} style={{ width: '100%' }} placeholder="请输入奖励金额" />
          </Form.Item>
          <Form.Item label="排序" name="sortOrder" initialValue={0}>
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
