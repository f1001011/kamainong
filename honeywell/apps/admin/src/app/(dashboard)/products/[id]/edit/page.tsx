/**
 * @file 产品编辑页
 * @description 编辑现有产品，支持实时预览、图片上传、富文本编辑
 * @depends 开发文档/04-后台管理端/04.5-产品管理/04.5.2-产品编辑页.md
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Radio,
  Switch,
  Button,
  Space,
  Typography,
  Upload,
  Spin,
  Alert,
  Descriptions,
  Breadcrumb,
  Row,
  Col,
  App,
  Image,
  Divider,
  Tag,
} from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import {
  RiSaveLine,
  RiArrowLeftLine,
  RiDraftLine,
  RiUpload2Line,
  RiImageLine,
  RiDeleteBinLine,
  RiInformationLine,
  RiFileTextLine,
  RiDraggable,
} from '@remixicon/react';
import Link from 'next/link';
import Decimal from 'decimal.js';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
  fetchProductDetail,
  updateProduct,
  uploadProductImage,
} from '@/services/products';
import { AmountDisplay, ProductStatusBadge, RichTextEditor } from '@/components/common';
import { ConfirmModal } from '@/components/modals';
import { ListPageSkeleton } from '@/components/tables';
import type {
  ProductDetail,
  ProductFormData,
  ProductType,
  ProductSeries,
} from '@/types/products';
import {
  PRODUCT_TYPE_OPTIONS,
  PRODUCT_SERIES_OPTIONS,
  CYCLE_QUICK_OPTIONS,
  PRODUCT_SALE_STATUS_OPTIONS,
} from '@/types/products';
import { useGlobalConfig } from '@/hooks/useGlobalConfig';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * 可排序图片组件
 */
function SortableImage({
  file,
  onRemove,
}: {
  file: UploadFile;
  onRemove: (uid: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.uid });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const imageUrl = file.url || file.thumbUrl || (file.response as any)?.url;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        position: 'relative',
        width: 104,
        height: 104,
        border: isDragging ? '2px dashed #1677ff' : '1px solid #d9d9d9',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#fafafa',
      }}
    >
      <div
        {...attributes}
        {...listeners}
        style={{
          position: 'absolute',
          top: 4,
          left: 4,
          cursor: 'grab',
          color: '#fff',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: 4,
          padding: 2,
          zIndex: 10,
        }}
      >
        <RiDraggable size={16} />
      </div>
      <Button
        type="text"
        danger
        size="small"
        icon={<RiDeleteBinLine size={14} />}
        onClick={() => onRemove(file.uid)}
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          background: 'rgba(255,255,255,0.9)',
          borderRadius: 4,
          zIndex: 10,
        }}
      />
      <Image
        src={imageUrl}
        alt="详情图"
        width={104}
        height={104}
        style={{ objectFit: 'cover' }}
        preview={{ mask: null }}
      />
    </div>
  );
}

/**
 * 收益预览组件
 */
