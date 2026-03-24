/**
 * @file 最近订单面板组件
 * @description 分别展示最近充值订单和最近提现订单列表
 * @depends 开发文档/04-后台管理端/04.1.1-仪表盘页.md - 第 4.5.2 节
 * @uses AmountDisplay - 金额显示复用组件
 * @uses RelativeTime - 相对时间显示复用组件
 * @uses StatusBadge - 状态标签复用组件
 */

'use client';

import React from 'react';
import { Row, Col, Card, List, Typography, Space, Skeleton, Empty } from 'antd';
import { useRouter } from 'next/navigation';
import {
  RiArrowUpCircleLine,
  RiArrowDownCircleLine,
  RiArrowRightLine,
} from '@remixicon/react';
import type { RecentRecharge, RecentWithdraw } from '@/types/dashboard';
import { AmountDisplay } from '@/components/common/AmountDisplay';
import { RelativeTime } from '@/components/common/TimeDisplay';
import { WithdrawStatusBadge } from '@/components/common/StatusBadge';

const { Text } = Typography;

interface RecentOrdersPanelProps {
  /** 最近充值订单 */
  recharges: RecentRecharge[];
  /** 最近提现订单 */
  withdraws: RecentWithdraw[];
  /** 是否加载中 */
  loading?: boolean;
}

/**
 * 最近充值订单列表
 */
function RechargeOrderList({
  orders,
  loading,
}: {
  orders: RecentRecharge[];
  loading?: boolean;
}) {
  const router = useRouter();

  if (loading) {
    return (
      <Card
        title={
          <Space>
            <RiArrowUpCircleLine size={16} className="text-green-500" />
            <span>最近充值</span>
          </Space>
        }
        variant="borderless"
        className="dashboard-orders-card"
      >
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <RiArrowUpCircleLine size={16} style={{ color: '#52c41a' }} />
          <span>最近充值</span>
        </Space>
      }
      extra={
        <a onClick={() => router.push('/orders/recharge')} className="view-all-link">
          查看全部 <RiArrowRightLine size={14} />
        </a>
      }
      variant="borderless"
      className="dashboard-orders-card"
      styles={{ body: { padding: 0 } }}
    >
      {orders.length > 0 ? (
        <div className="orders-scroll-container">
          <List
            size="small"
            dataSource={orders.slice(0, 10)}
            renderItem={(item, index) => (
              <List.Item className={`order-item ${index === 0 ? 'latest' : ''}`}>
                <div className="order-item-content">
                  <div className="order-item-left">
                    <RiArrowUpCircleLine size={16} className="order-icon-recharge" />
                    <div className="order-info">
                      <Text className="order-phone">{item.userPhone}</Text>
                      <Text type="secondary" className="order-time">
                        <RelativeTime value={item.time} />
                      </Text>
                    </div>
                  </div>
                  <div className="order-item-right">
                    <AmountDisplay
                      value={item.amount}
                      showSign
                      style={{ color: '#52c41a', fontWeight: 600 }}
                    />
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
      ) : (
        <Empty description="暂无充值订单" className="orders-empty" />
      )}
    </Card>
  );
}

/**
 * 最近提现订单列表
 */
function WithdrawOrderList({
  orders,
  loading,
}: {
  orders: RecentWithdraw[];
  loading?: boolean;
}) {
  const router = useRouter();

  if (loading) {
    return (
      <Card
        title={
          <Space>
            <RiArrowDownCircleLine size={16} className="text-red-500" />
            <span>最近提现</span>
          </Space>
        }
        variant="borderless"
        className="dashboard-orders-card"
      >
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <RiArrowDownCircleLine size={16} style={{ color: '#ff4d4f' }} />
          <span>最近提现</span>
        </Space>
      }
      extra={
        <a onClick={() => router.push('/orders/withdraw')} className="view-all-link">
          查看全部 <RiArrowRightLine size={14} />
        </a>
      }
      variant="borderless"
      className="dashboard-orders-card"
      styles={{ body: { padding: 0 } }}
    >
      {orders.length > 0 ? (
        <div className="orders-scroll-container">
          <List
            size="small"
            dataSource={orders.slice(0, 10)}
            renderItem={(item, index) => (
              <List.Item className={`order-item ${index === 0 ? 'latest' : ''}`}>
                <div className="order-item-content">
                  <div className="order-item-left">
                    <RiArrowDownCircleLine size={16} className="order-icon-withdraw" />
                    <div className="order-info">
                      <Text className="order-phone">{item.userPhone}</Text>
                      <Text type="secondary" className="order-time">
                        <RelativeTime value={item.time} />
                      </Text>
                    </div>
                  </div>
                  <div className="order-item-right">
                    <AmountDisplay
                      value={-Number(item.amount)}
                      showSign
                      style={{ color: '#1677ff', fontWeight: 600 }}
                    />
                    {item.status && (
                      <WithdrawStatusBadge status={item.status} />
                    )}
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
      ) : (
        <Empty description="暂无提现订单" className="orders-empty" />
      )}
    </Card>
  );
}

/**
 * 最近订单面板（包含充值和提现两个列表）
 */
export function RecentOrdersPanel({
  recharges,
  withdraws,
  loading,
}: RecentOrdersPanelProps) {
  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} md={12}>
        <RechargeOrderList orders={recharges} loading={loading} />
      </Col>
      <Col xs={24} md={12}>
        <WithdrawOrderList orders={withdraws} loading={loading} />
      </Col>
    </Row>
  );
}

export default RecentOrdersPanel;
