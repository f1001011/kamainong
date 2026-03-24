/**
 * @file 仪表盘骨架屏组件
 * @description 页面级别的 loading 骨架屏，提升用户体验
 * @depends 开发文档/04-后台管理端/04.1.1-仪表盘页.md - UX设计规范
 */

'use client';

import React from 'react';
import { Row, Col, Card, Skeleton, Space } from 'antd';

/**
 * 统计卡片骨架屏
 */
function StatCardSkeleton() {
  return (
    <Card className="dashboard-stat-card" variant="borderless">
      <div className="stat-card-content">
        <div className="stat-card-info" style={{ flex: 1 }}>
          <Skeleton.Input active size="small" style={{ width: 80, marginBottom: 8 }} />
          <Skeleton.Input active size="large" style={{ width: 120, height: 32, marginBottom: 8 }} />
          <Skeleton.Input active size="small" style={{ width: 60 }} />
        </div>
        <Skeleton.Avatar active size={56} shape="square" style={{ borderRadius: 12 }} />
      </div>
    </Card>
  );
}

/**
 * 待审核提现卡片骨架屏
 */
function PendingWithdrawSkeleton() {
  return (
    <Card className="pending-withdraw-card loading" variant="borderless">
      <div className="pending-withdraw-content">
        <div className="pending-withdraw-left">
          <Skeleton.Avatar active size={64} shape="square" style={{ borderRadius: 12 }} />
        </div>
        <div className="pending-withdraw-center" style={{ flex: 1, padding: '0 16px' }}>
          <Skeleton.Input active size="small" style={{ width: 100, marginBottom: 8 }} />
          <Skeleton.Input active size="large" style={{ width: 80, height: 36, marginBottom: 8 }} />
          <Skeleton.Input active size="small" style={{ width: 120 }} />
        </div>
        <div className="pending-withdraw-right">
          <Skeleton.Input active size="small" style={{ width: 80 }} />
        </div>
      </div>
    </Card>
  );
}

/**
 * 累计数据卡片骨架屏
 */
function TotalCardSkeleton() {
  return (
    <Card variant="borderless" className="dashboard-total-card">
      <Space style={{ marginBottom: 16 }}>
        <Skeleton.Avatar active size={20} shape="circle" />
        <Skeleton.Input active size="small" style={{ width: 80 }} />
      </Space>
      <Row gutter={[16, 16]}>
        {[1, 2, 3].map((i) => (
          <Col span={8} key={i}>
            <Skeleton.Input active size="small" style={{ width: 60, marginBottom: 8 }} />
            <Skeleton.Input active size="default" style={{ width: 100 }} />
          </Col>
        ))}
      </Row>
    </Card>
  );
}

/**
 * 通道余额卡片骨架屏
 */
