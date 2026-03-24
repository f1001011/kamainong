/**
 * @file 实时数据监控页
 * @description 提供实时数据看板，包含在线用户监控、实时交易监控、系统状态监控
 * @depends 开发文档.md 第13.23节 - 实时数据监控
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第22节 - 实时数据监控接口
 */

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Space,
  Typography,
  Switch,
  Badge,
  Table,
  Tooltip,
  Progress,
  Empty,
  Skeleton,
  App,
  ConfigProvider,
  theme,
} from 'antd';
import {
  RiFullscreenLine,
  RiFullscreenExitLine,
  RiRefreshLine,
  RiTimeLine,
  RiUser3Line,
  RiExchangeDollarLine,
  RiServerLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiSmartphoneLine,
  RiComputerLine,
  RiTabletLine,
  RiQuestionLine,
  RiSunLine,
  RiMoonLine,
  RiAlertLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiErrorWarningLine,
  RiPauseLine,
  RiPlayLine,
  RiExpandRightLine,
} from '@remixicon/react';
import { Area } from '@ant-design/charts';
import type { ColumnsType } from 'antd/es/table';
import { StatisticCard, StatisticCardGroup } from '@/components/common/StatisticCard';
import { AmountDisplay } from '@/components/common/AmountDisplay';
import { TimeDisplay } from '@/components/common/TimeDisplay';
import { MaskedText } from '@/components/common/MaskedText';
import { ChannelStatusBadge, TaskStatusBadge } from '@/components/common/StatusBadge';
import {
  fetchOnlineUserStats,
  fetchOnlineUserList,
  fetchRealtimeTransactions,
  fetchSystemStatus,
  fetchTasksStatus,
  mergeTransactions,
  REFRESH_INTERVALS,
} from '@/services/realtime';
import type {
  OnlineUserStats,
  OnlineUser,
  RealtimeTransactions,
  SystemStatusData,
  TaskStatusInfo,
  UnifiedTransaction,
  HourlyStat,
  DeviceType,
} from '@/types/realtime';
import {
  formatOnlineDuration,
  calculateChangePercent,
  HIGHLIGHT_AMOUNT_THRESHOLD,
  TRANSACTION_TYPE_CONFIG,
} from '@/types/realtime';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

// ==================== 设备图标组件 ====================
const DeviceIcon: React.FC<{ deviceType: DeviceType; size?: number }> = ({ deviceType, size = 16 }) => {
  switch (deviceType) {
    case 'mobile':
      return <RiSmartphoneLine size={size} />;
    case 'desktop':
      return <RiComputerLine size={size} />;
    case 'tablet':
      return <RiTabletLine size={size} />;
    default:
      return <RiQuestionLine size={size} />;
  }
};

// ==================== 状态指示器组件 ====================
interface StatusIndicatorProps {
  status: 'normal' | 'warning' | 'critical';
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'normal':
        return { color: '#52c41a', animation: 'breath', label: '正常' };
      case 'warning':
        return { color: '#faad14', animation: 'blink', label: '有告警' };
      case 'critical':
        return { color: '#ff4d4f', animation: 'solid', label: '严重异常' };
    }
  };

  const config = getStatusConfig();

  return (
    <Tooltip title={config.label}>
      <span
        className={`status-indicator status-indicator-${config.animation}`}
        style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: config.color,
          boxShadow: `0 0 8px ${config.color}`,
        }}
      />
    </Tooltip>
  );
};

// ==================== 交易列表项组件 ====================
interface TransactionItemProps {
  transaction: UnifiedTransaction;
  darkMode: boolean;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, darkMode }) => {
  const config = TRANSACTION_TYPE_CONFIG[transaction.type];
  const isHighlight = Number(transaction.amount) > HIGHLIGHT_AMOUNT_THRESHOLD;

  return (
    <div
      className="transaction-item"
      style={{
        padding: '12px 16px',
        marginBottom: 8,
        borderRadius: 8,
        backgroundColor: darkMode ? config.bgColor.replace('0.1', '0.2') : config.bgColor,
        border: isHighlight ? `2px solid ${config.color}` : '1px solid transparent',
        transition: 'all 0.3s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space size={12}>
          <Badge color={config.color} />
          <Text strong style={{ color: config.color }}>
            {config.label}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {transaction.userPhone}
          </Text>
          {transaction.productName && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {transaction.productName}
            </Text>
          )}
          {transaction.channelName && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {transaction.channelName}
            </Text>
          )}
        </Space>
        <Space size={16}>
          <AmountDisplay
            value={transaction.amount}
            highlight={isHighlight}
            size={isHighlight ? 'large' : 'default'}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {transaction.timeAgo}
          </Text>
        </Space>
      </div>
    </div>
  );
};

