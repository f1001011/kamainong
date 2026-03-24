/**
 * @file 转盘配置页面
 * @description 活动管理 - 幸运转盘配置，包含全局设置和奖品管理
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  Input,
  Switch,
  Popconfirm,
  Alert,
  Row,
  Col,
  Divider,
  Spin,
  Tag,
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
import useGlobalConfig from '@/hooks/useGlobalConfig';

const { Title, Text } = Typography;

interface SpinWheelConfig {
  spin_wheel_enabled: boolean;
  spin_max_daily: number;
  spin_invite_threshold: number;
}

interface SpinWheelPrize {
  id: number;
  name: string;
  amount: string;
  probability: number;
  sortOrder: number;
}

export default function SpinWheelConfigPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const globalConfig = useGlobalConfig();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<SpinWheelConfig | null>(null);
  const [prizes, setPrizes] = useState<SpinWheelPrize[]>([]);
  const [saving, setSaving] = useState(false);
  const [prizeModalOpen, setPrizeModalOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<SpinWheelPrize | null>(null);

  const [configForm] = Form.useForm();
  const [prizeForm] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, prizesRes] = await Promise.all([
        get<SpinWheelConfig>('/spin-wheel/config'),
        get<{ list: SpinWheelPrize[] }>('/spin-wheel/prizes'),
      ]);
      setConfig(configRes);
      setPrizes(prizesRes.list);
      configForm.setFieldsValue(configRes);
    } catch (error) {
      console.error('加载转盘配置失败:', error);
    } finally {
      setLoading(false);
    }
  }, [configForm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalProbability = useMemo(() => {
    return prizes.reduce((sum, p) => sum + p.probability, 0);
  }, [prizes]);

  const handleSaveConfig = useCallback(async () => {
    try {
      const values = await configForm.validateFields();
      setSaving(true);
      await put('/spin-wheel/config', values);
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
      await put('/spin-wheel/config', { spin_wheel_enabled: enabled });
      setConfig((prev) => prev ? { ...prev, spin_wheel_enabled: enabled } : prev);
      configForm.setFieldValue('spin_wheel_enabled', enabled);
      message.success(enabled ? '转盘已启用' : '转盘已禁用');
    } catch (error) {
      console.error('切换状态失败:', error);
    }
  }, [configForm, message]);

  const handleOpenPrizeModal = useCallback((prize?: SpinWheelPrize) => {
    if (prize) {
      setEditingPrize(prize);
      prizeForm.setFieldsValue({
        name: prize.name,
        amount: Number(prize.amount),
        probability: prize.probability,
        sortOrder: prize.sortOrder,
      });
    } else {
      setEditingPrize(null);
      prizeForm.resetFields();
    }
    setPrizeModalOpen(true);
  }, [prizeForm]);

  const handleSavePrize = useCallback(async () => {
    try {
      const values = await prizeForm.validateFields();
      setSaving(true);

      if (editingPrize) {
        await put(`/spin-wheel/prizes/${editingPrize.id}`, values);
        message.success('奖品更新成功');
      } else {
        await post('/spin-wheel/prizes', values);
        message.success('奖品创建成功');
      }

      setPrizeModalOpen(false);
      setEditingPrize(null);
      prizeForm.resetFields();
      loadData();
    } catch (error) {
      console.error('保存奖品失败:', error);
    } finally {
      setSaving(false);
    }
  }, [prizeForm, editingPrize, message, loadData]);

  const handleDeletePrize = useCallback(async (id: number) => {
    try {
      await del(`/spin-wheel/prizes/${id}`);
      message.success('奖品已删除');
      loadData();
    } catch (error) {
      console.error('删除奖品失败:', error);
    }
  }, [message, loadData]);

  const prizeColumns: ColumnsType<SpinWheelPrize> = [
    { title: '奖品名称', dataIndex: 'name' },
    {
      title: '金额',
      dataIndex: 'amount',
      render: (val: string) => <AmountDisplay value={val} />,
    },
    {
      title: '概率 (%)',
      dataIndex: 'probability',
      render: (val: number) => <Tag color={val > 10 ? 'green' : 'orange'}>{val}%</Tag>,
    },
    { title: '排序', dataIndex: 'sortOrder', width: 80 },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<RiEditLine size={14} />} onClick={() => handleOpenPrizeModal(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此奖品？" onConfirm={() => handleDeletePrize(record.id)}>
            <Button type="text" danger size="small" icon={<RiDeleteBinLine size={14} />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>转盘配置</Title>
          <Text type="secondary">管理幸运转盘的全局设置和奖品配置</Text>
        </div>
        <Button
          icon={<RiFileListLine size={16} />}
          onClick={() => router.push('/activities/spin-wheel/records')}
        >
          抽奖记录
        </Button>
      </div>

      {/* 全局设置 */}
      <Card
        title={<Space><RiSettings3Line size={16} />全局设置</Space>}
        style={{ marginBottom: 24 }}
      >
        <Form form={configForm} layout="vertical">
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item label="转盘开关" name="spin_wheel_enabled" valuePropName="checked">
                <Switch
                  checkedChildren="开启"
                  unCheckedChildren="关闭"
                  onChange={handleToggleEnabled}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="每日最大抽奖次数" name="spin_max_daily" rules={[{ required: true, message: '请输入' }]}>
                <InputNumber min={1} max={100} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="邀请人数门槛" name="spin_invite_threshold" rules={[{ required: true, message: '请输入' }]}>
                <InputNumber min={0} max={1000} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" loading={saving} onClick={handleSaveConfig}>
            保存设置
          </Button>
        </Form>
      </Card>

      {/* 概率校验 */}
      {prizes.length > 0 && Math.abs(totalProbability - 100) > 0.01 && (
        <Alert
          type="warning"
          message={`概率总和为 ${totalProbability.toFixed(2)}%，建议调整为 100%`}
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}

      {/* 奖品管理 */}
      <Card
        title="奖品列表"
        extra={
          <Space>
            <Button icon={<RiRefreshLine size={16} />} onClick={loadData}>刷新</Button>
            <Button type="primary" icon={<RiAddLine size={16} />} onClick={() => handleOpenPrizeModal()}>
              添加奖品
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={prizeColumns}
          dataSource={prizes}
          pagination={false}
        />
      </Card>

      {/* 奖品编辑弹窗 */}
      <Modal
        title={editingPrize ? '编辑奖品' : '添加奖品'}
        open={prizeModalOpen}
        onOk={handleSavePrize}
        onCancel={() => {
          setPrizeModalOpen(false);
          setEditingPrize(null);
          prizeForm.resetFields();
        }}
        confirmLoading={saving}
      >
        <Form form={prizeForm} layout="vertical">
          <Form.Item label="奖品名称" name="name" rules={[{ required: true, message: '请输入奖品名称' }]}>
            <Input placeholder="请输入奖品名称" maxLength={50} />
          </Form.Item>
          <Form.Item label="金额" name="amount" rules={[{ required: true, message: '请输入金额' }]}>
            <InputNumber min={0} precision={2} prefix={globalConfig.currencySymbol} style={{ width: '100%' }} placeholder="请输入金额" />
          </Form.Item>
          <Form.Item label="概率 (%)" name="probability" rules={[{ required: true, message: '请输入概率' }]}>
            <InputNumber min={0} max={100} precision={2} addonAfter="%" style={{ width: '100%' }} placeholder="请输入概率" />
          </Form.Item>
          <Form.Item label="排序" name="sortOrder" initialValue={0}>
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
