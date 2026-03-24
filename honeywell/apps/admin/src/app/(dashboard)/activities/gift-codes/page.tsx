/**
 * @file 礼品码管理页面
 * @description 活动管理 - 礼品码列表，支持创建/编辑/启用禁用/删除/查看详情
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
  Input,
  InputNumber,
  Select,
  Switch,
  Popconfirm,
  Tag,
  Tooltip,
  DatePicker,
  Radio,
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
  RiEyeLine,
  RiFileCopyLine,
  RiSearchLine,
} from '@remixicon/react';
import dayjs from 'dayjs';

import { get, post, put, del } from '@/utils/request';
import { AmountDisplay } from '@/components/common';
import useGlobalConfig from '@/hooks/useGlobalConfig';
import { formatSystemTime } from '@/utils/timezone';

const { Title, Text } = Typography;

interface GiftCodeItem {
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
}

interface ListResponse {
  list: GiftCodeItem[];
  pagination: { page: number; pageSize: number; total: number };
}

export default function GiftCodesPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const globalConfig = useGlobalConfig();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GiftCodeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<{ status?: string; amountType?: string; keyword?: string }>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const amountType = Form.useWatch('amountType', form);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize, ...filters };
      const res = await get<ListResponse>('/gift-codes', params);
      setData(res.list);
      setTotal(res.pagination.total);
    } catch (error) {
      console.error('加载礼品码列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = useCallback(() => {
    setEditingId(null);
    form.resetFields();
    form.setFieldValue('amountType', 'FIXED');
    form.setFieldValue('requirement', 'NONE');
    form.setFieldValue('totalCount', 1);
    setModalOpen(true);
  }, [form]);

  const handleEdit = useCallback((record: GiftCodeItem) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      requirement: record.requirement,
      remark: record.remark,
      startAt: record.startAt ? dayjs(record.startAt) : null,
      expireAt: record.expireAt ? dayjs(record.expireAt) : null,
    });
    setModalOpen(true);
  }, [form]);

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload: Record<string, unknown> = { ...values };
      if (values.startAt) payload.startAt = values.startAt.toISOString();
      else payload.startAt = null;
      if (values.expireAt) payload.expireAt = values.expireAt.toISOString();
      else payload.expireAt = null;

      if (editingId) {
        await put(`/gift-codes/${editingId}`, {
          name: payload.name,
          requirement: payload.requirement,
          startAt: payload.startAt,
          expireAt: payload.expireAt,
          remark: payload.remark,
        });
        message.success('礼品码已更新');
      } else {
        await post('/gift-codes', payload);
        message.success('礼品码创建成功');
      }

      setModalOpen(false);
      form.resetFields();
      loadData();
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setSaving(false);
    }
  }, [form, editingId, message, loadData]);

  const handleToggleStatus = useCallback(async (id: number, enabled: boolean) => {
    try {
      await put(`/gift-codes/${id}/status`, { enabled });
      message.success(enabled ? '已启用' : '已禁用');
      loadData();
    } catch (error) {
      console.error('切换状态失败:', error);
    }
  }, [message, loadData]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await del(`/gift-codes/${id}`);
      message.success('已删除');
      loadData();
    } catch (error) {
      console.error('删除失败:', error);
    }
  }, [message, loadData]);

  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    message.success('已复制礼品码');
  }, [message]);

  const statusTagMap: Record<string, { color: string; text: string }> = {
    ACTIVE: { color: 'green', text: '进行中' },
    DISABLED: { color: 'default', text: '已禁用' },
    EXPIRED: { color: 'orange', text: '已过期' },
    EXHAUSTED: { color: 'red', text: '已领完' },
  };

  const columns: ColumnsType<GiftCodeItem> = [
    {
      title: '礼品码',
      dataIndex: 'code',
      width: 140,
      render: (code: string) => (
        <Space>
          <Text code copyable={{ text: code }}>{code}</Text>
        </Space>
      ),
    },
    { title: '名称', dataIndex: 'name', width: 150, ellipsis: true },
    {
      title: '类型',
      dataIndex: 'amountType',
      width: 90,
      render: (v: string) => (
        <Tag color={v === 'FIXED' ? 'blue' : 'purple'}>
          {v === 'FIXED' ? '固定' : '拼手气'}
        </Tag>
      ),
    },
    {
      title: '金额',
      key: 'amount',
      width: 180,
      render: (_: unknown, record: GiftCodeItem) => {
        if (record.amountType === 'FIXED') {
          return <span>每人 <AmountDisplay value={record.fixedAmount} /></span>;
        }
        return (
          <span>
            总 <AmountDisplay value={record.totalAmount} />
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {globalConfig.currencySymbol} {record.minAmount} ~ {record.maxAmount}/人
            </Text>
          </span>
        );
      },
    },
    {
      title: '领取进度',
      key: 'progress',
      width: 100,
      render: (_: unknown, record: GiftCodeItem) => (
        <span>
          <Text strong>{record.claimedCount}</Text>
          <Text type="secondary"> / {record.totalCount}</Text>
        </span>
      ),
    },
    {
      title: '前置条件',
      dataIndex: 'requirement',
      width: 110,
      render: (v: string) => v === 'MUST_PURCHASE' ? <Tag color="orange">需购买</Tag> : <Tag>无</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (status: string) => {
        const info = statusTagMap[status] || { color: 'default', text: status };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '有效期',
      key: 'validity',
      width: 180,
      render: (_: unknown, record: GiftCodeItem) => {
        if (!record.startAt && !record.expireAt) return <Text type="secondary">永久有效</Text>;
        return (
          <div style={{ fontSize: 12 }}>
            {record.startAt && <div>开始: {formatSystemTime(record.startAt, 'MM-DD HH:mm')}</div>}
            {record.expireAt && <div>截止: {formatSystemTime(record.expireAt, 'MM-DD HH:mm')}</div>}
          </div>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 150,
      render: (v: string) => formatSystemTime(v, 'YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_: unknown, record: GiftCodeItem) => (
        <Space size={4}>
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<RiEyeLine size={14} />}
              onClick={() => router.push(`/activities/gift-codes/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="复制礼品码">
            <Button
              type="text"
              size="small"
              icon={<RiFileCopyLine size={14} />}
              onClick={() => handleCopyCode(record.code)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<RiEditLine size={14} />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Switch
            size="small"
            checked={record.status === 'ACTIVE'}
            onChange={(checked) => handleToggleStatus(record.id, checked)}
            disabled={record.status === 'EXHAUSTED' || record.status === 'EXPIRED'}
          />
          {record.claimedCount === 0 && (
            <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
              <Button type="text" danger size="small" icon={<RiDeleteBinLine size={14} />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (loading && data.length === 0) {
    return <div style={{ padding: 24, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>礼品码管理</Title>
          <Text type="secondary">管理礼品码的创建、分发和使用状态</Text>
        </div>
        <Space>
          <Button icon={<RiRefreshLine size={16} />} onClick={loadData}>刷新</Button>
          <Button type="primary" icon={<RiAddLine size={16} />} onClick={handleCreate}>创建礼品码</Button>
        </Space>
      </div>

      {/* 筛选栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 130 }}
            onChange={(v) => { setFilters(f => ({ ...f, status: v })); setPage(1); }}
            options={[
              { value: 'ACTIVE', label: '进行中' },
              { value: 'DISABLED', label: '已禁用' },
              { value: 'EXHAUSTED', label: '已领完' },
              { value: 'EXPIRED', label: '已过期' },
            ]}
          />
          <Select
            placeholder="类型筛选"
            allowClear
            style={{ width: 130 }}
            onChange={(v) => { setFilters(f => ({ ...f, amountType: v })); setPage(1); }}
            options={[
              { value: 'FIXED', label: '固定金额' },
              { value: 'RANDOM', label: '拼手气' },
            ]}
          />
          <Input.Search
            placeholder="搜索码/名称"
            allowClear
            style={{ width: 200 }}
            prefix={<RiSearchLine size={14} />}
            onSearch={(v) => { setFilters(f => ({ ...f, keyword: v || undefined })); setPage(1); }}
          />
        </Space>
      </Card>

      {/* 列表 */}
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingId ? '编辑礼品码' : '创建礼品码'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        confirmLoading={saving}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ amountType: 'FIXED', requirement: 'NONE', totalCount: 1 }}>
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：新春红包、注册礼包" maxLength={100} />
          </Form.Item>

          {!editingId && (
            <>
              <Form.Item label="金额类型" name="amountType" rules={[{ required: true }]}>
                <Radio.Group>
                  <Radio.Button value="FIXED">固定金额</Radio.Button>
                  <Radio.Button value="RANDOM">拼手气红包</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item label="总份数" name="totalCount" rules={[{ required: true, message: '请输入份数' }]}>
                <InputNumber min={1} max={100000} precision={0} style={{ width: '100%' }} placeholder="1=一码一人，>1=一码多人" />
              </Form.Item>

              {amountType === 'FIXED' ? (
                <Form.Item label="每人金额" name="fixedAmount" rules={[{ required: true, message: '请输入金额' }]}>
                  <InputNumber min={1} precision={0} prefix={globalConfig.currencySymbol} style={{ width: '100%' }} placeholder="每人领取的固定金额" />
                </Form.Item>
              ) : (
                <>
                  <Form.Item label="总金额" name="totalAmount" rules={[{ required: true, message: '请输入总金额' }]}>
                    <InputNumber min={1} precision={0} prefix={globalConfig.currencySymbol} style={{ width: '100%' }} placeholder="红包总金额" />
                  </Form.Item>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="最低金额/人" name="minAmount" rules={[{ required: true, message: '请输入' }]}>
                        <InputNumber min={1} precision={0} prefix={globalConfig.currencySymbol} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="最高金额/人" name="maxAmount" rules={[{ required: true, message: '请输入' }]}>
                        <InputNumber min={1} precision={0} prefix={globalConfig.currencySymbol} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              )}
            </>
          )}

          <Form.Item label="前置条件" name="requirement">
            <Select
              options={[
                { value: 'NONE', label: '无前置条件' },
                { value: 'MUST_PURCHASE', label: '需先购买产品' },
              ]}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="生效时间" name="startAt">
                <DatePicker showTime style={{ width: '100%' }} placeholder="不填则立即生效" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="过期时间" name="expireAt">
                <DatePicker showTime style={{ width: '100%' }} placeholder="不填则永不过期" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} placeholder="可选，仅后台可见" maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