function IncomePreview({
  price,
  dailyIncome,
  cycleDays,
}: {
  price?: number;
  dailyIncome?: number;
  cycleDays?: number;
}) {
  if (!price || !dailyIncome || !cycleDays) {
    return null;
  }

  const totalIncome = new Decimal(dailyIncome).times(cycleDays).toFixed(2);
  const annualRate = new Decimal(dailyIncome)
    .times(365)
    .div(price)
    .times(100)
    .toFixed(0);

  return (
    <Card
      size="small"
      style={{ marginTop: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}
    >
      <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
        收益预览
      </Title>
      <Descriptions column={1} size="small">
        <Descriptions.Item label="投入本金">
          <AmountDisplay value={price} />
        </Descriptions.Item>
        <Descriptions.Item label="周期收益">
          <AmountDisplay value={totalIncome} highlight /> （{cycleDays}天）
        </Descriptions.Item>
        <Descriptions.Item label="年化收益率">
          <Text type="success" strong>
            约 {annualRate}%
          </Text>
        </Descriptions.Item>
      </Descriptions>
      <Text type="secondary" style={{ fontSize: 12 }}>
        用户购买后每日获得 <AmountDisplay value={dailyIncome} size="small" />
        ，共计 {cycleDays} 天
      </Text>
    </Card>
  );
}

/**
 * 移动端预览组件
 */
function MobilePreview({
  formData,
  mainImageUrl,
}: {
  formData: Partial<ProductFormData>;
  mainImageUrl: string | null;
}) {
  const totalIncome = useMemo(() => {
    if (formData.dailyIncome && formData.cycleDays) {
      return new Decimal(formData.dailyIncome)
        .times(formData.cycleDays)
        .toFixed(2);
    }
    return '0.00';
  }, [formData.dailyIncome, formData.cycleDays]);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 375,
        margin: '0 auto',
        border: '8px solid #1f1f1f',
        borderRadius: 32,
        overflow: 'hidden',
        background: '#fff',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      }}
    >
      {/* 模拟手机顶部 */}
      <div
        style={{
          height: 24,
          background: '#1f1f1f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 60,
            height: 6,
            background: '#333',
            borderRadius: 3,
          }}
        />
      </div>

      {/* 内容区 */}
      <div style={{ height: 500, overflow: 'auto' }}>
        {/* 产品主图 */}
        <div
          style={{
            width: '100%',
            height: 200,
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {mainImageUrl ? (
            <img
              src={mainImageUrl}
              alt="产品主图"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#bfbfbf' }}>
              <RiImageLine size={48} />
              <div>暂无主图</div>
            </div>
          )}

          {/* 角标 */}
          {formData.showRecommendBadge && (
            <Tag
              color="red"
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                fontSize: 12,
              }}
            >
              {formData.customBadgeText || 'Recomendado'}
            </Tag>
          )}

          {/* 系列标签 */}
          <Tag
            color={
              formData.series === 'VIP' ? 'gold' :
              formData.series === 'VIC' ? 'cyan' :
              formData.series === 'NWS' ? 'green' :
              formData.series === 'QLD' ? 'purple' :
              formData.series === 'FINANCIAL' ? 'magenta' : 'blue'
            }
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
            }}
          >
            {formData.series || 'PO'}系列
          </Tag>
        </div>

        {/* 产品信息 */}
        <div style={{ padding: 16 }}>
          <Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
            {formData.name || '产品名称'}
          </Title>

          {/* 价格 */}
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              价格
            </Text>
            <div>
              <AmountDisplay value={formData.price || 0} size="large" />
            </div>
          </div>

          {/* 收益信息 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              padding: 12,
              background: '#f9f9f9',
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                日收益
              </Text>
              <div>
                <AmountDisplay
                  value={formData.dailyIncome || 0}
                  highlight
                  size="default"
                />
              </div>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                周期
              </Text>
              <div>
                <Text strong>{formData.cycleDays || 0} 天</Text>
              </div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                总收益
              </Text>
              <div>
                <AmountDisplay value={totalIncome} highlight size="default" />
              </div>
            </div>
          </div>

          {/* 产品类型标签 */}
          <Space wrap style={{ marginBottom: 16 }}>
            {formData.type === 'TRIAL' && <Tag color="default">体验产品</Tag>}
            {formData.type === 'FINANCIAL' && <Tag color="processing">理财产品</Tag>}
          </Space>

          {/* 产品详情预览 */}
          {formData.detailContent && (
            <div
              style={{
                borderTop: '1px solid #f0f0f0',
                paddingTop: 16,
              }}
            >
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                产品详情
              </Text>
              <div
                className="preview-content"
                dangerouslySetInnerHTML={{ __html: formData.detailContent }}
                style={{ fontSize: 13, lineHeight: 1.6 }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 产品编辑页面
 */
export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.id);
  const { message } = App.useApp();
  const config = useGlobalConfig();
  const [form] = Form.useForm<ProductFormData>();

  // 状态
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [formChanged, setFormChanged] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // 图片状态
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
  const [mainImageUploading, setMainImageUploading] = useState(false);
  const [detailImageList, setDetailImageList] = useState<UploadFile[]>([]);

  // 监听表单值变化
  const formValues = Form.useWatch([], form);

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /**
   * 加载产品详情
   */
  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchProductDetail(productId);
      setProduct(data);

      // 填充表单（包含新增的库存、限购、SVIP、理财字段）
      form.setFieldsValue({
        code: data.code,
        name: data.name,
        type: data.type,
        series: data.series,
        price: data.price,
        dailyIncome: data.dailyIncome,
        cycleDays: data.cycleDays,
        purchaseLimit: data.purchaseLimit,
        userPurchaseLimit: data.userPurchaseLimit ?? undefined,
        globalStock: data.globalStock ?? undefined,
        displayUserLimit: data.displayUserLimit ?? undefined,
        svipDailyReward: data.svipDailyReward ?? undefined,
        svipRequireCount: data.svipRequireCount ?? undefined,
        returnPrincipal: data.returnPrincipal ?? false,
        productStatus: (data.productStatus || 'OPEN') as 'OPEN' | 'COMING_SOON' | 'CLOSED',
        showRecommendBadge: data.showRecommendBadge,
        customBadgeText: data.customBadgeText || '',
        sortOrder: data.sortOrder,
        status: data.status as 'ACTIVE' | 'INACTIVE',
        detailContent: data.detailContent || '',
      });

      // 设置图片
      setMainImageUrl(data.mainImage);
      if (data.detailImages && data.detailImages.length > 0) {
        setDetailImageList(
          data.detailImages.map((url, index) => ({
            uid: `-${index}`,
            name: `image-${index}`,
            status: 'done',
            url,
          }))
        );
      }

      setFormChanged(false);
    } catch (error) {
      console.error('加载产品详情失败:', error);
      router.push('/products');
    } finally {
      setLoading(false);
    }
  }, [productId, form, router]);

  // 初始化加载
  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId, loadProduct]);

  /**
   * 监听表单变化
   */
  const handleFormChange = useCallback(() => {
    setFormChanged(true);
  }, []);

  /**
   * 处理主图上传
   */
  const handleMainImageUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    setMainImageUploading(true);

    try {
      const response = await uploadProductImage(file as File);
      setMainImageUrl(response.url);
      setFormChanged(true);
      onSuccess?.(response);
      message.success('主图上传成功');
    } catch (error) {
      onError?.(error as Error);
      message.error('主图上传失败');
    } finally {
      setMainImageUploading(false);
    }
  };

  /**
   * 删除主图
   */
  const handleRemoveMainImage = useCallback(() => {
    setMainImageUrl(null);
    setFormChanged(true);
  }, []);

  /**
   * 处理详情图上传
   */
  const handleDetailImageUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    const tempFile = file as File;
    const tempUid = `temp-${Date.now()}`;

    // 添加临时文件
    setDetailImageList((prev) => [
      ...prev,
      {
        uid: tempUid,
        name: tempFile.name,
        status: 'uploading',
      },
    ]);

    try {
      const response = await uploadProductImage(tempFile);
      // 更新为上传成功
      setDetailImageList((prev) =>
        prev.map((f) =>
          f.uid === tempUid
            ? { ...f, status: 'done', url: response.url, response }
            : f
        )
      );
      setFormChanged(true);
      onSuccess?.(response);
    } catch (error) {
      // 移除上传失败的文件
      setDetailImageList((prev) => prev.filter((f) => f.uid !== tempUid));
      onError?.(error as Error);
      message.error('图片上传失败');
    }
  };

  /**
   * 删除详情图
   */
  const handleRemoveDetailImage = useCallback((uid: string) => {
    setDetailImageList((prev) => prev.filter((f) => f.uid !== uid));
    setFormChanged(true);
  }, []);

  /**
   * 详情图拖拽排序
   */
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setDetailImageList((prev) => {
        const oldIndex = prev.findIndex((f) => f.uid === active.id);
        const newIndex = prev.findIndex((f) => f.uid === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
      setFormChanged(true);
    }
  }, []);

  /**
   * 处理导航（检查未保存更改）
   */
  const handleNavigate = useCallback(
    (path: string) => {
      if (formChanged) {
        setPendingNavigation(path);
        setLeaveModalOpen(true);
      } else {
        router.push(path);
      }
    },
    [formChanged, router]
  );

  /**
   * 确认离开
   */
  const confirmLeave = useCallback(() => {
    setLeaveModalOpen(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  }, [pendingNavigation, router]);

  /**
   * 保存产品
   */
  const handleSubmit = useCallback(
    async (isDraft = false) => {
      try {
        const values = await form.validateFields();

        // 上架前验证
        if (!isDraft && values.status === 'ACTIVE') {
          if (!mainImageUrl) {
            message.error('上架产品必须有主图');
            return;
          }
          if (!values.price || Number(values.price) <= 0) {
            message.error('上架产品必须设置价格');
            return;
          }
        }

        setSubmitting(true);

        // 构建提交数据
        // 依据：02.4-后台API接口清单.md 第7.2节 - price和dailyIncome需要是字符串类型
        const submitData: Partial<ProductFormData> = {
          ...values,
          // 价格和日收益需要转换为字符串（精确2位小数）
          price: new Decimal(values.price || 0).toFixed(2),
          dailyIncome: new Decimal(values.dailyIncome || 0).toFixed(2),
          mainImage: mainImageUrl,
          detailImages: detailImageList
            .filter((f) => f.status === 'done')
            .map((f) => f.url || (f.response as any)?.url)
            .filter(Boolean),
          status: isDraft ? 'INACTIVE' : values.status,
        };

        await updateProduct(productId, submitData);
        message.success(isDraft ? '已保存为草稿' : '产品更新成功');
        setFormChanged(false);
        router.push('/products');
      } catch (error) {
        console.error('保存失败:', error);
      } finally {
        setSubmitting(false);
      }
    },
    [form, mainImageUrl, detailImageList, productId, message, router]
  );

  // 加载中
  if (loading) {
    return <ListPageSkeleton />;
  }

  // 系列提示
  const series = formValues?.series;

  return (
    <div style={{ padding: 24, maxWidth: 1600 }}>
      {/* 面包屑导航 - 依据：04.5.2-产品编辑页.md 第1节 */}
      <Breadcrumb
        items={[
          { title: <Link href="/">首页</Link> },
          { title: '产品管理' },
          { title: <Link href="/products">产品列表</Link> },
          { title: '编辑产品' },
        ]}
        style={{ marginBottom: 16 }}
      />

      {/* 页面标题 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            编辑产品
          </Title>
          <Text type="secondary">
            编码：{product?.code} · {product?.name}
          </Text>
        </div>
        <Space>
          <Button
            icon={<RiArrowLeftLine size={16} />}
            onClick={() => handleNavigate('/products')}
          >
            返回列表
          </Button>
          <Button
            icon={<RiDraftLine size={16} />}
            loading={submitting}
            onClick={() => handleSubmit(true)}
          >
            保存为草稿
          </Button>
          <Button
            type="primary"
            icon={<RiSaveLine size={16} />}
            loading={submitting}
            onClick={() => handleSubmit(false)}
          >
            保存
          </Button>
        </Space>
      </div>

      {/* 编辑提示 */}
      <Alert
        type="info"
        showIcon
        icon={<RiInformationLine size={16} />}
        message="编辑产品提示"
        description={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>修改价格/收益不影响已购买用户的持仓订单</li>
            <li>修改等级要求可能导致部分用户无法再次购买</li>
            <li>产品下架后，用户无法在前端看到和购买该产品</li>
          </ul>
        }
        style={{ marginBottom: 24 }}
      />

      <Row gutter={24}>
        {/* 左侧表单 */}
        <Col xs={24} lg={16}>
          <Form
            form={form}
            layout="vertical"
            onValuesChange={handleFormChange}
            initialValues={{
              type: 'PAID',
              series: 'PO',
              purchaseLimit: 1,
              showRecommendBadge: false,
              sortOrder: 0,
              status: 'INACTIVE',
              returnPrincipal: false,
            }}
          >
            {/* 基本信息 */}
            <Card title="基本信息" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="产品编码"
                    name="code"
                    rules={[
                      { required: true, message: '请输入产品编码' },
                      {
                        pattern: /^[A-Za-z0-9]{1,20}$/,
                        message: '编码仅支持1-20位字母和数字',
                      },
                    ]}
                    // 依据：04.5.2-产品编辑页.md 第9.1节 - 自动转大写，过滤特殊字符
                    normalize={(value) =>
                      value
                        ? value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
                        : value
                    }
                    extra={
                      <Text type="warning" style={{ fontSize: 12 }}>
                        修改编码可能影响系统其他配置，请谨慎操作
                      </Text>
                    }
                  >
                    <Input placeholder="如：PO1、VIP1" maxLength={20} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="产品名称"
                    name="name"
                    rules={[
                      { required: true, message: '请输入产品名称' },
                      { max: 100, message: '名称不能超过100个字符' },
                    ]}
                  >
                    <Input placeholder="请输入产品名称" maxLength={100} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="产品系列"
                    name="series"
                    rules={[{ required: true, message: '请选择产品系列' }]}
                  >
                    <Radio.Group>
                      {PRODUCT_SERIES_OPTIONS.map((opt) => (
                        <Radio.Button key={opt.value} value={opt.value}>
                          {opt.label}
                        </Radio.Button>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="产品类型"
                    name="type"
                    rules={[{ required: true, message: '请选择产品类型' }]}
                  >
                    <Radio.Group>
                      {PRODUCT_TYPE_OPTIONS.map((opt) => (
                        <Radio.Button key={opt.value} value={opt.value}>
                          {opt.label}
                        </Radio.Button>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>

              {/* 系列配置建议 */}
              {series === 'PO' && (
                <Alert
                  type="info"
                  showIcon
                  message="Po系列产品配置建议"
                  description={
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      <li>Po系列产品购买后赠送对应的 VIP 等级（Po1 → VIP1）</li>
                      <li>体验产品(TRIAL)不触发返佣，不计入首购</li>
                      <li>Po系列产品通常无购买等级要求</li>
                    </ul>
                  }
                  style={{ marginTop: 16 }}
                />
              )}
              {series === 'VIP' && (
                <Alert
                  type="info"
                  showIcon
                  message="VIP系列产品配置建议"
                  description={
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      <li>VIP系列产品购买后赠送对应的 SVIP 等级（VIP1 → SVIP1）</li>
                      <li>VIP系列产品需要用户达到对应的 VIP 等级才能购买</li>
                      <li>例如：VIP3 产品需要 VIP3 等级</li>
                    </ul>
                  }
                  style={{ marginTop: 16 }}
                />
              )}
            </Card>

            {/* 收益配置 */}
            <Card title="收益配置" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="产品价格"
                    name="price"
                    rules={[{ required: true, message: '请输入产品价格' }]}
                  >
                    <InputNumber
                      min={0}
                      max={99999999.99}
                      precision={2}
                      prefix={config.currencySymbol}
                      style={{ width: '100%' }}
                      placeholder="请输入价格"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="日收益"
                    name="dailyIncome"
                    rules={[{ required: true, message: '请输入日收益' }]}
                  >
                    <InputNumber
                      min={0}
                      max={99999999.99}
                      precision={2}
                      prefix={config.currencySymbol}
                      style={{ width: '100%' }}
                      placeholder="请输入日收益"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="周期天数"
                    name="cycleDays"
                    rules={[{ required: true, message: '请输入周期天数' }]}
                  >
                    <InputNumber
                      min={1}
                      max={9999}
                      precision={0}
                      addonAfter="天"
                      style={{ width: '100%' }}
                      placeholder="请输入周期"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* 快捷周期按钮 */}
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ marginRight: 8 }}>
                  快捷设置：
                </Text>
                <Space>
                  {CYCLE_QUICK_OPTIONS.map((days) => (
                    <Button
                      key={days}
                      size="small"
                      onClick={() => form.setFieldValue('cycleDays', days)}
                    >
                      {days}天
                    </Button>
                  ))}
                </Space>
              </div>

              {/* 收益预览 */}
              <IncomePreview
                price={Number(formValues?.price) || 0}
                dailyIncome={Number(formValues?.dailyIncome) || 0}
                cycleDays={Number(formValues?.cycleDays) || 0}
              />
            </Card>

            {/* 库存与限购配置（统一使用 userPurchaseLimit，留空=不限购） */}
            <Card title="库存与限购配置" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="全局库存"
                    name="globalStock"
                    extra="留空表示不限库存"
                  >
                    <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder="不限" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="用户购买上限"
                    name="userPurchaseLimit"
                    extra="每个用户最多购买份数，留空不限"
                  >
                    <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="不限" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="前端显示限购数"
                    name="displayUserLimit"
                    extra="前端产品详情显示的限购数量，留空不显示"
                  >
                    <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="不显示" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* SVIP配置 */}
            <Card title="SVIP配置" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="SVIP每日奖励"
                    name="svipDailyReward"
                    extra="持有该产品时SVIP每日签到奖励金额，留空不产生奖励"
                  >
                    <InputNumber min={0} precision={2} prefix={config.currencySymbol} style={{ width: '100%' }} placeholder="留空不产生" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="SVIP所需持仓数"
                    name="svipRequireCount"
                    extra="激活SVIP奖励所需的该产品持仓数量，留空为1"
                  >
                    <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="默认1" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* 理财配置 */}
            <Card title="理财配置" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="到期返还本金"
                    name="returnPrincipal"
                    valuePropName="checked"
                    extra="开启后产品到期时将本金返还给用户"
                  >
                    <Switch checkedChildren="返还" unCheckedChildren="不返还" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="产品销售状态"
                    name="productStatus"
                    extra="控制产品在前端的展示和购买状态"
                  >
                    <Select
                      options={PRODUCT_SALE_STATUS_OPTIONS}
                      allowClear
                      placeholder="默认开放"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* 展示配置 */}
            <Card title="展示配置" style={{ marginBottom: 16 }}>
              {/* 产品主图 */}
              <Form.Item
                label="产品主图"
                extra="建议尺寸 750×750px，支持 JPG/PNG/GIF/WEBP，最大 5MB"
              >
                <div style={{ display: 'flex', gap: 16 }}>
                  {mainImageUrl ? (
                    <div style={{ position: 'relative', width: 200, height: 200 }}>
                      <Image
                        src={mainImageUrl}
                        alt="产品主图"
                        width={200}
                        height={200}
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                      />
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<RiDeleteBinLine size={14} />}
                        onClick={handleRemoveMainImage}
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          background: 'rgba(255,255,255,0.9)',
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  ) : (
                    <Upload
                      accept=".jpg,.jpeg,.png,.gif,.webp"
                      showUploadList={false}
                      customRequest={handleMainImageUpload}
                      beforeUpload={(file) => {
                        const isLt5M = file.size / 1024 / 1024 < 5;
                        if (!isLt5M) {
                          message.error('图片大小不能超过 5MB');
                        }
                        return isLt5M;
                      }}
                    >
                      <div
                        style={{
                          width: 200,
                          height: 200,
                          border: '1px dashed #d9d9d9',
                          borderRadius: 8,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          background: '#fafafa',
                        }}
                      >
                        {mainImageUploading ? (
                          <Spin />
                        ) : (
                          <>
                            <RiUpload2Line size={32} style={{ color: '#8c8c8c' }} />
                            <div style={{ marginTop: 8, color: '#8c8c8c' }}>
                              点击上传主图
                            </div>
                          </>
                        )}
                      </div>
                    </Upload>
                  )}
                </div>
              </Form.Item>

              {/* 详情图片 */}
              <Form.Item
                label="详情图片"
                extra="支持多图上传，可拖拽排序，最多10张，建议尺寸 750×auto"
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={detailImageList.map((f) => f.uid)}
                    strategy={rectSortingStrategy}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {detailImageList.map((file) => (
                        <SortableImage
                          key={file.uid}
                          file={file}
                          onRemove={handleRemoveDetailImage}
                        />
                      ))}
                      {detailImageList.length < 10 && (
                        <Upload
                          accept=".jpg,.jpeg,.png,.gif,.webp"
                          showUploadList={false}
                          customRequest={handleDetailImageUpload}
                          beforeUpload={(file) => {
                            const isLt5M = file.size / 1024 / 1024 < 5;
                            if (!isLt5M) {
                              message.error('图片大小不能超过 5MB');
                            }
                            return isLt5M;
                          }}
                        >
                          <div
                            style={{
                              width: 104,
                              height: 104,
                              border: '1px dashed #d9d9d9',
                              borderRadius: 8,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              background: '#fafafa',
                            }}
                          >
                            <RiUpload2Line size={20} style={{ color: '#8c8c8c' }} />
                            <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
                              上传
                            </div>
                          </div>
                        </Upload>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </Form.Item>

              <Divider />

              {/* 产品详情富文本 */}
              <Form.Item
                label="产品详情"
                name="detailContent"
                extra="支持图文混排，图片建议宽度不超过750px"
              >
                <RichTextEditor
                  placeholder="请输入产品详情介绍..."
                  height={200}
                />
              </Form.Item>
            </Card>

            {/* 角标配置 */}
            <Card title="角标配置" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="显示新手推荐角标"
                    name="showRecommendBadge"
                    valuePropName="checked"
                    extra="开启后产品卡片显示推荐角标，文案由下方「自定义角标文案」控制"
                  >
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="自定义角标文案"
                    name="customBadgeText"
                    extra="最多50字符，留空则显示默认文案「Recomendado」，返佣比例从全局配置读取"
                  >
                    <Input placeholder="自定义角标文案" maxLength={50} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* 其他设置 */}
            <Card title="其他设置" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="排序权重"
                    name="sortOrder"
                    extra="数值越大越靠前，用于控制前端展示顺序"
                    rules={[{ required: true, message: '请输入排序权重' }]}
                  >
                    <InputNumber min={0} max={9999} precision={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="产品状态" name="status">
                    <Radio.Group>
                      <Radio.Button value="ACTIVE">上架</Radio.Button>
                      <Radio.Button value="INACTIVE">下架</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Form>
        </Col>

        {/* 右侧预览 */}
        <Col xs={24} lg={8}>
          <div style={{ position: 'sticky', top: 24 }}>
            <Card
              title={
                <Space>
                  <RiFileTextLine size={16} />
                  实时预览
                </Space>
              }
              extra={<ProductStatusBadge status={formValues?.status || 'INACTIVE'} />}
            >
              <MobilePreview formData={formValues || {}} mainImageUrl={mainImageUrl} />
            </Card>
          </div>
        </Col>
      </Row>

      {/* 离开确认弹窗 */}
      <ConfirmModal
        open={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        onConfirm={confirmLeave}
        title="确认离开"
        content="您有未保存的更改，确定要离开吗？"
        type="warning"
        confirmText="确定离开"
        cancelText="继续编辑"
        impacts={['未保存的更改将丢失']}
      />

      {/* 样式 */}
      <style jsx global>{`
        .ql-container {
          min-height: 200px;
          font-size: 14px;
        }
        .ql-editor {
          min-height: 180px;
        }
        .preview-content img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
}
