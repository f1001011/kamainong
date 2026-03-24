/**
 * @file 管理员管理页
 * @description 管理后台系统的管理员账号，支持增删改查、状态切换、密码重置
 * @depends 开发文档/04-后台管理端/04.10-安全管理/04.10.1-管理员管理页.md
 */

'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Button,
  Dropdown,
  Typography,
  Space,
  Modal,
  Form,
  Input,
  Checkbox,
  Tooltip,
  Progress,
  Radio,
  App,
  Tag,
} from 'antd';
import type { MenuProps } from 'antd';
import { ProTable, PageContainer } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import {
  RiAddLine,
  RiEditLine,
  RiKeyLine,
  RiCheckLine,
  RiProhibitedLine,
  RiDeleteBinLine,
  RiArrowDownSLine,
  RiVipCrownFill,
  RiRefreshLine,
  RiFileCopyLine,
} from '@remixicon/react';

import { useAuthStore } from '@/stores/admin';
import { TimeDisplay } from '@/components/common/TimeDisplay';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { CopyButton } from '@/components/common/CopyButton';
import { ListPageSkeleton } from '@/components/tables/ListPageSkeleton';
import {
  fetchAdminList,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  toggleAdminStatus,
  resetAdminPassword,
  generateRandomPassword,
} from '@/services/admins';
import type { Admin, CreateAdminFormData, UpdateAdminFormData, PasswordStrength, ResetPasswordMode } from '@/types/admins';

const { Text, Paragraph } = Typography;

/**
 * 计算密码强度
 * @description 依据密码规则计算强度等级
 */
function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password || password.length < 8) return 'weak';
  
  let score = 0;
  
  // 长度分数
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // 包含小写字母
  if (/[a-z]/.test(password)) score += 1;
  // 包含大写字母
  if (/[A-Z]/.test(password)) score += 1;
  // 包含数字
  if (/\d/.test(password)) score += 1;
  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  
  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
}

/**
 * 密码强度指示器组件
 */
function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = calculatePasswordStrength(password);
  
  const config = {
    weak: { percent: 33, color: '#ff4d4f', text: '弱' },
    medium: { percent: 66, color: '#faad14', text: '中' },
    strong: { percent: 100, color: '#52c41a', text: '强' },
  };
  
  const { percent, color, text } = config[strength];
  
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>密码强度</Text>
        <Text style={{ fontSize: 12, color }}>{text}</Text>
      </div>
      <Progress
        percent={percent}
        size="small"
        strokeColor={color}
        showInfo={false}
      />
    </div>
  );
}

/**
 * 管理员状态标签
 */
function AdminStatusTag({ isActive }: { isActive: boolean }) {
  return (
    <Tag color={isActive ? 'success' : 'default'}>
      {isActive ? '启用' : '禁用'}
    </Tag>
  );
}

/**
 * 管理员管理页面
 */
