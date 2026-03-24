/**
 * @file 公告管理页
 * @description 系统公告的CRUD管理、批量操作、预览功能
 * @depends 开发文档/04-后台管理端/04.8-内容管理/04.8.2-公告管理页.md
 */

'use client';

import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  Button,
  Space,
  Switch,
  Tag,
  Typography,
  Popconfirm,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Radio,
  DatePicker,
  InputNumber,
  message,
  Card,
  Divider,
} from 'antd';
import { ProTable, PageContainer, ModalForm, ProFormText, ProFormDigit } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import {
  RiAddLine,
  RiEyeLine,
  RiEditLine,
  RiDeleteBinLine,
  RiAddCircleLine,
  RiCloseLine,
  RiSmartphoneLine,
} from '@remixicon/react';
import dayjs from 'dayjs';

import { TimeDisplay } from '@/components/common/TimeDisplay';
import { DragSortList, type SortableItem } from '@/components/tables/DragSortList';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import RichTextEditor from '@/components/common/RichTextEditor';
import { formatSystemTime } from '@/utils/timezone';
import { showSuccess } from '@/utils/messageHolder';

import {
  fetchAnnouncementList,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  updateAnnouncementStatus,
  batchUpdateStatus,
  batchDeleteAnnouncements,
} from '@/services/announcements';

import type {
  Announcement,
  AnnouncementFormData,
  AnnouncementButton,
  PopupFrequency,
  AnnouncementTarget,
  BatchOperationResponse,
} from '@/types/announcements';

import {
  POPUP_FREQUENCY_OPTIONS,
  TARGET_TYPE_OPTIONS,
  BUTTON_TYPE_OPTIONS,
  BUTTON_ACTION_OPTIONS,
} from '@/types/announcements';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

// ============================================================================
// 类型定义
// ============================================================================

/** 按钮配置项（带 ID 用于拖拽排序） */
interface ButtonConfigItem extends SortableItem, AnnouncementButton {
  id: string;
}

// ============================================================================
// 弹窗频率映射
// ============================================================================

const POPUP_FREQUENCY_MAP: Record<PopupFrequency, { text: string; color: string }> = {
  ONCE: { text: '仅一次', color: 'blue' },
  EVERY_LOGIN: { text: '每次登录', color: 'orange' },
  DAILY: { text: '每天一次', color: 'green' },
};

const TARGET_TYPE_MAP: Record<AnnouncementTarget, string> = {
  ALL: '全部用户',
  SPECIFIC: '指定用户',
};

// ============================================================================
// 按钮配置组件
// ============================================================================

interface ButtonConfigListProps {
  value?: ButtonConfigItem[];
  onChange?: (value: ButtonConfigItem[]) => void;
  max?: number;
}

/**
 * 按钮配置列表组件
 * @description 支持拖拽排序、添加、编辑、删除按钮配置
 */
