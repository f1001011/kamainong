/**
 * @file 账户锁定管理页
 * @description 银行账户-手机号锁定记录管理，支持查看、解锁/重锁、删除
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Button,
  Space,
  Switch,
  Table,
  Input,
  Modal,
  Tag,
  message,
  Empty,
  Tooltip,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import {
  RiSearchLine,
  RiFilterLine,
  RiDeleteBinLine,
  RiLockLine,
  RiLockUnlockLine,
} from '@remixicon/react';

import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { TimeDisplay } from '@/components/common/TimeDisplay';
import { showSuccess } from '@/utils/messageHolder';

import {
  fetchAccountLockList,
  toggleAccountLock,
  deleteAccountLock,
} from '@/services/account-locks';

import type { AccountLockItem } from '@/types/account-locks';

// ============================================================================
// 类型定义
// ============================================================================

/** 筛选状态 */
interface FilterState {
  phone: string;
  accountNoMask: string;
  isLocked: boolean | undefined;
}

// ============================================================================
// 主页面组件
// ============================================================================

export default function AccountLocksPage() {
  // ============================================================================
  // 状态定义
  // ============================================================================

  const [records, setRecords] = useState<AccountLockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const [filters, setFilters] = useState<FilterState>({
    phone: '',
    accountNoMask: '',
    isLocked: undefined,
  });

  // 删除确认弹窗
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<AccountLockItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ============================================================================
  // 数据加载
  // ============================================================================

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAccountLockList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        phone: filters.phone || undefined,
        accountNoMask: filters.accountNoMask || undefined,
        isLocked: filters.isLocked,
      });

      setRecords(result.list);
      setPagination((prev) => ({
        ...prev,
        total: result.pagination.total,
      }));
    } catch (error) {
      console.error('加载锁定记录失败:', error);
      message.error('加载锁定记录失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // ============================================================================
  // 事件处理
  // ============================================================================

  const handleSearch = useCallback(() => {
    if (pagination.current === 1) {
      loadRecords();
    } else {
      setPagination((prev) => ({ ...prev, current: 1 }));
    }
  }, [pagination.current, loadRecords]);

  const handleReset = () => {
    setFilters({ phone: '', accountNoMask: '', isLocked: undefined });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  /**
   * 切换锁定状态
   */
  const handleToggleLock = async (record: AccountLockItem) => {
    const action = record.isLocked ? '解锁' : '重新锁定';
    Modal.confirm({
      title: `确认${action}？`,
      content: (
        <div>
          <p>银行卡号：{record.accountNoMask}</p>
          <p>绑定手机号：{record.phone}</p>
          <p>用户ID：{record.userId}</p>
          {record.isLocked ? (
            <p style={{ color: '#faad14' }}>解锁后，其他手机号用户可以绑定此银行账户</p>
          ) : (
            <p style={{ color: '#1677ff' }}>重新锁定后，只有手机号 {record.phone} 的用户可以绑定此账户</p>
          )}
        </div>
      ),
      onOk: async () => {
        try {
          const result = await toggleAccountLock(record.id);
          showSuccess(result.isLocked ? '已重新锁定' : '已解锁');
          // 更新本地状态
          setRecords((prev) =>
            prev.map((r) =>
              r.id === record.id ? { ...r, isLocked: result.isLocked } : r
            )
          );
        } catch (error) {
          message.error('操作失败');
        }
      },
    });
  };

  /**
   * 打开删除确认弹窗
   */
  const handleDelete = (record: AccountLockItem) => {
    setDeletingRecord(record);
    setDeleteModalVisible(true);
  };

  /**
   * 确认删除
   */
  const handleConfirmDelete = async () => {
    if (!deletingRecord) return;

    setDeleteLoading(true);
    try {
      await deleteAccountLock(deletingRecord.id);
      showSuccess('锁定记录已删除');
      setDeleteModalVisible(false);
      setDeletingRecord(null);
      loadRecords();
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : '删除失败';
      message.error(errMsg);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ============================================================================
  // 表格列配置
  // ============================================================================

  const columns: TableColumnsType<AccountLockItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      align: 'center',
    },
    {
      title: '银行卡号',
      dataIndex: 'accountNo',
      width: 180,
      render: (accountNo: string, record: AccountLockItem) => (
        <Tooltip title={accountNo}>
          <span style={{ fontFamily: 'monospace' }}>{record.accountNoMask}</span>
        </Tooltip>
      ),
    },
    {
      title: '锁定手机号',
      dataIndex: 'phone',
      width: 130,
      render: (phone: string) => (
        <span style={{ fontFamily: 'monospace' }}>{phone}</span>
      ),
    },
    {
      title: '用户信息',
      key: 'userInfo',
      width: 160,
      render: (_: unknown, record: AccountLockItem) => (
        <div>
          <div>ID: {record.userId}</div>
          {record.userNickname && (
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>{record.userNickname}</div>
          )}
        </div>
      ),
    },
    {
      title: '锁定状态',
      dataIndex: 'isLocked',
      width: 100,
      align: 'center',
      render: (isLocked: boolean) =>
        isLocked ? (
          <Tag icon={<RiLockLine size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />} color="red">
            已锁定
          </Tag>
        ) : (
          <Tag icon={<RiLockUnlockLine size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />} color="green">
            已解锁
          </Tag>
        ),
    },
    {
      title: '锁定时间',
      dataIndex: 'createdAt',
      width: 150,
      render: (createdAt: string) => <TimeDisplay value={createdAt} />,
    },
    {
      title: '解锁信息',
      key: 'unlockInfo',
      width: 160,
      responsive: ['lg'],
      render: (_: unknown, record: AccountLockItem) =>
        record.unlockedByName ? (
          <div>
            <div>{record.unlockedByName}</div>
            {record.unlockedAt && (
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                <TimeDisplay value={record.unlockedAt} />
              </div>
            )}
          </div>
        ) : (
          <span style={{ color: '#d9d9d9' }}>—</span>
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      align: 'center',
      render: (_: unknown, record: AccountLockItem) => (
        <Space size={8}>
          <Tooltip title={record.isLocked ? '解锁' : '重新锁定'}>
            <Button
              type="text"
              size="small"
              icon={
                record.isLocked ? (
                  <RiLockUnlockLine size={16} />
                ) : (
                  <RiLockLine size={16} />
                )
              }
              onClick={() => handleToggleLock(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              danger
              icon={<RiDeleteBinLine size={16} />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ============================================================================
  // 渲染
  // ============================================================================

  return (
    <PageContainer
      header={{
        title: '账户锁定管理',
      }}
      content="管理银行账户与手机号的绑定锁定关系，防止不同手机号用户绑定同一银行账户"
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
            placeholder="手机号"
            prefix={<RiSearchLine size={16} style={{ color: '#bfbfbf' }} />}
            value={filters.phone}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, phone: e.target.value }))
            }
            onPressEnter={handleSearch}
            style={{ width: 160 }}
            allowClear
          />
          <Input
            placeholder="卡号（脱敏）"
            prefix={<RiSearchLine size={16} style={{ color: '#bfbfbf' }} />}
            value={filters.accountNoMask}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, accountNoMask: e.target.value }))
            }
            onPressEnter={handleSearch}
            style={{ width: 160 }}
            allowClear
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RiFilterLine size={16} style={{ color: '#8c8c8c' }} />
            <span style={{ color: '#8c8c8c', fontSize: 13 }}>状态：</span>
            <Button.Group>
              <Button
                type={filters.isLocked === undefined ? 'primary' : 'default'}
                size="small"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, isLocked: undefined }))
                }
              >
                全部
              </Button>
              <Button
                type={filters.isLocked === true ? 'primary' : 'default'}
                size="small"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, isLocked: true }))
                }
              >
                已锁定
              </Button>
              <Button
                type={filters.isLocked === false ? 'primary' : 'default'}
                size="small"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, isLocked: false }))
                }
              >
                已解锁
              </Button>
            </Button.Group>
          </div>
          <Button onClick={handleSearch}>查询</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </div>

      {/* 表格 */}
      <div style={{ background: '#fff', borderRadius: 8 }}>
        <Table<AccountLockItem>
          rowKey="id"
          columns={columns}
          dataSource={records}
          loading={loading}
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
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  filters.phone || filters.accountNoMask || filters.isLocked !== undefined
                    ? '暂无符合条件的记录'
                    : '暂无锁定记录'
                }
              />
            ),
          }}
        />
      </div>

      {/* 删除确认弹窗 */}
      <ConfirmModal
        open={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setDeletingRecord(null);
        }}
        onConfirm={handleConfirmDelete}
        title="确认删除锁定记录"
        content={
          deletingRecord
            ? `删除后，银行卡号 ${deletingRecord.accountNoMask} 将不再受手机号限制，任何用户均可绑定此账户。此操作不可恢复。`
            : ''
        }
        danger
        confirmText="删除"
        loading={deleteLoading}
      />
    </PageContainer>
  );
}
