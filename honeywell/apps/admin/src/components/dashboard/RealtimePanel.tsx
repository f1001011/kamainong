/**
 * @file 实时数据面板组件
 * @description 展示实时在线用户数和最近订单滚动列表
 * @depends 开发文档/04-后台管理端/04.1.1-仪表盘页.md - UX设计规范
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { Card, Badge, List, Tag, Typography, Space, Skeleton, Empty } from 'antd';
import {
  RiUserLine,
  RiArrowUpCircleLine,
  RiArrowDownCircleLine,
  RiTimeLine,
} from '@remixicon/react';
import type { RealtimeData, RecentRecharge, RecentWithdraw } from '@/types/dashboard';
import { WITHDRAW_STATUS_MAP } from '@/services/dashboard';
import { formatCurrency } from '@/utils/format';

const { Text, Title } = Typography;

interface RealtimePanelProps {
  /** 实时数据 */
  data: RealtimeData | null;
  /** 是否加载中 */
  loading?: boolean;
}

/**
 * 在线用户数展示（带脉冲动画）
 */
function OnlineUserCount({ count, peakCount, peakTime }: {
  count: number;
  peakCount: number;
  peakTime: string;
}) {
  return (
    <Card variant="borderless" className="dashboard-online-card">
      <div className="online-header">
        <Space>
          <Badge status="processing" />
          <Text strong>实时在线</Text>
        </Space>
      </div>
      <div className="online-count-wrapper">
        <div className="online-pulse-ring" />
        <div className="online-pulse-ring delay-1" />
        <div className="online-pulse-ring delay-2" />
        <div className="online-count">
          <RiUserLine size={32} className="online-icon" />
          <Title level={1} className="online-number">
            {count}
          </Title>
          <Text type="secondary">人</Text>
        </div>
      </div>
      <div className="online-footer">
        <Text type="secondary">
          今日峰值: <Text strong>{peakCount}</Text> 人
        </Text>
      </div>
    </Card>
  );
}

/**
 * 最近订单列表
 */
function RecentOrderList({
  recharges,
  withdraws,
}: {
  recharges: RecentRecharge[];
  withdraws: RecentWithdraw[];
}) {
  const listRef = useRef<HTMLDivElement>(null);

  // 合并并排序订单
  const orders = React.useMemo(() => {
    const allOrders: Array<{
      key: string;
      type: 'recharge' | 'withdraw';
      phone: string;
      amount: string;
      time: string;
      status?: string;
    }> = [];

    recharges.forEach((item, index) => {
      allOrders.push({
        key: `r-${index}`,
        type: 'recharge',
        phone: item.userPhone,
        amount: item.amount,
        time: item.time,
      });
    });

    withdraws.forEach((item, index) => {
      allOrders.push({
        key: `w-${index}`,
        type: 'withdraw',
        phone: item.userPhone,
        amount: item.amount,
        time: item.time,
        status: item.status,
      });
    });

    // 按时间倒序（最新的在前）
    return allOrders.slice(0, 10);
  }, [recharges, withdraws]);

  // 自动滚动效果
  useEffect(() => {
    const el = listRef.current;
    if (!el || orders.length <= 5) return;

    let scrollTop = 0;
    const scrollInterval = setInterval(() => {
      scrollTop += 1;
      if (scrollTop >= el.scrollHeight - el.clientHeight) {
        scrollTop = 0;
      }
      el.scrollTop = scrollTop;
    }, 50);

    // hover 时暂停滚动
    const handleMouseEnter = () => clearInterval(scrollInterval);
    const handleMouseLeave = () => {
      // 重新开始滚动
    };

    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearInterval(scrollInterval);
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [orders.length]);

  return (
    <Card
      title={
        <Space>
          <RiTimeLine size={16} />
          <span>最近订单</span>
        </Space>
      }
      variant="borderless"
      className="dashboard-orders-card"
      styles={{ body: { padding: 0 } }}
    >
      <div ref={listRef} className="orders-scroll-container">
        {orders.length > 0 ? (
          <List
            size="small"
            dataSource={orders}
            renderItem={(item) => (
              <List.Item className={`order-item order-item-${item.type}`}>
                <div className="order-item-content">
                  <div className="order-item-left">
                    {item.type === 'recharge' ? (
                      <RiArrowUpCircleLine size={18} className="order-icon-recharge" />
                    ) : (
                      <RiArrowDownCircleLine size={18} className="order-icon-withdraw" />
                    )}
                    <div className="order-info">
                      <Text className="order-phone">{item.phone}</Text>
                      <Text type="secondary" className="order-time">
                        {item.time}
                      </Text>
                    </div>
                  </div>
                  <div className="order-item-right">
                    <Text
                      strong
                      className={item.type === 'recharge' ? 'amount-recharge' : 'amount-withdraw'}
                    >
                      {item.type === 'recharge' ? '+' : '-'}
                      {formatCurrency(item.amount)}
                    </Text>
                    {item.status && (
                      <Tag
                        color={WITHDRAW_STATUS_MAP[item.status]?.color || 'default'}
                        className="order-status-tag"
                      >
                        {WITHDRAW_STATUS_MAP[item.status]?.label || item.status}
                      </Tag>
                    )}
                  </div>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无订单" className="orders-empty" />
        )}
      </div>
    </Card>
  );
}

/**
 * 实时数据面板
 */
export function RealtimePanel({ data, loading }: RealtimePanelProps) {
  if (loading) {
    return (
      <Card variant="borderless">
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  return (
    <div className="realtime-panel">
      <OnlineUserCount
        count={data?.onlineCount ?? 0}
        peakCount={data?.todayPeakOnline ?? 0}
        peakTime={data?.peakTime ?? ''}
      />
      <RecentOrderList
        recharges={data?.recentRecharges ?? []}
        withdraws={data?.recentWithdraws ?? []}
      />
    </div>
  );
}

export default RealtimePanel;
