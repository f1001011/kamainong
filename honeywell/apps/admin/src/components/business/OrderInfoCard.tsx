/**
 * @file 订单信息卡片组件
 * @description 显示订单号、金额、状态、时间等信息
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第11节 - 常用组件规范
 */

'use client';

import React from 'react';
import { Card, Typography, Space, Divider } from 'antd';
import {
  RiFileList3Line,
  RiBankCard2Line,
  RiExchangeDollarLine,
  RiMoneyDollarCircleLine,
} from '@remixicon/react';
import { CopyButton } from '@/components/common/CopyButton';
import { AmountDisplay } from '@/components/common/AmountDisplay';
import { TimeDisplay } from '@/components/common/TimeDisplay';
import {
  RechargeStatusBadge,
  WithdrawStatusBadge,
  PositionStatusBadge,
} from '@/components/common/StatusBadge';

const { Text, Title } = Typography;

/**
 * 订单类型
 */
export type OrderType = 'recharge' | 'withdraw' | 'position';

/**
 * 订单类型配置
 */
const ORDER_TYPE_CONFIG: Record<
  OrderType,
  {
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    label: string;
  }
> = {
  recharge: {
    icon: <RiBankCard2Line size={20} />,
    color: '#52c41a',
    bgColor: '#f6ffed',
    label: '充值订单',
  },
  withdraw: {
    icon: <RiExchangeDollarLine size={20} />,
    color: '#1677ff',
    bgColor: '#e6f4ff',
    label: '提现订单',
  },
  position: {
    icon: <RiMoneyDollarCircleLine size={20} />,
    color: '#722ed1',
    bgColor: '#f9f0ff',
    label: '持仓订单',
  },
};

export interface OrderInfoCardProps {
  /** 订单类型 */
  orderType: OrderType;
  /** 订单号 */
  orderNo: string;
  /** 订单金额 */
  amount: number | string;
  /** 订单状态 */
  status: string;
  /** 创建时间 */
  createdAt: string;
  /** 完成时间 */
  completedAt?: string | null;
  /** 额外信息 */
  extra?: React.ReactNode;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 卡片尺寸 */
  size?: 'small' | 'default';
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 获取状态标签组件
 */
function getStatusBadge(orderType: OrderType, status: string) {
  switch (orderType) {
    case 'recharge':
      return <RechargeStatusBadge status={status} />;
    case 'withdraw':
      return <WithdrawStatusBadge status={status} />;
    case 'position':
      return <PositionStatusBadge status={status} />;
  }
}

/**
 * 订单信息卡片
 * @description 显示订单基本信息，包括订单号、金额、状态、时间
 * @example
 * <OrderInfoCard
 *   orderType="recharge"
 *   orderNo="RC20260205ABC123"
 *   amount={100}
 *   status="PAID"
 *   createdAt="2026-02-05T10:30:00Z"
 * />
 */
export function OrderInfoCard({
  orderType,
  orderNo,
  amount,
  status,
  createdAt,
  completedAt,
  extra,
  bordered = true,
  size = 'default',
  className,
  style,
}: OrderInfoCardProps) {
  const typeConfig = ORDER_TYPE_CONFIG[orderType];
  const isSmall = size === 'small';

  return (
    <Card
      size="small"
      bordered={bordered}
      className={className}
      style={{
        borderRadius: 12,
        ...style,
      }}
      styles={{
        body: {
          padding: isSmall ? 12 : 16,
        },
      }}
    >
      {/* 头部：类型图标 + 订单号 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isSmall ? 12 : 16,
        }}
      >
        <Space size={8}>
          <div
            style={{
              width: isSmall ? 32 : 36,
              height: isSmall ? 32 : 36,
              borderRadius: 8,
              background: typeConfig.bgColor,
              color: typeConfig.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {typeConfig.icon}
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              {typeConfig.label}
            </Text>
            <CopyButton
              text={orderNo}
              showText
              size="small"
              monospace
            />
          </div>
        </Space>

        {/* 状态标签 */}
        {getStatusBadge(orderType, status)}
      </div>

      {/* 金额 */}
      <div
        style={{
          background: '#fafafa',
          borderRadius: 8,
          padding: isSmall ? '8px 12px' : '12px 16px',
          marginBottom: isSmall ? 12 : 16,
        }}
      >
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
          订单金额
        </Text>
        <AmountDisplay
          value={amount}
          size={isSmall ? 'default' : 'large'}
          style={{ fontWeight: 600 }}
        />
      </div>

      {/* 时间信息 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: completedAt ? '1fr 1fr' : '1fr',
          gap: 12,
        }}
      >
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
            创建时间
          </Text>
          <TimeDisplay value={createdAt} format="datetime" showTooltip={false} />
        </div>
        {completedAt && (
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
              完成时间
            </Text>
            <TimeDisplay value={completedAt} format="datetime" showTooltip={false} />
          </div>
        )}
      </div>

      {/* 额外信息 */}
      {extra && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          {extra}
        </>
      )}
    </Card>
  );
}

/**
 * 订单号显示组件（简化版）
 * @description 仅显示订单号和复制按钮
 */
export function OrderNoDisplay({
  orderNo,
  orderType,
  showIcon = false,
  className,
  style,
}: {
  orderNo: string;
  orderType?: OrderType;
  showIcon?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const typeConfig = orderType ? ORDER_TYPE_CONFIG[orderType] : null;

  return (
    <Space size={8} className={className} style={style}>
      {showIcon && typeConfig && (
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            background: typeConfig.bgColor,
            color: typeConfig.color,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.cloneElement(typeConfig.icon as React.ReactElement<{ size?: number }>)}
        </div>
      )}
      <CopyButton text={orderNo} showText monospace size="small" />
    </Space>
  );
}

/**
 * 订单金额卡片（极简版）
 * @description 用于列表等场景的金额显示
 */
export function OrderAmountCard({
  amount,
  label,
  type = 'default',
  className,
  style,
}: {
  amount: number | string;
  label?: string;
  type?: 'default' | 'income' | 'expense';
  className?: string;
  style?: React.CSSProperties;
}) {
  const typeColors = {
    default: undefined,
    income: '#52c41a',
    expense: '#ff4d4f',
  };

  return (
    <div
      className={className}
      style={{
        textAlign: 'right',
        ...style,
      }}
    >
      {label && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
          {label}
        </Text>
      )}
      <AmountDisplay
        value={amount}
        showSign={type !== 'default'}
        style={{
          color: typeColors[type],
          fontWeight: 500,
        }}
      />
    </div>
  );
}

export default OrderInfoCard;
