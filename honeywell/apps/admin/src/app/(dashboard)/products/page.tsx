/**
 * @file 产品列表页
 * @description 后台管理系统产品列表页面，支持Tab筛选、状态筛选、拖拽排序、批量操作
 * @depends 开发文档/04-后台管理端/04.5-产品管理/04.5.1-产品列表页.md
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第7节
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Space,
  Button,
  Typography,
  Tooltip,
  App,
  Switch,
  Tag,
  Tabs,
  Image,
  Empty,
  Row,
  Col,
  Checkbox,
  Badge,
  Spin,
  Input,
  Select,
  InputNumber,
  Form,
} from 'antd';
import {
  RiAddLine,
  RiRefreshLine,
  RiDraggable,
  RiDeleteBinLine,
  RiEditLine,
  RiImageLine,
  RiShoppingCartLine,
  RiVipCrownLine,
  RiVipDiamondLine,
  RiInformationLine,
  RiSearchLine,
  RiFilterLine,
  RiFileCopyLine,
  RiLockLine,
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

import {
  fetchProductList,
  updateProductStatus,
  updateProductSort,
  batchUpdateProductStatus,
  deleteProduct,
} from '@/services/products';
import { AmountDisplay, ProductStatusBadge, CopyButton } from '@/components/common';
import { QuickFilters, ListPageSkeleton } from '@/components/tables';
import { ConfirmModal, BatchResultModal } from '@/components/modals';
import type { FilterOption } from '@/components/tables';
import type { FailedRecord } from '@/components/modals';
import type {
  ProductListItem,
  ProductListParams,
  ProductSeries,
  ProductStatus,
  ProductType,
  BatchOperationResult,
} from '@/types/products';
import { useGlobalConfig } from '@/hooks/useGlobalConfig';

const { Text, Title } = Typography;

/**
 * 产品类型筛选选项
 */
const TYPE_FILTER_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'TRIAL', label: '体验产品' },
  { value: 'PAID', label: '付费产品' },
  { value: 'FINANCIAL', label: '理财产品' },
];

/**
 * 状态筛选选项配置
 */
const STATUS_FILTER_OPTIONS: FilterOption<string>[] = [
  { value: '', label: '全部' },
  { value: 'ACTIVE', label: '上架中' },
  { value: 'INACTIVE', label: '已下架' },
];

/**
 * 可排序产品卡片组件
 */
interface SortableProductCardProps {
  product: ProductListItem;
  selected: boolean;
  onSelect: (id: number, checked: boolean) => void;
  onStatusChange: (id: number, checked: boolean) => void;
  onDelete: (product: ProductListItem) => void;
  onEdit: (id: number) => void;
  statusLoading: number | null;
}

