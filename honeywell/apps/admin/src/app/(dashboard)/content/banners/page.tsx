/**
 * @file Banner管理页
 * @description 首页轮播Banner的管理页面，支持拖拽排序、批量操作
 * @depends 开发文档/04-后台管理端/04.8-内容管理/04.8.1-Banner管理页.md
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Switch,
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  Image,
  Tooltip,
  Checkbox,
  message,
  Modal,
  List,
  Row,
  Col,
  Empty,
  Spin,
} from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiDraggable,
  RiUploadCloud2Line,
  RiExternalLinkLine,
  RiHome5Line,
  RiShoppingBag3Line,
  RiTimeLine,
  RiAlertLine,
} from '@remixicon/react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { BannerStatusBadge } from '@/components/common/StatusBadge';
import { TimeDisplay } from '@/components/common/TimeDisplay';
import {
  fetchBannerList,
  createBanner,
  updateBanner,
  deleteBanner,
  updateBannerSort,
  batchUpdateBannerStatus,
  batchDeleteBanners,
  uploadBannerImage,
} from '@/services/banners';
import { fetchProductList } from '@/services/products';
import type {
  Banner,
  BannerFormData,
  BannerLinkType,
  BannerBatchOperationResult,
} from '@/types/banners';
import {
  BANNER_LINK_TYPE_OPTIONS,
  INTERNAL_PATH_OPTIONS,
  URL_PATTERN,
  getBannerEffectiveStatus,
} from '@/types/banners';
import { formatSystemTime } from '@/utils/timezone';

const { Title, Text, Paragraph } = Typography;

/**
 * 可拖拽的Banner卡片组件
 */
