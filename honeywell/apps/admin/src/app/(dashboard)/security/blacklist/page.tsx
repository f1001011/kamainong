/**
 * @file 黑名单管理页
 * @description 三类黑名单（手机号/IP/银行卡）的统一管理页面
 * @depends 开发文档/04-后台管理端/04.10-安全管理/04.10.2-黑名单管理页.md
 */

'use client';

import React, { useRef, useState, useMemo, useCallback } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import { Button, Tabs, Badge, message } from 'antd';
import { RiAddLine, RiUploadLine } from '@remixicon/react';
import BlacklistTable from './components/BlacklistTable';
import AddBlacklistForm from './components/AddBlacklistForm';
import BatchImportModal from './components/BatchImportModal';
import { BatchResultModal } from '@/components/modals';
import type { FailedRecord } from '@/components/modals/BatchResultModal';
import type {
  BlacklistFormData,
  BatchImportResponse,
  BatchDeleteResponse,
} from '@/types/blacklist';
import { blacklistTabs } from '@/types/blacklist';
import {
  useAddBlacklist,
  useDeleteBlacklist,
  useBatchDeleteBlacklist,
  useBatchImportBlacklist,
  useBlacklistCounts,
} from './hooks/useBlacklistActions';

/**
 * 黑名单管理页面
 */
