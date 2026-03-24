/**
 * @file 二次确认弹窗组件
 * @description 用于危险操作的二次确认，支持自定义内容和影响说明
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第11节 - 常用组件规范
 */

'use client';

import React from 'react';
import { Modal, Button, Space, Typography, List } from 'antd';
import {
  RiErrorWarningLine,
  RiAlertLine,
  RiQuestionLine,
  RiDeleteBinLine,
  RiCheckLine,
} from '@remixicon/react';

const { Text, Paragraph } = Typography;

/**
 * 确认弹窗类型
 */
export type ConfirmType = 'warning' | 'danger' | 'info' | 'confirm';

export interface ConfirmModalProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 确认回调 */
  onConfirm: () => void | Promise<void>;
  /** 弹窗标题 */
  title: string;
  /** 弹窗内容 */
  content?: React.ReactNode;
  /** 确认类型 */
  type?: ConfirmType;
  /** 是否危险操作（红色主按钮） */
  danger?: boolean;
  /** 确认按钮文字 */
  confirmText?: string;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 是否加载中 */
  loading?: boolean;
  /** 影响说明列表 */
  impacts?: string[];
  /** 自定义图标 */
  icon?: React.ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 弹窗宽度 */
  width?: number;
}

/**
 * 获取类型对应的图标
 */
function getTypeIcon(type: ConfirmType, danger?: boolean): React.ReactNode {
  const iconProps = { size: 48 };

  if (danger) {
    return <RiDeleteBinLine {...iconProps} style={{ color: '#ff4d4f' }} />;
  }

  switch (type) {
    case 'danger':
      return <RiErrorWarningLine {...iconProps} style={{ color: '#ff4d4f' }} />;
    case 'warning':
      return <RiAlertLine {...iconProps} style={{ color: '#faad14' }} />;
    case 'info':
      return <RiQuestionLine {...iconProps} style={{ color: '#1677ff' }} />;
    case 'confirm':
    default:
      return <RiCheckLine {...iconProps} style={{ color: '#52c41a' }} />;
  }
}

/**
 * 获取类型对应的颜色
 */
function getTypeColor(type: ConfirmType, danger?: boolean): string {
  if (danger) return '#ff4d4f';

  switch (type) {
    case 'danger':
      return '#ff4d4f';
    case 'warning':
      return '#faad14';
    case 'info':
      return '#1677ff';
    case 'confirm':
    default:
      return '#52c41a';
  }
}

/**
 * 二次确认弹窗
 * @description 用于危险操作的二次确认，支持影响说明列表
 * @example
 * <ConfirmModal
 *   open={visible}
 *   onClose={() => setVisible(false)}
 *   onConfirm={handleDelete}
 *   title="确认删除"
 *   content="删除后数据将无法恢复"
 *   danger
 *   impacts={['用户数据将被清除', '相关订单将被归档']}
 * />
 */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  content,
  type = 'confirm',
  danger = false,
  confirmText = '确认',
  cancelText = '取消',
  loading = false,
  impacts,
  icon,
  className,
  width = 420,
}: ConfirmModalProps) {
  /**
   * 处理确认
   */
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      // 错误由调用方处理
      console.error('确认操作失败:', error);
    }
  };

  const typeColor = getTypeColor(type, danger);
  const displayIcon = icon || getTypeIcon(type, danger);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={width}
      centered
      destroyOnHidden
      className={`confirm-modal-component ${className || ''}`}
      closable={!loading}
      maskClosable={!loading}
      styles={{
        content: {
          borderRadius: 'var(--radius-xl, 16px)',
          overflow: 'hidden',
        },
      }}
    >
      <div style={{ textAlign: 'center', padding: 'var(--card-padding, 24px) 0 var(--spacing-md, 16px)' }}>
        {/* 图标 - 带呼吸动画 */}
        <div
          style={{
            marginBottom: 'var(--spacing-lg, 20px)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${typeColor}15 0%, ${typeColor}08 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 24px ${typeColor}20`,
              animation: 'breathe 2s ease-in-out infinite',
            }}
          >
            {displayIcon}
          </div>
        </div>
        <style jsx>{`
          @keyframes breathe {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.03); }
          }
        `}</style>

        {/* 标题 */}
        <Text
          strong
          style={{
            fontSize: 18,
            display: 'block',
            marginBottom: 12,
          }}
        >
          {title}
        </Text>

        {/* 内容 */}
        {content && (
          <Paragraph
            type="secondary"
            style={{
              marginBottom: impacts && impacts.length > 0 ? 16 : 24,
              fontSize: 14,
            }}
          >
            {content}
          </Paragraph>
        )}

        {/* 影响说明列表 */}
        {impacts && impacts.length > 0 && (
          <div
            style={{
              background: danger ? '#fff2f0' : '#fffbe6',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 24,
              textAlign: 'left',
            }}
          >
            <Text
              type="secondary"
              style={{
                fontSize: 12,
                display: 'block',
                marginBottom: 8,
                color: danger ? '#ff4d4f' : '#faad14',
              }}
            >
              {danger ? '此操作将产生以下影响：' : '请注意：'}
            </Text>
            <List
              size="small"
              dataSource={impacts}
              renderItem={(item) => (
                <List.Item
                  style={{
                    padding: '4px 0',
                    border: 'none',
                  }}
                >
                  <Text style={{ fontSize: 13 }}>• {item}</Text>
                </List.Item>
              )}
            />
          </div>
        )}

        {/* 操作按钮 */}
        <Space size={12}>
          <Button
            onClick={onClose}
            disabled={loading}
            style={{ minWidth: 88 }}
          >
            {cancelText}
          </Button>
          <Button
            type="primary"
            danger={danger || type === 'danger'}
            onClick={handleConfirm}
            loading={loading}
            style={{ minWidth: 88 }}
          >
            {confirmText}
          </Button>
        </Space>
      </div>
    </Modal>
  );
}

/**
 * 危险操作确认弹窗
 * @description 便捷组件，预设危险样式
 */
export function DangerConfirmModal(
  props: Omit<ConfirmModalProps, 'danger' | 'type'>
) {
  return <ConfirmModal {...props} danger type="danger" />;
}

/**
 * 警告确认弹窗
 * @description 便捷组件，预设警告样式
 */
export function WarningConfirmModal(
  props: Omit<ConfirmModalProps, 'type'>
) {
  return <ConfirmModal {...props} type="warning" />;
}

export default ConfirmModal;