function SortableBannerCard({
  banner,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  banner: Banner;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (isActive: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 获取Banner生效状态
  const effectiveStatus = getBannerEffectiveStatus(banner);

  // 获取跳转目标显示文本
  const getLinkTargetDisplay = () => {
    switch (banner.linkType) {
      case 'NONE':
        return '-';
      case 'PRODUCT':
        return banner.productName || '-';
      case 'INTERNAL':
        const internalOption = INTERNAL_PATH_OPTIONS.find(
          (opt) => opt.value === banner.linkUrl
        );
        return internalOption?.label || banner.linkUrl || '-';
      case 'EXTERNAL':
        return (
          <Tooltip title={banner.linkUrl}>
            <Text ellipsis style={{ maxWidth: 150 }}>
              {banner.linkUrl || '-'}
            </Text>
          </Tooltip>
        );
      default:
        return '-';
    }
  };

  // 获取有效期显示
  const getValidityDisplay = () => {
    if (!banner.startAt && !banner.endAt) {
      return '长期有效';
    }
    const start = banner.startAt
      ? formatSystemTime(banner.startAt, 'MM-DD')
      : '立即';
    const end = banner.endAt
      ? formatSystemTime(banner.endAt, 'MM-DD')
      : '永久';
    return `${start} ~ ${end}`;
  };

  // 获取跳转类型显示
  const getLinkTypeDisplay = () => {
    const option = BANNER_LINK_TYPE_OPTIONS.find(
      (opt) => opt.value === banner.linkType
    );
    return option?.label || banner.linkType;
  };

  // 获取跳转类型图标
  const getLinkTypeIcon = () => {
    switch (banner.linkType) {
      case 'EXTERNAL':
        return <RiExternalLinkLine size={14} />;
      case 'INTERNAL':
        return <RiHome5Line size={14} />;
      case 'PRODUCT':
        return <RiShoppingBag3Line size={14} />;
      default:
        return null;
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        hoverable
        style={{
          border: isDragging ? '2px dashed #1677ff' : undefined,
          background: isDragging ? '#e6f4ff' : undefined,
        }}
        styles={{
          body: { padding: 0 },
        }}
      >
        {/* 顶部操作栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fafafa',
          }}
        >
          {/* 复选框 */}
          <Checkbox
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            style={{ marginRight: 8 }}
          />

          {/* 拖拽把手 */}
          <div
            {...attributes}
            {...listeners}
            style={{
              cursor: 'grab',
              color: '#8c8c8c',
              display: 'flex',
              alignItems: 'center',
              padding: 4,
              borderRadius: 4,
              marginRight: 8,
            }}
          >
            <RiDraggable size={16} />
          </div>

          {/* Banner ID */}
          <Text type="secondary" style={{ fontSize: 12, flex: 1 }}>
            #{banner.id}
          </Text>

          {/* 状态开关 */}
          <Tooltip title={banner.isActive ? '点击禁用' : '点击启用'}>
            <Switch
              size="small"
              checked={banner.isActive}
              onChange={onStatusChange}
            />
          </Tooltip>
        </div>

        {/* Banner图片 */}
        <div style={{ padding: 12, paddingBottom: 0 }}>
          <Image
            src={banner.imageUrl}
            alt="Banner"
            width="100%"
            height={100}
            style={{
              objectFit: 'cover',
              borderRadius: 8,
            }}
            placeholder={
              <div
                style={{
                  width: '100%',
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f5f5f5',
                }}
              >
                <Spin size="small" />
              </div>
            }
            fallback="/images/image-error.png"
          />
        </div>

        {/* Banner信息 */}
        <div style={{ padding: 12 }}>
          {/* 状态标签 */}
          <div style={{ marginBottom: 8 }}>
            <BannerStatusBadge status={effectiveStatus} />
          </div>

          {/* 跳转类型和目标 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginBottom: 4,
            }}
          >
            {getLinkTypeIcon()}
            <Text style={{ fontSize: 13 }}>{getLinkTypeDisplay()}</Text>
            {banner.linkType !== 'NONE' && (
              <>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  :
                </Text>
                <Text style={{ fontSize: 13 }}>{getLinkTargetDisplay()}</Text>
              </>
            )}
          </div>

          {/* 有效期 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: '#8c8c8c',
              fontSize: 12,
            }}
          >
            <RiTimeLine size={14} />
            <span>{getValidityDisplay()}</span>
            {effectiveStatus === 'EXPIRING_SOON' && (
              <Tooltip title="7天内过期">
                <RiAlertLine size={14} style={{ color: '#faad14' }} />
              </Tooltip>
            )}
          </div>
        </div>

        {/* 底部操作 */}
        <div
          style={{
            display: 'flex',
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <Button
            type="text"
            icon={<RiEditLine size={16} />}
            onClick={onEdit}
            style={{ flex: 1, borderRadius: 0 }}
          >
            编辑
          </Button>
          <div style={{ width: 1, background: '#f0f0f0' }} />
          <Button
            type="text"
            danger
            icon={<RiDeleteBinLine size={16} />}
            onClick={onDelete}
            style={{ flex: 1, borderRadius: 0 }}
          >
            删除
          </Button>
        </div>
      </Card>
    </div>
  );
}

/**
 * 拖拽覆盖层卡片
 */
function DragOverlayCard({ banner }: { banner: Banner }) {
  return (
    <Card
      style={{
        width: 280,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        border: '2px solid #1677ff',
      }}
      styles={{ body: { padding: 12 } }}
    >
      <Image
        src={banner.imageUrl}
        alt="Banner"
        width="100%"
        height={80}
        style={{ objectFit: 'cover', borderRadius: 4 }}
        preview={false}
      />
      <div style={{ marginTop: 8 }}>
        <Text style={{ fontSize: 12 }}>
          #{banner.id} - {BANNER_LINK_TYPE_OPTIONS.find((opt) => opt.value === banner.linkType)?.label}
        </Text>
      </div>
    </Card>
  );
}

/**
 * Banner管理页主组件
 */
export default function BannerManagePage() {
  const queryClient = useQueryClient();

  // 状态管理
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);
  const [batchDeleteConfirmVisible, setBatchDeleteConfirmVisible] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [localBanners, setLocalBanners] = useState<Banner[]>([]);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const [form] = Form.useForm();
  const linkType = Form.useWatch('linkType', form);

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 获取Banner列表
  const {
    data: bannerData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['banners'],
    queryFn: () => fetchBannerList({ pageSize: 100 }),
  });

  // 同步远程数据到本地状态（用于拖拽排序）
  useEffect(() => {
    if (bannerData?.list) {
      setLocalBanners(bannerData.list);
    }
  }, [bannerData?.list]);

  // 获取产品列表（用于产品选择器）
  const { data: productsData } = useQuery({
    queryKey: ['products', 'active'],
    queryFn: () => fetchProductList({ status: 'ACTIVE' }),
  });

  // 创建Banner
  const createMutation = useMutation({
    mutationFn: createBanner,
    onSuccess: () => {
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      setImageUrl('');
      refetch();
    },
    onError: () => {
      message.error('创建失败');
    },
  });

  // 更新Banner
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BannerFormData> }) =>
      updateBanner(id, data),
    onSuccess: () => {
      message.success('更新成功');
      setModalVisible(false);
      setEditingBanner(null);
      form.resetFields();
      setImageUrl('');
      refetch();
    },
    onError: () => {
      message.error('更新失败');
    },
  });

  // 删除Banner
  const deleteMutation = useMutation({
    mutationFn: deleteBanner,
    onSuccess: () => {
      message.success('删除成功');
      setDeleteConfirmVisible(false);
      setDeletingBanner(null);
      refetch();
    },
    onError: () => {
      message.error('删除失败');
    },
  });

  // 更新排序
  const sortMutation = useMutation({
    mutationFn: updateBannerSort,
    onSuccess: () => {
      message.success('排序已保存');
      refetch();
    },
    onError: () => {
      message.error('排序失败');
      // 恢复原排序
      if (bannerData?.list) {
        setLocalBanners(bannerData.list);
      }
    },
  });

  // 批量更新状态
  const batchStatusMutation = useMutation({
    mutationFn: batchUpdateBannerStatus,
    onSuccess: (result) => {
      handleBatchResult(result, '状态更新');
      setSelectedIds([]);
      refetch();
    },
    onError: () => {
      message.error('批量操作失败');
    },
  });

  // 批量删除
  const batchDeleteMutation = useMutation({
    mutationFn: batchDeleteBanners,
    onSuccess: (result) => {
      handleBatchResult(result, '删除');
      setBatchDeleteConfirmVisible(false);
      setSelectedIds([]);
      refetch();
    },
    onError: () => {
      message.error('批量删除失败');
    },
  });

  /**
   * 处理批量操作结果
   */
  const handleBatchResult = (result: BannerBatchOperationResult, action: string) => {
    if (result.failed === 0) {
      message.success(`批量${action}成功,共处理 ${result.succeeded} 条`);
    } else if (result.succeeded === 0) {
      message.error(`批量${action}失败,共 ${result.failed} 条失败`);
    } else {
      // 部分成功
      Modal.info({
        title: '部分操作成功',
        content: (
          <div>
            <p>
              成功 {result.succeeded} 条,失败 {result.failed} 条
            </p>
            <List
              size="small"
              dataSource={result.results.filter((r) => !r.success)}
              renderItem={(item) => (
                <List.Item>
                  ID {item.id}: {item.error?.message}
                </List.Item>
              )}
            />
          </div>
        ),
      });
    }
  };

  /**
   * 处理拖拽开始
   */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  }, []);

  /**
   * 处理拖拽结束
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (over && active.id !== over.id) {
        setLocalBanners((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);
          const newItems = arrayMove(items, oldIndex, newIndex);

          // 调用排序接口
          sortMutation.mutate({ ids: newItems.map((item) => item.id) });

          return newItems;
        });
      }
    },
    [sortMutation]
  );

  /**
   * 处理状态切换
   */
  const handleStatusChange = useCallback(
    async (banner: Banner, isActive: boolean) => {
      try {
        await updateBanner(banner.id, { isActive });
        message.success(isActive ? '已启用' : '已禁用');
        refetch();
      } catch {
        message.error('操作失败');
      }
    },
    [refetch]
  );

  /**
   * 打开新建弹窗
   */
  const handleCreate = () => {
    setEditingBanner(null);
    setImageUrl('');
    form.resetFields();
    form.setFieldsValue({
      linkType: 'NONE',
      isActive: true,
    });
    setModalVisible(true);
  };

  /**
   * 打开编辑弹窗
   */
  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setImageUrl(banner.imageUrl);
    form.setFieldsValue({
      linkType: banner.linkType,
      linkUrl: banner.linkUrl,
      productId: banner.productId,
      startAt: banner.startAt ? new Date(banner.startAt) : null,
      endAt: banner.endAt ? new Date(banner.endAt) : null,
      isActive: banner.isActive,
    });
    setModalVisible(true);
  };

  /**
   * 处理删除确认
   */
  const handleDeleteConfirm = (banner: Banner) => {
    setDeletingBanner(banner);
    setDeleteConfirmVisible(true);
  };

  /**
   * 执行删除
   */
  const handleDelete = () => {
    if (deletingBanner) {
      deleteMutation.mutate(deletingBanner.id);
    }
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 检查图片是否上传
      if (!imageUrl) {
        message.error('请上传Banner图片');
        return;
      }

      const submitData: BannerFormData = {
        imageUrl,
        linkType: values.linkType,
        linkUrl: null,
        productId: null,
        startAt: values.startAt ? new Date(values.startAt).toISOString() : null,
        endAt: values.endAt ? new Date(values.endAt).toISOString() : null,
        isActive: values.isActive ?? true,
      };

      // 根据linkType设置对应字段
      switch (values.linkType) {
        case 'INTERNAL':
        case 'EXTERNAL':
          submitData.linkUrl = values.linkUrl;
          break;
        case 'PRODUCT':
          submitData.productId = values.productId;
          break;
      }

      if (editingBanner) {
        updateMutation.mutate({ id: editingBanner.id, data: submitData });
      } else {
        createMutation.mutate(submitData);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  /**
   * 处理图片上传
   */
  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);
    
    try {
      const result = await uploadBannerImage(file as File);
      setImageUrl(result.url);
      onSuccess?.(result);
      message.success('图片上传成功');
    } catch (error) {
      onError?.(error as Error);
      message.error('图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  /**
   * 图片上传前校验
   */
  const beforeUpload = (file: File) => {
    const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(
      file.type
    );
    if (!isValidType) {
      message.error('仅支持 JPG/PNG/GIF/WEBP 格式');
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片大小不能超过 5MB');
      return false;
    }
    return true;
  };

  /**
   * 全选/反选
   */
  const handleSelectAll = () => {
    if (selectedIds.length === localBanners.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(localBanners.map((b) => b.id));
    }
  };

  /**
   * 切换单个选中
   */
  const handleSelectOne = (bannerId: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, bannerId]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== bannerId));
    }
  };

  /**
   * 批量启用
   */
  const handleBatchEnable = () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择Banner');
      return;
    }
    batchStatusMutation.mutate({ ids: selectedIds, isActive: true });
  };

  /**
   * 批量禁用
   */
  const handleBatchDisable = () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择Banner');
      return;
    }
    batchStatusMutation.mutate({ ids: selectedIds, isActive: false });
  };

  /**
   * 批量删除确认
   */
  const handleBatchDeleteConfirm = () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择Banner');
      return;
    }
    setBatchDeleteConfirmVisible(true);
  };

  /**
   * 执行批量删除
   */
  const handleBatchDelete = () => {
    batchDeleteMutation.mutate({ ids: selectedIds });
  };

  // 获取当前拖拽项
  const activeBanner = activeId
    ? localBanners.find((b) => b.id === activeId)
    : null;

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题和操作 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          轮播Banner管理
        </Title>
        <Button type="primary" icon={<RiAddLine size={16} />} onClick={handleCreate}>
          新建Banner
        </Button>
      </div>

      {/* 批量操作栏 */}
      {localBanners.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <Checkbox
              indeterminate={
                selectedIds.length > 0 && selectedIds.length < localBanners.length
              }
              checked={selectedIds.length === localBanners.length && localBanners.length > 0}
              onChange={handleSelectAll}
            >
              全选
            </Checkbox>
            <Text type="secondary">已选 {selectedIds.length} 项</Text>
            <Space>
              <Button
                size="small"
                onClick={handleBatchEnable}
                disabled={selectedIds.length === 0}
              >
                批量启用
              </Button>
              <Button
                size="small"
                onClick={handleBatchDisable}
                disabled={selectedIds.length === 0}
              >
                批量禁用
              </Button>
              <Button
                size="small"
                danger
                onClick={handleBatchDeleteConfirm}
                disabled={selectedIds.length === 0}
              >
                批量删除
              </Button>
            </Space>
          </div>
        </Card>
      )}

      {/* Banner卡片网格 */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      ) : localBanners.length === 0 ? (
        <Card>
          <Empty
            description="暂无Banner"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={handleCreate}>
              立即创建
            </Button>
          </Empty>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localBanners.map((b) => b.id)}
            strategy={rectSortingStrategy}
          >
            <Row gutter={[16, 16]}>
              {localBanners.map((banner) => (
                <Col key={banner.id} xs={24} sm={12} md={8} lg={6}>
                  <SortableBannerCard
                    banner={banner}
                    isSelected={selectedIds.includes(banner.id)}
                    onSelect={(checked) => handleSelectOne(banner.id, checked)}
                    onEdit={() => handleEdit(banner)}
                    onDelete={() => handleDeleteConfirm(banner)}
                    onStatusChange={(isActive) =>
                      handleStatusChange(banner, isActive)
                    }
                  />
                </Col>
              ))}
            </Row>
          </SortableContext>

          {/* 拖拽覆盖层 */}
          <DragOverlay>
            {activeBanner && <DragOverlayCard banner={activeBanner} />}
          </DragOverlay>
        </DndContext>
      )}

      {/* 提示信息 */}
      {localBanners.length > 0 && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text type="secondary">
            <RiDraggable size={14} style={{ verticalAlign: 'middle' }} /> 拖拽卡片可调整Banner显示顺序
          </Text>
        </div>
      )}

      {/* 新建/编辑弹窗 */}
      <Modal
        title={editingBanner ? '编辑Banner' : '新建Banner'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingBanner(null);
          form.resetFields();
          setImageUrl('');
        }}
        onOk={handleSubmit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={600}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" initialValues={{ linkType: 'NONE', isActive: true }}>
          {/* Banner图片上传 */}
          <Form.Item
            label="Banner图片"
            required
            help="建议尺寸: 750x300px，支持JPG/PNG/GIF/WEBP，最大5MB"
          >
            <Upload
              accept=".jpg,.jpeg,.png,.gif,.webp"
              listType="picture-card"
              showUploadList={false}
              customRequest={handleUpload}
              beforeUpload={beforeUpload}
            >
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt="Banner预览"
                  width="100%"
                  height={80}
                  style={{ objectFit: 'cover' }}
                  preview={false}
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 80,
                  }}
                >
                  {uploading ? (
                    <Spin />
                  ) : (
                    <>
                      <RiUploadCloud2Line size={24} style={{ color: '#8c8c8c' }} />
                      <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                        点击上传
                      </Text>
                    </>
                  )}
                </div>
              )}
            </Upload>
          </Form.Item>

          {/* 跳转类型 */}
          <Form.Item
            name="linkType"
            label="跳转类型"
            rules={[{ required: true, message: '请选择跳转类型' }]}
          >
            <Select options={BANNER_LINK_TYPE_OPTIONS} placeholder="请选择跳转类型" />
          </Form.Item>

          {/* 内部路径（linkType=INTERNAL时显示） */}
          {linkType === 'INTERNAL' && (
            <Form.Item
              name="linkUrl"
              label="内部页面"
              rules={[{ required: true, message: '请选择内部页面' }]}
            >
              <Select options={INTERNAL_PATH_OPTIONS} placeholder="请选择内部页面" />
            </Form.Item>
          )}

          {/* 外部链接（linkType=EXTERNAL时显示） */}
          {linkType === 'EXTERNAL' && (
            <Form.Item
              name="linkUrl"
              label="外部链接"
              rules={[
                { required: true, message: '请输入外部链接' },
                {
                  pattern: URL_PATTERN,
                  message: '请输入有效的URL（以http://或https://开头）',
                },
              ]}
            >
              <Input placeholder="请输入外部链接，如: https://example.com" />
            </Form.Item>
          )}

          {/* 选择产品（linkType=PRODUCT时显示） */}
          {linkType === 'PRODUCT' && (
            <Form.Item
              name="productId"
              label="选择产品"
              rules={[{ required: true, message: '请选择关联产品' }]}
            >
              <Select
                placeholder="请选择关联产品"
                showSearch
                optionFilterProp="label"
                options={productsData?.list?.map((p) => ({
                  label: `${p.name} (${p.series})`,
                  value: p.id,
                }))}
              />
            </Form.Item>
          )}

          {/* 生效时间 */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startAt" label="开始时间" help="留空表示立即生效">
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  placeholder="选择开始时间"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endAt"
                label="结束时间"
                help="留空表示长期有效"
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const startAt = getFieldValue('startAt');
                      if (value && startAt && new Date(value) <= new Date(startAt)) {
                        return Promise.reject(new Error('结束时间必须晚于开始时间'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  placeholder="选择结束时间"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 启用状态 */}
          <Form.Item name="isActive" label="启用状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 删除确认弹窗 */}
      <ConfirmModal
        open={deleteConfirmVisible}
        onClose={() => {
          setDeleteConfirmVisible(false);
          setDeletingBanner(null);
        }}
        onConfirm={handleDelete}
        title="确认删除"
        content="确定删除该Banner?此操作不可恢复"
        danger
        loading={deleteMutation.isPending}
      />

      {/* 批量删除确认弹窗 */}
      <ConfirmModal
        open={batchDeleteConfirmVisible}
        onClose={() => setBatchDeleteConfirmVisible(false)}
        onConfirm={handleBatchDelete}
        title="确认批量删除"
        content={`确定删除选中的 ${selectedIds.length} 个Banner?此操作不可恢复`}
        danger
        loading={batchDeleteMutation.isPending}
      />
    </div>
  );
}
