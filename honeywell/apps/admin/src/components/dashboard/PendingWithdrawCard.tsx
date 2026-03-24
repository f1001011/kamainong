/**
 * @file 待审核提现卡片组件
 * @description 红色高亮的待审核提现卡片，支持脉冲动画和点击跳转
 * @depends 开发文档/04-后台管理端/04.1.1-仪表盘页.md - 第 4.2.3 节
 */

'use client';

import React from 'react';
import { Card, Statistic, Typography, Space } from 'antd';
import { useRouter } from 'next/navigation';
import {
  RiFileList2Line,
  RiArrowRightLine,
} from '@remixicon/react';
import type { PendingStats } from '@/types/dashboard';
import { useGlobalConfigStore } from '@/stores/config';

const { Text } = Typography;

interface PendingWithdrawCardProps {
  /** 待处理统计数据 */
  pending: PendingStats | null;
  /** 是否加载中 */
  loading?: boolean;
}

/**
 * 待审核提现卡片
 * @description 红色高亮显示，点击跳转到待审核提现列表
 */
export function PendingWithdrawCard({ pending, loading }: PendingWithdrawCardProps) {
  const router = useRouter();
  const { config } = useGlobalConfigStore();

  const handleClick = () => {
    router.push('/orders/withdraw?status=PENDING_REVIEW');
  };

  const count = pending?.withdrawReviewCount ?? 0;
  const amount = Number(pending?.withdrawReviewAmount ?? 0);
  const hasItems = count > 0;

  if (loading) {
    return (
      <Card className="pending-withdraw-card loading" variant="borderless">
        <div className="pending-withdraw-skeleton" />
      </Card>
    );
  }

  return (
    <Card
      className={`pending-withdraw-card ${hasItems ? 'has-items' : ''}`}
      variant="borderless"
      onClick={handleClick}
    >
      <div className="pending-withdraw-content">
        {/* 左侧：图标 + 标题 */}
        <div className="pending-withdraw-left">
          <div className="pending-withdraw-icon">
            <RiFileList2Line size={32} />
            {/* 脉冲动画 - 仅在有待处理项时显示 */}
            {hasItems && (
              <>
                <span className="pulse-ring" />
                <span className="pulse-ring delay-1" />
              </>
            )}
          </div>
        </div>

        {/* 中间：数据 */}
        <div className="pending-withdraw-center">
          <div className="pending-withdraw-header">
            <Space size={8}>
              {/* 脉冲点 */}
              {hasItems && (
                <span className="pulse-dot">
                  <span className="pulse-dot-inner" />
                  <span className="pulse-dot-ring" />
                </span>
              )}
              <Text strong className="pending-withdraw-title">
                待审核提现
              </Text>
            </Space>
          </div>
          
          <div className="pending-withdraw-stats">
            <Statistic
              value={count}
              suffix="笔"
              valueStyle={{
                fontSize: 32,
                fontWeight: 700,
                color: hasItems ? '#ff4d4f' : '#8c8c8c',
                fontFamily: 'Roboto Mono, monospace',
              }}
            />
          </div>

          <div className="pending-withdraw-amount">
            <Text type={hasItems ? undefined : 'secondary'} className="amount-text">
              金额 {config.currencySymbol}{config.currencySpace ? ' ' : ''}{amount.toLocaleString()}
            </Text>
          </div>
        </div>

        {/* 右侧：立即处理按钮 */}
        <div className="pending-withdraw-right">
          <div className="pending-withdraw-action">
            <Text className="action-text">
              {hasItems ? '立即处理' : '暂无待审'}
            </Text>
            <RiArrowRightLine size={16} />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default PendingWithdrawCard;
