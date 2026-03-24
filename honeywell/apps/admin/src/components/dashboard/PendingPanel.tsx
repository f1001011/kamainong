/**
 * @file 待处理事项面板组件
 * @description 展示待处理的审核、异常等事项
 * @depends 开发文档/04-后台管理端/04.1.1-仪表盘页.md - UX设计规范
 * @uses AmountDisplay - 金额显示复用组件
 */

'use client';

import React from 'react';
import { Card, Typography, Space, Skeleton, Statistic, Row, Col } from 'antd';
import { useRouter } from 'next/navigation';
import {
  RiTodoLine,
  RiFileList2Line,
  RiErrorWarningLine,
  RiArrowRightLine,
} from '@remixicon/react';
import type { DashboardStats } from '@/types/dashboard';
import { AmountDisplay } from '@/components/common/AmountDisplay';

const { Text } = Typography;

interface PendingPanelProps {
  /** 统计数据 */
  stats: DashboardStats | null;
  /** 是否加载中 */
  loading?: boolean;
}

/**
 * 待处理项卡片
 */
function PendingItem({
  title,
  count,
  amount,
  icon,
  color,
  onClick,
}: {
  title: string;
  count: number;
  amount?: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}) {
  return (
    <div className="pending-item" onClick={onClick}>
      <div className="pending-item-icon" style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>
      <div className="pending-item-content">
        <Text type="secondary" className="pending-item-title">
          {title}
        </Text>
        <div className="pending-item-stats">
          <Statistic
            value={count}
            suffix="笔"
            valueStyle={{
              fontSize: 24,
              fontWeight: 600,
              color: count > 0 ? color : undefined,
            }}
          />
          {amount && (
            <AmountDisplay
              value={amount}
              size="small"
              className="pending-item-amount"
              style={{ color: '#8c8c8c' }}
            />
          )}
        </div>
      </div>
      <div className="pending-item-arrow">
        <RiArrowRightLine size={16} />
      </div>
    </div>
  );
}

/**
 * 待处理事项面板
 */
export function PendingPanel({ stats, loading }: PendingPanelProps) {
  const router = useRouter();

  if (loading) {
    return (
      <Card
        title={
          <Space>
            <RiTodoLine size={16} />
            <span>待处理事项</span>
          </Space>
        }
        variant="borderless"
        className="dashboard-pending-card"
      >
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  const pending = stats?.pending;
  const totalPending = (pending?.withdrawReviewCount ?? 0) + (pending?.incomeExceptionCount ?? 0);

  return (
    <Card
      title={
        <Space>
          <RiTodoLine size={16} />
          <span>待处理事项</span>
          {totalPending > 0 && (
            <span className="pending-total-badge">{totalPending}</span>
          )}
        </Space>
      }
      variant="borderless"
      className="dashboard-pending-card"
    >
      <div className="pending-list">
        {/* 待审核提现 */}
        <PendingItem
          title="待审核提现"
          count={pending?.withdrawReviewCount ?? 0}
          amount={pending?.withdrawReviewAmount}
          icon={<RiFileList2Line size={24} />}
          color="#faad14"
          onClick={() => router.push('/orders/withdraw?status=PENDING_REVIEW')}
        />

        {/* 收益发放异常 */}
        <PendingItem
          title="收益发放异常"
          count={pending?.incomeExceptionCount ?? 0}
          icon={<RiErrorWarningLine size={24} />}
          color="#ff4d4f"
          onClick={() => router.push('/finance/income?status=FAILED')}
        />
      </div>

      {/* 累计统计区 */}
      <div className="pending-summary">
        <Text type="secondary" className="pending-summary-title">
          累计统计
        </Text>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="总用户数"
              value={stats?.total.userCount ?? 0}
              valueStyle={{ fontSize: 18, fontWeight: 600 }}
            />
          </Col>
          <Col span={8}>
            <div className="pending-stat-item">
              <Text type="secondary" style={{ fontSize: 12 }}>总充值</Text>
              <AmountDisplay
                value={stats?.total.rechargeAmount ?? 0}
                style={{ fontSize: 18, fontWeight: 600 }}
              />
            </div>
          </Col>
          <Col span={8}>
            <div className="pending-stat-item">
              <Text type="secondary" style={{ fontSize: 12 }}>总提现</Text>
              <AmountDisplay
                value={stats?.total.withdrawAmount ?? 0}
                style={{ fontSize: 18, fontWeight: 600 }}
              />
            </div>
          </Col>
        </Row>
      </div>
    </Card>
  );
}

export default PendingPanel;