export default function BlacklistManagePage() {
  const actionRef = useRef<ActionType>(null);

  // Tab 状态
  const [activeTab, setActiveTab] = useState('phone');

  // 弹窗状态
  const [formVisible, setFormVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);

  // 当前正在删除的ID（用于单条删除按钮loading）
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 批量操作结果弹窗
  const [batchResultVisible, setBatchResultVisible] = useState(false);
  const [batchResult, setBatchResult] = useState<{
    operationName: string;
    total: number;
    successCount: number;
    failedCount: number;
    failedRecords: FailedRecord[];
  }>({
    operationName: '',
    total: 0,
    successCount: 0,
    failedCount: 0,
    failedRecords: [],
  });

  // React Query Hooks
  const { data: tabCounts = { phone: 0, ip: 0, bank_card: 0 }, refetch: refetchCounts } = useBlacklistCounts();
  const addMutation = useAddBlacklist();
  const deleteMutation = useDeleteBlacklist();
  const batchDeleteMutation = useBatchDeleteBlacklist();
  const batchImportMutation = useBatchImportBlacklist();

  // 当前黑名单类型
  const currentType = useMemo(() => {
    const tab = blacklistTabs.find((t) => t.key === activeTab);
    return tab?.type || 'PHONE';
  }, [activeTab]);

  /**
   * Tab 切换
   */
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    actionRef.current?.reload();
  };

  /**
   * 添加黑名单
   */
  const handleAdd = () => {
    setFormVisible(true);
  };

  /**
   * 删除黑名单
   */
  const handleDelete = useCallback(async (id: number) => {
    setDeletingId(id);
    try {
      await deleteMutation.mutateAsync(id);
      actionRef.current?.reload();
      refetchCounts();
    } finally {
      setDeletingId(null);
    }
  }, [deleteMutation, refetchCounts]);

  /**
   * 表单提交
   */
  const handleFormSubmit = useCallback(async (values: BlacklistFormData) => {
    await addMutation.mutateAsync(values);
    setFormVisible(false);
    actionRef.current?.reload();
    refetchCounts();
  }, [addMutation, refetchCounts]);

  /**
   * 批量删除结果处理
   */
  const handleBatchDeleteResult = useCallback((result: BatchDeleteResponse) => {
    if (result.failed === 0) {
      // 全部成功
      message.success(`批量移除成功，共处理 ${result.succeeded} 条`);
      actionRef.current?.reload();
    } else if (result.succeeded === 0) {
      // 全部失败
      message.error(`批量移除失败，共 ${result.failed} 条失败`);
    } else {
      // 部分成功，显示详情弹窗
      setBatchResult({
        operationName: '批量移除',
        total: result.total,
        successCount: result.succeeded,
        failedCount: result.failed,
        failedRecords: result.results
          .filter((r) => !r.success)
          .map((r) => ({
            id: r.id,
            reason: r.error?.message || '未知错误',
          })),
      });
      setBatchResultVisible(true);
    }
  }, []);

  /**
   * 批量删除
   */
  const handleBatchDelete = useCallback(async (ids: number[]) => {
    const result = await batchDeleteMutation.mutateAsync(ids);
    handleBatchDeleteResult(result);
    refetchCounts();
  }, [batchDeleteMutation, handleBatchDeleteResult, refetchCounts]);

  /**
   * 批量导入结果处理
   */
  const handleBatchImportResult = useCallback((result: BatchImportResponse) => {
    if (result.failed === 0) {
      // 全部成功
      message.success(`批量导入成功，共导入 ${result.succeeded} 条`);
      setImportModalVisible(false);
      actionRef.current?.reload();
    } else if (result.succeeded === 0) {
      // 全部失败
      message.error(`批量导入失败，共 ${result.failed} 条失败`);
    } else {
      // 部分成功，显示详情弹窗
      setBatchResult({
        operationName: '批量导入',
        total: result.total,
        successCount: result.succeeded,
        failedCount: result.failed,
        failedRecords: result.results
          .filter((r) => !r.success)
          .map((r) => ({
            id: r.value,
            name: r.value,
            reason: r.error?.message || '未知错误',
          })),
      });
      setBatchResultVisible(true);
      setImportModalVisible(false);
    }
  }, []);

  /**
   * 批量导入
   */
  const handleBatchImport = useCallback(async (data: { type: string; values: string[]; reason?: string }) => {
    const result = await batchImportMutation.mutateAsync(data);
    handleBatchImportResult(result);
    refetchCounts();
  }, [batchImportMutation, handleBatchImportResult, refetchCounts]);

  /**
   * 批量结果弹窗关闭
   */
  const handleBatchResultClose = () => {
    setBatchResultVisible(false);
    actionRef.current?.reload();
  };

  return (
    <PageContainer
      header={{
        title: '黑名单管理',
      }}
      extra={[
        <Button key="import" icon={<RiUploadLine size={16} />} onClick={() => setImportModalVisible(true)}>
          批量导入
        </Button>,
        <Button key="add" type="primary" icon={<RiAddLine size={16} />} onClick={handleAdd}>
          添加黑名单
        </Button>,
      ]}
    >
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={blacklistTabs.map((tab) => ({
          key: tab.key,
          label: (
            <span>
              {tab.label}
              {tabCounts[tab.key as keyof typeof tabCounts] > 0 && (
                <Badge
                  count={tabCounts[tab.key as keyof typeof tabCounts]}
                  style={{ marginLeft: 8 }}
                  overflowCount={999}
                />
              )}
            </span>
          ),
        }))}
      />

      <BlacklistTable
        actionRef={actionRef}
        type={currentType}
        onDelete={handleDelete}
        onBatchDelete={handleBatchDelete}
        onOpenImport={() => setImportModalVisible(true)}
        deleteLoading={deletingId}
        batchDeleteLoading={batchDeleteMutation.isPending}
      />

      <AddBlacklistForm
        visible={formVisible}
        defaultType={currentType}
        onCancel={() => setFormVisible(false)}
        onSubmit={handleFormSubmit}
        loading={addMutation.isPending}
      />

      <BatchImportModal
        visible={importModalVisible}
        defaultType={currentType}
        onCancel={() => setImportModalVisible(false)}
        onSubmit={handleBatchImport}
        loading={batchImportMutation.isPending}
      />

      <BatchResultModal
        open={batchResultVisible}
        onClose={handleBatchResultClose}
        onRefresh={() => actionRef.current?.reload()}
        operationName={batchResult.operationName}
        total={batchResult.total}
        successCount={batchResult.successCount}
        failedCount={batchResult.failedCount}
        failedRecords={batchResult.failedRecords}
      />
    </PageContainer>
  );
}
