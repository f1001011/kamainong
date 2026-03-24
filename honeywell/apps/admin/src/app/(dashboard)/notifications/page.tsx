/**
 * @file 站内信管理页
 * @description 站内信列表、发送通知、消息详情、批量删除功能
 * @depends 开发文档/开发文档.md 第13.12节 站内信管理
 */

'use client';

import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  Button,
  Space,
  Tag,
  Typography,
  Table,
  Modal,
  Form,
  Input,
  Radio,
  Steps,
  message,
  Card,
  Select,
  Badge,
  Divider,
  InputNumber,
  Spin,
  Empty,
  Descriptions,
} from 'antd';
import { ProTable, PageContainer } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import {
  RiSendPlaneFill,
  RiEyeLine,
  RiDeleteBinLine,
  RiNotification3Line,
  RiMoneyCnyCircleFill,
  RiBankFill,
  RiMegaphoneFill,
  RiGiftFill,
  RiTeamFill,
  RiSmartphoneLine,
  RiSearchLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCheckLine,
  RiUserAddLine,
  RiFileTextLine,
} from '@remixicon/react';

import { TimeDisplay } from '@/components/common/TimeDisplay';
import { UserInfoCard } from '@/components/business/UserInfoCard';
import { NotificationReadStatusBadge } from '@/components/common/StatusBadge';
import { QuickFilters } from '@/components/tables/QuickFilters';
import { DateRangeSelect, type DateRangeValue } from '@/components/tables/DateRangeSelect';
import { DetailDrawer, DetailSection } from '@/components/modals/DetailDrawer';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { BatchResultModal, type FailedRecord } from '@/components/modals/BatchResultModal';
import RichTextEditor from '@/components/common/RichTextEditor';

import { showSuccess } from '@/utils/messageHolder';
import { formatSystemTime } from '@/utils/timezone';

import {
  fetchNotificationList,
  fetchNotificationDetail,
  sendNotification,
  deleteNotification,
  batchDeleteNotifications,
  searchUsers,
} from '@/services/notifications';

import type {
  Notification,
  NotificationType,
  NotificationTargetType,
  SendNotificationParams,
} from '@/types/notifications';

import {
  NOTIFICATION_TYPE_CONFIG,
  NOTIFICATION_TYPE_OPTIONS,
  TARGET_TYPE_OPTIONS,
  NOTIFICATION_TEMPLATES,
} from '@/types/notifications';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

// ============================================================================
// 消息类型图标组件
// ============================================================================

/**
 * 根据消息类型获取图标
 */
function NotificationTypeIcon({ type }: { type: NotificationType }) {
  const config = NOTIFICATION_TYPE_CONFIG[type] || { label: type, color: 'default', icon: 'announcement' };
  const iconSize = 16;
  
  const iconMap: Record<string, React.ReactNode> = {
    income: <RiMoneyCnyCircleFill size={iconSize} style={{ color: '#52c41a' }} />,
    withdraw: <RiBankFill size={iconSize} style={{ color: '#1677ff' }} />,
    announcement: <RiMegaphoneFill size={iconSize} style={{ color: '#fa8c16' }} />,
    activity: <RiGiftFill size={iconSize} style={{ color: '#722ed1' }} />,
    commission: <RiTeamFill size={iconSize} style={{ color: '#13c2c2' }} />,
    recharge: <RiMoneyCnyCircleFill size={iconSize} style={{ color: '#52c41a' }} />,
    reward: <RiGiftFill size={iconSize} style={{ color: '#722ed1' }} />,
  };

  return (
    <Space size={4}>
      {iconMap[config.icon] || iconMap.announcement}
      <Tag color={config.color} style={{ margin: 0 }}>
        {config.label}
      </Tag>
    </Space>
  );
}

// ============================================================================
// 发送通知弹窗
// ============================================================================

interface SendNotificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SelectedUser {
  id: number;
  phone: string;
  nickname: string | null;
}

/**
 * 发送通知弹窗
 * @description 步骤式引导：选择接收人 -> 编辑内容 -> 预览确认
 */
