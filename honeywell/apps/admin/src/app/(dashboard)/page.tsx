/**
 * @file 仪表盘首页
 * @description 后台管理系统仪表盘，展示核心数据统计、趋势图表、实时数据
 * @depends 开发文档/04-后台管理端/04.1.1-仪表盘页.md
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第2节
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col, Typography, Space, Button, Alert, App } from 'antd';
import {
  RiRefreshLine,
  RiTimeLine,
  RiAlertLine,
} from '@remixicon/react';
import { StatCards } from '@/components/dashboard/StatCards';
import { PendingWithdrawCard } from '@/components/dashboard/PendingWithdrawCard';
import { TotalAndChannelCards } from '@/components/dashboard/TotalAndChannelCards';
import { FinanceTrendChart } from '@/components/dashboard/TrendCharts';
import { UserTrendChart } from '@/components/dashboard/UserTrendChart';
import { ProductSalesChart } from '@/components/dashboard/ProductSalesChart';
import { RecentOrdersPanel } from '@/components/dashboard/RecentOrdersPanel';
import { AlertPanel } from '@/components/dashboard/AlertPanel';
import { PendingPanel } from '@/components/dashboard/PendingPanel';
import { RealtimePanel } from '@/components/dashboard/RealtimePanel';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  fetchDashboardStats,
  fetchTrendData,
  fetchRealtimeData,
  fetchAlerts,
  ALERT_TYPE_MAP,
} from '@/services/dashboard';
import type {
  DashboardStats,
  TrendData,
  RealtimeData,
  AlertsData,
  TrendRange,
  TotalStats,
  ChannelBalance,
} from '@/types/dashboard';
import { useRouter } from 'next/navigation';
import { get } from '@/utils/request';

const { Title, Text } = Typography;

/** 实时数据刷新间隔（毫秒） */
const REALTIME_REFRESH_INTERVAL = 30000;

/**
 * 仪表盘页面
 */