function SortableProductCard({
  product,
  selected,
  onSelect,
  onStatusChange,
  onDelete,
  onEdit,
  statusLoading,
}: SortableProductCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  // 下架产品样式
  const isInactive = product.status === 'INACTIVE';
  // 有活跃持仓的产品不可删除
  const hasActivePositions = (product.activePositionCount ?? 0) > 0;

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        hoverable
        className={`product-card ${isInactive ? 'inactive' : ''}`}
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          filter: isInactive ? 'grayscale(60%)' : 'none',
          opacity: isInactive ? 0.75 : 1,
          border: selected ? '2px solid #1677ff' : '1px solid #f0f0f0',
          transition: 'all 0.3s ease',
        }}
        bodyStyle={{ padding: 0 }}
      >
        {/* 卡片头部 - 选择框和拖拽手柄 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #f0f0f0',
            background: selected ? '#e6f4ff' : '#fafafa',
          }}
        >
          <Checkbox
            checked={selected}
            onChange={(e) => onSelect(product.id, e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
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
            }}
          >
            <RiDraggable size={18} />
          </div>
        </div>

        {/* 产品主图 */}
        <div
          style={{
            position: 'relative',
            height: 160,
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          onClick={() => onEdit(product.id)}
        >
          {product.mainImage ? (
            <Image
              src={product.mainImage}
              alt={product.name}
              width="100%"
              height={160}
              style={{ objectFit: 'cover' }}
              preview={false}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#bfbfbf' }}>
              <RiImageLine size={40} />
              <div style={{ marginTop: 8, fontSize: 12 }}>暂无图片</div>
            </div>
          )}

          {/* 角标 */}
          {product.showRecommendBadge && (
            <Tag
              color="red"
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                margin: 0,
                fontSize: 11,
              }}
            >
              {product.customBadgeText || '新手推荐'}
            </Tag>
          )}

          {/* 产品系列标签 */}
          <Tag
            color={
              product.series === 'VIP' ? 'gold' :
              product.series === 'VIC' ? 'cyan' :
              product.series === 'NWS' ? 'green' :
              product.series === 'QLD' ? 'purple' :
              product.series === 'FINANCIAL' ? 'magenta' : 'blue'
            }
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              margin: 0,
            }}
          >
            {product.series}系列
          </Tag>
        </div>

        {/* 产品信息 */}
        <div
          style={{ padding: 16, cursor: 'pointer' }}
          onClick={() => onEdit(product.id)}
        >
          {/* 产品ID、名称和编码 */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              {/* 产品ID - 点击复制 */}
              <Space size={4}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ID: {product.id}
                </Text>
                <CopyButton
                  text={String(product.id)}
                  size="small"
                  successMessage="产品ID已复制"
                />
              </Space>
              {/* 产品类型标签 */}
              <Tag
                color={product.type === 'PAID' ? 'success' : product.type === 'FINANCIAL' ? 'purple' : 'default'}
                style={{ margin: 0 }}
              >
                {product.type === 'PAID' ? '付费' : product.type === 'FINANCIAL' ? '理财' : '体验'}
              </Tag>
            </div>
            <Text strong style={{ fontSize: 16, display: 'block' }}>
              {product.name}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              编码：{product.code}
            </Text>
          </div>

          {/* 价格和收益 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                价格
              </Text>
              <AmountDisplay value={product.price} size="default" />
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                日收益
              </Text>
              <AmountDisplay value={product.dailyIncome} size="default" highlight />
            </div>
          </div>

          {/* 周期和总收益 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                周期
              </Text>
              <Text>{product.cycleDays} 天</Text>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                总收益
              </Text>
              <AmountDisplay value={product.totalIncome} size="default" highlight />
            </div>
          </div>

          {/* 等级要求、赠送和限购 */}
          <div style={{ marginBottom: 12 }}>
            <Space size={4} wrap>
              {product.svipDailyReward != null && product.svipDailyReward > 0 && (
                <Tag color="gold" icon={<RiVipDiamondLine size={12} />}>
                  SVIP奖励 {product.svipDailyReward}/天
                </Tag>
              )}
              {product.returnPrincipal && (
                <Tag color="cyan">到期返本</Tag>
              )}
              {/* 限购数量（userPurchaseLimit 为 null 表示不限购） */}
              {product.userPurchaseLimit != null ? (
                <Tag color="cyan" icon={<RiLockLine size={12} />}>
                  限购{product.userPurchaseLimit}份
                </Tag>
              ) : (
                <Tag color="default">不限购</Tag>
              )}
            </Space>
          </div>

          {/* 库存和状态 */}
          {(product.globalStock != null || product.productStatus) && (
            <div style={{ marginBottom: 8 }}>
              <Space size={4} wrap>
                {product.globalStock != null && (
                  <Tag color="geekblue">
                    库存 {(product.globalSold ?? 0)}/{product.globalStock}
                  </Tag>
                )}
                {product.productStatus && product.productStatus !== 'OPEN' && (
                  <Tag color={product.productStatus === 'COMING_SOON' ? 'warning' : 'default'}>
                    {product.productStatus === 'COMING_SOON' ? '即将开放' : '已关闭'}
                  </Tag>
                )}
              </Space>
            </div>
          )}

          {/* 销量统计 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: '#8c8c8c',
              fontSize: 12,
            }}
          >
            <RiShoppingCartLine size={14} />
            <span>已售 {product.totalSold} 份</span>
            <span style={{ marginLeft: 8 }}>
              销售额 <AmountDisplay value={product.totalAmount} size="small" />
            </span>
          </div>
        </div>

        {/* 操作栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderTop: '1px solid #f0f0f0',
            background: '#fafafa',
          }}
        >
          {/* 状态开关 */}
          <Space size={8}>
            <Switch
              checked={product.status === 'ACTIVE'}
              checkedChildren="上架"
              unCheckedChildren="下架"
              loading={statusLoading === product.id}
              onChange={(checked) => onStatusChange(product.id, checked)}
              onClick={(_, e) => e.stopPropagation()}
            />
            <ProductStatusBadge status={product.status} />
          </Space>

          {/* 操作按钮 */}
          <Space size={4}>
            <Tooltip title="编辑">
              <Button
                type="text"
                size="small"
                icon={<RiEditLine size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(product.id);
                }}
              />
            </Tooltip>
            <Tooltip title={hasActivePositions ? '存在活跃持仓，无法删除' : '删除'}>
              <Button
                type="text"
                size="small"
                danger
                disabled={hasActivePositions}
                icon={<RiDeleteBinLine size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!hasActivePositions) {
                    onDelete(product);
                  }
                }}
              />
            </Tooltip>
          </Space>
        </div>
      </Card>
    </div>
  );
}