function ChannelCardSkeleton() {
  return (
    <Card variant="borderless" className="dashboard-channel-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space>
          <Skeleton.Avatar active size={20} shape="circle" />
          <Skeleton.Input active size="small" style={{ width: 100 }} />
        </Space>
        <Skeleton.Input active size="small" style={{ width: 100 }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Skeleton.Input active size="small" style={{ width: 60 }} />
          <Skeleton.Input active size="small" style={{ width: 80 }} />
        </div>
        <Skeleton.Input active size="small" style={{ width: '100%', height: 8 }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Skeleton.Input active size="small" style={{ width: 60 }} />
          <Skeleton.Input active size="small" style={{ width: 80 }} />
        </div>
        <Skeleton.Input active size="small" style={{ width: '100%', height: 8 }} />
      </div>
      <div style={{ paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
        <Skeleton.Input active size="small" style={{ width: 200 }} />
      </div>
    </Card>
  );
}

/**
 * 图表卡片骨架屏
 */
function ChartCardSkeleton({ title = '图表' }: { title?: string }) {
  return (
    <Card
      title={title}
      variant="borderless"
      className="dashboard-chart-card"
      extra={<Skeleton.Input active size="small" style={{ width: 120 }} />}
    >
      <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Skeleton.Node active style={{ width: '100%', height: 280 }}>
          <div style={{ width: '100%', height: '100%' }} />
        </Skeleton.Node>
      </div>
    </Card>
  );
}

/**
 * 实时在线卡片骨架屏
 */
function OnlineCardSkeleton() {
  return (
    <Card variant="borderless" className="dashboard-online-card" style={{ background: '#f5f5f5' }}>
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <Skeleton.Input active size="small" style={{ width: 80, marginBottom: 16 }} />
        <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Skeleton.Avatar active size={80} shape="circle" />
        </div>
        <Skeleton.Input active size="small" style={{ width: 120, marginTop: 16 }} />
      </div>
    </Card>
  );
}

/**
 * 订单列表卡片骨架屏
 */
function OrderListSkeleton({ title = '最近订单' }: { title?: string }) {
  return (
    <Card
      title={
        <Space>
          <Skeleton.Avatar active size={16} shape="circle" />
          <span>{title}</span>
        </Space>
      }
      variant="borderless"
      className="dashboard-orders-card"
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ padding: '8px 0' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: i < 5 ? '1px solid #f5f5f5' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Skeleton.Avatar active size={16} shape="circle" />
              <div>
                <Skeleton.Input active size="small" style={{ width: 80, marginBottom: 4 }} />
                <Skeleton.Input active size="small" style={{ width: 60, height: 12 }} />
              </div>
            </div>
            <Skeleton.Input active size="small" style={{ width: 80 }} />
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * 告警面板骨架屏
 */
function AlertPanelSkeleton() {
  return (
    <Card
      title={
        <Space>
          <Skeleton.Avatar active size={16} shape="circle" />
          <span>异常告警</span>
        </Space>
      }
      variant="borderless"
      className="dashboard-alert-card"
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
        <Skeleton.Avatar active size={80} shape="circle" style={{ marginBottom: 16 }} />
        <Skeleton.Input active size="small" style={{ width: 100, marginBottom: 8 }} />
        <Skeleton.Input active size="small" style={{ width: 80 }} />
      </div>
    </Card>
  );
}

/**
 * 待处理面板骨架屏
 */
function PendingPanelSkeleton() {
  return (
    <Card
      title={
        <Space>
          <Skeleton.Avatar active size={16} shape="circle" />
          <span>待处理事项</span>
        </Space>
      }
      variant="borderless"
      className="dashboard-pending-card"
    >
      <div style={{ marginBottom: 20 }}>
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 16,
              background: '#fafafa',
              borderRadius: 8,
              marginBottom: i < 2 ? 12 : 0,
            }}
          >
            <Skeleton.Avatar active size={48} shape="square" style={{ borderRadius: 12 }} />
            <div style={{ flex: 1 }}>
              <Skeleton.Input active size="small" style={{ width: 80, marginBottom: 8 }} />
              <Skeleton.Input active size="default" style={{ width: 60 }} />
            </div>
            <Skeleton.Avatar active size={16} shape="circle" />
          </div>
        ))}
      </div>
      <div style={{ paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
        <Skeleton.Input active size="small" style={{ width: 60, marginBottom: 12 }} />
        <Row gutter={16}>
          {[1, 2, 3].map((i) => (
            <Col span={8} key={i}>
              <Skeleton.Input active size="small" style={{ width: 50, marginBottom: 4 }} />
              <Skeleton.Input active size="default" style={{ width: 60 }} />
            </Col>
          ))}
        </Row>
      </div>
    </Card>
  );
}

/**
 * 仪表盘页面骨架屏
 * @description 完整的页面级骨架屏，与实际页面布局一致
 */
export function DashboardSkeleton() {
  return (
    <div className="dashboard-page dashboard-skeleton">
      {/* 页面头部 */}
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <Skeleton.Input active size="large" style={{ width: 100, marginBottom: 8 }} />
          <Skeleton.Input active size="small" style={{ width: 200 }} />
        </div>
        <div className="dashboard-header-right">
          <Space>
            <Skeleton.Input active size="small" style={{ width: 100 }} />
            <Skeleton.Button active size="default" style={{ width: 80 }} />
          </Space>
        </div>
      </div>

      {/* 第1层：待审核提现卡片 */}
      <div className="dashboard-section">
        <PendingWithdrawSkeleton />
      </div>

      {/* 第2层：核心今日指标（10个指标卡片） */}
      <div className="dashboard-section">
        {/* 第一行：6个核心财务指标 */}
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Col xs={12} sm={8} lg={4} key={i}>
              <StatCardSkeleton />
            </Col>
          ))}
        </Row>
        {/* 第二行：4个支出指标 */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <Col xs={12} sm={6} lg={4} key={i}>
              <StatCardSkeleton />
            </Col>
          ))}
        </Row>
      </div>

      {/* 第3层：累计数据 + 支付通道余额 */}
      <div className="dashboard-section">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <TotalCardSkeleton />
          </Col>
          <Col xs={24} lg={12}>
            <ChannelCardSkeleton />
          </Col>
        </Row>
      </div>

      {/* 第4层：图表区 */}
      <div className="dashboard-section">
        <Row gutter={[24, 24]}>
          <Col xs={24} xl={12}>
            <ChartCardSkeleton title="充提趋势" />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <ChartCardSkeleton title="用户增长趋势" />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <ChartCardSkeleton title="产品销量分布" />
          </Col>
        </Row>
      </div>

      {/* 第5层：最近订单 */}
      <div className="dashboard-section">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <OrderListSkeleton title="最近充值" />
          </Col>
          <Col xs={24} md={12}>
            <OrderListSkeleton title="最近提现" />
          </Col>
        </Row>
      </div>

      {/* 第6层：实时数据 + 异常告警 + 待处理事项 */}
      <div className="dashboard-section">
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={8}>
            <OnlineCardSkeleton />
          </Col>
          <Col xs={24} lg={8}>
            <AlertPanelSkeleton />
          </Col>
          <Col xs={24} lg={8}>
            <PendingPanelSkeleton />
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default DashboardSkeleton;
