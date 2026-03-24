/**
 * @file 详情抽屉组件
 * @description 通用的详情展示抽屉，支持状态图标、描述列表、自定义页脚
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第11节 - 常用组件规范
 */

'use client';

import React from 'react';
import { Drawer, Descriptions, Space, Typography, Skeleton, Divider } from 'antd';
import type { DescriptionsProps } from 'antd';
import {
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiTimeLine,
  RiLoader4Line,
  RiErrorWarningFill,
  RiQuestionLine,
} from '@remixicon/react';

const { Title, Text } = Typography;

/**
 * 状态类型
 */
export type DetailStatus =
  | 'success'
  | 'error'
  | 'warning'
  | 'pending'
  | 'processing'
  | 'info';

/**
 * 描述项类型
 */
export interface DetailItem {
  /** 标签 */
  label: string;
  /** 内容 */
  children: React.ReactNode;
  /** 占据列数 */
  span?: number;
}

export interface DetailDrawerProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 抽屉标题 */
  title: string;
  /** 副标题（如订单号） */
  subtitle?: string;
  /** 状态 */
  status?: DetailStatus;
  /** 状态文字 */
  statusText?: string;
  /** 描述项列表 */
  items?: DetailItem[];
  /** 描述列表配置 */
  descriptionsProps?: Omit<DescriptionsProps, 'items'>;
  /** 页脚操作按钮 */
  footer?: React.ReactNode;
  /** 额外内容（在描述列表下方） */
  extra?: React.ReactNode;
  /** 是否加载中 */
  loading?: boolean;
  /** 抽屉宽度 */
  width?: number;
  /** 自定义类名 */
  className?: string;
  /** 子组件 */
  children?: React.ReactNode;
}

/**
 * 获取状态图标配置
 */
function getStatusConfig(status: DetailStatus) {
  const iconSize = 48;

  switch (status) {
    case 'success':
      return {
        icon: <RiCheckboxCircleFill size={iconSize} />,
        color: '#52c41a',
        bgColor: '#f6ffed',
      };
    case 'error':
      return {
        icon: <RiCloseCircleFill size={iconSize} />,
        color: '#ff4d4f',
        bgColor: '#fff2f0',
      };
    case 'warning':
      return {
        icon: <RiErrorWarningFill size={iconSize} />,
        color: '#faad14',
        bgColor: '#fffbe6',
      };
    case 'pending':
      return {
        icon: <RiTimeLine size={iconSize} />,
        color: '#1677ff',
        bgColor: '#e6f4ff',
      };
    case 'processing':
      return {
        icon: <RiLoader4Line size={iconSize} className="spin-animation" />,
        color: '#1677ff',
        bgColor: '#e6f4ff',
      };
    case 'info':
    default:
      return {
        icon: <RiQuestionLine size={iconSize} />,
        color: '#8c8c8c',
        bgColor: '#fafafa',
      };
  }
}

/**
 * 详情抽屉组件
 * @description 通用的详情展示抽屉，带状态图标和描述列表
 * @example
 * <DetailDrawer
 *   open={visible}
 *   onClose={() => setVisible(false)}
 *   title="订单详情"
 *   subtitle="#RC20260205ABC123"
 *   status="success"
 *   statusText="已完成"
 *   items={[
 *     { label: '订单金额', children: <AmountDisplay value={100} /> },
 *     { label: '创建时间', children: <TimeDisplay value={createdAt} /> },
 *   ]}
 *   footer={<Button type="primary">操作按钮</Button>}
 * />
 */
export function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  status,
  statusText,
  items,
  descriptionsProps,
  footer,
  extra,
  loading = false,
  width = 600,
  className,
  children,
}: DetailDrawerProps) {
  const statusConfig = status ? getStatusConfig(status) : null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={null}
      width={width}
      className={`detail-drawer-component ${className || ''}`}
      footer={footer}
      styles={{
        wrapper: {
          boxShadow: 'var(--shadow-lg, 0 4px 12px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06))',
        },
        body: {
          padding: 0,
        },
        footer: footer
          ? {
              padding: 'var(--spacing-md, 16px) var(--card-padding, 24px)',
              borderTop: '1px solid var(--border-light, #f0f0f0)',
              background: 'var(--bg-hover, #fafafa)',
            }
          : undefined,
      }}
    >
      {/* 全局旋转动画样式 */}
      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>

      {loading ? (
        <div style={{ padding: 24 }}>
          <Skeleton active avatar={{ size: 64, shape: 'circle' }} />
          <Skeleton active style={{ marginTop: 24 }} />
          <Skeleton active style={{ marginTop: 16 }} />
        </div>
      ) : (
        <>
          {/* 头部区域：状态图标 + 标题 */}
          <div
            style={{
              padding: 'var(--spacing-xl, 32px) var(--card-padding, 24px) var(--spacing-lg, 24px)',
              background: statusConfig
                ? `linear-gradient(180deg, ${statusConfig.bgColor} 0%, var(--bg-card, #fff) 100%)`
                : 'var(--bg-hover, #fafafa)',
              borderBottom: '1px solid var(--border-light, #f0f0f0)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
              }}
            >
              {/* 状态图标 */}
              {statusConfig && (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: statusConfig.color,
                    flexShrink: 0,
                  }}
                >
                  {statusConfig.icon}
                </div>
              )}

              {/* 标题信息 */}
              <div style={{ flex: 1, paddingTop: statusConfig ? 8 : 0 }}>
                <Title
                  level={4}
                  style={{
                    margin: 0,
                    marginBottom: 4,
                  }}
                >
                  {title}
                </Title>
                {subtitle && (
                  <Text
                    type="secondary"
                    style={{
                      fontFamily: 'Roboto Mono, monospace',
                      fontSize: 13,
                      display: 'block',
                      marginBottom: statusText ? 8 : 0,
                    }}
                  >
                    {subtitle}
                  </Text>
                )}
                {statusText && statusConfig && (
                  <Text
                    style={{
                      color: statusConfig.color,
                      fontWeight: 500,
                      fontSize: 15,
                    }}
                  >
                    {statusText}
                  </Text>
                )}
              </div>
            </div>
          </div>

          {/* 内容区域 */}
          <div style={{ padding: 24 }}>
            {/* 描述列表 */}
            {items && items.length > 0 && (
              <Descriptions
                column={2}
                styles={{
                  label: {
                    color: '#8c8c8c',
                    fontWeight: 400,
                    width: 100,
                  },
                  content: {
                    color: '#262626',
                  },
                }}
                {...descriptionsProps}
              >
                {items.map((item, index) => (
                  <Descriptions.Item
                    key={index}
                    label={item.label}
                    span={item.span}
                  >
                    {item.children}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            )}

            {/* 额外内容 */}
            {extra && (
              <>
                {items && items.length > 0 && (
                  <Divider style={{ margin: '20px 0' }} />
                )}
                {extra}
              </>
            )}

            {/* 子组件 */}
            {children}
          </div>
        </>
      )}
    </Drawer>
  );
}

/**
 * 详情分组标题
 * @description 用于在详情抽屉中分组显示内容
 */
export function DetailSection({
  title,
  children,
  style,
}: {
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ marginBottom: 24, ...style }}>
      <Text
        strong
        style={{
          fontSize: 15,
          display: 'block',
          marginBottom: 16,
          paddingBottom: 8,
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        {title}
      </Text>
      {children}
    </div>
  );
}

export default DetailDrawer;
