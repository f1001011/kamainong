/**
 * @file 周薪配置页面
 * @description 活动管理 - 周薪活动配置，包含全局开关和奖励档位管理
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
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiRefreshLine,
  RiFileListLine,
  RiSettings3Line,
} from '@remixicon/react';

import { get, post, put, del } from '@/utils/request';
import { AmountDisplay } from '@/components/common';
import { useGlobalConfig } from '@/hooks/useGlobalConfig';

const { Title, Text } = Typography;

interface WeeklySalaryConfig {
  weekly_salary_enabled: boolean;
}

interface WeeklySalaryTier {
  id: number;
  minRecharge: string;
  rewardAmount: string;
  sortOrder: number;
}

export default function WeeklySalaryConfigPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const globalConfig = useGlobalConfig();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<WeeklySalaryConfig | null>(null);
  const [tiers, setTiers] = useState<WeeklySalaryTier[]>([]);
  const [saving, setSaving] = useState(false);
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<WeeklySalaryTier | null>(null);

  const [configForm] = Form.useForm();
  const [tierForm] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, tiersRes] = await Promise.all([
        get<WeeklySalaryConfig>('/weekly-salary/config'),
        get<{ list: WeeklySalaryTier[] }>('/weekly-salary/tiers'),
      ]);
      setConfig(configRes);
      setTiers(tiersRes.list);
      configForm.setFieldsValue(configRes);
    } catch (error) {
      console.error('加载周薪配置失败:', error);
    } finally {
      setLoading(false);
    }
  }, [configForm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleEnabled = useCallback(async (enabled: boolean) => {
    try {
      await put('/weekly-salary/config', { weekly_salary_enabled: enabled });
      setConfig((prev) => prev ? { ...prev, weekly_salary_enabled: enabled } : prev);
      message.success(enabled ? '周薪活动已启用' : '周薪活动已禁用');
    } catch (error) {
      console.error('切换状态失败:', error);
    }
  }, [message]);

  const handleOpenTierModal = useCallback((tier?: WeeklySalaryTier) => {
    if (tier) {
      setEditingTier(tier);
      tierForm.setFieldsValue({
        minRecharge: Number(tier.minRecharge),
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
        await put(`/weekly-salary/tiers/${editingTier.id}`, values);
        message.success('档位更新成功');
      } else {
        await post('/weekly-salary/tiers', values);
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
      await del(`/weekly-salary/tiers/${id}`);
      message.success('档位已删除');
      loadData();
    } catch (error) {
      console.error('删除档位失败:', error);
    }
  }, [message, loadData]);

  const tierColumns: ColumnsType<WeeklySalaryTier> = [
    {
      title: '最低充值门槛',
      dataIndex: 'minRecharge',
      render: (val: string) => <AmountDisplay value={val} />,
    },
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

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>周薪配置</Title>
          <Text type="secondary">管理周薪活动的全局设置和奖励档位</Text>
        </div>
        <Button icon={<RiFileListLine size={16} />} onClick={() => router.push('/activities/weekly-salary/records')}>
          发放记录
        </Button>
      </div>

      {/* 全局设置 */}
      <Card title={<Space><RiSettings3Line size={16} />全局设置</Space>} style={{ marginBottom: 24 }}>
        <Form form={configForm} layout="vertical">
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item label="周薪开关" name="weekly_salary_enabled" valuePropName="checked">
                <Switch checkedChildren="开启" unCheckedChildren="关闭" onChange={handleToggleEnabled} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 奖励档位 */}
      <Card
        title="奖励档位"
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

      {/* 档位编辑弹窗 */}
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
          <Form.Item label="最低充值门槛" name="minRecharge" rules={[{ required: true, message: '请输入最低充值门槛' }]}>
            <InputNumber min={0} precision={2} prefix={globalConfig.currencySymbol} style={{ width: '100%' }} placeholder="团队充值达到此金额可领取" />
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
