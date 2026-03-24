/**
 * @file 累计数据 + 支付通道余额卡片组件
 * @description 展示累计统计数据和支付通道余额
 * @depends 开发文档/04-后台管理端/04.1.1-仪表盘页.md - 第 4.3 节
 * @uses AmountDisplay - 金额显示复用组件
 */

'use client';

import React from 'react';
import { Row, Col, Card, Statistic, Progress, Typography, Space, Skeleton, Tooltip } from 'antd';
import {
  RiGroupFill,
  RiWalletFill,
  RiBankFill,
  RiInformationLine,
} from '@remixicon/react';
import type { TotalStats, ChannelBalance } from '@/types/dashboard';
import { useGlobalConfigStore } from '@/stores/config';
import { AmountDisplay } from '@/components/common/AmountDisplay';

const { Text } = Typography;

interface TotalAndChannelCardsProps {
  /** 累计数据 */
  total: TotalStats | null;
  /** 通道余额 */
  channelBalance: ChannelBalance | null;
  /** 是否加载中 */
  loading?: boolean;
}

/**
 * 累计数据 + 支付通道余额卡片
 */
export function TotalAndChannelCards({
  total,
  channelBalance,
  loading,
}: TotalAndChannelCardsProps) {
  const { config } = useGlobalConfigStore();

  if (loading) {
    return (
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card variant="borderless" className="dashboard-total-card">
            <Skeleton active paragraph={{ rows: 3 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card variant="borderless" className="dashboard-channel-card">
            <Skeleton active paragraph={{ rows: 3 }} />
          </Card>
        </Col>
      </Row>
    );
  }

  // 计算通道余额百分比
  const lwpayBalance = Number(channelBalance?.LWPAY ?? 0);
  const uzpayBalance = Number(channelBalance?.UZPAY ?? 0);
  const totalChannelBalance = lwpayBalance + uzpayBalance;
  const lwpayPercent = totalChannelBalance > 0
    ? Math.round((lwpayBalance / totalChannelBalance) * 100)
    : 50;

  return (
    <Row gutter={[24, 24]}>
      {/* 累计数据卡片 */}
      <Col xs={24} lg={12}>
        <Card
          title={
            <Space>
              <RiWalletFill className="card-title-icon" style={{ color: '#1677ff' }} />
              <span>累计数据</span>
            </Space>
          }
          variant="borderless"
          className="dashboard-total-card"
        >
          <Row gutter={[20, 20]}>
            <Col span={8}>
              <div className="total-stat-item">
                <div className="total-stat-icon" style={{ backgroundColor: '#1677ff15' }}>
                  <RiGroupFill size={24} style={{ color: '#1677ff' }} />
                </div>
                <Statistic
                  title="总用户数"
                  value={total?.userCount ?? 0}
                  suffix="人"
                  valueStyle={{ 
                    fontSize: 22, 
                    fontWeight: 600,
                    color: '#1677ff',
                    fontFamily: 'Roboto Mono, monospace',
                  }}
                />
              </div>
            </Col>
            <Col span={8}>
              <div className="total-stat-item">
                <Text type="secondary" style={{ fontSize: 14, marginBottom: 12, display: 'block' }}>累计充值</Text>
                <AmountDisplay
                  value={total?.rechargeAmount ?? 0}
                  size="large"
                  style={{ color: '#52c41a', fontSize: 22, fontWeight: 600 }}
                />
              </div>
            </Col>
            <Col span={8}>
              <div className="total-stat-item">
                <Text type="secondary" style={{ fontSize: 14, marginBottom: 12, display: 'block' }}>累计提现</Text>
                <AmountDisplay
                  value={total?.withdrawAmount ?? 0}
                  size="large"
                  style={{ color: '#ff9f4a', fontSize: 22, fontWeight: 600 }}
                />
              </div>
            </Col>
          </Row>
        </Card>
      </Col>

      {/* 支付通道余额卡片 */}
      <Col xs={24} lg={12}>
        <Card
          title={
            <Space>
              <RiBankFill className="card-title-icon" style={{ color: '#52c41a' }} />
              <span>支付通道余额</span>
            </Space>
          }
          extra={
            <Text type="secondary" className="channel-total-label">
              合计 <AmountDisplay value={totalChannelBalance} size="small" />
            </Text>
          }
          variant="borderless"
          className="dashboard-channel-card"
        >
          <div className="channel-balance-list">
            {/* LWPAY 通道 */}
            <div className="channel-balance-item">
              <div className="channel-info">
                <Text strong>LWPAY</Text>
                <AmountDisplay
                  value={lwpayBalance}
                  className="channel-amount"
                  style={{ color: '#52c41a' }}
                />
              </div>
              <Progress
                percent={lwpayPercent}
                showInfo={false}
                strokeColor="#52c41a"
                trailColor="#f0f0f0"
                size="small"
              />
            </div>

            {/* UZPAY 通道 */}
            <div className="channel-balance-item">
              <div className="channel-info">
                <Text strong>UZPAY</Text>
                <AmountDisplay
                  value={uzpayBalance}
                  className="channel-amount"
                  style={{ color: '#1677ff' }}
                />
              </div>
              <Progress
                percent={100 - lwpayPercent}
                showInfo={false}
                strokeColor="#1677ff"
                trailColor="#f0f0f0"
                size="small"
              />
            </div>
          </div>

          {/* 提示信息 */}
          <div className="channel-tip">
            <Tooltip title="余额过低时请及时充值，避免影响代付业务">
              <Space size={4}>
                <RiInformationLine size={14} style={{ color: '#8c8c8c' }} />
                <Text type="secondary" className="tip-text">
                  建议保持各通道余额充足，确保提现业务正常运行
                </Text>
              </Space>
            </Tooltip>
          </div>
        </Card>
      </Col>
    </Row>
  );
}

export default TotalAndChannelCards;
