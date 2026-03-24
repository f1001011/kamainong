/**
 * @file 银行列表管理页
 * @description 银行CRUD、拖拽排序、批量操作
 * @depends 开发文档/04-后台管理端/04.9-系统设置/04.9.3-银行列表管理页.md
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Button,
  Space,
  Switch,
  Table,
  Form,
  Input,
  InputNumber,
  Modal,
  Tooltip,
  Tag,
  message,
  Empty,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiDraggable,
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiSearchLine,
  RiFilterLine,
  RiLoader4Line,
} from '@remixicon/react';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { BatchResultModal, FailedRecord } from '@/components/modals/BatchResultModal';
import { TimeDisplay } from '@/components/common/TimeDisplay';
import { showSuccess } from '@/utils/messageHolder';

import {
  fetchBankList,
  createBank,
  updateBank,
  deleteBank,
  updateBankStatus,
  batchUpdateBankStatus,
  updateBankSort,
  checkBankCode,
} from '@/services/banks';

import type { Bank, CreateBankRequest, UpdateBankRequest } from '@/types/banks';

// ============================================================================
// 类型定义
// ============================================================================

/** 表单数据类型 */
interface BankFormValues {
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

/** 筛选状态 */
interface FilterState {
  keyword: string;
  isActive: boolean | undefined;
}

// ============================================================================
// 可排序表格行组件
// ============================================================================

interface SortableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': number;
}

/**
 * 可排序表格行
 * @description 使用 dnd-kit 实现表格行拖拽
 */