function SendNotificationModal({ visible, onClose, onSuccess }: SendNotificationModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  
  // 接收人相关状态
  const [targetType, setTargetType] = useState<NotificationTargetType>('ALL');
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<SelectedUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [batchUserIds, setBatchUserIds] = useState('');
  
  // 内容相关状态
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // 重置状态
  const resetState = useCallback(() => {
    setCurrentStep(0);
    setTargetType('ALL');
    setSelectedUsers([]);
    setSearchKeyword('');
    setSearchResults([]);
    setBatchUserIds('');
    setTitle('');
    setContent('');
  }, []);
  
  // 关闭弹窗时重置
  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);
  
  // 搜索用户
  const handleSearchUsers = useCallback(async () => {
    if (!searchKeyword.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const results = await searchUsers(searchKeyword);
      // 过滤已选择的用户
      const filtered = results.filter(
        (u) => !selectedUsers.some((s) => s.id === u.id)
      );
      setSearchResults(filtered);
    } catch (error) {
      // 错误已在 request 中处理
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [searchKeyword, selectedUsers]);
  
  // 添加用户
  const handleAddUser = useCallback((user: SelectedUser) => {
    setSelectedUsers((prev) => [...prev, user]);
    setSearchResults((prev) => prev.filter((u) => u.id !== user.id));
    setSearchKeyword('');
  }, []);
  
  // 移除用户
  const handleRemoveUser = useCallback((userId: number) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);
  
  // 批量添加用户ID
  const handleBatchAdd = useCallback(() => {
    const ids = batchUserIds
      .split(/[,，\s\n]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);
    
    if (ids.length === 0) {
      message.warning('请输入有效的用户ID');
      return;
    }
    
    // 添加ID到已选用户（简化处理，只存储ID）
    const newUsers = ids
      .filter((id) => !selectedUsers.some((u) => u.id === id))
      .map((id) => ({ id, phone: `ID: ${id}`, nickname: null }));
    
    setSelectedUsers((prev) => [...prev, ...newUsers]);
    setBatchUserIds('');
    message.success(`已添加 ${newUsers.length} 个用户`);
  }, [batchUserIds, selectedUsers]);
  
  // 应用模板
  const handleApplyTemplate = useCallback((templateId: string) => {
    const template = NOTIFICATION_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setTitle(template.title);
      setContent(template.content);
      message.success(`已应用模板：${template.name}`);
    }
  }, []);
  
  // 获取接收人数量
  const getReceiverCount = useCallback(() => {
    if (targetType === 'ALL') return '全部用户';
    return `${selectedUsers.length} 个用户`;
  }, [targetType, selectedUsers]);
  
  // 下一步
  const handleNext = useCallback(() => {
    if (currentStep === 0) {
      // 验证接收人
      if (targetType === 'SPECIFIC' && selectedUsers.length === 0) {
        message.warning('请至少选择一个接收用户');
        return;
      }
    } else if (currentStep === 1) {
      // 验证内容
      if (!title.trim()) {
        message.warning('请输入通知标题');
        return;
      }
      if (!content.trim() || content === '<p><br></p>') {
        message.warning('请输入通知内容');
        return;
      }
      if (title.length > 60) {
        message.warning('标题不能超过60个字符');
        return;
      }
    }
    setCurrentStep((prev) => prev + 1);
  }, [currentStep, targetType, selectedUsers, title, content]);
  
  // 上一步
  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => prev - 1);
  }, []);
  
  // 确认发送（先弹二次确认）
  const handleConfirmClick = useCallback(() => {
    setConfirmModalVisible(true);
  }, []);
  
  // 发送通知
  const handleSend = useCallback(async () => {
    setLoading(true);
    try {
      const params: SendNotificationParams = {
        targetType,
        title: title.trim(),
        content,
      };
      
      if (targetType === 'SPECIFIC') {
        params.targetUserIds = selectedUsers.map((u) => u.id);
      }
      
      const result = await sendNotification(params);
      showSuccess(`已发送给 ${result.sentCount} 位用户`);
      setConfirmModalVisible(false);
      handleClose();
      onSuccess();
    } catch (error) {
      // 错误已在 request 中处理
    } finally {
      setLoading(false);
    }
  }, [targetType, title, content, selectedUsers, handleClose, onSuccess]);
  
  // 步骤配置
  const steps = [
    {
      title: '选择接收人',
      icon: <RiUserAddLine size={20} />,
    },
    {
      title: '编辑内容',
      icon: <RiFileTextLine size={20} />,
    },
    {
      title: '预览确认',
      icon: <RiCheckLine size={20} />,
    },
  ];
  
  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={{ padding: '24px 0' }}>
            <Form layout="vertical">
              <Form.Item label="发送对象">
                <Radio.Group
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                >
                  {TARGET_TYPE_OPTIONS.map((opt) => (
                    <Radio.Button key={opt.value} value={opt.value}>
                      {opt.label}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </Form.Item>
              
              {targetType === 'SPECIFIC' && (
                <>
                  {/* 搜索添加用户 */}
                  <Form.Item label="搜索用户">
                    <Space.Compact style={{ width: '100%' }}>
                      <Input
                        placeholder="输入用户ID或手机号搜索"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        onPressEnter={handleSearchUsers}
                        prefix={<RiSearchLine size={16} style={{ color: '#bfbfbf' }} />}
                      />
                      <Button
                        type="primary"
                        onClick={handleSearchUsers}
                        loading={searchLoading}
                      >
                        搜索
                      </Button>
                    </Space.Compact>
                    
                    {/* 搜索结果 */}
                    {searchResults.length > 0 && (
                      <div
                        style={{
                          marginTop: 8,
                          background: '#fafafa',
                          borderRadius: 8,
                          padding: 12,
                          maxHeight: 200,
                          overflow: 'auto',
                        }}
                      >
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              marginBottom: 4,
                              background: '#fff',
                              borderRadius: 6,
                            }}
                          >
                            <Space>
                              <Text strong>#{user.id}</Text>
                              <Text>{user.phone}</Text>
                              {user.nickname && (
                                <Text type="secondary">({user.nickname})</Text>
                              )}
                            </Space>
                            <Button
                              type="link"
                              size="small"
                              onClick={() => handleAddUser(user)}
                            >
                              添加
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Form.Item>
                  
                  {/* 批量输入ID */}
                  <Form.Item label="批量输入用户ID">
                    <Space.Compact style={{ width: '100%' }}>
                      <TextArea
                        rows={2}
                        placeholder="输入用户ID，多个用逗号或换行分隔"
                        value={batchUserIds}
                        onChange={(e) => setBatchUserIds(e.target.value)}
                      />
                    </Space.Compact>
                    <Button
                      style={{ marginTop: 8 }}
                      onClick={handleBatchAdd}
                      disabled={!batchUserIds.trim()}
                    >
                      批量添加
                    </Button>
                  </Form.Item>
                  
                  {/* 已选用户列表 */}
                  <Form.Item label={`已选用户 (${selectedUsers.length})`}>
                    {selectedUsers.length === 0 ? (
                      <Empty
                        description="未选择任何用户"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    ) : (
                      <div
                        style={{
                          background: '#f6ffed',
                          borderRadius: 8,
                          padding: 12,
                          maxHeight: 200,
                          overflow: 'auto',
                        }}
                      >
                        <Space size={8} wrap>
                          {selectedUsers.map((user) => (
                            <Tag
                              key={user.id}
                              closable
                              onClose={() => handleRemoveUser(user.id)}
                              style={{
                                padding: '4px 8px',
                                fontSize: 13,
                                lineHeight: '20px',
                              }}
                            >
                              #{user.id} {user.nickname || user.phone}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    )}
                  </Form.Item>
                </>
              )}
            </Form>
          </div>
        );
        
      case 1:
        return (
          <div style={{ padding: '24px 0' }}>
            <Form layout="vertical">
              {/* 快捷模板 */}
              <Form.Item label="快捷模板">
                <Select
                  placeholder="选择模板快速填充"
                  allowClear
                  onChange={handleApplyTemplate}
                  options={NOTIFICATION_TEMPLATES.map((t) => ({
                    value: t.id,
                    label: t.name,
                  }))}
                  style={{ width: 200 }}
                />
              </Form.Item>
              
              {/* 通知标题 */}
              <Form.Item
                label="通知标题"
                required
                extra={`${title.length}/60`}
              >
                <Input
                  placeholder="请输入通知标题"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={60}
                  showCount
                />
              </Form.Item>
              
              {/* 通知内容 */}
              <Form.Item label="通知内容" required>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  height={250}
                  placeholder="请输入通知内容..."
                />
              </Form.Item>
            </Form>
          </div>
        );
        
      case 2:
        return (
          <div style={{ padding: '24px 0' }}>
            <div style={{ display: 'flex', gap: 24 }}>
              {/* 左侧：发送信息 */}
              <div style={{ flex: 1 }}>
                <Card title="发送信息" size="small">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="接收对象">
                      <Text strong style={{ color: '#1677ff' }}>
                        {getReceiverCount()}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="通知标题">
                      {title || '-'}
                    </Descriptions.Item>
                  </Descriptions>
                  
                  <Divider style={{ margin: '12px 0' }} />
                  
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                    通知内容预览：
                  </Text>
                  <div
                    style={{
                      background: '#fafafa',
                      borderRadius: 8,
                      padding: 12,
                      maxHeight: 200,
                      overflow: 'auto',
                      fontSize: 14,
                    }}
                    dangerouslySetInnerHTML={{ __html: content || '<p>-</p>' }}
                  />
                </Card>
              </div>
              
              {/* 右侧：手机预览 */}
              <div style={{ width: 280, flexShrink: 0 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                  <RiSmartphoneLine size={14} style={{ marginRight: 4, verticalAlign: -2 }} />
                  移动端预览
                </Text>
                <div
                  style={{
                    background: '#f0f0f0',
                    borderRadius: 24,
                    padding: 20,
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  {/* 模拟通知卡片 */}
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: 12,
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                  >
                    {/* 卡片头部 */}
                    <div
                      style={{
                        padding: '12px 16px',
                        background: 'linear-gradient(135deg, #fa8c16 0%, #faad14 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <RiMegaphoneFill size={20} style={{ color: '#fff' }} />
                      <Text style={{ color: '#fff', fontWeight: 500 }}>系统通知</Text>
                    </div>
                    
                    {/* 卡片内容 */}
                    <div style={{ padding: 16 }}>
                      <Text
                        strong
                        style={{
                          fontSize: 15,
                          display: 'block',
                          marginBottom: 8,
                        }}
                        ellipsis={{ tooltip: title }}
                      >
                        {title || '通知标题'}
                      </Text>
                      <div
                        style={{
                          fontSize: 13,
                          lineHeight: 1.6,
                          color: '#666',
                          maxHeight: 120,
                          overflow: 'hidden',
                        }}
                        dangerouslySetInnerHTML={{
                          __html: content || '<p>通知内容...</p>',
                        }}
                      />
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 11,
                          display: 'block',
                          marginTop: 12,
                        }}
                      >
                        刚刚
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <>
      <Modal
        title={
          <Space>
            <RiSendPlaneFill size={20} style={{ color: '#1677ff' }} />
            <span>发送通知</span>
          </Space>
        }
        open={visible}
        onCancel={handleClose}
        width={800}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={handleClose}>取消</Button>
            <Space>
              {currentStep > 0 && (
                <Button icon={<RiArrowLeftLine size={16} />} onClick={handlePrev}>
                  上一步
                </Button>
              )}
              {currentStep < 2 ? (
                <Button type="primary" onClick={handleNext}>
                  下一步
                  <RiArrowRightLine size={16} style={{ marginLeft: 4 }} />
                </Button>
              ) : (
                <Button type="primary" onClick={handleConfirmClick}>
                  确认发送
                  <RiSendPlaneFill size={16} style={{ marginLeft: 4 }} />
                </Button>
              )}
            </Space>
          </div>
        }
        destroyOnHidden
      >
        <Steps
          current={currentStep}
          items={steps}
          style={{ marginBottom: 16 }}
        />
        {renderStepContent()}
      </Modal>
      
      {/* 二次确认弹窗 */}
      <ConfirmModal
        open={confirmModalVisible}
        onClose={() => setConfirmModalVisible(false)}
        onConfirm={handleSend}
        title="确认发送通知"
        content={`确定要将此通知发送给 ${getReceiverCount()} 吗？`}
        type="confirm"
        loading={loading}
      />
    </>
  );
}

// ============================================================================
// 消息详情抽屉
// ============================================================================

interface NotificationDetailDrawerProps {
  visible: boolean;
  notification: Notification | null;
  onClose: () => void;
  loading?: boolean;
}

/**
 * 消息详情抽屉
 */
function NotificationDetailDrawer({
  visible,
  notification,
  onClose,
  loading,
}: NotificationDetailDrawerProps) {
  if (!notification && !loading) return null;
  
  const items = notification
    ? [
        {
          label: '消息ID',
          children: <Text copyable>{notification.id}</Text>,
        },
        {
          label: '消息类型',
          children: <NotificationTypeIcon type={notification.type} />,
        },
        {
          label: '消息标题',
          children: notification.title,
        },
        {
          label: '发送时间',
          children: <TimeDisplay value={notification.createdAt} />,
        },
        {
          label: '阅读状态',
          children: <NotificationReadStatusBadge isRead={notification.isRead} />,
        },
        {
          label: '阅读时间',
          children: notification.readAt ? (
            <TimeDisplay value={notification.readAt} />
          ) : (
            <Text type="secondary">-</Text>
          ),
        },
        ...(notification.senderName
          ? [
              {
                label: '发送人',
                children: notification.senderName,
              },
            ]
          : []),
      ]
    : [];
  
  return (
    <DetailDrawer
      open={visible}
      onClose={onClose}
      title="消息详情"
      subtitle={notification ? `#${notification.id}` : undefined}
      status={notification?.isRead ? 'success' : 'info'}
      statusText={notification?.isRead ? '已读' : '未读'}
      items={items}
      loading={loading}
      extra={
        notification && (
          <DetailSection title="消息内容">
            <div
              style={{
                background: '#fafafa',
                borderRadius: 8,
                padding: 16,
                lineHeight: 1.8,
              }}
              dangerouslySetInnerHTML={{ __html: notification.content }}
            />
          </DetailSection>
        )
      }
    >
      {notification?.userId && (
        <DetailSection title="接收用户">
          <UserInfoCard
            userId={notification.userId}
            phone={notification.userPhone || ''}
            nickname={notification.userNickname}
            clickable
            showStatus={false}
            showVip={false}
          />
        </DetailSection>
      )}
    </DetailDrawer>
  );
}

// ============================================================================
// 主页面组件
// ============================================================================

/**
 * 站内信管理页
 * @description 站内信列表、发送通知、消息详情、批量删除功能
 */
export default function NotificationManagePage() {
  const actionRef = useRef<ActionType>(null);
  
  // 弹窗状态
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [batchResultVisible, setBatchResultVisible] = useState(false);
  
  // 数据状态
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // 批量操作结果状态
  const [batchResult, setBatchResult] = useState({
    total: 0,
    succeeded: 0,
    failed: 0,
    failedRecords: [] as FailedRecord[],
  });
  
  // 加载状态
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // 筛选状态 - 消息类型支持多选
  const [typeFilters, setTypeFilters] = useState<NotificationType[]>([]);
  const [dateRange, setDateRange] = useState<DateRangeValue>(null);
  
  // ============================================================================
  // 操作处理函数
  // ============================================================================
  
  // 查看详情
  const handleViewDetail = useCallback(async (record: Notification) => {
    setCurrentNotification(record);
    setDetailDrawerVisible(true);
    
    // 可选：获取完整详情
    // setDetailLoading(true);
    // try {
    //   const detail = await fetchNotificationDetail(record.id);
    //   setCurrentNotification(detail);
    // } catch (error) {
    //   // 错误已处理
    // } finally {
    //   setDetailLoading(false);
    // }
  }, []);
  
  // 删除单条
  const handleDeleteClick = useCallback((id: number) => {
    setDeletingId(id);
    setDeleteModalVisible(true);
  }, []);
  
  // 确认删除
  const handleDeleteConfirm = useCallback(async () => {
    if (deletingId === null) return;
    
    setDeleteLoading(true);
    try {
      await deleteNotification(deletingId);
      showSuccess('删除成功');
      setDeleteModalVisible(false);
      actionRef.current?.reload();
    } catch (error) {
      // 错误已处理
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
    }
  }, [deletingId]);
  
  // 批量删除
  const handleBatchDelete = useCallback(async (selectedKeys: React.Key[]) => {
    const ids = selectedKeys.map(Number);
    
    try {
      const result = await batchDeleteNotifications(ids);
      
      // 构建失败记录
      const failedRecords: FailedRecord[] = result.results
        .filter((r) => !r.success)
        .map((r) => ({
          id: r.id,
          reason: r.error?.message || '删除失败',
        }));
      
      setBatchResult({
        total: result.total,
        succeeded: result.succeeded,
        failed: result.failed,
        failedRecords,
      });
      setBatchResultVisible(true);
    } catch (error) {
      // 错误已处理
    }
  }, []);
  
  // 发送成功后刷新
  const handleSendSuccess = useCallback(() => {
    actionRef.current?.reload();
  }, []);
  
  // ============================================================================
  // 表格列定义
  // ============================================================================
  
  const columns: ProColumns<Notification>[] = useMemo(
    () => [
      {
        title: '消息ID',
        dataIndex: 'id',
        width: 80,
        search: false,
        render: (_, record) => (
          <Text copyable={{ text: String(record.id) }} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {record.id}
          </Text>
        ),
      },
      {
        title: '接收用户',
        dataIndex: 'userId',
        width: 200,
        render: (_, record) => {
          if (!record.userId) {
            return (
              <Tag color="orange" icon={<RiMegaphoneFill size={12} />}>
                全部用户
              </Tag>
            );
          }
          return (
            <UserInfoCard
              userId={record.userId}
              phone={record.userPhone || ''}
              nickname={record.userNickname}
              size="small"
              showStatus={false}
              showVip={false}
            />
          );
        },
        fieldProps: {
          placeholder: '用户ID或手机号',
        },
      },
      {
        title: '消息类型',
        dataIndex: 'type',
        width: 130,
        valueType: 'select',
        valueEnum: Object.fromEntries(
          NOTIFICATION_TYPE_OPTIONS.map((opt) => [opt.value, { text: opt.label }])
        ),
        render: (_, record) => <NotificationTypeIcon type={record.type} />,
      },
      {
        title: '标题',
        dataIndex: 'title',
        width: 200,
        ellipsis: true,
        render: (_, record) => {
          // 未读消息：标题加粗，左侧蓝色圆点
          if (!record.isRead) {
            return (
              <Space size={8}>
                <Badge status="processing" />
                <Text strong>{record.title}</Text>
              </Space>
            );
          }
          return record.title;
        },
        fieldProps: {
          placeholder: '搜索标题',
        },
      },
      {
        title: '已读状态',
        dataIndex: 'isRead',
        width: 100,
        valueType: 'select',
        valueEnum: {
          true: { text: '已读' },
          false: { text: '未读' },
        },
        render: (_, record) => (
          <NotificationReadStatusBadge isRead={record.isRead} />
        ),
      },
      {
        title: '发送时间',
        dataIndex: 'createdAt',
        width: 160,
        valueType: 'dateTimeRange',
        search: {
          transform: (value) => ({
            startDate: value?.[0],
            endDate: value?.[1],
          }),
        },
        render: (_, record) => <TimeDisplay value={record.createdAt} />,
        sorter: true,
      },
      {
        title: '操作',
        valueType: 'option',
        width: 120,
        fixed: 'right',
        render: (_, record) => [
          <a key="view" onClick={() => handleViewDetail(record)}>
            <Space size={4}>
              <RiEyeLine size={14} />
              详情
            </Space>
          </a>,
          <a
            key="delete"
            style={{ color: '#ff4d4f' }}
            onClick={() => handleDeleteClick(record.id)}
          >
            <Space size={4}>
              <RiDeleteBinLine size={14} />
              删除
            </Space>
          </a>,
        ],
      },
    ],
    [handleViewDetail, handleDeleteClick]
  );
  
  // 消息类型快捷筛选选项
  const typeFilterOptions = useMemo(
    () =>
      NOTIFICATION_TYPE_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.label,
      })),
    []
  );
  
  // ============================================================================
  // 渲染
  // ============================================================================
  
  return (
    <PageContainer
      header={{
        title: '站内信管理',
      }}
      extra={[
        <Button
          key="send"
          type="primary"
          icon={<RiSendPlaneFill size={16} />}
          onClick={() => setSendModalVisible(true)}
        >
          发送通知
        </Button>,
      ]}
    >
      <ProTable<Notification>
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 'max-content' }}
        // 搜索配置
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
          collapseRender: (collapsed) => (collapsed ? '展开' : '收起'),
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
          persistenceKey: 'notification-list-columns',
          persistenceType: 'localStorage',
        }}
        // 工具栏上方的筛选区 - 消息类型支持多选
        toolbar={{
          filter: (
            <Space size={16}>
              <Space size={8}>
                <Text type="secondary">消息类型：</Text>
                <QuickFilters
                  options={typeFilterOptions}
                  value={typeFilters}
                  onChange={(v) => {
                    setTypeFilters((v as NotificationType[]) || []);
                    actionRef.current?.reload();
                  }}
                  multiple
                  allOption={{ value: '' as NotificationType, label: '全部' }}
                />
              </Space>
            </Space>
          ),
        }}
        // 批量操作
        rowSelection={{
          selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
        }}
        tableAlertRender={({ selectedRowKeys, onCleanSelected }) => (
          <Space>
            <span>已选 {selectedRowKeys.length} 项</span>
            <a onClick={onCleanSelected}>取消选择</a>
          </Space>
        )}
        tableAlertOptionRender={({ selectedRowKeys, onCleanSelected }) => (
          <Space>
            <Button
              danger
              onClick={() => {
                handleBatchDelete(selectedRowKeys);
                onCleanSelected();
              }}
            >
              批量删除
            </Button>
          </Space>
        )}
        // 数据请求
        request={async (params, sort) => {
          const { current, pageSize, userId, type, isRead, startDate, endDate, title, ...rest } = params;
          
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
          
          // 处理多选类型筛选 - 转为逗号分隔字符串
          const typeParam = typeFilters.length > 0 
            ? typeFilters.join(',') 
            : (type as string) || undefined;
          
          try {
            const response = await fetchNotificationList({
              page: current,
              pageSize,
              userId: userId ? parseInt(userId, 10) : undefined,
              userPhone: title, // 使用 title 字段作为关键词搜索
              type: typeParam,
              isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
              startDate,
              endDate,
            });
            
            return {
              data: response.list,
              total: response.pagination.total,
              success: true,
            };
          } catch (error) {
            return {
              data: [],
              total: 0,
              success: false,
            };
          }
        }}
        params={{ typeFilters }}
      />
      
      {/* 发送通知弹窗 */}
      <SendNotificationModal
        visible={sendModalVisible}
        onClose={() => setSendModalVisible(false)}
        onSuccess={handleSendSuccess}
      />
      
      {/* 消息详情抽屉 */}
      <NotificationDetailDrawer
        visible={detailDrawerVisible}
        notification={currentNotification}
        onClose={() => {
          setDetailDrawerVisible(false);
          setCurrentNotification(null);
        }}
        loading={detailLoading}
      />
      
      {/* 删除确认弹窗 */}
      <ConfirmModal
        open={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setDeletingId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="确认删除消息"
        content="删除后数据将无法恢复，确定要删除该消息吗？"
        danger
        loading={deleteLoading}
      />
      
      {/* 批量删除结果弹窗 */}
      <BatchResultModal
        open={batchResultVisible}
        onClose={() => setBatchResultVisible(false)}
        onRefresh={() => actionRef.current?.reload()}
        operationName="删除站内信"
        total={batchResult.total}
        successCount={batchResult.succeeded}
        failedCount={batchResult.failed}
        failedRecords={batchResult.failedRecords}
      />
    </PageContainer>
  );
}