function ButtonConfigList({ value = [], onChange, max = 2 }: ButtonConfigListProps) {
  // 添加按钮
  const handleAdd = () => {
    if (value.length >= max) {
      message.warning(`最多添加 ${max} 个按钮`);
      return;
    }
    const newButton: ButtonConfigItem = {
      id: `btn_${Date.now()}`,
      text: '',
      type: 'primary',
      action: 'close',
      url: '',
    };
    onChange?.([...value, newButton]);
  };

  // 删除按钮
  const handleRemove = (id: string) => {
    onChange?.(value.filter((item) => item.id !== id));
  };

  // 更新按钮配置
  const handleUpdate = (id: string, field: keyof ButtonConfigItem, fieldValue: string) => {
    onChange?.(
      value.map((item) =>
        item.id === id ? { ...item, [field]: fieldValue } : item
      )
    );
  };

  // 排序变化
  const handleSortChange = (newItems: ButtonConfigItem[]) => {
    onChange?.(newItems);
  };

  // 渲染单个按钮配置
  const renderButtonItem = (item: ButtonConfigItem, index: number) => (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* 按钮文案 */}
        <div style={{ flex: '1 1 150px', minWidth: 120 }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            按钮文案 *
          </Text>
          <Input
            size="small"
            placeholder="请输入按钮文案"
            value={item.text}
            onChange={(e) => handleUpdate(item.id, 'text', e.target.value)}
            maxLength={20}
            showCount
          />
        </div>

        {/* 按钮类型 */}
        <div style={{ flex: '0 0 100px' }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            类型
          </Text>
          <Select
            size="small"
            style={{ width: '100%' }}
            value={item.type}
            onChange={(val) => handleUpdate(item.id, 'type', val)}
            options={BUTTON_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
          />
        </div>

        {/* 按钮动作 */}
        <div style={{ flex: '0 0 100px' }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            动作
          </Text>
          <Select
            size="small"
            style={{ width: '100%' }}
            value={item.action}
            onChange={(val) => handleUpdate(item.id, 'action', val)}
            options={BUTTON_ACTION_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
          />
        </div>

        {/* 跳转链接（仅 action=link 时显示） */}
        {item.action === 'link' && (
          <div style={{ flex: '1 1 200px', minWidth: 150 }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              跳转链接 *
            </Text>
            <Input
              size="small"
              placeholder="/products 或 https://..."
              value={item.url}
              onChange={(e) => handleUpdate(item.id, 'url', e.target.value)}
            />
          </div>
        )}

        {/* 删除按钮 */}
        <div style={{ flex: '0 0 32px', alignSelf: 'flex-end' }}>
          <Button
            size="small"
            type="text"
            danger
            icon={<RiCloseLine size={16} />}
            onClick={() => handleRemove(item.id)}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {value.length > 0 && (
        <DragSortList
          items={value}
          onSortChange={handleSortChange}
          renderItem={renderButtonItem}
          showIndex
        />
      )}

      {value.length < max && (
        <Button
          type="dashed"
          icon={<RiAddCircleLine size={16} />}
          onClick={handleAdd}
          style={{ width: '100%', marginTop: value.length > 0 ? 8 : 0 }}
        >
          添加按钮
        </Button>
      )}

      <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
        最多添加 {max} 个按钮，支持拖拽排序
      </Text>
    </div>
  );
}

// ============================================================================
// 公告预览弹窗
// ============================================================================

interface AnnouncementPreviewProps {
  visible: boolean;
  announcement: Partial<Announcement> | null;
  onClose: () => void;
}

/**
 * 公告预览弹窗
 * @description 模拟用户端公告弹窗效果
 */
function AnnouncementPreview({ visible, announcement, onClose }: AnnouncementPreviewProps) {
  if (!announcement) return null;

  const handleButtonClick = (btn: AnnouncementButton) => {
    if (btn.action === 'link') {
      message.info(`预览模式：将跳转到 ${btn.url}`);
    } else {
      message.info('预览模式：将关闭弹窗');
    }
  };

  return (
    <Modal
      title={
        <Space>
          <RiSmartphoneLine size={20} />
          <span>公告预览</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={<Button onClick={onClose}>关闭预览</Button>}
      width={500}
      centered
      styles={{
        body: {
          background: '#f5f5f5',
          padding: 24,
        },
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {/* 模拟手机屏幕 */}
        <div
          style={{
            width: 350,
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: 24,
            padding: 40,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          }}
        >
          {/* 公告弹窗卡片 */}
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* 公告图片 */}
            {announcement.imageUrl && (
              <div style={{ width: '100%', aspectRatio: '750/400', overflow: 'hidden' }}>
                <img
                  src={announcement.imageUrl}
                  alt="公告图片"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}

            {/* 公告内容 */}
            <div style={{ padding: 20 }}>
              <Text
                strong
                style={{
                  fontSize: 18,
                  display: 'block',
                  marginBottom: 12,
                  textAlign: 'center',
                }}
              >
                {announcement.title || '公告标题'}
              </Text>

              <div
                style={{
                  maxHeight: 200,
                  overflow: 'auto',
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: '#666',
                }}
                dangerouslySetInnerHTML={{
                  __html: announcement.content || '<p>公告内容...</p>',
                }}
              />
            </div>

            {/* 按钮区域 */}
            {announcement.buttons && announcement.buttons.length > 0 && (
              <div
                style={{
                  padding: '0 20px 20px',
                  display: 'flex',
                  gap: 12,
                }}
              >
                {announcement.buttons.map((btn, index) => (
                  <Button
                    key={index}
                    type={btn.type === 'primary' ? 'primary' : 'default'}
                    block
                    onClick={() => handleButtonClick(btn)}
                    style={{
                      height: 44,
                      borderRadius: 8,
                    }}
                  >
                    {btn.text}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          textAlign: 'center',
          marginTop: 16,
          color: '#999',
          fontSize: 12,
        }}
      >
        此为用户端弹窗展示效果模拟，实际样式以APP为准
      </div>
    </Modal>
  );
}

// ============================================================================
// 公告表单弹窗
// ============================================================================

interface AnnouncementFormProps {
  visible: boolean;
  announcement: Announcement | null;
  onCancel: () => void;
  onSubmit: (values: AnnouncementFormData) => Promise<void>;
  onPreview: (values: Partial<Announcement>) => void;
  loading: boolean;
}

/**
 * 公告表单弹窗
 * @description 新建/编辑公告的表单弹窗
 */
function AnnouncementForm({
  visible,
  announcement,
  onCancel,
  onSubmit,
  onPreview,
  loading,
}: AnnouncementFormProps) {
  const [form] = Form.useForm<AnnouncementFormData>();
  const targetType = Form.useWatch('targetType', form);

  // 初始化表单数据
  React.useEffect(() => {
    if (visible) {
      if (announcement) {
        // 编辑模式：填充数据
        const buttons = announcement.buttons?.map((btn, idx) => ({
          ...btn,
          id: `btn_${idx}`,
        })) || [];

        form.setFieldsValue({
          title: announcement.title,
          content: announcement.content,
          imageUrl: announcement.imageUrl,
          targetType: announcement.targetType,
          targetUserIds: announcement.targetUserIds || [],
          popupFrequency: announcement.popupFrequency,
          buttons,
          startAt: announcement.startAt,
          endAt: announcement.endAt,
          isActive: announcement.isActive,
          sortOrder: announcement.sortOrder,
        });
      } else {
        // 新建模式：重置表单
        form.resetFields();
        form.setFieldsValue({
          targetType: 'ALL',
          popupFrequency: 'ONCE',
          isActive: true,
          sortOrder: 0,
          buttons: [],
        });
      }
    }
  }, [visible, announcement, form]);

  // 表单提交
  const handleFinish = async (values: AnnouncementFormData) => {
    // 处理按钮配置（移除 id）
    const buttons = (values.buttons as ButtonConfigItem[] | undefined)?.map(
      ({ id, ...rest }) => rest
    );

    // 处理目标用户ID
    let targetUserIds: number[] | undefined;
    if (values.targetType === 'SPECIFIC' && values.targetUserIds) {
      if (typeof values.targetUserIds === 'string') {
        // 从字符串解析
        targetUserIds = (values.targetUserIds as unknown as string)
          .split(/[,，\s]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
          .map((s) => parseInt(s, 10))
          .filter((n) => !isNaN(n) && n > 0);
      } else {
        targetUserIds = values.targetUserIds;
      }
    }

    await onSubmit({
      ...values,
      buttons,
      targetUserIds,
    });
  };

  // 预览
  const handlePreview = () => {
    const values = form.getFieldsValue();
    const buttons = (values.buttons as ButtonConfigItem[] | undefined)?.map(
      ({ id, ...rest }) => rest
    );
    onPreview({
      ...values,
      buttons,
    } as Partial<Announcement>);
  };

  return (
    <Modal
      title={announcement ? '编辑公告' : '新建公告'}
      open={visible}
      onCancel={onCancel}
      width={720}
      footer={
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button onClick={handlePreview} icon={<RiEyeLine size={16} />}>
            预览
          </Button>
          <Button type="primary" loading={loading} onClick={() => form.submit()}>
            保存
          </Button>
        </Space>
      }
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          targetType: 'ALL',
          popupFrequency: 'ONCE',
          isActive: true,
          sortOrder: 0,
          buttons: [],
        }}
      >
        {/* 基本信息 */}
        <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
          <Form.Item
            name="title"
            label="公告标题"
            rules={[
              { required: true, message: '请输入公告标题' },
              { max: 200, message: '标题最多200个字符' },
            ]}
          >
            <Input placeholder="请输入公告标题" maxLength={200} showCount />
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label="公告图片"
            extra="支持 JPG/PNG/GIF/WEBP，最大 5MB，建议尺寸 750x400px"
          >
            <Input placeholder="请输入图片URL" />
          </Form.Item>

          <Form.Item
            name="content"
            label="公告内容"
            rules={[{ required: true, message: '请输入公告内容' }]}
          >
            <RichTextEditor height={200} placeholder="请输入公告内容..." />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="启用状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Card>

        {/* 投放配置 */}
        <Card title="投放配置" size="small" style={{ marginBottom: 16 }}>
          <Form.Item
            name="targetType"
            label="目标用户"
            rules={[{ required: true, message: '请选择目标用户' }]}
          >
            <Radio.Group>
              {TARGET_TYPE_OPTIONS.map((opt) => (
                <Radio key={opt.value} value={opt.value}>
                  {opt.label}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>

          {targetType === 'SPECIFIC' && (
            <Form.Item
              name="targetUserIds"
              label="指定用户ID"
              rules={[{ required: true, message: '请输入目标用户ID' }]}
              extra="多个ID用逗号分隔，如：1001,1002,1003"
            >
              <TextArea rows={2} placeholder="请输入用户ID，多个用逗号分隔" />
            </Form.Item>
          )}

          <Form.Item
            name="popupFrequency"
            label="弹窗频率"
            rules={[{ required: true, message: '请选择弹窗频率' }]}
          >
            <Select
              options={POPUP_FREQUENCY_OPTIONS.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              placeholder="请选择弹窗频率"
            />
          </Form.Item>

          <Form.Item label="生效时间" extra="留空表示长期有效">
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="startAt" noStyle>
                <DatePicker
                  showTime
                  placeholder="开始时间"
                  style={{ width: '50%' }}
                  format="YYYY-MM-DD HH:mm"
                />
              </Form.Item>
              <Form.Item name="endAt" noStyle>
                <DatePicker
                  showTime
                  placeholder="结束时间"
                  style={{ width: '50%' }}
                  format="YYYY-MM-DD HH:mm"
                />
              </Form.Item>
            </Space.Compact>
          </Form.Item>

          <Form.Item
            name="sortOrder"
            label="排序权重"
            extra="数字越大越靠前"
          >
            <InputNumber min={0} placeholder="0" style={{ width: 150 }} />
          </Form.Item>
        </Card>

        {/* 按钮配置 */}
        <Card title="按钮配置（可选）" size="small">
          <Form.Item name="buttons">
            <ButtonConfigList max={2} />
          </Form.Item>
        </Card>
      </Form>
    </Modal>
  );
}

// ============================================================================
// 主页面组件
// ============================================================================

/**
 * 公告管理页
 * @description 系统公告的CRUD管理、批量操作、预览功能
 */
export default function AnnouncementManagePage() {
  const actionRef = useRef<ActionType>(null);

  // 弹窗状态
  const [formVisible, setFormVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [previewAnnouncement, setPreviewAnnouncement] = useState<Partial<Announcement> | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 加载状态
  const [submitLoading, setSubmitLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<Record<number, boolean>>({});
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ============================================================================
  // 操作处理函数
  // ============================================================================

  // 新建公告
  const handleCreate = () => {
    setEditingAnnouncement(null);
    setFormVisible(true);
  };

  // 编辑公告
  const handleEdit = (record: Announcement) => {
    setEditingAnnouncement(record);
    setFormVisible(true);
  };

  // 预览公告
  const handlePreview = (record: Announcement) => {
    setPreviewAnnouncement(record);
    setPreviewVisible(true);
  };

  // 删除公告（弹窗确认）
  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setDeleteModalVisible(true);
  };

  // 确认删除
  const handleDeleteConfirm = async () => {
    if (deletingId === null) return;

    setDeleteLoading(true);
    try {
      await deleteAnnouncement(deletingId);
      showSuccess('删除成功');
      setDeleteModalVisible(false);
      actionRef.current?.reload();
    } catch (error) {
      // 错误已在 request 拦截器中处理
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
    }
  };

  // 状态切换
  const handleStatusChange = async (id: number, isActive: boolean) => {
    setStatusLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await updateAnnouncementStatus(id, isActive);
      actionRef.current?.reload();
    } catch (error) {
      // 错误已在 request 拦截器中处理
    } finally {
      setStatusLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  // 表单提交
  const handleFormSubmit = async (values: AnnouncementFormData) => {
    setSubmitLoading(true);
    try {
      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id, values);
        showSuccess('更新成功');
      } else {
        await createAnnouncement(values);
        showSuccess('创建成功');
      }
      setFormVisible(false);
      actionRef.current?.reload();
    } catch (error) {
      // 错误已在 request 拦截器中处理
    } finally {
      setSubmitLoading(false);
    }
  };

  // 表单预览
  const handleFormPreview = (values: Partial<Announcement>) => {
    setPreviewAnnouncement(values);
    setPreviewVisible(true);
  };

  // 批量状态更新
  const handleBatchStatus = async (ids: React.Key[], isActive: boolean) => {
    try {
      const result = await batchUpdateStatus(ids.map(Number), isActive);
      handleBatchResult(result, isActive ? '批量启用' : '批量禁用');
    } catch (error) {
      // 错误已在 request 拦截器中处理
    }
  };

  // 批量删除
  const handleBatchDelete = async (ids: React.Key[]) => {
    try {
      const result = await batchDeleteAnnouncements(ids.map(Number));
      handleBatchResult(result, '批量删除');
    } catch (error) {
      // 错误已在 request 拦截器中处理
    }
  };

  // 批量操作结果处理
  const handleBatchResult = (result: BatchOperationResponse, operation: string) => {
    if (result.failed === 0) {
      showSuccess(`${operation}成功，共处理 ${result.succeeded} 条`);
    } else if (result.succeeded === 0) {
      message.error(`${operation}失败，共 ${result.failed} 条失败`);
    } else {
      message.warning(
        `部分${operation}成功：成功 ${result.succeeded} 条，失败 ${result.failed} 条`
      );
    }
    actionRef.current?.reload();
  };

  // ============================================================================
  // 表格列定义
  // ============================================================================

  const columns: ProColumns<Announcement>[] = useMemo(
    () => [
      {
        title: 'ID',
        dataIndex: 'id',
        width: 80,
        search: false,
        sorter: true,
      },
      {
        title: '标题',
        dataIndex: 'title',
        width: 200,
        ellipsis: true,
        copyable: true,
        fieldProps: {
          placeholder: '搜索标题',
        },
      },
      {
        title: '弹窗频率',
        dataIndex: 'popupFrequency',
        width: 100,
        valueType: 'select',
        valueEnum: {
          ONCE: { text: '仅一次' },
          EVERY_LOGIN: { text: '每次登录' },
          DAILY: { text: '每天一次' },
        },
        render: (_, record) => {
          const config = POPUP_FREQUENCY_MAP[record.popupFrequency];
          return <Tag color={config.color}>{config.text}</Tag>;
        },
      },
      {
        title: '目标用户',
        dataIndex: 'targetType',
        width: 100,
        valueType: 'select',
        valueEnum: {
          ALL: { text: '全部用户' },
          SPECIFIC: { text: '指定用户' },
        },
        render: (_, record) => TARGET_TYPE_MAP[record.targetType],
      },
      {
        title: '生效时间',
        dataIndex: 'effectiveTime',
        width: 180,
        search: false,
        responsive: ['md'],
        render: (_, record) => {
          const { startAt, endAt } = record;
          const now = new Date();

          if (!startAt && !endAt) {
            return '长期有效';
          }

          let timeText = '';
          if (startAt && endAt) {
            timeText = `${formatSystemTime(startAt, 'MM-DD HH:mm')} ~ ${formatSystemTime(endAt, 'MM-DD HH:mm')}`;
          } else if (startAt) {
            timeText = `${formatSystemTime(startAt, 'MM-DD HH:mm')} 起`;
          } else if (endAt) {
            timeText = `至 ${formatSystemTime(endAt, 'MM-DD HH:mm')}`;
          }

          // 状态标记
          if (endAt && new Date(endAt) < now) {
            return (
              <Text type="secondary">
                {timeText} <Tag color="default">已过期</Tag>
              </Text>
            );
          }
          if (startAt && new Date(startAt) > now) {
            return (
              <Text>
                {timeText} <Tag color="blue">未开始</Tag>
              </Text>
            );
          }

          return timeText;
        },
      },
      {
        title: '生效时间',
        dataIndex: 'effectiveTimeRange',
        valueType: 'dateTimeRange',
        hideInTable: true,
        search: {
          transform: (value) => ({
            effectiveStartDate: value?.[0],
            effectiveEndDate: value?.[1],
          }),
        },
      },
      {
        title: '排序',
        dataIndex: 'sortOrder',
        width: 80,
        search: false,
        sorter: true,
        responsive: ['lg'],
      },
      {
        title: '状态',
        dataIndex: 'isActive',
        width: 100,
        valueType: 'select',
        valueEnum: {
          true: { text: '启用', status: 'Success' },
          false: { text: '禁用', status: 'Default' },
        },
        render: (_, record) => (
          <Switch
            checked={record.isActive}
            checkedChildren="启用"
            unCheckedChildren="禁用"
            loading={statusLoading[record.id]}
            onChange={(checked) => handleStatusChange(record.id, checked)}
          />
        ),
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        width: 150,
        search: false,
        sorter: true,
        responsive: ['lg'],
        render: (_, record) => <TimeDisplay value={record.createdAt} />,
      },
      {
        title: '操作',
        valueType: 'option',
        width: 150,
        fixed: 'right',
        render: (_, record) => [
          <a key="preview" onClick={() => handlePreview(record)}>
            <Space size={4}>
              <RiEyeLine size={14} />
              预览
            </Space>
          </a>,
          <a key="edit" onClick={() => handleEdit(record)}>
            <Space size={4}>
              <RiEditLine size={14} />
              编辑
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
    [statusLoading]
  );

  // ============================================================================
  // 渲染
  // ============================================================================

  return (
    <PageContainer
      header={{
        title: '公告管理',
      }}
      extra={[
        <Button
          key="create"
          type="primary"
          icon={<RiAddLine size={16} />}
          onClick={handleCreate}
        >
          新建公告
        </Button>,
      ]}
    >
      <ProTable<Announcement>
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
          persistenceKey: 'announcement-list-columns',
          persistenceType: 'localStorage',
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
            <Button onClick={() => handleBatchStatus(selectedRowKeys, true)}>
              批量启用
            </Button>
            <Button onClick={() => handleBatchStatus(selectedRowKeys, false)}>
              批量禁用
            </Button>
            <Popconfirm
              title={`确定删除选中的 ${selectedRowKeys.length} 条公告？`}
              description="此操作不可恢复"
              onConfirm={() => {
                handleBatchDelete(selectedRowKeys);
                onCleanSelected();
              }}
              okText="确定"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button danger>批量删除</Button>
            </Popconfirm>
          </Space>
        )}
        // 数据请求
        request={async (params, sort) => {
          const { current, pageSize, keyword, ...filters } = params;

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
            const response = await fetchAnnouncementList({
              page: current,
              pageSize,
              keyword,
              ...filters,
              sortField,
              sortOrder,
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
      />

      {/* 新建/编辑弹窗 */}
      <AnnouncementForm
        visible={formVisible}
        announcement={editingAnnouncement}
        onCancel={() => setFormVisible(false)}
        onSubmit={handleFormSubmit}
        onPreview={handleFormPreview}
        loading={submitLoading}
      />

      {/* 预览弹窗 */}
      <AnnouncementPreview
        visible={previewVisible}
        announcement={previewAnnouncement}
        onClose={() => setPreviewVisible(false)}
      />

      {/* 删除确认弹窗 */}
      <ConfirmModal
        open={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setDeletingId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="确认删除公告"
        content="删除后数据将无法恢复，确定要删除该公告吗？"
        danger
        loading={deleteLoading}
      />
    </PageContainer>
  );
}