export default function AdminManagePage() {
  const actionRef = useRef<ActionType>(null);
  const { admin: currentAdmin } = useAuthStore();
  const { message } = App.useApp();
  
  // 首次加载状态
  const [initialLoading, setInitialLoading] = useState(true);
  
  // 弹窗状态
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [resetPwdModalOpen, setResetPwdModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  // 操作状态
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [targetAdmin, setTargetAdmin] = useState<Admin | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // 表单实例
  const [formInstance] = Form.useForm();
  const [resetPwdForm] = Form.useForm();
  
  // 重置密码相关状态
  const [resetPwdMode, setResetPwdMode] = useState<ResetPasswordMode>('auto');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  
  /**
   * 检查是否可以操作目标管理员
   * @returns [canOperate, reason]
   */
  const checkCanOperate = useCallback((record: Admin): [boolean, string] => {
    // 不能操作超级管理员（ID=1）
    if (record.id === 1) {
      return [false, '不能操作超级管理员'];
    }
    // 不能操作自己
    if (record.id === currentAdmin?.id) {
      return [false, '不能操作自己'];
    }
    return [true, ''];
  }, [currentAdmin?.id]);
  
  /**
   * 打开添加管理员弹窗
   */
  const handleAdd = useCallback(() => {
    setEditingAdmin(null);
    formInstance.resetFields();
    formInstance.setFieldsValue({ isActive: true });
    setFormModalOpen(true);
  }, [formInstance]);
  
  /**
   * 打开编辑管理员弹窗
   */
  const handleEdit = useCallback((record: Admin) => {
    const [canOperate, reason] = checkCanOperate(record);
    if (!canOperate) {
      message.warning(reason);
      return;
    }
    
    setEditingAdmin(record);
    formInstance.setFieldsValue({
      username: record.username,
      nickname: record.nickname || '',
      isActive: record.isActive,
    });
    setFormModalOpen(true);
  }, [checkCanOperate, formInstance, message]);
  
  /**
   * 打开重置密码弹窗
   */
  const handleResetPassword = useCallback((record: Admin) => {
    const [canOperate, reason] = checkCanOperate(record);
    if (!canOperate) {
      message.warning(reason);
      return;
    }
    
    setTargetAdmin(record);
    setResetPwdMode('auto');
    setGeneratedPassword('');
    setShowGeneratedPassword(false);
    resetPwdForm.resetFields();
    setResetPwdModalOpen(true);
  }, [checkCanOperate, message, resetPwdForm]);
  
  /**
   * 处理启用/禁用
   */
  const handleToggleStatus = useCallback(async (record: Admin) => {
    const [canOperate, reason] = checkCanOperate(record);
    if (!canOperate) {
      message.warning(reason);
      return;
    }
    
    const action = record.isActive ? '禁用' : '启用';
    const content = record.isActive
      ? `确定禁用管理员 ${record.username}？禁用后该管理员将无法登录系统。`
      : `确定启用管理员 ${record.username}？`;
    
    Modal.confirm({
      title: `确认${action}`,
      content,
      okText: `确定${action}`,
      okButtonProps: { danger: record.isActive },
      cancelText: '取消',
      onOk: async () => {
        try {
          await toggleAdminStatus(record.id, !record.isActive);
          message.success(`${action}成功`);
          actionRef.current?.reload();
        } catch (error) {
          // 错误已在 request 中处理
        }
      },
    });
  }, [checkCanOperate, message]);
  
  /**
   * 打开删除确认弹窗
   */
  const handleDelete = useCallback((record: Admin) => {
    const [canOperate, reason] = checkCanOperate(record);
    if (!canOperate) {
      message.warning(reason);
      return;
    }
    
    setTargetAdmin(record);
    setDeleteModalOpen(true);
  }, [checkCanOperate, message]);
  
  /**
   * 确认删除
   */
  const confirmDelete = useCallback(async () => {
    if (!targetAdmin) return;
    
    setDeleteLoading(true);
    try {
      await deleteAdmin(targetAdmin.id);
      message.success('删除成功');
      setDeleteModalOpen(false);
      setTargetAdmin(null);
      actionRef.current?.reload();
    } catch (error) {
      // 错误已在 request 中处理
    } finally {
      setDeleteLoading(false);
    }
  }, [targetAdmin, message]);
  
  /**
   * 提交表单（创建/更新管理员）
   */
  const handleFormSubmit = useCallback(async () => {
    try {
      const values = await formInstance.validateFields();
      setFormLoading(true);
      
      if (editingAdmin) {
        // 编辑模式
        const updateData: UpdateAdminFormData = {
          nickname: values.nickname || undefined,
          isActive: values.isActive,
        };
        await updateAdmin(editingAdmin.id, updateData);
        message.success('更新成功');
      } else {
        // 添加模式
        const { confirmPassword, ...createData } = values as CreateAdminFormData;
        await createAdmin(createData);
        message.success('创建成功');
      }
      
      setFormModalOpen(false);
      setEditingAdmin(null);
      formInstance.resetFields();
      actionRef.current?.reload();
    } catch (error) {
      // 表单校验失败或 API 错误（API 错误已在 request 中处理）
    } finally {
      setFormLoading(false);
    }
  }, [editingAdmin, formInstance, message]);
  
  /**
   * 生成随机密码
   */
  const handleGeneratePassword = useCallback(() => {
    const password = generateRandomPassword();
    setGeneratedPassword(password);
    setShowGeneratedPassword(true);
  }, []);
  
  /**
   * 提交重置密码
   */
  const handleResetPwdSubmit = useCallback(async () => {
    if (!targetAdmin) return;
    
    let password = '';
    
    if (resetPwdMode === 'auto') {
      if (!generatedPassword) {
        message.warning('请先生成密码');
        return;
      }
      password = generatedPassword;
    } else {
      try {
        const values = await resetPwdForm.validateFields();
        password = values.password;
      } catch {
        return;
      }
    }
    
    setFormLoading(true);
    try {
      await resetAdminPassword(targetAdmin.id, password);
      message.success('密码重置成功');
      setResetPwdModalOpen(false);
      setTargetAdmin(null);
    } catch (error) {
      // 错误已在 request 中处理
    } finally {
      setFormLoading(false);
    }
  }, [targetAdmin, resetPwdMode, generatedPassword, resetPwdForm, message]);
  
  /**
   * 操作菜单配置
   */
  const getMenuItems = useCallback((record: Admin): MenuProps['items'] => {
    const [canOperate] = checkCanOperate(record);
    
    return [
      {
        key: 'edit',
        label: '编辑',
        icon: <RiEditLine size={14} />,
        disabled: !canOperate,
        onClick: () => handleEdit(record),
      },
      {
        key: 'resetPassword',
        label: '重置密码',
        icon: <RiKeyLine size={14} />,
        disabled: !canOperate,
        onClick: () => handleResetPassword(record),
      },
      {
        key: 'toggle',
        label: record.isActive ? '禁用' : '启用',
        icon: record.isActive ? <RiProhibitedLine size={14} /> : <RiCheckLine size={14} />,
        disabled: !canOperate,
        onClick: () => handleToggleStatus(record),
      },
      { type: 'divider' },
      {
        key: 'delete',
        label: '删除',
        icon: <RiDeleteBinLine size={14} />,
        danger: true,
        disabled: !canOperate,
        onClick: () => handleDelete(record),
      },
    ];
  }, [checkCanOperate, handleEdit, handleResetPassword, handleToggleStatus, handleDelete]);
  
  /**
   * 表格列配置
   */
  const columns: ProColumns<Admin>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
      sorter: true,
      render: (_, record) => {
        const isSuperAdmin = record.id === 1;
        return (
          <Space size={4}>
            <Text>{record.id}</Text>
            {isSuperAdmin && (
              <Tooltip title="超级管理员">
                <RiVipCrownFill size={16} style={{ color: '#faad14' }} />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: '用户名',
      dataIndex: 'username',
      width: 150,
      copyable: true,
      render: (_, record) => {
        const isCurrentAdmin = record.id === currentAdmin?.id;
        return (
          <Space size={4}>
            <Text>{record.username}</Text>
            {isCurrentAdmin && (
              <Tag color="blue" style={{ marginLeft: 4 }}>当前</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      width: 120,
      render: (_, record) => record.nickname || <Text type="secondary">-</Text>,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 80,
      valueType: 'select',
      valueEnum: {
        true: { text: '启用', status: 'Success' },
        false: { text: '禁用', status: 'Default' },
      },
      render: (_, record) => <AdminStatusTag isActive={record.isActive} />,
    },
    {
      title: '最后登录时间',
      dataIndex: 'lastLoginAt',
      width: 170,
      search: false,
      sorter: true,
      responsive: ['md'],
      render: (_, record) => <TimeDisplay value={record.lastLoginAt} />,
    },
    {
      title: '最后登录IP',
      dataIndex: 'lastLoginIp',
      width: 140,
      search: false,
      responsive: ['xl'], // >= 1200px
      render: (_, record) => record.lastLoginIp || <Text type="secondary">-</Text>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 170,
      valueType: 'dateRange',
      responsive: ['md'],
      sorter: true,
      search: {
        transform: (value) => ({
          startDate: value?.[0],
          endDate: value?.[1],
        }),
      },
      render: (_, record) => <TimeDisplay value={record.createdAt} />,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      fixed: 'right',
      render: (_, record) => {
        const [canOperate, reason] = checkCanOperate(record);
        
        // 使用 Tooltip 显示禁用原因（对自己或超级管理员）
        return (
          <Tooltip title={!canOperate ? reason : undefined}>
            <Dropdown
              menu={{ items: getMenuItems(record) }}
              trigger={['click']}
              disabled={!canOperate}
            >
              <a
                onClick={(e) => e.preventDefault()}
                style={{ 
                  opacity: canOperate ? 1 : 0.5,
                  cursor: canOperate ? 'pointer' : 'not-allowed',
                  color: canOperate ? undefined : '#999',
                }}
              >
                操作 <RiArrowDownSLine size={14} style={{ verticalAlign: 'middle' }} />
              </a>
            </Dropdown>
          </Tooltip>
        );
      },
    },
  ];
  
  // 首次加载完成后关闭骨架屏
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  
  // 骨架屏
  if (initialLoading) {
    return (
      <PageContainer header={{ title: '管理员管理' }}>
        <ListPageSkeleton
          showSearch
          searchCount={3}
          rows={10}
          columns={6}
        />
      </PageContainer>
    );
  }
  
  return (
    <PageContainer
      header={{ title: '管理员管理' }}
      extra={[
        <Button
          key="add"
          type="primary"
          icon={<RiAddLine size={16} />}
          onClick={handleAdd}
        >
          添加管理员
        </Button>,
      ]}
    >
      <ProTable<Admin>
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 'max-content' }}
        
        // 搜索配置
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
        
        // 分页配置
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        
        // 工具栏配置
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: true,
        }}
        
        // 列配置持久化
        columnsState={{
          persistenceKey: 'admin-list-columns',
          persistenceType: 'localStorage',
        }}
        
        // 工具栏
        toolBarRender={() => [
          <Button
            key="refresh"
            icon={<RiRefreshLine size={16} />}
            onClick={() => actionRef.current?.reload()}
          >
            刷新
          </Button>,
        ]}
        
        // 数据请求
        request={async (params, sort) => {
          const { current, pageSize, username, nickname, isActive, startDate, endDate } = params;
          
          // 构建排序参数
          let sortField: string | undefined;
          let sortOrder: 'ascend' | 'descend' | undefined;
          if (sort) {
            const sortKey = Object.keys(sort)[0];
            if (sortKey) {
              sortField = sortKey;
              sortOrder = sort[sortKey] as 'ascend' | 'descend';
            }
          }
          
          try {
            const response = await fetchAdminList({
              page: current,
              pageSize,
              username,
              nickname,
              isActive: isActive === undefined ? undefined : isActive === 'true',
              startDate,
              endDate,
              sortField,
              sortOrder,
            });
            
            return {
              data: response.list,
              total: response.pagination.total,
              success: true,
            };
          } catch {
            return {
              data: [],
              total: 0,
              success: false,
            };
          }
        }}
        
        // 行样式
        onRow={(record) => ({
          style: {
            backgroundColor: record.id === currentAdmin?.id ? 'rgba(22, 119, 255, 0.06)' : undefined,
          },
        })}
      />
      
      {/* 添加/编辑管理员弹窗 */}
      <Modal
        title={editingAdmin ? '编辑管理员' : '添加管理员'}
        open={formModalOpen}
        onCancel={() => {
          setFormModalOpen(false);
          setEditingAdmin(null);
          formInstance.resetFields();
        }}
        onOk={handleFormSubmit}
        confirmLoading={formLoading}
        destroyOnHidden
        width={500}
      >
        <Form
          form={formInstance}
          layout="vertical"
          initialValues={{ isActive: true }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={
              editingAdmin
                ? []
                : [
                    { required: true, message: '请输入用户名' },
                    { min: 4, message: '用户名至少4位' },
                    { max: 20, message: '用户名最多20位' },
                    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字、下划线' },
                  ]
            }
            extra={editingAdmin ? '用户名不可修改' : '4-20位字母、数字、下划线'}
          >
            <Input
              placeholder="请输入用户名"
              disabled={!!editingAdmin}
            />
          </Form.Item>
          
          {!editingAdmin && (
            <>
              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 8, message: '密码至少8位' },
                  { max: 20, message: '密码最多20位' },
                  { pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, message: '密码必须包含字母和数字' },
                ]}
                extra="8-20位字符，包含字母和数字"
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
              
              <Form.Item
                name="confirmPassword"
                label="确认密码"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="请再次输入密码" />
              </Form.Item>
            </>
          )}
          
          <Form.Item
            name="nickname"
            label="昵称"
            rules={[
              { min: 2, message: '昵称至少2位' },
              { max: 20, message: '昵称最多20位' },
            ]}
            extra="选填，2-20位字符"
          >
            <Input placeholder="请输入昵称（选填）" />
          </Form.Item>
          
          <Form.Item
            name="isActive"
            valuePropName="checked"
          >
            <Checkbox>启用账号</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 重置密码弹窗 */}
      <Modal
        title={`重置密码 - ${targetAdmin?.username || ''}`}
        open={resetPwdModalOpen}
        onCancel={() => {
          setResetPwdModalOpen(false);
          setTargetAdmin(null);
          setGeneratedPassword('');
          setShowGeneratedPassword(false);
          resetPwdForm.resetFields();
        }}
        onOk={handleResetPwdSubmit}
        confirmLoading={formLoading}
        destroyOnHidden
        width={480}
        okText="确定重置"
      >
        <div style={{ marginBottom: 16 }}>
          <Radio.Group
            value={resetPwdMode}
            onChange={(e) => {
              setResetPwdMode(e.target.value);
              setShowGeneratedPassword(false);
              setGeneratedPassword('');
              resetPwdForm.resetFields();
            }}
          >
            <Radio value="auto">自动生成</Radio>
            <Radio value="manual">手动输入</Radio>
          </Radio.Group>
        </div>
        
        {resetPwdMode === 'auto' ? (
          <div>
            <Button
              type="primary"
              ghost
              icon={<RiRefreshLine size={16} />}
              onClick={handleGeneratePassword}
              style={{ marginBottom: 16 }}
            >
              生成随机密码
            </Button>
            
            {showGeneratedPassword && generatedPassword && (
              <div
                style={{
                  padding: 16,
                  background: '#f5f5f5',
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>新密码：</Text>
                    <Text
                      strong
                      style={{
                        fontSize: 18,
                        fontFamily: 'Roboto Mono, monospace',
                        letterSpacing: 1,
                      }}
                    >
                      {generatedPassword}
                    </Text>
                  </div>
                  <CopyButton text={generatedPassword} />
                </div>
                <PasswordStrengthIndicator password={generatedPassword} />
              </div>
            )}
            
            <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8 }}>
              点击上方按钮生成随机密码，生成后请复制并妥善保存
            </Paragraph>
          </div>
        ) : (
          <Form form={resetPwdForm} layout="vertical">
            <Form.Item
              name="password"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 8, message: '密码至少8位' },
                { max: 20, message: '密码最多20位' },
                { pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, message: '密码必须包含字母和数字' },
              ]}
              extra="8-20位字符，包含字母和数字"
            >
              <Input.Password placeholder="请输入新密码" />
            </Form.Item>
            
            <Form.Item
              noStyle
              shouldUpdate={(prev, curr) => prev.password !== curr.password}
            >
              {({ getFieldValue }) => {
                const password = getFieldValue('password') || '';
                return password.length > 0 ? (
                  <PasswordStrengthIndicator password={password} />
                ) : null;
              }}
            </Form.Item>
            
            <Form.Item
              name="confirmPassword"
              label="确认密码"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="请再次输入新密码" />
            </Form.Item>
          </Form>
        )}
      </Modal>
      
      {/* 删除确认弹窗 */}
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTargetAdmin(null);
        }}
        onConfirm={confirmDelete}
        title="确认删除"
        content={
          <div>
            <Paragraph>
              确定删除管理员 <Text strong>{targetAdmin?.username}</Text>？
            </Paragraph>
            <Paragraph type="danger" style={{ marginBottom: 0 }}>
              此操作不可撤销！
            </Paragraph>
          </div>
        }
        danger
        confirmText="确定删除"
        loading={deleteLoading}
        impacts={[
          '该管理员将无法登录系统',
          '删除后数据无法恢复',
        ]}
      />
      
      {/* 样式 */}
      <style jsx global>{`
        .admins-page .ant-pro-table-search {
          margin-bottom: 16px;
          padding: 20px 24px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
      `}</style>
    </PageContainer>
  );
}
