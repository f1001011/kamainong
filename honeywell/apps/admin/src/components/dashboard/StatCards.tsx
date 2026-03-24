/**
 * @file 核心指标卡片组件
 * @description 仪表盘顶部的统计数据卡片，完整展示 12 个核心指标
 * @depends 开发文档/04-后台管理端/04.1.1-仪表盘页.md - 第 4.2 节卡片配置清单
 */

'use client';

import React from 'react';
import { Row, Col, Card, Statistic, Typography, Space, Skeleton, Tooltip } from 'antd';
import { useRouter } from 'next/navigation';
import {
  RiUserAddLine,
  RiUserHeartLine,
  RiMoneyDollarCircleLine,
  RiExchangeDollarLine,
  RiLineChartLine,
  RiShoppingCartLine,
  RiWalletLine,
  RiTeamLine,
  RiCalendarCheckLine,
  RiGiftLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiQuestionLine,
} from '@remixicon/react';
import { formatCurrency, formatNumber } from '@/utils/format';
import type { DashboardStats, CompareResult } from '@/types/dashboard';
import { calculateChange } from '@/services/dashboard';
import { useGlobalConfigStore } from '@/stores/config';

const { Text } = Typography;

interface StatCardsProps {
  /** 统计数据 */
  stats: DashboardStats | null;
  /** 是否加载中 */
  loading?: boolean;
}

/**
 * 单个统计卡片
 */
