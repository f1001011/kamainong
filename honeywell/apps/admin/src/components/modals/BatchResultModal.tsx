/**
 * @file 批量操作结果弹窗
 * @description 显示批量操作的执行结果，支持成功/失败/部分成功状态
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第11节 - 常用组件规范
 */

'use client';

import React from 'react';
import { Modal, Button, Typography, Progress, List, Space, Divider } from 'antd';
import {
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiErrorWarningFill,
  RiRefreshLine,
} from '@remixicon/react';

const { Text, Title } = Typography;

/**
 * 失败记录类型
 */
export interface FailedRecord {
  /** 记录标识（如用户ID、订单号） */
  id: string | number;
  /** 记录名称/描述 */
  name?: string;
  /** 失败原因 */
  reason: string;
}

/**
 * 批量操作结果类型
 */
export type BatchResultStatus = 'success' | 'partial' | 'failed';

export interface BatchResultModalProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 刷新列表回调 */
  onRefresh?: () => void;
  /** 操作名称（如"封禁用户"） */
  operationName: string;
  /** 总数 */
  total: number;
  /** 成功数 */
  successCount: number;
  /** 失败数 */
  failedCount: number;
  /** 失败记录详情 */
  failedRecords?: FailedRecord[];
  /** 自定义类名 */
  className?: string;
  /** 弹窗宽度 */
  width?: number;
}

/**
 * 获取结果状态
 */
function getResultStatus(
  successCount: number,
  failedCount: number,
  total: number
): BatchResultStatus {
  if (successCount === total) return 'success';
  if (failedCount === total) return 'failed';
  return 'partial';
}

/**
 * 获取状态配置
 */
function getStatusConfig(status: BatchResultStatus) {
  switch (status) {
    case 'success':
      return {
        icon: <RiCheckboxCircleFill size={56} style={{ color: '#52c41a' }} />,
        title: '操作成功',
        color: '#52c41a',
        bgColor: '#f6ffed',
      };
    case 'partial':
      return {
        icon: <RiErrorWarningFill size={56} style={{ color: '#faad14' }} />,
        title: '部分成功',
        color: '#faad14',
        bgColor: '#fffbe6',
      };
    case 'failed':
      return {
        icon: <RiCloseCircleFill size={56} style={{ color: '#ff4d4f' }} />,
        title: '操作失败',
        color: '#ff4d4f',
        bgColor: '#fff2f0',
      };
  }
}

/**
 * 批量操作结果弹窗
 * @description 显示批量操作的执行结果，包含成功/失败统计和失败原因
 * @example
 * <BatchResultModal
 *   open={visible}
 *   onClose={() => setVisible(false)}
 *   onRefresh={fetchList}
 *   operationName="封禁用户"
 *   total={10}
 *   successCount={8}
 *   failedCount={2}
 *   failedRecords={[
 *     { id: 1, name: '用户A', reason: '已被封禁' },
 *     { id: 2, name: '用户B', reason: '权限不足' },
 *   ]}
 * />
 */
export function BatchResultModal({
  open,
  onClose,
  onRefresh,
  operationName,
  total,
  successCount,
  failedCount,
  failedRecords = [],
  className,
  width = 480,
}: BatchResultModalProps) {
  const status = getResultStatus(successCount, failedCount, total);
  const statusConfig = getStatusConfig(status);
  const successPercent = total > 0 ? Math.round((successCount / total) * 100) : 0;

  /**
   * 处理刷新并关闭
   */
  const handleRefreshAndClose = () => {
    onRefresh?.();
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={width}
      centered
      destroyOnHidden
      className={`batch-result-modal ${className || ''}`}
      styles={{
        content: {
          borderRadius: 'var(--radius-xl, 16px)',
          overflow: 'hidden',
        },
      }}
    >
      <div style={{ padding: 'var(--card-padding, 24px) 0 var(--spacing-md, 16px)' }}>
        {/* 顶部状态图标 - 带成功/失败动画 */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 'var(--spacing-lg, 24px)',
          }}
        >
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${statusConfig.bgColor} 0%, #fff 100%)`,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--spacing-md, 16px)',
              boxShadow: `0 8px 24px ${statusConfig.color}20`,
              animation: status === 'success' ? 'successPop 0.5s ease-out' : undefined,
            }}
          >
            {statusConfig.icon}
          </div>
          <style jsx>{`
            @keyframes successPop {
              0% { transform: scale(0.8); opacity: 0; }
              50% { transform: scale(1.1); }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
          <Title level={4} style={{ marginBottom: 4 }}>
            {statusConfig.title}
          </Title>
          <Text type="secondary">
            {operationName}完成
          </Text>
        </div>

        {/* 进度统计 */}
        <div
          style={{
            background: 'var(--bg-hover, #fafafa)',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: 'var(--spacing-lg, 20px) var(--card-padding, 24px)',
            marginBottom: 'var(--spacing-lg, 20px)',
            border: '1px solid var(--border-light, #f0f0f0)',
          }}
        >
          {/* 进度条 */}
          <Progress
            percent={successPercent}
            strokeColor={statusConfig.color}
            trailColor="#e8e8e8"
            showInfo={false}
            style={{ marginBottom: 16 }}
          />

          {/* 统计数字 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ textAlign: 'center', flex: 1 }}>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: 600,
                  color: '#262626',
                  display: 'block',
                  lineHeight: 1.2,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {total}
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                总数
              </Text>
            </div>

            <Divider type="vertical" style={{ height: 40, margin: '0 16px' }} />

            <div style={{ textAlign: 'center', flex: 1 }}>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: 600,
                  color: '#52c41a',
                  display: 'block',
                  lineHeight: 1.2,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {successCount}
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                成功
              </Text>
            </div>

            <Divider type="vertical" style={{ height: 40, margin: '0 16px' }} />

            <div style={{ textAlign: 'center', flex: 1 }}>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: 600,
                  color: failedCount > 0 ? '#ff4d4f' : '#8c8c8c',
                  display: 'block',
                  lineHeight: 1.2,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {failedCount}
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                失败
              </Text>
            </div>
          </div>
        </div>

        {/* 失败记录列表 */}
        {failedRecords.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <Text
              type="secondary"
              style={{
                fontSize: 13,
                display: 'block',
                marginBottom: 8,
              }}
            >
              失败详情 ({failedRecords.length})
            </Text>
            <div
              style={{
                background: '#fff2f0',
                borderRadius: 8,
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              <List
                size="small"
                dataSource={failedRecords}
                renderItem={(record) => (
                  <List.Item
                    style={{
                      padding: '10px 16px',
                      borderBottom: '1px solid #ffccc7',
                    }}
                  >
                    <div style={{ width: '100%' }}>
                      <Space size={8}>
                        <RiCloseCircleFill size={14} style={{ color: '#ff4d4f' }} />
                        <Text style={{ fontWeight: 500 }}>
                          {record.name || `#${record.id}`}
                        </Text>
                      </Space>
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 12,
                          display: 'block',
                          marginTop: 2,
                          marginLeft: 22,
                        }}
                      >
                        {record.reason}
                      </Text>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{ textAlign: 'center' }}>
          <Space size={12}>
            <Button onClick={onClose} style={{ minWidth: 88 }}>
              关闭
            </Button>
            {onRefresh && (
              <Button
                type="primary"
                icon={<RiRefreshLine size={16} />}
                onClick={handleRefreshAndClose}
                style={{ minWidth: 120 }}
              >
                刷新列表
              </Button>
            )}
          </Space>
        </div>
      </div>
    </Modal>
  );
}

export default BatchResultModal;
