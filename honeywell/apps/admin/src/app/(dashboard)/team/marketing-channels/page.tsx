/**
 * @file 渠道链接管理页
 * @description 管理后台渠道链接功能：列表展示（含统计）、创建/编辑弹窗、展开行子表格、删除确认
 * @depends 渠道链接.md 第5.5节 - 列表页核心代码
 */

'use client';

import React, { useRef, useState, useCallback } from 'react';
import {
  Button,
  Typography,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  App,
  Switch,
} from 'antd';
import { ProTable, PageContainer } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiUserLine,
} from '@remixicon/react';

import { TimeDisplay } from '@/components/common/TimeDisplay';
import { CopyButton } from '@/components/common/CopyButton';
import { formatCurrency } from '@/utils/format';
import { fetchUserList } from '@/services/users';
import {
  fetchChannelList,
  createChannel,
  updateChannel,
  deleteChannel,
  fetchChannelDetail,
} from '@/services/marketing-channels';
import type {
  MarketingChannelItem,
  ChannelUserItem,
  CreateChannelRequest,
  UpdateChannelRequest,
} from '@/types/marketing-channels';

const { Text } = Typography;

// ================================
// 工具函数
// ================================

/** 防抖函数 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ================================
// 子表格：渠道下线用户
// ================================

function ChannelUsersTable({ channelId }: { channelId: number }) {
  const columns: ProColumns<ChannelUserItem>[] = [
    {
      title: '用户ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 130,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (_, record) => (
        <Tag color={record.status === 'ACTIVE' ? 'green' : 'red'}>
          {record.status === 'ACTIVE' ? '正常' : '封禁'}
        </Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (_, record) => <TimeDisplay value={record.createdAt} />,
    },
    {
      title: '充值次数',
      dataIndex: 'rechargeCount',
      width: 100,
      align: 'right',
    },
    {
      title: '充值总额',
      dataIndex: 'totalRechargeAmount',
      width: 130,
      align: 'right',
      render: (_, record) => formatCurrency(record.totalRechargeAmount),
    },
    {
      title: '首次充值时间',
      dataIndex: 'firstRechargeAt',
      width: 180,
      render: (_, record) => <TimeDisplay value={record.firstRechargeAt} />,
    },
    {
      title: '最近充值时间',
      dataIndex: 'lastRechargeAt',
      width: 180,
      render: (_, record) => <TimeDisplay value={record.lastRechargeAt} />,
    },
  ];

  return (
    <ProTable<ChannelUserItem>
      columns={columns}
      rowKey="id"
      headerTitle="下线用户列表"
      search={false}
      options={false}
      toolBarRender={false}
      request={async (params) => {
        try {
          const data = await fetchChannelDetail(channelId, {
            page: params.current,
            pageSize: params.pageSize,
          });
          return {
            data: data.users.list,
            success: true,
            total: data.users.pagination.total,
          };
        } catch {
          return { data: [], success: false, total: 0 };
        }
      }}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
      }}
      size="small"
    />
  );
}

// ================================
// 主页面
// ================================

export default function MarketingChannelsPage() {
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [createForm] = Form.useForm();

  // 弹窗状态
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChannel, setEditingChannel] = useState<MarketingChannelItem | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // 用户搜索选项
  const [userOptions, setUserOptions] = useState<{ label: string; value: number }[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);

  // 用户远程搜索（防抖）
  const handleUserSearch = useCallback(
    debounce(async (value: string) => {
      if (!value || value.length < 2) {
        setUserOptions([]);
        return;
      }
      setUserSearchLoading(true);
      try {
        const data = await fetchUserList({ keyword: value, pageSize: 10 });
        setUserOptions(
          data.list.map((u) => ({
            label: `${u.phone} (ID:${u.id})`,
            value: u.id,
          }))
        );
      } catch {
        setUserOptions([]);
      } finally {
        setUserSearchLoading(false);
      }
    }, 300),
    []
  );

  // 打开创建弹窗
  const handleCreate = useCallback(() => {
    setEditingChannel(null);
    createForm.resetFields();
    setUserOptions([]);
    setModalVisible(true);
  }, [createForm]);

  // 打开编辑弹窗
  const handleEdit = useCallback((record: MarketingChannelItem) => {
    setEditingChannel(record);
    createForm.setFieldsValue({
      name: record.name,
      userId: record.userId,
      remark: record.remark || '',
      isActive: record.isActive,
    });
    // 预设用户选项
    setUserOptions([{
      label: `${record.userPhone} (${record.userInviteCode})`,
      value: record.userId,
    }]);
    setModalVisible(true);
  }, [createForm]);

  // 提交创建/编辑
  const handleSubmit = useCallback(async () => {
    try {
      const values = await createForm.validateFields();
      setModalLoading(true);

      if (editingChannel) {
        // 编辑模式
        const updateData: UpdateChannelRequest = {};
        if (values.name !== editingChannel.name) updateData.name = values.name;
        if (values.remark !== editingChannel.remark) updateData.remark = values.remark || null;
        if (values.isActive !== editingChannel.isActive) updateData.isActive = values.isActive;

        await updateChannel(editingChannel.id, updateData);
        message.success('渠道更新成功');
      } else {
        // 创建模式
        const createData: CreateChannelRequest = {
          name: values.name,
          userId: values.userId,
          remark: values.remark || undefined,
        };
        await createChannel(createData);
        message.success('渠道创建成功');
      }

      setModalVisible(false);
      actionRef.current?.reload();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        // Antd 表单校验失败，错误已在表单项内联显示，无需 toast
      } else if (error instanceof Error) {
        message.error(error.message || '操作失败');
      }
    } finally {
      setModalLoading(false);
    }
  }, [createForm, editingChannel, message]);

  // 删除渠道
  const handleDelete = useCallback((record: MarketingChannelItem) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除渠道「${record.name}」吗？删除后仅移除渠道记录，不影响已注册用户。`,
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await deleteChannel(record.id);
        message.success('渠道已删除');
        actionRef.current?.reload();
      },
    });
  }, [message, modal]);

  // 切换启用/停用
  const handleToggleActive = useCallback(async (record: MarketingChannelItem) => {
    try {
      await updateChannel(record.id, { isActive: !record.isActive });
      message.success(record.isActive ? '渠道已停用' : '渠道已启用');
      actionRef.current?.reload();
    } catch (error: unknown) {
      if (error instanceof Error) {
        message.error(error.message || '操作失败');
      }
    }
  }, [message]);

  // ================================
  // ProTable 列定义
  // ================================

  const columns: ProColumns<MarketingChannelItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      hideInSearch: true,
    },
    {
      title: '渠道名称',
      dataIndex: 'name',
      width: 150,
      formItemProps: {
        name: 'keyword',
      },
      fieldProps: {
        placeholder: '搜索渠道名称',
      },
    },
    {
      title: '关联用户',
      dataIndex: 'userPhone',
      width: 140,
      hideInSearch: true,
      render: (_, record) => (
        <Space size={4}>
          <RiUserLine size={14} style={{ color: '#8c8c8c' }} />
          <a href={`/users/${record.userId}`} target="_blank" rel="noopener noreferrer">
            {record.userPhone}
          </a>
        </Space>
      ),
    },
    {
      title: '邀请链接',
      dataIndex: 'inviteLink',
      width: 200,
      hideInSearch: true,
      ellipsis: true,
      render: (_, record) => (
        <CopyButton text={record.inviteLink} showText maxLength={30} />
      ),
    },
    {
      title: '注册人数',
      dataIndex: ['stats', 'registerCount'],
      width: 100,
      hideInSearch: true,
      align: 'right',
      sorter: false,
    },
    {
      title: '首冲人数',
      dataIndex: ['stats', 'firstRechargeCount'],
      width: 100,
      hideInSearch: true,
      align: 'right',
    },
    {
      title: '首冲率',
      dataIndex: ['stats', 'firstRechargeRate'],
      width: 90,
      hideInSearch: true,
      align: 'right',
      render: (_, record) => {
        const rate = parseFloat(record.stats.firstRechargeRate);
        let color = '#8c8c8c';
        if (rate >= 50) color = '#52c41a';
        else if (rate < 10 && record.stats.registerCount > 0) color = '#ff4d4f';
        return <Text style={{ color }}>{record.stats.firstRechargeRate}%</Text>;
      },
    },
    {
      title: '老客充值',
      dataIndex: ['stats', 'repeatRechargeCount'],
      width: 100,
      hideInSearch: true,
      align: 'right',
    },
    {
      title: '净充值额',
      dataIndex: ['stats', 'totalNetRecharge'],
      width: 130,
      hideInSearch: true,
      align: 'right',
      render: (_, record) => formatCurrency(record.stats.totalNetRecharge),
    },
    {
      title: '人均充值',
      dataIndex: ['stats', 'avgRechargePerUser'],
      width: 130,
      hideInSearch: true,
      align: 'right',
      render: (_, record) => formatCurrency(record.stats.avgRechargePerUser),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 80,
      valueType: 'select',
      valueEnum: {
        true: { text: '启用', status: 'Success' },
        false: { text: '停用', status: 'Default' },
      },
      render: (_, record) => (
        <Tag color={record.isActive ? 'green' : 'default'}>
          {record.isActive ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      hideInSearch: true,
      render: (_, record) => <TimeDisplay value={record.createdAt} />,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<RiEditLine size={14} />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleToggleActive(record)}
          >
            {record.isActive ? '停用' : '启用'}
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<RiDeleteBinLine size={14} />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: '渠道链接',
        subTitle: '管理推广渠道，追踪渠道推广效果',
      }}
    >
      <ProTable<MarketingChannelItem>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 1800 }}
        request={async (params) => {
          try {
            const data = await fetchChannelList({
              page: params.current,
              pageSize: params.pageSize,
              keyword: params.keyword,
              isActive: params.isActive,
            });
            return {
              data: data.list,
              success: true,
              total: data.pagination.total,
            };
          } catch {
            return { data: [], success: false, total: 0 };
          }
        }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
          span: 6,
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: true,
        }}
        columnsState={{
          persistenceKey: 'marketing-channels-columns',
          persistenceType: 'localStorage',
        }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<RiAddLine size={16} />}
            onClick={handleCreate}
          >
            创建渠道
          </Button>,
        ]}
        expandable={{
          expandedRowRender: (record) => (
            <ChannelUsersTable channelId={record.id} />
          ),
        }}
      />

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingChannel ? '编辑渠道' : '创建渠道'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={modalLoading}
        okText={editingChannel ? '保存' : '创建'}
        cancelText="取消"
        destroyOnClose
        width={500}
      >
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{ isActive: true }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="渠道名称"
            rules={[
              { required: true, message: '请输入渠道名称' },
              { max: 100, message: '渠道名称不能超过100字符' },
            ]}
          >
            <Input placeholder="例如：Facebook推广" maxLength={100} />
          </Form.Item>

          <Form.Item
            name="userId"
            label="关联用户"
            rules={[{ required: true, message: '请选择关联用户' }]}
            extra="输入手机号搜索用户（至少输入2个字符）"
          >
            <Select
              showSearch
              filterOption={false}
              onSearch={(value: string) => handleUserSearch(value)}
              options={userOptions}
              disabled={!!editingChannel}
              placeholder="输入手机号搜索用户"
              loading={userSearchLoading}
              notFoundContent={userSearchLoading ? '搜索中...' : '未找到用户'}
              suffixIcon={<RiUserLine size={14} />}
            />
          </Form.Item>

          {editingChannel && (
            <Form.Item
              name="isActive"
              label="启用状态"
              valuePropName="checked"
            >
              <Switch checkedChildren="启用" unCheckedChildren="停用" />
            </Form.Item>
          )}

          <Form.Item
            name="remark"
            label="备注"
            rules={[{ max: 500, message: '备注不能超过500字符' }]}
          >
            <Input.TextArea
              placeholder="可选，填写渠道备注说明"
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}
