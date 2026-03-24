/**
 * @file 批量操作栏组件
 * @description 固定底部浮出的批量操作栏，勾选时显示
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第11节 - 常用组件规范
 */

'use client';

import React from 'react';
import { Button, Space, Typography } from 'antd';
import { RiCloseLine } from '@remixicon/react';

const { Text } = Typography;

/**
 * 操作按钮配置
 */
export interface BatchAction {
  /** 按钮key */
  key: string;
  /** 按钮文字 */
  label: string;
  /** 按钮图标 */
  icon?: React.ReactNode;
  /** 是否危险按钮 */
  danger?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 加载状态 */
  loading?: boolean;
  /** 点击回调 */
  onClick: () => void;
}

export interface BatchOperationBarProps {
  /** 选中数量 */
  selectedCount: number;
  /** 操作按钮列表 */
  actions: BatchAction[];
  /** 取消选择回调 */
  onCancel: () => void;
  /** 是否显示（默认选中数量>0时显示） */
  visible?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 批量操作栏组件
 * @description 固定底部浮出，显示已选数量和操作按钮
 * @example
 * <BatchOperationBar
 *   selectedCount={selectedRows.length}
 *   onCancel={() => setSelectedRows([])}
 *   actions={[
 *     { key: 'approve', label: '批量通过', icon: <RiCheckLine />, onClick: handleBatchApprove },
 *     { key: 'reject', label: '批量拒绝', danger: true, onClick: handleBatchReject },
 *   ]}
 * />
 */
export function BatchOperationBar({
  selectedCount,
  actions,
  onCancel,
  visible,
  className,
  style,
}: BatchOperationBarProps) {
  // 默认选中数量>0时显示
  const isVisible = visible ?? selectedCount > 0;

  return (
    <>
      {/* 全局样式 */}
      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideDown {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100%);
            opacity: 0;
          }
        }
        .batch-bar-enter {
          animation: slideUp 0.25s ease-out forwards;
        }
        .batch-bar-exit {
          animation: slideDown 0.2s ease-in forwards;
        }
      `}</style>

      {/* 操作栏 */}
      {isVisible && (
        <div
          className={`batch-bar-enter ${className || ''}`}
          style={{
            position: 'fixed',
            bottom: 'var(--spacing-lg, 24px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'var(--bg-card, #fff)',
            borderRadius: 'var(--radius-lg, 12px)',
            boxShadow: 'var(--shadow-lg, 0 4px 12px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06))',
            border: '1px solid var(--border-light, #f0f0f0)',
            padding: 'var(--spacing-sm, 12px) var(--card-padding, 24px)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-lg, 24px)',
            minWidth: 400,
            backdropFilter: 'blur(8px)',
            ...style,
          }}
        >
          {/* 左侧：已选择数量 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text>已选择</Text>
            <Text
              strong
              style={{
                fontSize: 20,
                color: '#1677ff',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {selectedCount}
            </Text>
            <Text>项</Text>
          </div>

          {/* 分隔线 */}
          <div
            style={{
              width: 1,
              height: 24,
              background: '#f0f0f0',
            }}
          />

          {/* 右侧：操作按钮 */}
          <Space size={8} style={{ flex: 1 }}>
            {actions.map((action) => (
              <Button
                key={action.key}
                type={action.danger ? 'primary' : 'default'}
                danger={action.danger}
                icon={action.icon}
                disabled={action.disabled}
                loading={action.loading}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </Space>

          {/* 取消选择 */}
          <Button
            type="text"
            icon={<RiCloseLine size={16} />}
            onClick={onCancel}
            style={{ color: '#8c8c8c' }}
          >
            取消选择
          </Button>
        </div>
      )}
    </>
  );
}

export default BatchOperationBar;