// ==================== 主页面组件 ====================
export default function RealtimeMonitorPage() {
  const router = useRouter();
  const { message } = App.useApp();

  // ========== 状态定义 ==========
  // 数据状态
  const [onlineStats, setOnlineStats] = useState<OnlineUserStats | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [transactions, setTransactions] = useState<RealtimeTransactions | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatusData | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatusInfo[]>([]);

  // UI 状态
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(REFRESH_INTERVALS.DEFAULT);
  const [countdown, setCountdown] = useState(REFRESH_INTERVALS.DEFAULT / 1000);
  const [isPaused, setIsPaused] = useState(false);
  const [showOnlineUserList, setShowOnlineUserList] = useState(false);

  // 滚动状态
  const [isScrollPaused, setIsScrollPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 定时器引用
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 页面容器引用（用于全屏）
  const pageContainerRef = useRef<HTMLDivElement>(null);

  // ========== 数据加载函数 ==========
  /**
   * 加载在线用户统计数据
   */
  const loadOnlineStats = useCallback(async () => {
    try {
      const data = await fetchOnlineUserStats();
      setOnlineStats(data);
    } catch (error) {
      console.error('加载在线用户统计失败:', error);
    }
  }, []);

  /**
   * 加载在线用户列表
   */
  const loadOnlineUserList = useCallback(async () => {
    try {
      const data = await fetchOnlineUserList({ pageSize: 100 });
      setOnlineUsers(data.list || []);
    } catch (error) {
      console.error('加载在线用户列表失败:', error);
    }
  }, []);

  /**
   * 加载实时交易数据
   */
  const loadTransactions = useCallback(async () => {
    try {
      const data = await fetchRealtimeTransactions(50);
      setTransactions(data);
    } catch (error) {
      console.error('加载实时交易数据失败:', error);
    }
  }, []);

  /**
   * 加载系统状态数据
   */
  const loadSystemStatus = useCallback(async () => {
    try {
      const [status, tasks] = await Promise.all([
        fetchSystemStatus(),
        fetchTasksStatus(),
      ]);
      setSystemStatus(status);
      setTaskStatus(tasks);
    } catch (error) {
      console.error('加载系统状态失败:', error);
    }
  }, []);

  /**
   * 加载所有数据
   */
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadOnlineStats(),
        loadOnlineUserList(),
        loadTransactions(),
        loadSystemStatus(),
      ]);
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  }, [loadOnlineStats, loadOnlineUserList, loadTransactions, loadSystemStatus, message]);

  /**
   * 手动刷新
   */
  const handleRefresh = useCallback(() => {
    setCountdown(refreshInterval / 1000);
    loadAllData();
  }, [loadAllData, refreshInterval]);

  // ========== 全屏控制 ==========
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await pageContainerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.error('进入全屏失败:', error);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (error) {
        console.error('退出全屏失败:', error);
      }
    }
  }, []);

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // ========== 定时刷新 ==========
  useEffect(() => {
    // 初始加载
    loadAllData();

    return () => {
      // 清理定时器
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 刷新定时器
  useEffect(() => {
    if (isPaused) {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      return;
    }

    refreshTimerRef.current = setInterval(() => {
      loadAllData();
      setCountdown(refreshInterval / 1000);
    }, refreshInterval);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [refreshInterval, isPaused, loadAllData]);

  // 倒计时定时器
  useEffect(() => {
    if (isPaused) {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      return;
    }

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : refreshInterval / 1000));
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [refreshInterval, isPaused]);

  // ========== 自动滚动 ==========
  useEffect(() => {
    if (isScrollPaused || !scrollContainerRef.current) {
      if (scrollTimerRef.current) {
        clearInterval(scrollTimerRef.current);
        scrollTimerRef.current = null;
      }
      return;
    }

    scrollTimerRef.current = setInterval(() => {
      const container = scrollContainerRef.current;
      if (container) {
        const maxScroll = container.scrollHeight - container.clientHeight;
        if (container.scrollTop >= maxScroll) {
          container.scrollTop = 0;
        } else {
          container.scrollTop += 1;
        }
      }
    }, 50);

    return () => {
      if (scrollTimerRef.current) {
        clearInterval(scrollTimerRef.current);
      }
    };
  }, [isScrollPaused]);

  // ========== 计算衍生数据 ==========
  // 合并交易记录
  const unifiedTransactions = useMemo(() => {
    if (!transactions) return [];
    return mergeTransactions(transactions);
  }, [transactions]);

  // 24小时在线趋势图数据
  const hourlyChartData = useMemo(() => {
    if (!onlineStats?.hourlyStats) return [];
    return onlineStats.hourlyStats.map((item: HourlyStat) => ({
      hour: `${item.hour}:00`,
      count: item.count,
    }));
  }, [onlineStats]);

  // 同比变化百分比
  const changePercent = useMemo(() => {
    if (!onlineStats) return 0;
    return calculateChangePercent(onlineStats.currentOnline, onlineStats.yesterdaySameTime);
  }, [onlineStats]);

  // ========== 在线用户表格列配置 ==========
  const onlineUserColumns: ColumnsType<OnlineUser> = [
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 80,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (phone: string) => <MaskedText value={phone} maskType="phone" />,
    },
    {
      title: 'VIP等级',
      dataIndex: 'vipLevel',
      key: 'vipLevel',
      width: 80,
      render: (level: number) => (
        <Badge
          count={`VIP${level}`}
          style={{
            backgroundColor: level >= 3 ? '#ff4d4f' : level >= 2 ? '#faad14' : '#1677ff',
          }}
        />
      ),
    },
    {
      title: '最后活跃',
      dataIndex: 'lastHeartbeatAt',
      key: 'lastHeartbeatAt',
      width: 180,
      render: (time: string) => <TimeDisplay value={time} format="relative" />,
    },
    {
      title: '在线时长',
      dataIndex: 'onlineDuration',
      key: 'onlineDuration',
      width: 100,
      render: (seconds: number) => formatOnlineDuration(seconds),
    },
    {
      title: '设备',
      dataIndex: 'deviceType',
      key: 'deviceType',
      width: 60,
      render: (deviceType: DeviceType) => (
        <Tooltip title={deviceType}>
          <DeviceIcon deviceType={deviceType} />
        </Tooltip>
      ),
    },
  ];

  // ========== 24小时趋势图配置 ==========
  const trendChartConfig = {
    data: hourlyChartData,
    xField: 'hour',
    yField: 'count',
    smooth: true,
    area: {
      style: {
        fillOpacity: 0.3,
      },
    },
    line: {
      style: {
        stroke: '#1677ff',
        lineWidth: 2,
      },
    },
    point: {
      size: 3,
      shape: 'circle',
      style: {
        fill: '#1677ff',
      },
    },
    animation: {
      appear: {
        animation: 'wave-in',
        duration: 1000,
      },
    },
    yAxis: {
      grid: {
        line: {
          style: {
            stroke: darkMode ? '#303030' : '#f0f0f0',
          },
        },
      },
    },
    xAxis: {
      tickLine: null,
      label: {
        style: {
          fill: darkMode ? '#8c8c8c' : '#595959',
        },
      },
    },
  };

  // ========== 渲染 ==========
  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <div
        ref={pageContainerRef}
        className={`realtime-monitor-page ${darkMode ? 'dark-mode' : ''} ${isFullscreen ? 'fullscreen' : ''}`}
        style={{
          backgroundColor: darkMode ? '#141414' : '#f5f5f5',
          minHeight: '100vh',
          padding: isFullscreen ? 24 : 0,
        }}
      >
        {/* ========== 页面顶部 ========== */}
        <div
          className="realtime-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            padding: '16px 24px',
            backgroundColor: darkMode ? '#1f1f1f' : '#fff',
            borderRadius: 8,
            boxShadow: darkMode ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0, color: darkMode ? '#fff' : undefined }}>
              <RiServerLine size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              实时数据监控
            </Title>
          </div>

          <Space size={16}>
            {/* 刷新倒计时 */}
            <Space>
              <RiTimeLine size={16} style={{ color: darkMode ? '#8c8c8c' : '#595959' }} />
              <Text style={{ color: darkMode ? '#8c8c8c' : '#595959', fontVariantNumeric: 'tabular-nums' }}>
                {countdown}秒后刷新
              </Text>
              <Progress
                type="circle"
                percent={(countdown / (refreshInterval / 1000)) * 100}
                size={24}
                showInfo={false}
                strokeColor="#1677ff"
              />
            </Space>

            {/* 暂停/继续 */}
            <Tooltip title={isPaused ? '继续刷新' : '暂停刷新'}>
              <Button
                icon={isPaused ? <RiPlayLine size={16} /> : <RiPauseLine size={16} />}
                onClick={() => setIsPaused(!isPaused)}
              />
            </Tooltip>

            {/* 手动刷新 */}
            <Button
              icon={<RiRefreshLine size={16} />}
              onClick={handleRefresh}
              loading={loading}
            >
              刷新
            </Button>

            {/* 主题切换 */}
            <Tooltip title={darkMode ? '切换浅色主题' : '切换深色主题'}>
              <Switch
                checked={darkMode}
                onChange={setDarkMode}
                checkedChildren={<RiMoonLine size={14} />}
                unCheckedChildren={<RiSunLine size={14} />}
              />
            </Tooltip>

            {/* 全屏切换 */}
            <Tooltip title={isFullscreen ? '退出全屏' : '全屏模式'}>
              <Button
                icon={isFullscreen ? <RiFullscreenExitLine size={16} /> : <RiFullscreenLine size={16} />}
                onClick={toggleFullscreen}
              />
            </Tooltip>
          </Space>
        </div>

        {/* ========== 区域1: 在线用户监控 ========== */}
        <Card
          title={
            <Space>
              <RiUser3Line size={20} />
              <span>在线用户监控</span>
            </Space>
          }
          extra={
            <Button
              type="link"
              icon={<RiExpandRightLine size={16} />}
              onClick={() => setShowOnlineUserList(!showOnlineUserList)}
            >
              {showOnlineUserList ? '收起列表' : '展开列表'}
            </Button>
          }
          style={{ marginBottom: 24 }}
        >
          {loading && !onlineStats ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : (
            <>
              {/* 核心指标卡片 */}
              <Row gutter={[24, 24]}>
                <Col xs={24} sm={8}>
                  <StatisticCard
                    title="当前在线人数"
                    value={onlineStats?.currentOnline || 0}
                    size="large"
                    prefix={<RiUser3Line size={24} style={{ color: '#1677ff' }} />}
                    valueStyle={{ fontSize: 48, color: '#1677ff' }}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <StatisticCard
                    title="今日峰值在线"
                    value={onlineStats?.todayPeak || 0}
                    size="large"
                    prefix={<RiArrowUpLine size={24} style={{ color: '#52c41a' }} />}
                    suffix={
                      onlineStats?.todayPeakTime ? (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <TimeDisplay value={onlineStats.todayPeakTime} format="HH:mm" />
                        </Text>
                      ) : undefined
                    }
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <StatisticCard
                    title="较昨日同时段"
                    value={`${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`}
                    size="large"
                    prefix={
                      changePercent >= 0 ? (
                        <RiArrowUpLine size={24} style={{ color: '#52c41a' }} />
                      ) : (
                        <RiArrowDownLine size={24} style={{ color: '#ff4d4f' }} />
                      )
                    }
                    valueStyle={{
                      color: changePercent >= 0 ? '#52c41a' : '#ff4d4f',
                    }}
                  />
                </Col>
              </Row>

              {/* 24小时在线趋势图 */}
              <div style={{ marginTop: 24 }}>
                <Text strong style={{ marginBottom: 16, display: 'block' }}>
                  24小时在线趋势
                </Text>
                {hourlyChartData.length > 0 ? (
                  <div style={{ height: 200 }}>
                    <Area {...trendChartConfig} />
                  </div>
                ) : (
                  <Empty description="暂无数据" style={{ height: 200, paddingTop: 60 }} />
                )}
              </div>

              {/* 在线用户列表（可展开） */}
              {showOnlineUserList && (
                <div style={{ marginTop: 24 }}>
                  <Text strong style={{ marginBottom: 16, display: 'block' }}>
                    在线用户列表
                  </Text>
                  <Table
                    dataSource={onlineUsers}
                    columns={onlineUserColumns}
                    rowKey="userId"
                    pagination={{ pageSize: 10, size: 'small' }}
                    scroll={{ x: 650 }}
                    size="small"
                  />
                </div>
              )}
            </>
          )}
        </Card>

        {/* ========== 区域2: 实时交易监控 ========== */}
        <Row gutter={24} style={{ marginBottom: 24 }}>
          {/* 滚动交易流水 */}
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <RiExchangeDollarLine size={20} />
                  <span>实时交易流水</span>
                  <Badge count={unifiedTransactions.length} style={{ backgroundColor: '#1677ff' }} />
                </Space>
              }
              extra={
                <Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    悬停暂停滚动
                  </Text>
                  <Tooltip title={isScrollPaused ? '继续滚动' : '暂停滚动'}>
                    <Button
                      size="small"
                      icon={isScrollPaused ? <RiPlayLine size={14} /> : <RiPauseLine size={14} />}
                      onClick={() => setIsScrollPaused(!isScrollPaused)}
                    />
                  </Tooltip>
                </Space>
              }
            >
              {loading && !transactions ? (
                <Skeleton active paragraph={{ rows: 8 }} />
              ) : unifiedTransactions.length > 0 ? (
                <div
                  ref={scrollContainerRef}
                  style={{
                    height: 400,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                  }}
                  onMouseEnter={() => setIsScrollPaused(true)}
                  onMouseLeave={() => setIsScrollPaused(false)}
                >
                  {unifiedTransactions.map((tx) => (
                    <TransactionItem key={tx.id} transaction={tx} darkMode={darkMode} />
                  ))}
                </div>
              ) : (
                <Empty description="暂无交易记录" style={{ height: 400, paddingTop: 150 }} />
              )}
            </Card>
          </Col>

          {/* 5分钟汇总统计 */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <RiTimeLine size={20} />
                  <span>近5分钟汇总</span>
                </Space>
              }
              style={{ height: '100%' }}
            >
              {loading && !transactions ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* 充值汇总 */}
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 8,
                      backgroundColor: 'rgba(82, 196, 26, 0.1)',
                    }}
                  >
                    <Text type="secondary">充值</Text>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <AmountDisplay
                        value={transactions?.summary?.last5MinRecharge || '0'}
                        size="large"
                        style={{ color: '#52c41a' }}
                      />
                      {transactions?.summary?.last5MinRechargeCount !== undefined && (
                        <Badge
                          count={`${transactions.summary.last5MinRechargeCount}笔`}
                          style={{ backgroundColor: '#52c41a' }}
                        />
                      )}
                    </div>
                  </div>

                  {/* 提现汇总 */}
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 8,
                      backgroundColor: 'rgba(22, 119, 255, 0.1)',
                    }}
                  >
                    <Text type="secondary">提现</Text>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <AmountDisplay
                        value={transactions?.summary?.last5MinWithdraw || '0'}
                        size="large"
                        style={{ color: '#1677ff' }}
                      />
                      {transactions?.summary?.last5MinWithdrawCount !== undefined && (
                        <Badge
                          count={`${transactions.summary.last5MinWithdrawCount}笔`}
                          style={{ backgroundColor: '#1677ff' }}
                        />
                      )}
                    </div>
                  </div>

                  {/* 购买汇总 */}
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 8,
                      backgroundColor: 'rgba(250, 140, 22, 0.1)',
                    }}
                  >
                    <Text type="secondary">购买</Text>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <AmountDisplay
                        value={transactions?.summary?.last5MinPurchase || '0'}
                        size="large"
                        style={{ color: '#fa8c16' }}
                      />
                      {transactions?.summary?.last5MinPurchaseCount !== undefined && (
                        <Badge
                          count={`${transactions.summary.last5MinPurchaseCount}笔`}
                          style={{ backgroundColor: '#fa8c16' }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* ========== 区域3: 系统状态监控 ========== */}
        <Card
          title={
            <Space>
              <RiServerLine size={20} />
              <span>系统状态监控</span>
              <StatusIndicator status={systemStatus?.overallStatus || 'normal'} />
            </Space>
          }
          extra={
            systemStatus?.alertCount ? (
              <Button
                type="link"
                icon={<RiAlertLine size={16} />}
                danger
                onClick={() => router.push('/tasks')}
              >
                {systemStatus.alertCount} 条告警
              </Button>
            ) : null
          }
        >
          {loading && !systemStatus ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : (
            <Row gutter={[24, 24]}>
              {/* 支付通道状态 */}
              <Col xs={24} lg={12}>
                <Text strong style={{ marginBottom: 16, display: 'block' }}>
                  支付通道状态
                </Text>
                {(systemStatus?.channels || []).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {systemStatus?.channels.map((channel) => (
                      <div
                        key={channel.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          borderRadius: 8,
                          backgroundColor: darkMode ? '#262626' : '#fafafa',
                        }}
                      >
                        <Space>
                          <ChannelStatusBadge status={channel.status} />
                          <Text strong>{channel.name}</Text>
                        </Space>
                        <Space size={24}>
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              余额
                            </Text>
                            <div>
                              <AmountDisplay value={channel.balance} size="small" />
                            </div>
                          </div>
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              成功率
                            </Text>
                            <div>
                              <Text
                                style={{
                                  color:
                                    Number(channel.successRate) >= 90
                                      ? '#52c41a'
                                      : Number(channel.successRate) >= 50
                                      ? '#faad14'
                                      : '#ff4d4f',
                                }}
                              >
                                {channel.successRate}%
                              </Text>
                            </div>
                          </div>
                        </Space>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty description="暂无通道数据" />
                )}
              </Col>

              {/* 定时任务状态 */}
              <Col xs={24} lg={12}>
                <Text strong style={{ marginBottom: 16, display: 'block' }}>
                  定时任务状态
                </Text>
                {taskStatus.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {taskStatus.slice(0, 5).map((task) => (
                      <div
                        key={task.taskCode}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          borderRadius: 8,
                          backgroundColor: darkMode ? '#262626' : '#fafafa',
                          cursor: 'pointer',
                        }}
                        onClick={() => router.push(`/tasks/${task.taskCode}/logs`)}
                      >
                        <Space>
                          {task.lastRunStatus && <TaskStatusBadge status={task.lastRunStatus} />}
                          <Text>{task.taskName}</Text>
                        </Space>
                        <Space>
                          {task.consecutiveFailures > 0 && (
                            <Badge
                              count={`连续失败${task.consecutiveFailures}次`}
                              style={{ backgroundColor: '#ff4d4f' }}
                            />
                          )}
                          {task.lastRunAt && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <TimeDisplay value={task.lastRunAt} format="relative" />
                            </Text>
                          )}
                        </Space>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty description="暂无任务数据" />
                )}
              </Col>
            </Row>
          )}
        </Card>

        {/* ========== 全局样式 ========== */}
        <style jsx global>{`
          /* 状态指示器动画 */
          .status-indicator-breath {
            animation: breath 2s ease-in-out infinite;
          }

          .status-indicator-blink {
            animation: blink 0.8s ease-in-out infinite;
          }

          .status-indicator-solid {
            /* 红色常亮，无动画 */
          }

          @keyframes breath {
            0%,
            100% {
              opacity: 0.5;
              transform: scale(0.9);
            }
            50% {
              opacity: 1;
              transform: scale(1.1);
            }
          }

          @keyframes blink {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0.3;
            }
          }

          /* 交易项悬停效果 */
          .transaction-item:hover {
            transform: translateX(4px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          /* 全屏模式样式 */
          .realtime-monitor-page.fullscreen {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1000;
            overflow-y: auto;
          }

          /* 数字滚动动画（使用等宽字体） */
          .ant-statistic-content-value,
          .stat-card-component .ant-typography {
            font-variant-numeric: tabular-nums;
            font-family: 'Roboto Mono', monospace;
          }

          /* 深色模式卡片样式 */
          .dark-mode .ant-card {
            background-color: #1f1f1f;
            border-color: #303030;
          }

          .dark-mode .ant-card-head {
            border-color: #303030;
          }

          /* 滚动条样式 */
          .realtime-monitor-page ::-webkit-scrollbar {
            width: 6px;
          }

          .realtime-monitor-page ::-webkit-scrollbar-track {
            background: transparent;
          }

          .realtime-monitor-page ::-webkit-scrollbar-thumb {
            background: #d9d9d9;
            border-radius: 3px;
          }

          .dark-mode ::-webkit-scrollbar-thumb {
            background: #434343;
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
}