function SortableRow({ children, ...props }: SortableRowProps) {
  const id = props['data-row-key'];
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
  };

  return (
    <tr {...props} ref={setNodeRef} style={style} {...attributes}>
      {React.Children.map(children, (child) => {
        if ((child as React.ReactElement)?.key === 'drag-handle') {
          // 拖拽手柄渲染
          const dragHandle = (
            <div
              ref={setActivatorNodeRef}
              style={{
                touchAction: 'none',
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              {...listeners}
            >
              <RiDraggable size={18} style={{ color: '#8c8c8c' }} />
            </div>
          );
          return React.cloneElement(
            child as React.ReactElement<{ children?: React.ReactNode }>,
            { children: dragHandle }
          );
        }
        return child;
      })}
    </tr>
  );
}

// ============================================================================
// 主页面组件
// ============================================================================

/**
 * 银行列表管理页
 * @description 管理系统支持的收款银行
 */
export default function BankListPage() {
  // ============================================================================
  // 状态定义
  // ============================================================================

  // 列表数据
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // 筛选状态
  const [filters, setFilters] = useState<FilterState>({
    keyword: '',
    isActive: undefined,
  });

  // 选中状态（批量操作）
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  // 弹窗状态
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // 删除确认弹窗
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingBank, setDeletingBank] = useState<Bank | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 批量操作结果弹窗
  const [batchResultVisible, setBatchResultVisible] = useState(false);
  const [batchResult, setBatchResult] = useState({
    operationName: '',
    total: 0,
    successCount: 0,
    failedCount: 0,
    failedRecords: [] as FailedRecord[],
  });

  // 编码唯一性校验
  const [codeChecking, setCodeChecking] = useState(false);
  const [codeExists, setCodeExists] = useState(false);

  // 表单引用
  const [form] = Form.useForm<BankFormValues>();

  // ============================================================================
  // 拖拽排序配置
  // ============================================================================

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

  // ============================================================================
  // 数据加载
  // ============================================================================

  /**
   * 加载银行列表
   */
  const loadBanks = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchBankList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        keyword: filters.keyword || undefined,
        isActive: filters.isActive,
      });

      setBanks(result.list);
      setPagination((prev) => ({
        ...prev,
        total: result.pagination.total,
      }));
    } catch (error) {
      console.error('加载银行列表失败:', error);
      message.error('加载银行列表失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters]);

  // 初始加载
  useEffect(() => {
    loadBanks();
  }, [loadBanks]);

  // ============================================================================
  // 事件处理
  // ============================================================================

  /**
   * 搜索处理
   * 当已在第1页时，filters 虽已通过 onChange 更新并自动加载，
   * 但用户点击"查询"期望显式触发刷新，故需直接调用 loadBanks
   */
  const handleSearch = useCallback(() => {
    if (pagination.current === 1) {
      loadBanks();
    } else {
      setPagination((prev) => ({ ...prev, current: 1 }));
    }
  }, [pagination.current, loadBanks]);

  /**
   * 重置筛选
   */
  const handleReset = () => {
    setFilters({ keyword: '', isActive: undefined });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  /**
   * 打开新增弹窗
   */
  const handleAdd = () => {
    setEditingBank(null);
    setCodeExists(false);
    form.resetFields();
    form.setFieldsValue({
      code: '',
      name: '',
      sortOrder: 0,
      isActive: true,
    });
    setFormModalVisible(true);
  };

  /**
   * 打开编辑弹窗
   */
  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setCodeExists(false);
    form.setFieldsValue({
      code: bank.code,
      name: bank.name,
      sortOrder: bank.sortOrder,
      isActive: bank.isActive,
    });
    setFormModalVisible(true);
  };

  /**
   * 打开删除确认弹窗
   */
  const handleDelete = (bank: Bank) => {
    setDeletingBank(bank);
    setDeleteModalVisible(true);
  };

  /**
   * 确认删除
   */
  const handleConfirmDelete = async () => {
    if (!deletingBank) return;

    setDeleteLoading(true);
    try {
      await deleteBank(deletingBank.id);
      showSuccess('删除银行成功');
      setDeleteModalVisible(false);
      setDeletingBank(null);
      loadBanks();
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : '删除失败';
      message.error(errMsg);
    } finally {
      setDeleteLoading(false);
    }
  };

  /**
   * 切换银行状态
   */
  const handleStatusChange = async (bank: Bank, checked: boolean) => {
    try {
      await updateBankStatus(bank.id, checked);
      showSuccess(checked ? '银行已启用' : '银行已禁用');
      // 更新本地状态
      setBanks((prev) =>
        prev.map((b) => (b.id === bank.id ? { ...b, isActive: checked } : b))
      );
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  /**
   * 批量启用/禁用
   */
  const handleBatchStatus = async (isActive: boolean) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的银行');
      return;
    }

    Modal.confirm({
      title: `确认批量${isActive ? '启用' : '禁用'}？`,
      content: `将${isActive ? '启用' : '禁用'}选中的 ${selectedRowKeys.length} 个银行`,
      onOk: async () => {
        try {
          const result = await batchUpdateBankStatus(selectedRowKeys, isActive);
          
          // 显示批量操作结果
          setBatchResult({
            operationName: isActive ? '批量启用' : '批量禁用',
            total: result.total,
            successCount: result.succeeded,
            failedCount: result.failed,
            failedRecords: result.results
              .filter((r) => !r.success)
              .map((r) => ({
                id: r.id,
                name: banks.find((b) => b.id === r.id)?.name,
                reason: r.message || '操作失败',
              })),
          });
          setBatchResultVisible(true);
          
          // 清空选中
          setSelectedRowKeys([]);
          // 刷新列表
          loadBanks();
        } catch (error) {
          message.error('批量操作失败');
        }
      },
    });
  };

  /**
   * 表单提交
   * @description 依据：04.9.3-银行列表管理页.md 第6.5节
   */
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 新增时再次检查编码唯一性（防止并发）
      if (!editingBank) {
        if (codeExists) {
          message.error('银行编码已存在');
          return;
        }
        // 等待任何正在进行的检查完成
        if (codeChecking) {
          message.warning('正在校验编码，请稍候');
          return;
        }
        // 最终确认校验
        const checkResult = await checkBankCode(values.code.toUpperCase());
        if (checkResult.exists) {
          setCodeExists(true);
          message.error('银行编码已存在');
          return;
        }
      }

      setFormLoading(true);

      if (editingBank) {
        // 编辑模式：不提交 code 字段
        const updateData: UpdateBankRequest = {
          name: values.name,
          sortOrder: values.sortOrder,
          isActive: values.isActive,
        };
        await updateBank(editingBank.id, updateData);
        showSuccess('银行更新成功');
      } else {
        // 新增模式
        const createData: CreateBankRequest = {
          code: values.code.toUpperCase(),
          name: values.name,
          sortOrder: values.sortOrder,
          isActive: values.isActive,
        };
        await createBank(createData);
        showSuccess('银行添加成功');
      }

      setFormModalVisible(false);
      loadBanks();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        // 表单校验错误，不处理
        return;
      }
      const errMsg = error instanceof Error ? error.message : '操作失败';
      message.error(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  // 防抖定时器引用
  const codeCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 编码唯一性校验（防抖处理）
   * @description 依据：04.9.3-银行列表管理页.md 第6.4节
   */
  const performCodeCheck = useCallback(async (code: string) => {
    if (!code || code.length < 2) {
      setCodeExists(false);
      setCodeChecking(false);
      return;
    }

    try {
      const result = await checkBankCode(code.toUpperCase());
      setCodeExists(result.exists);
    } catch (error) {
      // 忽略检查错误
      setCodeExists(false);
    } finally {
      setCodeChecking(false);
    }
  }, []);

  /**
   * 编码输入变化处理（带防抖）
   */
  const handleCodeChange = useCallback((code: string) => {
    // 编辑模式下不进行唯一性校验
    if (editingBank) return;

    // 清除之前的定时器
    if (codeCheckTimerRef.current) {
      clearTimeout(codeCheckTimerRef.current);
    }

    if (code && code.length >= 2) {
      setCodeChecking(true);
      // 设置新的防抖定时器
      codeCheckTimerRef.current = setTimeout(() => {
        performCodeCheck(code);
      }, 500);
    } else {
      setCodeExists(false);
      setCodeChecking(false);
    }
  }, [editingBank, performCodeCheck]);

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (codeCheckTimerRef.current) {
        clearTimeout(codeCheckTimerRef.current);
      }
    };
  }, []);

  /**
   * 拖拽排序结束处理
   */
  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const oldIndex = banks.findIndex((b) => b.id === active.id);
    const newIndex = banks.findIndex((b) => b.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // 更新本地状态
    const newBanks = arrayMove(banks, oldIndex, newIndex);
    setBanks(newBanks);

    // 计算新的排序值（索引越小排序值越大）
    const sortUpdates = newBanks.map((bank, index) => ({
      id: bank.id,
      sortOrder: newBanks.length - index,
    }));

    try {
      await updateBankSort(sortUpdates);
      showSuccess('排序已保存');
    } catch (error) {
      message.error('排序保存失败');
      // 恢复原状态
      loadBanks();
    }
  };

  // ============================================================================
  // 表格列配置
  // ============================================================================

  const columns: TableColumnsType<Bank> = [
    {
      key: 'drag-handle',
      width: 30,
      align: 'center',
      render: () => null, // 由 SortableRow 处理
    },
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      align: 'center',
    },
    {
      title: '银行编码',
      dataIndex: 'code',
      width: 100,
      render: (code: string) => (
        <Tag color="blue" style={{ fontFamily: 'monospace' }}>
          {code}
        </Tag>
      ),
    },
    {
      title: '银行名称',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: '绑卡数量',
      dataIndex: 'bankCardCount',
      width: 80,
      align: 'center',
      responsive: ['md'], // >= 768px 显示
      render: (count: number | undefined) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {count ?? 0}
        </span>
      ),
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      width: 80,
      align: 'center',
      responsive: ['xl'], // >= 1200px 显示
      render: (sortOrder: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', color: '#8c8c8c' }}>
          {sortOrder}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 80,
      align: 'center',
      render: (isActive: boolean, record: Bank) => (
        <Switch
          checked={isActive}
          checkedChildren="启用"
          unCheckedChildren="禁用"
          onChange={(checked) => handleStatusChange(record, checked)}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 150,
      responsive: ['xl'], // >= 1200px 显示
      render: (createdAt: string) => <TimeDisplay value={createdAt} />,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_: unknown, record: Bank) => {
        const hasCards = (record.bankCardCount ?? 0) > 0;
        
        return (
          <Space size={8}>
            <Tooltip title="编辑">
              <Button
                type="text"
                size="small"
                icon={<RiEditLine size={16} />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
            <Tooltip
              title={
                hasCards
                  ? `有关联银行卡，不可删除`
                  : '删除'
              }
            >
              <Button
                type="text"
                size="small"
                danger
                disabled={hasCards}
                icon={<RiDeleteBinLine size={16} />}
                onClick={() => handleDelete(record)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  // ============================================================================
  // 渲染
  // ============================================================================

  return (
    <PageContainer
      header={{
        title: '银行列表管理',
      }}
      content="管理系统支持的收款银行，控制用户绑卡时可选择的银行范围"
      extra={[
        <Button
          key="add"
          type="primary"
          icon={<RiAddLine size={16} />}
          onClick={handleAdd}
        >
          添加银行
        </Button>,
      ]}
    >
      {/* 搜索栏 */}
      <div
        style={{
          background: '#fff',
          padding: 20,
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <Space wrap>
          <Input
            placeholder="银行名称/编码"
            prefix={<RiSearchLine size={16} style={{ color: '#bfbfbf' }} />}
            value={filters.keyword}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, keyword: e.target.value }))
            }
            onPressEnter={handleSearch}
            style={{ width: 200 }}
            allowClear
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RiFilterLine size={16} style={{ color: '#8c8c8c' }} />
            <span style={{ color: '#8c8c8c', fontSize: 13 }}>状态：</span>
            <Button.Group>
              <Button
                type={filters.isActive === undefined ? 'primary' : 'default'}
                size="small"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, isActive: undefined }))
                }
              >
                全部
              </Button>
              <Button
                type={filters.isActive === true ? 'primary' : 'default'}
                size="small"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, isActive: true }))
                }
              >
                启用
              </Button>
              <Button
                type={filters.isActive === false ? 'primary' : 'default'}
                size="small"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, isActive: false }))
                }
              >
                禁用
              </Button>
            </Button.Group>
          </div>
          <Button onClick={handleSearch}>查询</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </div>

      {/* 批量操作栏 */}
      {selectedRowKeys.length > 0 && (
        <div
          style={{
            background: '#e6f4ff',
            padding: '12px 20px',
            borderRadius: 8,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Space>
            <span>
              已选 <strong>{selectedRowKeys.length}</strong> 项
            </span>
            <Button type="link" size="small" onClick={() => setSelectedRowKeys([])}>
              取消选择
            </Button>
          </Space>
          <Space>
            <Button
              type="link"
              size="small"
              icon={<RiCheckboxCircleFill size={14} />}
              onClick={() => handleBatchStatus(true)}
            >
              批量启用
            </Button>
            <Button
              type="link"
              size="small"
              danger
              icon={<RiCloseCircleFill size={14} />}
              onClick={() => handleBatchStatus(false)}
            >
              批量禁用
            </Button>
          </Space>
        </div>
      )}

      {/* 银行列表表格 */}
      <div style={{ background: '#fff', borderRadius: 8 }}>
        <DndContext
          sensors={sensors}
          modifiers={[restrictToVerticalAxis]}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={banks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <Table<Bank>
              rowKey="id"
              columns={columns}
              dataSource={banks}
              loading={loading}
              rowSelection={{
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys as number[]),
                selections: [
                  Table.SELECTION_ALL,
                  Table.SELECTION_INVERT,
                ],
              }}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
                onChange: (page, pageSize) => {
                  setPagination((prev) => ({
                    ...prev,
                    current: page,
                    pageSize,
                  }));
                },
              }}
              components={{
                body: {
                  row: SortableRow,
                },
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      filters.keyword || filters.isActive !== undefined
                        ? '暂无符合条件的银行，请调整筛选条件'
                        : '暂无银行，点击右上角按钮添加银行'
                    }
                  />
                ),
              }}
            />
          </SortableContext>
        </DndContext>
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingBank ? '编辑银行' : '添加银行'}
        open={formModalVisible}
        onOk={handleFormSubmit}
        onCancel={() => setFormModalVisible(false)}
        confirmLoading={formLoading}
        destroyOnHidden
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="code"
            label="银行编码"
            rules={[
              { required: true, message: '请输入银行编码' },
              {
                pattern: /^[A-Z0-9]{2,20}$/i,
                message: '编码只能包含字母和数字，2-20位',
              },
              // 异步唯一性校验
              {
                validator: async (_, value) => {
                  if (!value || editingBank) return Promise.resolve();
                  if (codeExists) {
                    return Promise.reject(new Error('该银行编码已存在'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
            extra={
              editingBank ? (
                <span style={{ color: '#faad14' }}>银行编码不可修改</span>
              ) : (
                <span>银行唯一标识，用于对接支付通道，创建后不可修改</span>
              )
            }
            validateStatus={codeExists ? 'error' : codeChecking ? 'validating' : undefined}
            help={codeExists ? '该银行编码已存在' : undefined}
            hasFeedback={codeChecking}
          >
            <Input
              placeholder="如 MAD001"
              maxLength={20}
              disabled={!!editingBank}
              style={{ textTransform: 'uppercase' }}
              onChange={(e) => handleCodeChange(e.target.value)}
              suffix={
                codeChecking ? (
                  <RiLoader4Line size={14} className="animate-spin" style={{ color: '#1677ff' }} />
                ) : null
              }
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="银行名称"
            rules={[
              { required: true, message: '请输入银行名称' },
              { max: 100, message: '银行名称不能超过100个字符' },
            ]}
            extra="用户端显示的银行名称"
          >
            <Input
              placeholder="如 Attijariwafa Bank"
              maxLength={100}
            />
          </Form.Item>

          <Form.Item
            name="sortOrder"
            label="排序权重"
            extra="数字越大越靠前显示"
          >
            <InputNumber
              min={0}
              max={9999}
              precision={0}
              placeholder="0"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="状态"
            valuePropName="checked"
            extra="关闭后用户无法选择该银行绑卡"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

        </Form>
      </Modal>

      {/* 删除确认弹窗 */}
      <ConfirmModal
        open={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setDeletingBank(null);
        }}
        onConfirm={handleConfirmDelete}
        title="确认删除银行"
        content={`确定要删除银行「${deletingBank?.name}」吗？此操作不可恢复。`}
        danger
        confirmText="删除"
        loading={deleteLoading}
      />

      {/* 批量操作结果弹窗 */}
      <BatchResultModal
        open={batchResultVisible}
        onClose={() => setBatchResultVisible(false)}
        onRefresh={loadBanks}
        operationName={batchResult.operationName}
        total={batchResult.total}
        successCount={batchResult.successCount}
        failedCount={batchResult.failedCount}
        failedRecords={batchResult.failedRecords}
      />
    </PageContainer>
  );
}