/**
 * 拖拽覆盖层卡片
 */
function DragOverlayCard({ product }: { product: ProductListItem }) {
  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        border: '2px solid #1677ff',
        width: 280,
      }}
      bodyStyle={{ padding: 16 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {product.mainImage ? (
          <Image
            src={product.mainImage}
            alt={product.name}
            width={60}
            height={60}
            style={{ objectFit: 'cover', borderRadius: 8 }}
            preview={false}
          />
        ) : (
          <div
            style={{
              width: 60,
              height: 60,
              background: '#f5f5f5',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RiImageLine size={24} style={{ color: '#bfbfbf' }} />
          </div>
        )}
        <div>
          <Text strong>{product.name}</Text>
          <div>
            <AmountDisplay value={product.price} size="small" />
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * 产品列表页面
 * @description 依据：04.5.1-产品列表页.md
 */
export default function ProductListPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const config = useGlobalConfig();

  // 首次加载状态
  const [initialLoading, setInitialLoading] = useState(true);
  // 数据加载状态
  const [loading, setLoading] = useState(false);
  // 产品列表数据
  const [products, setProducts] = useState<ProductListItem[]>([]);
  // 当前 Tab（系列筛选）
  const [activeSeries, setActiveSeries] = useState<'ALL' | ProductSeries>('ALL');
  // 状态筛选
  const [statusFilter, setStatusFilter] = useState<string>('');
  // 选中的产品ID
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // 搜索筛选条件
  const [searchName, setSearchName] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  // 状态切换中的产品ID
  const [statusLoading, setStatusLoading] = useState<number | null>(null);
  // 拖拽中的产品ID
  const [activeId, setActiveId] = useState<number | null>(null);
  // 排序保存中
  const [sortSaving, setSortSaving] = useState(false);

  // 删除确认弹窗
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 批量操作结果弹窗
  const [batchResultOpen, setBatchResultOpen] = useState(false);
  const [batchResult, setBatchResult] = useState<{
    operationName: string;
    total: number;
    successCount: number;
    failedCount: number;
    failedRecords: FailedRecord[];
  } | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  // 配置拖拽传感器
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

  /**
   * 加载产品列表
   */
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: ProductListParams = {
        series: activeSeries === 'ALL' ? undefined : activeSeries,
        status: statusFilter ? (statusFilter as ProductStatus) : undefined,
        name: searchName || undefined,
        type: typeFilter ? (typeFilter as ProductType) : undefined,
        priceMin: priceMin ?? undefined,
        priceMax: priceMax ?? undefined,
      };
      const response = await fetchProductList(params);
      setProducts(response.list);
    } catch (error) {
      console.error('加载产品列表失败:', error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [activeSeries, statusFilter, searchName, typeFilter, priceMin, priceMax]);

  /**
   * 执行搜索
   */
  const handleSearch = useCallback(() => {
    loadProducts();
  }, [loadProducts]);

  /**
   * 重置筛选条件
   */
  const handleReset = useCallback(() => {
    setSearchName('');
    setTypeFilter('');
    setPriceMin(null);
    setPriceMax(null);
    setStatusFilter('');
    setActiveSeries('ALL');
  }, []);

  // 初始化加载
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  /**
   * 筛选后的产品列表
   * @description 由于 API 已支持筛选，这里直接使用返回的列表
   * 前端只做本地筛选作为补充（当前页面内快速筛选）
   */
  const filteredProducts = useMemo(() => {
    return products;
  }, [products]);

  /**
   * 统计各系列产品数量
   * @description 显示当前筛选结果中各系列的数量
   */
  const seriesCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: 0, PO: 0, VIP: 0, VIC: 0, NWS: 0, QLD: 0, FINANCIAL: 0 };
    products.forEach((p) => {
      counts.ALL++;
      if (counts[p.series] !== undefined) counts[p.series]++;
    });
    return counts;
  }, [products]);

  /**
   * 统计各状态产品数量
   * @description 显示当前筛选结果中各状态的数量
   */
  const statusCounts = useMemo(() => {
    const counts = { ALL: 0, ACTIVE: 0, INACTIVE: 0 };
    products.forEach((p) => {
      counts.ALL++;
      if (p.status === 'ACTIVE') counts.ACTIVE++;
      if (p.status === 'INACTIVE') counts.INACTIVE++;
    });
    return counts;
  }, [products]);

  /**
   * 处理状态切换
   */
  const handleStatusChange = useCallback(
    async (productId: number, checked: boolean) => {
      setStatusLoading(productId);
      try {
        await updateProductStatus(productId, {
          status: checked ? 'ACTIVE' : 'INACTIVE',
        });
        message.success(checked ? '产品已上架' : '产品已下架');
        // 更新本地状态
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? { ...p, status: checked ? 'ACTIVE' : 'INACTIVE' }
              : p
          )
        );
      } catch (error) {
        console.error('状态切换失败:', error);
      } finally {
        setStatusLoading(null);
      }
    },
    [message]
  );

  /**
   * 处理选择
   */
  const handleSelect = useCallback((id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id)
    );
  }, []);

  /**
   * 全选/取消全选
   */
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedIds(checked ? filteredProducts.map((p) => p.id) : []);
    },
    [filteredProducts]
  );

  /**
   * 处理删除
   */
  const handleDelete = useCallback((product: ProductListItem) => {
    setDeleteTarget(product);
    setDeleteModalOpen(true);
  }, []);

  /**
   * 确认删除
   */
  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    try {
      await deleteProduct(deleteTarget.id);
      message.success('产品删除成功');
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      // 从列表中移除
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
    } catch (error) {
      console.error('删除失败:', error);
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget, message]);

  /**
   * 批量上架
   */
  const handleBatchOnline = useCallback(async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择产品');
      return;
    }

    setBatchLoading(true);
    try {
      const result = await batchUpdateProductStatus({
        ids: selectedIds,
        status: 'ACTIVE',
      });

      // 更新本地状态
      setProducts((prev) =>
        prev.map((p) =>
          selectedIds.includes(p.id) &&
          result.results.find((r) => r.id === p.id)?.success
            ? { ...p, status: 'ACTIVE' }
            : p
        )
      );

      // 显示结果
      const failedRecords: FailedRecord[] = result.results
        .filter((r) => !r.success)
        .map((r) => {
          const product = products.find((p) => p.id === r.id);
          return {
            id: r.id,
            name: product?.name || `产品 #${r.id}`,
            reason: r.error?.message || '未知错误',
          };
        });

      setBatchResult({
        operationName: '批量上架',
        total: result.total,
        successCount: result.succeeded,
        failedCount: result.failed,
        failedRecords,
      });
      setBatchResultOpen(true);
      setSelectedIds([]);
    } catch (error) {
      console.error('批量上架失败:', error);
    } finally {
      setBatchLoading(false);
    }
  }, [selectedIds, products, message]);

  /**
   * 批量下架
   */
  const handleBatchOffline = useCallback(async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择产品');
      return;
    }

    setBatchLoading(true);
    try {
      const result = await batchUpdateProductStatus({
        ids: selectedIds,
        status: 'INACTIVE',
      });

      // 更新本地状态
      setProducts((prev) =>
        prev.map((p) =>
          selectedIds.includes(p.id) &&
          result.results.find((r) => r.id === p.id)?.success
            ? { ...p, status: 'INACTIVE' }
            : p
        )
      );

      // 显示结果
      const failedRecords: FailedRecord[] = result.results
        .filter((r) => !r.success)
        .map((r) => {
          const product = products.find((p) => p.id === r.id);
          return {
            id: r.id,
            name: product?.name || `产品 #${r.id}`,
            reason: r.error?.message || '未知错误',
          };
        });

      setBatchResult({
        operationName: '批量下架',
        total: result.total,
        successCount: result.succeeded,
        failedCount: result.failed,
        failedRecords,
      });
      setBatchResultOpen(true);
      setSelectedIds([]);
    } catch (error) {
      console.error('批量下架失败:', error);
    } finally {
      setBatchLoading(false);
    }
  }, [selectedIds, products, message]);

  /**
   * 拖拽开始
   */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(Number(event.active.id));
  }, []);

  /**
   * 拖拽结束
   */
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (over && active.id !== over.id) {
        const oldIndex = filteredProducts.findIndex((p) => p.id === active.id);
        const newIndex = filteredProducts.findIndex((p) => p.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          // 乐观更新本地状态
          const newFilteredProducts = arrayMove(filteredProducts, oldIndex, newIndex);

          // 更新完整列表
          const newProducts = [...products];
          const filteredIds = newFilteredProducts.map((p) => p.id);

          // 重新排序
          let filteredIndex = 0;
          newProducts.forEach((p, i) => {
            const idx = filteredIds.indexOf(p.id);
            if (idx !== -1) {
              newProducts[i] = newFilteredProducts[filteredIndex++];
            }
          });

          setProducts(newProducts);

          // 调用排序 API
          setSortSaving(true);
          try {
            await updateProductSort({
              ids: newFilteredProducts.map((p) => p.id),
            });
            message.success('排序已保存');
          } catch (error) {
            // 排序失败，回滚
            message.error('排序保存失败');
            loadProducts();
          } finally {
            setSortSaving(false);
          }
        }
      }
    },
    [filteredProducts, products, message, loadProducts]
  );

  /**
   * 获取当前拖拽的产品
   */
  const activeProduct = activeId
    ? products.find((p) => p.id === activeId)
    : null;

  // 首次加载显示骨架屏
  if (initialLoading) {
    return <ListPageSkeleton />;
  }

  return (
    <div style={{ padding: 24 }}>
      {/* 页面头部 */}
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
            产品列表
          </Title>
          <Text type="secondary">管理平台所有产品，支持拖拽排序</Text>
        </div>
        <Space>
          <Button
            icon={<RiRefreshLine size={16} />}
            onClick={loadProducts}
            loading={loading}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<RiAddLine size={16} />}
            onClick={() => router.push('/products/create')}
          >
            新增产品
          </Button>
        </Space>
      </div>

      {/* 搜索筛选区 */}
      <Card
        size="small"
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          {/* 产品名称/编码搜索 */}
          <div style={{ minWidth: 200 }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              产品名称/编码
            </Text>
            <Input
              placeholder="搜索名称或编码"
              prefix={<RiSearchLine size={16} style={{ color: '#bfbfbf' }} />}
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
              style={{ width: 200 }}
            />
          </div>

          {/* 产品类型 */}
          <div style={{ minWidth: 140 }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              产品类型
            </Text>
            <Select
              placeholder="全部类型"
              value={typeFilter || undefined}
              onChange={(v) => setTypeFilter(v || '')}
              options={TYPE_FILTER_OPTIONS}
              allowClear
              style={{ width: 140 }}
            />
          </div>

          {/* 价格范围 */}
          <div style={{ minWidth: 220 }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              价格范围
            </Text>
            <Space.Compact>
              <InputNumber
                placeholder="最低价"
                value={priceMin}
                onChange={(v) => setPriceMin(v)}
                min={0}
                style={{ width: 100 }}
                prefix={config.currencySymbol}
              />
              <Input
                style={{ width: 32, pointerEvents: 'none', backgroundColor: '#fafafa' }}
                placeholder="~"
                disabled
              />
              <InputNumber
                placeholder="最高价"
                value={priceMax}
                onChange={(v) => setPriceMax(v)}
                min={0}
                style={{ width: 100 }}
                prefix={config.currencySymbol}
              />
            </Space.Compact>
          </div>

          {/* 操作按钮 */}
          <Space>
            <Button onClick={handleReset}>
              重置
            </Button>
            <Button type="primary" icon={<RiFilterLine size={16} />} onClick={handleSearch}>
              查询
            </Button>
          </Space>
        </div>
      </Card>

      {/* Tab 筛选（系列） */}
      <Tabs
        activeKey={activeSeries}
        onChange={(key) => {
          setActiveSeries(key as 'ALL' | ProductSeries);
          setSelectedIds([]);
          // 切换Tab时触发重新加载
        }}
        items={[
          { key: 'ALL', label: '全部' },
          { key: 'PO', label: 'Po系列' },
          { key: 'VIP', label: 'VIP系列' },
          { key: 'VIC', label: 'VIC系列' },
          { key: 'NWS', label: 'NWS系列' },
          { key: 'QLD', label: 'QLD系列' },
          { key: 'FINANCIAL', label: '理财系列' },
        ].map((item) => ({
          key: item.key,
          label: (
            <span>
              {item.label}
              <Badge
                count={seriesCounts[item.key] || 0}
                style={{
                  marginLeft: 8,
                  backgroundColor: activeSeries === item.key ? '#1677ff' : '#d9d9d9',
                }}
              />
            </span>
          ),
        }))}
        style={{ marginBottom: 16 }}
      />

      {/* 状态筛选和批量操作 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <QuickFilters
          options={STATUS_FILTER_OPTIONS.map((opt) => ({
            ...opt,
            count:
              opt.value === ''
                ? statusCounts.ALL
                : opt.value === 'ACTIVE'
                  ? statusCounts.ACTIVE
                  : statusCounts.INACTIVE,
          }))}
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter((v as string) || '');
            setSelectedIds([]);
          }}
          allowClear={false}
        />

        {/* 批量操作 */}
        <Space>
          {selectedIds.length > 0 && (
            <>
              <Text type="secondary">
                已选择 {selectedIds.length} 项
              </Text>
              <Button size="small" onClick={() => setSelectedIds([])}>
                清空
              </Button>
              <Button
                size="small"
                type="primary"
                loading={batchLoading}
                onClick={handleBatchOnline}
              >
                批量上架
              </Button>
              <Button
                size="small"
                loading={batchLoading}
                onClick={handleBatchOffline}
              >
                批量下架
              </Button>
            </>
          )}
          {selectedIds.length === 0 && filteredProducts.length > 0 && (
            <Button
              size="small"
              onClick={() => handleSelectAll(true)}
            >
              全选
            </Button>
          )}
        </Space>
      </div>

      {/* 排序提示 */}
      {sortSaving && (
        <div
          style={{
            padding: '8px 16px',
            background: '#e6f4ff',
            borderRadius: 8,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Spin size="small" />
          <Text type="secondary">正在保存排序...</Text>
        </div>
      )}

      {/* 拖拽提示 */}
      {!sortSaving && filteredProducts.length > 1 && (
        <div
          style={{
            padding: '8px 16px',
            background: '#fffbe6',
            borderRadius: 8,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <RiInformationLine size={16} style={{ color: '#faad14' }} />
          <Text type="secondary">
            支持拖拽调整产品排序，拖拽后自动保存
          </Text>
        </div>
      )}

      {/* 产品卡片网格 */}
      {filteredProducts.length > 0 ? (
        <Spin spinning={loading}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredProducts.map((p) => p.id)}
              strategy={rectSortingStrategy}
            >
              <Row gutter={[16, 16]}>
                {filteredProducts.map((product) => (
                  <Col key={product.id} xs={24} sm={12} md={8} lg={6}>
                    <SortableProductCard
                      product={product}
                      selected={selectedIds.includes(product.id)}
                      onSelect={handleSelect}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      onEdit={(id) => router.push(`/products/${id}/edit`)}
                      statusLoading={statusLoading}
                    />
                  </Col>
                ))}
              </Row>
            </SortableContext>

            {/* 拖拽覆盖层 */}
            <DragOverlay>
              {activeProduct && <DragOverlayCard product={activeProduct} />}
            </DragOverlay>
          </DndContext>
        </Spin>
      ) : (
        <Empty
          description={
            statusFilter || activeSeries !== 'ALL'
              ? '没有符合条件的产品'
              : '暂无产品'
          }
          style={{ padding: '60px 0' }}
        >
          <Button
            type="primary"
            icon={<RiAddLine size={16} />}
            onClick={() => router.push('/products/create')}
          >
            新增产品
          </Button>
        </Empty>
      )}

      {/* 业务规则提示 */}
      <Card
        size="small"
        style={{ marginTop: 24, background: '#fafafa' }}
        bodyStyle={{ padding: 16 }}
      >
        <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
          产品配置说明
        </Title>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#595959' }}>
          <li>体验产品(TRIAL)：用户首购不触发上级返佣</li>
          <li>付费产品(PAID)：用户首购会触发三级返佣（12%/3%/1%，比例以全局配置为准）</li>
          <li>总收益 = 日收益 × 周期天数（系统自动计算）</li>
          <li>赠送VIP等级：用户购买后自动获得对应VIP等级</li>
          <li>要求VIP等级：用户需达到该VIP等级才能购买</li>
          <li>限购数量：每用户可购买的最大次数</li>
        </ul>
      </Card>

      {/* 删除确认弹窗 */}
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="确认删除产品"
        content={`确定要删除产品「${deleteTarget?.name}」吗？`}
        danger
        loading={deleteLoading}
        confirmText="确定删除"
        impacts={[
          '产品将从列表中移除',
          '已购买的用户持仓不受影响',
          '历史订单数据保留',
        ]}
      />

      {/* 批量操作结果弹窗 */}
      {batchResult && (
        <BatchResultModal
          open={batchResultOpen}
          onClose={() => {
            setBatchResultOpen(false);
            setBatchResult(null);
          }}
          onRefresh={loadProducts}
          operationName={batchResult.operationName}
          total={batchResult.total}
          successCount={batchResult.successCount}
          failedCount={batchResult.failedCount}
          failedRecords={batchResult.failedRecords}
        />
      )}

      {/* 样式 */}
      <style jsx global>{`
        .product-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .product-card.inactive {
          background: #f5f5f5;
        }
      `}</style>
    </div>
  );
}