export default function DashboardPage() {
  const router = useRouter();
  const { message } = App.useApp();

  // 数据状态
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null);
  const [alertsData, setAlertsData] = useState<AlertsData | null>(null);
  const [totalStats, setTotalStats] = useState<TotalStats | null>(null);
  const [channelBalance, setChannelBalance] = useState<ChannelBalance | null>(null);

  // 加载状态
  const [loading, setLoading] = useState(true);
  const [realtimeLoading, setRealtimeLoading] = useState(false);

  // 趋势图范围（分别控制）
  const [financeTrendRange, setFinanceTrendRange] = useState<TrendRange>('7d');
  const [userTrendRange, setUserTrendRange] = useState<TrendRange>('7d');

  // 刷新时间 - 使用 null 初始化避免 SSR 水合不匹配
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshAgo, setRefreshAgo] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  // 定时器引用
  const realtimeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const refreshAgoTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 加载核心统计数据
   */
  const loadStats = useCallback(async () => {
    try {
      const data = await fetchDashboardStats();
      setStats(data);
      // 从 stats 中提取 total 数据
      if (data?.total) {
        setTotalStats(data.total);
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  }, []);

  /**
   * 加载趋势数据
   */
  const loadTrendData = useCallback(async (range: TrendRange) => {
    try {
      const data = await fetchTrendData(range);
      setTrendData(data);
    } catch (error) {
      console.error('加载趋势数据失败:', error);
    }
  }, []);

  /**
   * 加载实时数据
   * @description 实时数据中包含通道余额信息
   */
  const loadRealtimeData = useCallback(async () => {
    try {
      setRealtimeLoading(true);
      const data = await fetchRealtimeData();
      setRealtimeData(data);
      // 通道余额从实时数据中提取
      if (data?.channelBalance) {
        setChannelBalance(data.channelBalance);
      }
    } catch (error) {
      console.error('加载实时数据失败:', error);
    } finally {
      setRealtimeLoading(false);
    }
  }, []);

  /**
   * 加载告警数据
   */
  const loadAlerts = useCallback(async () => {
    try {
      const data = await fetchAlerts();
      setAlertsData(data);
    } catch (error) {
      console.error('加载告警数据失败:', error);
    }
  }, []);

  /**
   * 加载支付通道余额
   * @description 通道余额数据从 /dashboard/realtime 接口的 channelBalance 字段获取
   * 因此这个单独的函数已不需要，数据在 loadRealtimeData 中一起获取
   */
  const loadChannelBalance = useCallback(async () => {
    // 通道余额已包含在 realtime 接口中，无需单独请求
  }, []);

  /**
   * 加载所有数据
   */
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadTrendData(financeTrendRange),
        loadRealtimeData(),
        loadAlerts(),
        loadChannelBalance(),
      ]);
      setLastRefresh(new Date());
      setRefreshAgo(0);
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('数据加载失败，请刷新重试');
    } finally {
      setLoading(false);
    }
  }, [loadStats, loadTrendData, loadRealtimeData, loadAlerts, loadChannelBalance, financeTrendRange]);

  /**
   * 手动刷新
   */
  const handleRefresh = useCallback(() => {
    loadAllData();
  }, [loadAllData]);

  /**
   * 处理充提趋势范围变更
   */
  const handleFinanceTrendRangeChange = useCallback((range: TrendRange) => {
    setFinanceTrendRange(range);
    loadTrendData(range);
  }, [loadTrendData]);

  /**
   * 处理用户趋势范围变更（需要重新获取用户趋势数据）
   */
  const handleUserTrendRangeChange = useCallback((range: TrendRange) => {
    setUserTrendRange(range);
    // 用户趋势数据已在 trendData 中，无需重新请求
    // 但如果 API 支持单独请求，可以在此处调用
    loadTrendData(range);
  }, [loadTrendData]);

  /**
   * 处理告警点击
   */
  const handleAlertClick = useCallback((type: string) => {
    const info = ALERT_TYPE_MAP[type];
    if (info?.route) {
      router.push(info.route);
    }
  }, [router]);

  // 客户端挂载标记 - 避免 SSR 水合不匹配
  useEffect(() => {
    setMounted(true);
    setLastRefresh(new Date());
  }, []);

  // 初始化加载
  useEffect(() => {
    if (mounted) {
      loadAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // 实时数据轮询（30秒）
  useEffect(() => {
    realtimeTimerRef.current = setInterval(() => {
      loadRealtimeData();
      loadAlerts();
    }, REALTIME_REFRESH_INTERVAL);

    return () => {
      if (realtimeTimerRef.current) {
        clearInterval(realtimeTimerRef.current);
      }
    };
  }, [loadRealtimeData, loadAlerts]);

  // 更新刷新时间显示
  useEffect(() => {
    if (!lastRefresh) return;
    
    refreshAgoTimerRef.current = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000);
      setRefreshAgo(diff);
    }, 1000);

    return () => {
      if (refreshAgoTimerRef.current) {
        clearInterval(refreshAgoTimerRef.current);
      }
    };
  }, [lastRefresh]);

  // 格式化刷新时间
  const formatRefreshAgo = (seconds: number): string => {
    if (seconds < 60) return `${seconds}秒前`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`;
    return `${Math.floor(seconds / 3600)}小时前`;
  };

  // 判断是否有告警
  const hasAlerts = alertsData?.alerts && alertsData.alerts.length > 0;
  
  // 首次加载时显示骨架屏
  const isInitialLoading = loading && !stats;

  // 首次加载显示完整骨架屏
  if (isInitialLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="dashboard-page">
      {/* 顶部告警条 - 有异常时显示 */}
      {hasAlerts && (
        <Alert
          message={
            <Space>
              <RiAlertLine size={16} />
              <span>
                系统存在 {alertsData?.alerts.length} 条异常告警需要处理
              </span>
            </Space>
          }
          type="error"
          showIcon={false}
          banner
          className="dashboard-alert-banner"
          action={
            <Button
              size="small"
              type="link"
              onClick={() => handleAlertClick(alertsData?.alerts[0]?.type ?? '')}
            >
              立即处理
            </Button>
          }
        />
      )}

      {/* 页面头部 */}
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <Title level={4} style={{ marginBottom: 4 }}>
            仪表盘
          </Title>
          <Text type="secondary">
            欢迎回来，这是今日的数据概览
          </Text>
        </div>
        <div className="dashboard-header-right">
          <Space>
            <Text type="secondary" className="refresh-time">
              <RiTimeLine size={14} />
              上次刷新: {mounted ? formatRefreshAgo(refreshAgo) : '--'}
            </Text>
            <Button
              icon={<RiRefreshLine size={16} />}
              onClick={handleRefresh}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </div>
      </div>

      {/* 第1层：待审核提现红色高亮卡片 */}
      <div className="dashboard-section">
        <PendingWithdrawCard
          pending={stats?.pending ?? null}
          loading={loading}
        />
      </div>

      {/* 第2层：核心今日指标（10个指标卡片，2行） */}
      <div className="dashboard-section">
        <StatCards stats={stats} loading={loading} />
      </div>

      {/* 第3层：累计数据 + 支付通道余额 */}
      <div className="dashboard-section">
        <TotalAndChannelCards
          total={totalStats}
          channelBalance={channelBalance}
          loading={loading}
        />
      </div>

      {/* 第4层：图表区（充提趋势 + 用户增长 + 产品销量） */}
      <div className="dashboard-section">
        <Row gutter={[28, 28]}>
          {/* 充提趋势面积图 - 占据更大空间 */}
          <Col xs={24} lg={14}>
            <FinanceTrendChart
              trendData={trendData}
              range={financeTrendRange}
              loading={loading}
              onRangeChange={handleFinanceTrendRangeChange}
            />
          </Col>

          {/* 右侧双图表列 */}
          <Col xs={24} lg={10}>
            <Row gutter={[0, 24]}>
              {/* 用户增长趋势双轴图 */}
              <Col span={24}>
                <UserTrendChart
                  data={trendData}
                  range={userTrendRange}
                  loading={loading}
                  onRangeChange={handleUserTrendRangeChange}
                />
              </Col>

              {/* 产品销量分布饼图 */}
              <Col span={24}>
                <ProductSalesChart externalLoading={loading} />
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      {/* 第5层：最近订单（充值+提现分开） */}
      <div className="dashboard-section">
        <RecentOrdersPanel
          recharges={realtimeData?.recentRecharges ?? []}
          withdraws={realtimeData?.recentWithdraws ?? []}
          loading={realtimeLoading && !realtimeData}
        />
      </div>

      {/* 第6层：实时数据 + 异常告警 + 待处理事项 */}
      <div className="dashboard-section">
        <Row gutter={[28, 28]}>
          {/* 实时在线用户 */}
          <Col xs={24} lg={8}>
            <RealtimePanel
              data={realtimeData}
              loading={realtimeLoading && !realtimeData}
            />
          </Col>

          {/* 异常告警 */}
          <Col xs={24} lg={8}>
            <AlertPanel
              data={alertsData}
              loading={loading}
            />
          </Col>

          {/* 待处理事项 */}
          <Col xs={24} lg={8}>
            <PendingPanel
              stats={stats}
              loading={loading}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
}