function StatCard({
  title,
  value,
  prefix,
  suffix,
  extra,
  icon,
  color,
  change,
  loading,
  tooltip,
  onClick,
  highlight,
}: {
  title: string;
  value: string | number;
  prefix?: React.ReactNode;
  suffix?: string;
  extra?: string;
  icon: React.ReactNode;
  color: string;
  change?: CompareResult;
  loading?: boolean;
  tooltip?: string;
  onClick?: () => void;
  highlight?: 'danger' | 'warning';
}) {
  if (loading) {
    return (
      <Card className="dashboard-stat-card" variant="borderless">
        <Skeleton active paragraph={{ rows: 2 }} />
      </Card>
    );
  }

  return (
    <Card 
      className={`dashboard-stat-card ${onClick ? 'clickable' : ''} ${highlight ? `highlight-${highlight}` : ''}`}
      variant="borderless"
      onClick={onClick}
    >
      <div className="stat-card-content">
        <div className="stat-card-info">
          <Text type="secondary" className="stat-card-title">
            <span className="title-text">{title}</span>
            {tooltip && (
              <Tooltip title={tooltip}>
                <RiQuestionLine size={14} className="title-help" />
              </Tooltip>
            )}
          </Text>
          <div className="stat-card-value">
            <Statistic
              value={value}
              prefix={prefix}
              suffix={suffix}
              valueStyle={{
                fontSize: 28,
                fontWeight: 600,
                fontFamily: 'Roboto Mono, monospace',
                lineHeight: 1.2,
                color: highlight === 'danger' ? '#ff4d4f' : undefined,
              }}
            />
          </div>
          {extra && (
            <Text type="secondary" className="stat-card-extra">
              {extra}
            </Text>
          )}
          {change && (
            <div className="stat-card-change">
              <Space size={4}>
                {change.trend === 'up' ? (
                  <RiArrowUpLine size={14} className="change-icon-up" />
                ) : change.trend === 'down' ? (
                  <RiArrowDownLine size={14} className="change-icon-down" />
                ) : null}
                <Text
                  className={`change-text change-text-${change.trend}`}
                >
                  {change.text}
                </Text>
                <Text type="secondary" className="change-label">
                  较昨日
                </Text>
              </Space>
            </div>
          )}
        </div>
        <div
          className="stat-card-icon"
          style={{
            background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
            color: color,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

/**
 * 核心指标卡片组
 * @description 展示完整 12 个核心指标，分 2 行布局
 * 第一行：新增用户、活跃用户、今日充值、今日提现、净入金、今日购买
 * 第二行：收益发放、返佣发放、签到奖励、活动奖励
 */
export function StatCards({ stats, loading }: StatCardsProps) {
  const router = useRouter();
  const { config } = useGlobalConfigStore();

  // 计算同比变化 - 第一行核心指标
  const newUsersChange = stats
    ? calculateChange(stats.today.newUsers, stats.yesterday.newUsers)
    : undefined;
  const activeUsersChange = stats
    ? calculateChange(stats.today.activeUsers, stats.yesterday.activeUsers)
    : undefined;
  const rechargeChange = stats
    ? calculateChange(stats.today.rechargeAmount, stats.yesterday.rechargeAmount)
    : undefined;
  const withdrawChange = stats
    ? calculateChange(stats.today.withdrawAmount, stats.yesterday.withdrawAmount)
    : undefined;
  const netInflowChange = stats
    ? calculateChange(stats.today.netInflow, stats.yesterday.netInflow)
    : undefined;
  const purchaseChange = stats
    ? calculateChange(stats.today.purchaseAmount, stats.yesterday.purchaseAmount)
    : undefined;

  // 计算同比变化 - 第二行支出指标
  const incomeChange = stats
    ? calculateChange(stats.today.incomeAmount, stats.yesterday.incomeAmount)
    : undefined;
  const commissionChange = stats
    ? calculateChange(stats.today.commissionAmount, stats.yesterday.commissionAmount)
    : undefined;
  const signInChange = stats
    ? calculateChange(stats.today.signInRewardAmount, stats.yesterday.signInRewardAmount)
    : undefined;
  const activityChange = stats
    ? calculateChange(stats.today.activityRewardAmount, stats.yesterday.activityRewardAmount)
    : undefined;

  return (
    <div className="stat-cards-container">
      {/* 第一行：5列布局 */}
      <Row gutter={[20, 20]} className="stat-cards-row">
        {/* 今日新增用户 */}
        <Col flex="20%">
          <StatCard
            title="新增用户"
            value={stats?.today.newUsers ?? 0}
            suffix="人"
            icon={<RiUserAddLine size={24} />}
            color="#722ed1"
            change={newUsersChange}
            loading={loading}
            tooltip="今日新注册的用户数量"
          />
        </Col>

        {/* 今日活跃用户 */}
        <Col flex="20%">
          <StatCard
            title="活跃用户"
            value={stats?.today.activeUsers ?? 0}
            suffix="人"
            icon={<RiUserHeartLine size={24} />}
            color="#13c2c2"
            change={activeUsersChange}
            loading={loading}
            tooltip="今日登录过的独立用户数"
          />
        </Col>

        {/* 今日充值 */}
        <Col flex="20%">
          <StatCard
            title="今日充值"
            value={stats ? formatNumber(Number(stats.today.rechargeAmount)) : 0}
            prefix={<span className="currency-symbol">{config.currencySymbol}</span>}
            extra={stats ? `${stats.today.rechargeCount} 笔` : undefined}
            icon={<RiMoneyDollarCircleLine size={24} />}
            color="#52c41a"
            change={rechargeChange}
            loading={loading}
            tooltip="今日成功充值的总金额"
            onClick={() => router.push('/orders/recharge?date=today')}
          />
        </Col>

        {/* 今日提现 */}
        <Col flex="20%">
          <StatCard
            title="今日提现"
            value={stats ? formatNumber(Number(stats.today.withdrawAmount)) : 0}
            prefix={<span className="currency-symbol">{config.currencySymbol}</span>}
            extra={stats ? `${stats.today.withdrawCount} 笔` : undefined}
            icon={<RiExchangeDollarLine size={24} />}
            color="#ff9f4a"
            change={withdrawChange}
            loading={loading}
            tooltip="今日成功提现的总金额"
            onClick={() => router.push('/orders/withdraw?date=today')}
          />
        </Col>

        {/* 净流入 */}
        <Col flex="20%">
          <StatCard
            title="净流入"
            value={stats ? formatNumber(Number(stats.today.netInflow)) : 0}
            prefix={<span className="currency-symbol">{config.currencySymbol}</span>}
            icon={<RiLineChartLine size={24} />}
            color="#1677ff"
            change={netInflowChange}
            loading={loading}
            tooltip="今日充值 - 今日提现"
            highlight={stats && Number(stats.today.netInflow) < 0 ? 'danger' : undefined}
          />
        </Col>
      </Row>

      {/* 第二行：5列布局 */}
      <Row gutter={[20, 20]} className="stat-cards-row">
        {/* 今日购买 */}
        <Col flex="20%">
          <StatCard
            title="今日购买"
            value={stats ? formatNumber(Number(stats.today.purchaseAmount)) : 0}
            prefix={<span className="currency-symbol">{config.currencySymbol}</span>}
            icon={<RiShoppingCartLine size={24} />}
            color="#eb2f96"
            change={purchaseChange}
            loading={loading}
            tooltip="今日产品购买总金额"
            onClick={() => router.push('/orders/position?date=today')}
          />
        </Col>

        {/* 收益发放 */}
        <Col flex="20%">
          <StatCard
            title="收益发放"
            value={stats ? formatNumber(Number(stats.today.incomeAmount)) : 0}
            prefix={<span className="currency-symbol">{config.currencySymbol}</span>}
            icon={<RiWalletLine size={24} />}
            color="#faad14"
            change={incomeChange}
            loading={loading}
            tooltip="今日发放的产品收益总额"
          />
        </Col>

        {/* 返佣发放 */}
        <Col flex="20%">
          <StatCard
            title="返佣发放"
            value={stats ? formatNumber(Number(stats.today.commissionAmount)) : 0}
            prefix={<span className="currency-symbol">{config.currencySymbol}</span>}
            icon={<RiTeamLine size={24} />}
            color="#2f54eb"
            change={commissionChange}
            loading={loading}
            tooltip="今日发放的团队返佣总额"
          />
        </Col>

        {/* 签到奖励 */}
        <Col flex="20%">
          <StatCard
            title="签到奖励"
            value={stats ? formatNumber(Number(stats.today.signInRewardAmount)) : 0}
            prefix={<span className="currency-symbol">{config.currencySymbol}</span>}
            icon={<RiCalendarCheckLine size={24} />}
            color="#52c41a"
            change={signInChange}
            loading={loading}
            tooltip="今日发放的签到奖励总额"
          />
        </Col>

        {/* 活动奖励 */}
        <Col flex="20%">
          <StatCard
            title="活动奖励"
            value={stats ? formatNumber(Number(stats.today.activityRewardAmount)) : 0}
            prefix={<span className="currency-symbol">{config.currencySymbol}</span>}
            icon={<RiGiftLine size={24} />}
            color="#eb2f96"
            change={activityChange}
            loading={loading}
            tooltip="今日发放的活动奖励总额"
          />
        </Col>
      </Row>
    </div>
  );
}

export default StatCards;
