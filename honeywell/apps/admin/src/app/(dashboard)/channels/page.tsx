/**
 * @file 支付通道列表页
 * @description 后台管理系统支付通道列表页面，支持通道状态监控、配置管理、测试连接
 * @depends 开发文档/04-后台管理端/04.7-支付通道/04.7.1-支付通道管理页.md
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Space,
  Button,
  Typography,
  Switch,
  Tooltip,
  App,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Skeleton,
  Row,
  Col,
  Tag,
  Drawer,
  Badge,
} from 'antd';
import {
  RiRefreshLine,
  RiBankLine,
  RiSettings4Line,
  RiWifiLine,
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiErrorWarningFill,
  RiEyeLine,
  RiEyeOffLine,
  RiTimeLine,
  RiPercentLine,
} from '@remixicon/react';

import {
  fetchChannelList,
  fetchChannelDetail,
  updateChannelConfig,
  testChannelConnection,
  queryAllChannelsBalance,
  togglePayEnabled,
  toggleTransferEnabled,
} from '@/services/channels';
import {
  AmountDisplay,
  ChannelStatusBadge,
  TimeDisplay,
} from '@/components/common';
import { DetailDrawer, DetailSection } from '@/components/modals';
import type {
  ChannelListItem,
  ChannelDetail,
  UpdateChannelParams,
  TestConnectionResult,
  ChannelStatus,
} from '@/types/channels';
import type { BalanceQueryResultWithId } from '@/services/channels';
import { getChannelSignatureInfo } from '@/types/channels';

const { Text, Title } = Typography;

/**
 * 根据成功率获取通道健康状态
 * @description 依据：04.7.1-支付通道管理页.md 第3.2节
 */
function getHealthStatus(successRate: string | number): {
  status: ChannelStatus;
  color: string;
} {
  const rate = typeof successRate === 'string' ? parseFloat(successRate) : successRate;
  if (rate >= 90) return { status: 'NORMAL', color: '#52c41a' };
  if (rate >= 50) return { status: 'WARNING', color: '#faad14' };
  return { status: 'ERROR', color: '#f5222d' };
}

/**
 * 环形进度条组件
 * @description 用于显示成功率
 */
function SuccessRateCircle({
  rate,
  size = 80,
}: {
  rate: string | number;
  size?: number;
}) {
  const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
  const { color } = getHealthStatus(numRate);

  return (
    <Progress
      type="circle"
      percent={numRate}
      size={size}
      strokeColor={color}
      format={(percent) => (
        <span style={{ fontSize: size * 0.2, fontWeight: 600 }}>
          {percent?.toFixed(1)}%
        </span>
      )}
    />
  );
}

/**
 * 脱敏密钥显示组件
 * @description 用于密钥的脱敏显示，3秒后自动隐藏
 */
function SecretKeyDisplay({
  value,
  label,
}: {
  value: string | null | undefined;
  label: string;
}) {
  const [visible, setVisible] = useState(false);

  // 显示3秒后自动隐藏
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!value) {
    return (
      <Descriptions.Item label={label}>
        <Text type="secondary">-</Text>
      </Descriptions.Item>
    );
  }

  // 显示脱敏后的值
  const maskedValue = visible
    ? value
    : value.length > 8
    ? `${value.slice(0, 4)}${'*'.repeat(8)}${value.slice(-4)}`
    : '****';

  return (
    <Descriptions.Item label={label}>
      <Space>
        <Text
          style={{
            fontFamily: 'Roboto Mono, monospace',
            fontSize: 13,
          }}
        >
          {maskedValue}
        </Text>
        <Tooltip title={visible ? '隐藏' : '显示（3秒后自动隐藏）'}>
          <Button
            type="text"
            size="small"
            icon={visible ? <RiEyeOffLine size={14} /> : <RiEyeLine size={14} />}
            onClick={() => setVisible(!visible)}
          />
        </Tooltip>
      </Space>
    </Descriptions.Item>
  );
}

/**
 * 通道卡片组件
 */
function ChannelCard({
  channel,
  balances,
  onTest,
  onConfig,
  onDetail,
  onTogglePay,
  onToggleTransfer,
  testingId,
}: {
  channel: ChannelListItem;
  balances: Record<number, string>;
  onTest: (channel: ChannelListItem) => void;
  onConfig: (channel: ChannelListItem) => void;
  onDetail: (channel: ChannelListItem) => void;
  onTogglePay: (channel: ChannelListItem, enabled: boolean) => void;
  onToggleTransfer: (channel: ChannelListItem, enabled: boolean) => void;
  testingId: number | null;
}) {
  const { status: healthStatus, color: healthColor } = getHealthStatus(channel.hourlySuccessRate);
  const balance = balances[channel.id] || channel.balance;
  const isTesting = testingId === channel.id;

  return (
    <Card
      hoverable
      style={{
        borderRadius: 16,
        height: '100%',
      }}
      styles={{
        body: { padding: 20 },
      }}
    >
      {/* 头部：通道名称 + 状态 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Space>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${healthColor}20, ${healthColor}10)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RiBankLine size={24} style={{ color: healthColor }} />
          </div>
          <div>
            <Title level={5} style={{ margin: 0 }}>
              {channel.name}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {channel.code}
            </Text>
          </div>
        </Space>
        <ChannelStatusBadge status={channel.channelStatus} />
      </div>

      {/* 中部统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {/* 今日交易额 */}
        <Col span={8}>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              今日充值
            </Text>
            <AmountDisplay value={channel.todayRecharge} size="default" />
            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
              ({channel.todayRechargeCount}笔)
            </Text>
          </div>
        </Col>
        
        {/* 成功率 */}
        <Col span={8}>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
              成功率(1h)
            </Text>
            <SuccessRateCircle rate={channel.hourlySuccessRate} size={60} />
          </div>
        </Col>

        {/* 通道余额 */}
        <Col span={8}>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              通道余额
            </Text>
            <AmountDisplay
              value={balance}
              size="default"
              style={{ fontWeight: 600 }}
            />
            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
              今日提现: {channel.todayWithdrawCount}笔
            </Text>
          </div>
        </Col>
      </Row>

      {/* 更多指标 */}
      <Row gutter={[12, 8]} style={{ marginBottom: 20 }}>
        <Col span={12}>
          <div
            style={{
              background: '#fafafa',
              borderRadius: 8,
              padding: '8px 12px',
            }}
          >
            <Text type="secondary" style={{ fontSize: 11 }}>7天成功率</Text>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: getHealthStatus(channel.weeklySuccessRate).color,
                }}
              >
                {parseFloat(channel.weeklySuccessRate).toFixed(1)}%
              </Text>
            </div>
          </div>
        </Col>
        <Col span={12}>
          <div
            style={{
              background: '#fafafa',
              borderRadius: 8,
              padding: '8px 12px',
            }}
          >
            <Text type="secondary" style={{ fontSize: 11 }}>平均响应</Text>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: channel.avgResponseTime > 10000 ? '#ff4d4f' : undefined,
                }}
              >
                {channel.avgResponseTime}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>ms</Text>
            </div>
          </div>
        </Col>
      </Row>

      {/* 通道费率（点位） */}
      <Row gutter={[12, 8]} style={{ marginBottom: 20 }}>
        <Col span={12}>
          <div
            style={{
              background: '#f0f5ff',
              borderRadius: 8,
              padding: '8px 12px',
              border: '1px solid #d6e4ff',
            }}
          >
            <Text type="secondary" style={{ fontSize: 11 }}>
              <RiPercentLine size={10} style={{ marginRight: 2, verticalAlign: 'middle' }} />
              代收点位
            </Text>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: 600, color: '#1677ff' }}>
                {parseFloat(channel.payFeeRate || '0').toFixed(2)}%
              </Text>
            </div>
          </div>
        </Col>
        <Col span={12}>
          <div
            style={{
              background: '#fff7e6',
              borderRadius: 8,
              padding: '8px 12px',
              border: '1px solid #ffd591',
            }}
          >
            <Text type="secondary" style={{ fontSize: 11 }}>
              <RiPercentLine size={10} style={{ marginRight: 2, verticalAlign: 'middle' }} />
              代付点位
            </Text>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: 600, color: '#fa8c16' }}>
                {parseFloat(channel.transferFeeRate || '0').toFixed(2)}%
              </Text>
            </div>
          </div>
        </Col>
      </Row>

      {/* 开关区域 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          padding: '12px 16px',
          background: '#fafafa',
          borderRadius: 8,
        }}
      >
        <Space size={24}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 13 }}>充值</Text>
            <Switch
              checked={channel.payEnabled}
              onChange={(checked) => onTogglePay(channel, checked)}
              size="small"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 13 }}>提现</Text>
            <Switch
              checked={channel.transferEnabled}
              onChange={(checked) => onToggleTransfer(channel, checked)}
              size="small"
            />
            {channel.transferEnabled && (
              <Tag color="blue" style={{ marginLeft: 4, fontSize: 10 }}>
                当前代付
              </Tag>
            )}
          </div>
        </Space>
      </div>

      {/* 底部操作按钮 */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          type="default"
          icon={<RiSettings4Line size={14} />}
          onClick={() => onConfig(channel)}
          style={{ flex: 1 }}
        >
          配置
        </Button>
        <Button
          type="default"
          icon={<RiWifiLine size={14} />}
          onClick={() => onTest(channel)}
          loading={isTesting}
          style={{ flex: 1 }}
        >
          {isTesting ? '测试中' : '测试连接'}
        </Button>
        <Button
          type="link"
          icon={<RiEyeLine size={14} />}
          onClick={() => onDetail(channel)}
        >
          详情
        </Button>
      </div>
    </Card>
  );
}

/**
 * 支付通道列表页面
 * @description 依据：04.7.1-支付通道管理页.md
 */
export default function ChannelsPage() {
  const { message, modal } = App.useApp();
  const [configForm] = Form.useForm();

  // 首次加载状态
  const [initialLoading, setInitialLoading] = useState(true);

  // 通道列表数据
  const [channels, setChannels] = useState<ChannelListItem[]>([]);

  // 余额数据（单独管理，支持刷新）
  const [balances, setBalances] = useState<Record<number, string>>({});
  const [refreshingBalance, setRefreshingBalance] = useState(false);

  // 测试连接状态
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);
  const [testResultModalOpen, setTestResultModalOpen] = useState(false);
  const [testingChannel, setTestingChannel] = useState<ChannelListItem | null>(null);

  // 配置弹窗状态
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [configChannel, setConfigChannel] = useState<ChannelListItem | null>(null);

  // 详情抽屉状态
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentDetail, setCurrentDetail] = useState<ChannelDetail | null>(null);

  /**
   * 加载通道列表
   */
  const loadChannels = useCallback(async () => {
    try {
      const data = await fetchChannelList();
      setChannels(data.list);
      // 初始化余额数据
      const balanceMap: Record<number, string> = {};
      data.list.forEach((ch) => {
        balanceMap[ch.id] = ch.balance;
      });
      setBalances(balanceMap);
    } catch (error) {
      console.error('加载通道列表失败:', error);
      message.error('加载通道列表失败');
    } finally {
      setInitialLoading(false);
    }
  }, [message]);

  /**
   * 刷新所有通道余额
   */
  const handleRefreshBalances = useCallback(async () => {
    if (channels.length === 0) return;

    setRefreshingBalance(true);
    try {
      const ids = channels.map((c) => c.id);
      const result = await queryAllChannelsBalance(ids);
      
      const newBalances: Record<number, string> = {};
      result.results.forEach((r: BalanceQueryResultWithId) => {
        // 余额可能为 null（查询失败时），使用原值或'0'作为默认
        if (r.balance !== null) {
          newBalances[r.channelId] = r.balance;
        }
      });
      setBalances((prev) => ({ ...prev, ...newBalances }));
      message.success('余额已刷新');
    } catch (error) {
      console.error('刷新余额失败:', error);
      message.error('刷新余额失败');
    } finally {
      setRefreshingBalance(false);
    }
  }, [channels, message]);

  /**
   * 测试连接
   */
  const handleTestConnection = useCallback(async (channel: ChannelListItem) => {
    setTestingId(channel.id);
    setTestingChannel(channel);
    
    try {
      const result = await testChannelConnection(channel.id);
      setTestResult(result);
      setTestResultModalOpen(true);
    } catch (error) {
      console.error('测试连接失败:', error);
      setTestResult({
        success: false,
        responseTime: 0,
        message: error instanceof Error ? error.message : '测试连接失败',
        errorType: '请求异常',
        errorDetail: error instanceof Error ? error.message : '未知错误',
      });
      setTestResultModalOpen(true);
    } finally {
      setTestingId(null);
    }
  }, []);

  /**
   * 打开配置弹窗
   */
  const handleOpenConfig = useCallback((channel: ChannelListItem) => {
    setConfigChannel(channel);
    setConfigModalOpen(true);
    // 填充表单（不显示密钥原值）
    configForm.setFieldsValue({
      name: channel.name,
      merchantId: channel.merchantId,
      gatewayUrl: channel.gatewayUrl,
      bankCode: channel.bankCode || '',
      payFeeRate: parseFloat(channel.payFeeRate || '0'),
      transferFeeRate: parseFloat(channel.transferFeeRate || '0'),
      callbackIps: channel.callbackIps || '',
      payEnabled: channel.payEnabled,
      transferEnabled: channel.transferEnabled,
      paySecretKey: '', // 留空表示不修改
      transferSecretKey: '', // 留空表示不修改
    });
  }, [configForm]);

  /**
   * 保存通道配置
   */
  const handleSaveConfig = useCallback(async () => {
    if (!configChannel) return;

    try {
      const values = await configForm.validateFields();
      
      // 构建更新参数（空密钥字段不传）
      const params: UpdateChannelParams = {
        name: values.name,
        merchantId: values.merchantId,
        gatewayUrl: values.gatewayUrl,
        bankCode: values.bankCode || null,
        payFeeRate: values.payFeeRate != null ? String(values.payFeeRate) : '0',
        transferFeeRate: values.transferFeeRate != null ? String(values.transferFeeRate) : '0',
        callbackIps: values.callbackIps || null,
        payEnabled: values.payEnabled,
        transferEnabled: values.transferEnabled,
      };

      // 如果密钥有值则传递
      if (values.paySecretKey) {
        params.paySecretKey = values.paySecretKey;
      }
      if (values.transferSecretKey) {
        params.transferSecretKey = values.transferSecretKey;
      }

      // 如果开启代付，弹出确认
      if (values.transferEnabled && !configChannel.transferEnabled) {
        const confirmed = await new Promise<boolean>((resolve) => {
          modal.confirm({
            title: '确认开启代付功能？',
            content: (
              <div>
                <p>即将开启 {configChannel.name} 的代付功能。</p>
                <p style={{ color: '#faad14' }}>
                  注意：系统将自动关闭其他通道的代付功能，后续所有提现订单将通过此通道代付。
                </p>
              </div>
            ),
            okText: '确认开启',
            cancelText: '取消',
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });

        if (!confirmed) return;
      }

      setConfigLoading(true);
      await updateChannelConfig(configChannel.id, params);
      message.success('配置保存成功');
      setConfigModalOpen(false);
      loadChannels(); // 刷新列表
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return; // 表单验证错误
      }
      console.error('保存配置失败:', error);
      message.error(error instanceof Error ? error.message : '保存配置失败');
    } finally {
      setConfigLoading(false);
    }
  }, [configChannel, configForm, message, modal, loadChannels]);

  /**
   * 查看通道详情
   */
  const handleViewDetail = useCallback(async (channel: ChannelListItem) => {
    setDetailDrawerOpen(true);
    setDetailLoading(true);
    
    try {
      const detail = await fetchChannelDetail(channel.id);
      setCurrentDetail(detail);
    } catch (error) {
      console.error('加载通道详情失败:', error);
      message.error('加载通道详情失败');
    } finally {
      setDetailLoading(false);
    }
  }, [message]);

  /**
   * 切换代收开关
   */
  const handleTogglePay = useCallback(async (channel: ChannelListItem, enabled: boolean) => {
    try {
      await togglePayEnabled(channel.id, enabled);
      message.success(`${channel.name} 代收已${enabled ? '开启' : '关闭'}`);
      loadChannels();
    } catch (error) {
      console.error('切换代收开关失败:', error);
      message.error(error instanceof Error ? error.message : '操作失败');
    }
  }, [message, loadChannels]);

  /**
   * 切换代付开关
   */
  const handleToggleTransfer = useCallback(async (channel: ChannelListItem, enabled: boolean) => {
    // 开启代付需要确认
    if (enabled) {
      modal.confirm({
        title: '确认切换代付通道？',
        content: (
          <div>
            <p>即将开启 {channel.name} 的代付功能。</p>
            <p style={{ color: '#faad14' }}>
              注意：系统将自动关闭其他通道的代付功能，后续所有提现订单将通过 {channel.name} 通道代付。
            </p>
            <p>已提交但未回调的订单不受影响。</p>
          </div>
        ),
        okText: '确认切换',
        cancelText: '取消',
        onOk: async () => {
          try {
            await toggleTransferEnabled(channel.id, true);
            message.success(`已切换到 ${channel.name} 代付`);
            loadChannels();
          } catch (error) {
            console.error('切换代付通道失败:', error);
            message.error(error instanceof Error ? error.message : '操作失败');
          }
        },
      });
    } else {
      // 关闭代付直接执行
      try {
        await toggleTransferEnabled(channel.id, false);
        message.success(`${channel.name} 代付已关闭`);
        loadChannels();
      } catch (error) {
        console.error('关闭代付失败:', error);
        message.error(error instanceof Error ? error.message : '操作失败');
      }
    }
  }, [message, modal, loadChannels]);

  // 初始加载
  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  // 骨架屏
  if (initialLoading) {
    return (
      <div className="channels-page" style={{ padding: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Skeleton.Input active style={{ width: 200 }} />
          <Skeleton.Button active />
        </div>
        <Row gutter={[24, 24]}>
          {[1, 2, 3].map((i) => (
            <Col key={i} xs={24} lg={12}>
              <Card style={{ borderRadius: 16 }}>
                <Skeleton active avatar={{ size: 48, shape: 'square' }} />
                <Skeleton active style={{ marginTop: 24 }} />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  return (
    <div className="channels-page" style={{ padding: 24 }}>
      {/* 页面标题 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          支付通道管理
        </Title>
        <Button
          icon={<RiRefreshLine size={16} />}
          onClick={handleRefreshBalances}
          loading={refreshingBalance}
        >
          刷新余额
        </Button>
      </div>

      {/* 通道卡片区 */}
      <Row gutter={[24, 24]}>
        {channels.map((channel) => (
          <Col key={channel.id} xs={24} lg={12}>
            <ChannelCard
              channel={channel}
              balances={balances}
              onTest={handleTestConnection}
              onConfig={handleOpenConfig}
              onDetail={handleViewDetail}
              onTogglePay={handleTogglePay}
              onToggleTransfer={handleToggleTransfer}
              testingId={testingId}
            />
          </Col>
        ))}
      </Row>

      {/* 测试结果弹窗 */}
      <Modal
        title={`通道连接测试 - ${testingChannel?.name || ''}`}
        open={testResultModalOpen}
        onCancel={() => setTestResultModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setTestResultModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={500}
      >
        {testResult && (
          <div style={{ padding: '16px 0' }}>
            {/* 结果状态 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 24,
              }}
            >
              {testResult.success ? (
                <>
                  <RiCheckboxCircleFill size={32} style={{ color: '#52c41a' }} />
                  <Text style={{ fontSize: 16, fontWeight: 500, color: '#52c41a' }}>
                    连接测试成功
                  </Text>
                </>
              ) : (
                <>
                  <RiCloseCircleFill size={32} style={{ color: '#ff4d4f' }} />
                  <Text style={{ fontSize: 16, fontWeight: 500, color: '#ff4d4f' }}>
                    连接测试失败
                  </Text>
                </>
              )}
            </div>

            {/* 测试详情 */}
            {testResult.success ? (
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="网关地址">
                  {testingChannel?.gatewayUrl || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="响应时间">
                  <Text style={{ color: testResult.responseTime > 3000 ? '#faad14' : '#52c41a' }}>
                    {testResult.responseTime} ms
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="返回状态">
                  <Badge status="success" text="200 OK" />
                </Descriptions.Item>
                <Descriptions.Item label="商户验证">
                  <Badge status="success" text="通过" />
                </Descriptions.Item>
                <Descriptions.Item label="签名验证">
                  <Badge status="success" text="通过" />
                </Descriptions.Item>
                <Descriptions.Item label="测试时间">
                  <TimeDisplay value={new Date().toISOString()} />
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <div>
                <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="错误类型">
                    {testResult.errorType || '网关连接超时'}
                  </Descriptions.Item>
                  <Descriptions.Item label="错误详情">
                    {testResult.errorDetail || testResult.message}
                  </Descriptions.Item>
                </Descriptions>
                <div
                  style={{
                    background: '#fff7e6',
                    borderRadius: 8,
                    padding: 12,
                    border: '1px solid #ffd591',
                  }}
                >
                  <Text style={{ fontWeight: 500 }}>
                    <RiErrorWarningFill
                      size={14}
                      style={{ marginRight: 8, verticalAlign: 'middle', color: '#faad14' }}
                    />
                    建议操作：
                  </Text>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 24, color: '#8c8c8c' }}>
                    <li>检查网关地址是否正确</li>
                    <li>确认通道方服务是否正常</li>
                    <li>联系通道技术支持</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 配置弹窗 */}
      <Modal
        title={`编辑通道配置 - ${configChannel?.name || ''}`}
        open={configModalOpen}
        onCancel={() => setConfigModalOpen(false)}
        onOk={handleSaveConfig}
        okText="保存配置"
        confirmLoading={configLoading}
        width={560}
        destroyOnHidden
      >
        <Form form={configForm} layout="vertical" style={{ marginTop: 16 }}>
          {/* 基础信息 */}
          <Text strong style={{ display: 'block', marginBottom: 16 }}>
            基础信息
          </Text>
          
          <Form.Item
            name="name"
            label="通道名称"
            rules={[
              { required: true, message: '请输入通道名称' },
              { max: 100, message: '最多100个字符' },
            ]}
          >
            <Input placeholder="请输入通道名称" />
          </Form.Item>

          <Form.Item
            name="merchantId"
            label="商户号"
            rules={[{ required: true, message: '请输入商户号' }]}
          >
            <Input placeholder="请输入商户号" />
          </Form.Item>

          <Form.Item
            name="gatewayUrl"
            label="网关地址"
            rules={[
              { required: true, message: '请输入网关地址' },
              { type: 'url', message: '请输入有效的URL' },
            ]}
          >
            <Input placeholder="https://..." />
          </Form.Item>

          {/* 银行编码配置 */}
          <Text strong style={{ display: 'block', margin: '24px 0 16px' }}>
            银行编码配置
          </Text>

          <Form.Item
            name="bankCode"
            label="银行编码"
            help={
              configChannel?.code === 'LWPAY'
                ? 'LWPAY通道填写 901'
                : configChannel?.code === 'JYPAY'
                ? 'JYPAY通道填写代收busiCode（如 118001）'
                : 'UZPAY通道填写 COP 开头编码（如 COP1143）'
            }
          >
            <Input placeholder="请输入银行编码" />
          </Form.Item>

          {/* JYPAY 扩展配置（仅 JYPAY 通道显示） */}
          {configChannel?.code === 'JYPAY' && (
            <>
              <Text strong style={{ display: 'block', margin: '24px 0 16px' }}>
                JYPAY 扩展配置
              </Text>
              <Form.Item
                name={['extraConfig', 'transferGatewayUrl']}
                label="代付网关URL"
                help="JYPAY代付专用网关地址"
              >
                <Input placeholder="https://twerf.jytpz.com" />
              </Form.Item>
            </>
          )}

          {/* 通道费率（点位）配置 */}
          <Text strong style={{ display: 'block', margin: '24px 0 16px' }}>
            通道费率配置
          </Text>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="payFeeRate"
                label="代收点位 (%)"
                help="充值金额 x 点位% = 通道代收手续费"
                rules={[
                  { type: 'number', min: 0, max: 100, message: '请输入0-100之间的数值' },
                ]}
              >
                <InputNumber
                  placeholder="如 3.50"
                  min={0}
                  max={100}
                  step={0.01}
                  precision={2}
                  addonAfter="%"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="transferFeeRate"
                label="代付点位 (%)"
                help="提现金额 x 点位% = 通道代付手续费"
                rules={[
                  { type: 'number', min: 0, max: 100, message: '请输入0-100之间的数值' },
                ]}
              >
                <InputNumber
                  placeholder="如 2.00"
                  min={0}
                  max={100}
                  step={0.01}
                  precision={2}
                  addonAfter="%"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 密钥配置 */}
          <Text strong style={{ display: 'block', margin: '24px 0 16px' }}>
            密钥配置
          </Text>

          <Form.Item
            name="paySecretKey"
            label="代收密钥"
            help="留空表示不修改，密钥修改后立即生效"
          >
            <Input.Password placeholder="留空表示不修改" />
          </Form.Item>

          <Form.Item
            name="transferSecretKey"
            label="代付密钥"
            help="留空表示不修改，密钥修改后立即生效"
          >
            <Input.Password placeholder="留空表示不修改" />
          </Form.Item>

          {/* 白名单配置 */}
          <Text strong style={{ display: 'block', margin: '24px 0 16px' }}>
            安全配置
          </Text>

          <Form.Item
            name="callbackIps"
            label="回调IP白名单"
            help="多个IP用英文逗号分隔，如: 18.143.234.124,1.2.3.4。留空表示不校验"
          >
            <Input.TextArea
              placeholder="输入回调IP白名单，多个IP用逗号分隔"
              rows={2}
              style={{ fontFamily: 'Roboto Mono, monospace', fontSize: 13 }}
            />
          </Form.Item>

          {/* 开关配置 */}
          <Text strong style={{ display: 'block', margin: '24px 0 16px' }}>
            开关配置
          </Text>

          <Form.Item
            name="payEnabled"
            label="代收功能"
            valuePropName="checked"
            help="开启后该通道可用于充值"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="transferEnabled"
            label="代付功能"
            valuePropName="checked"
            help="开启后该通道用于提现代付（同时只能有一个通道开启）"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情抽屉 */}
      <DetailDrawer
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        title="通道详情"
        subtitle={currentDetail?.code}
        status={
          currentDetail?.channelStatus === 'NORMAL'
            ? 'success'
            : currentDetail?.channelStatus === 'WARNING'
            ? 'warning'
            : currentDetail?.channelStatus === 'ERROR'
            ? 'error'
            : 'info'
        }
        statusText={
          currentDetail?.channelStatus === 'NORMAL'
            ? '正常'
            : currentDetail?.channelStatus === 'WARNING'
            ? '警告'
            : currentDetail?.channelStatus === 'ERROR'
            ? '异常'
            : '未知'
        }
        loading={detailLoading}
        width={700}
      >
        {currentDetail && (
          <>
            {/* 基本信息 */}
            <DetailSection title="基本信息">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="通道编码">{currentDetail.code}</Descriptions.Item>
                <Descriptions.Item label="通道名称">{currentDetail.name}</Descriptions.Item>
                <Descriptions.Item label="商户号">{currentDetail.merchantId}</Descriptions.Item>
                <Descriptions.Item label="网关地址" span={2}>
                  <Text copyable style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {currentDetail.gatewayUrl}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="银行编码">
                  {currentDetail.bankCode || '-'}
                </Descriptions.Item>
              </Descriptions>
            </DetailSection>

            {/* 开关状态 */}
            <DetailSection title="开关状态">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="代收功能">
                  <Badge
                    status={currentDetail.payEnabled ? 'success' : 'default'}
                    text={currentDetail.payEnabled ? '已启用' : '未启用'}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="代付功能">
                  <Space>
                    <Badge
                      status={currentDetail.transferEnabled ? 'success' : 'default'}
                      text={currentDetail.transferEnabled ? '已启用' : '未启用'}
                    />
                    {currentDetail.transferEnabled && (
                      <Tag color="blue">当前代付通道</Tag>
                    )}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </DetailSection>

            {/* 通道费率 */}
            <DetailSection title="通道费率（点位）">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="代收点位">
                  <Text style={{ fontWeight: 600, color: '#1677ff' }}>
                    {parseFloat(currentDetail.payFeeRate || '0').toFixed(2)}%
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                    (充值金额 x {parseFloat(currentDetail.payFeeRate || '0').toFixed(2)}%)
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="代付点位">
                  <Text style={{ fontWeight: 600, color: '#fa8c16' }}>
                    {parseFloat(currentDetail.transferFeeRate || '0').toFixed(2)}%
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                    (提现金额 x {parseFloat(currentDetail.transferFeeRate || '0').toFixed(2)}%)
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </DetailSection>

            {/* 状态监控 */}
            <DetailSection title="状态监控">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="通道状态">
                  <ChannelStatusBadge status={currentDetail.channelStatus} />
                </Descriptions.Item>
                <Descriptions.Item label="最后检测时间">
                  {currentDetail.lastCheckAt ? (
                    <TimeDisplay value={currentDetail.lastCheckAt} />
                  ) : (
                    <Text type="secondary">-</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="连续失败次数">
                  <Text style={{ color: currentDetail.consecutiveFailures > 0 ? '#ff4d4f' : undefined }}>
                    {currentDetail.consecutiveFailures}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="近1小时成功率">
                  <Space>
                    <Text
                      style={{
                        color: getHealthStatus(currentDetail.hourlySuccessRate).color,
                        fontWeight: 500,
                      }}
                    >
                      {parseFloat(currentDetail.hourlySuccessRate).toFixed(1)}%
                    </Text>
                    <Progress
                      percent={parseFloat(currentDetail.hourlySuccessRate)}
                      size="small"
                      strokeColor={getHealthStatus(currentDetail.hourlySuccessRate).color}
                      showInfo={false}
                      style={{ width: 80 }}
                    />
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="近7天成功率">
                  <Space>
                    <Text
                      style={{
                        color: getHealthStatus(currentDetail.weeklySuccessRate).color,
                        fontWeight: 500,
                      }}
                    >
                      {parseFloat(currentDetail.weeklySuccessRate).toFixed(1)}%
                    </Text>
                    <Progress
                      percent={parseFloat(currentDetail.weeklySuccessRate)}
                      size="small"
                      strokeColor={getHealthStatus(currentDetail.weeklySuccessRate).color}
                      showInfo={false}
                      style={{ width: 80 }}
                    />
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="平均响应时间">
                  <Text style={{ color: currentDetail.avgResponseTime > 10000 ? '#ff4d4f' : undefined }}>
                    {currentDetail.avgResponseTime.toLocaleString()} ms
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </DetailSection>

            {/* 统计数据 */}
            <DetailSection title="统计数据">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    background: '#f6ffed',
                    borderRadius: 8,
                    padding: 12,
                    textAlign: 'center',
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>今日充值</Text>
                  <AmountDisplay value={currentDetail.todayRecharge} style={{ fontWeight: 600 }} />
                </div>
                <div
                  style={{
                    background: '#e6f4ff',
                    borderRadius: 8,
                    padding: 12,
                    textAlign: 'center',
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>昨日充值</Text>
                  <AmountDisplay value={currentDetail.yesterdayRecharge} style={{ fontWeight: 600 }} />
                </div>
                <div
                  style={{
                    background: '#f5f5f5',
                    borderRadius: 8,
                    padding: 12,
                    textAlign: 'center',
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>累计充值</Text>
                  <AmountDisplay value={currentDetail.totalRecharge} style={{ fontWeight: 600 }} />
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    background: '#fff7e6',
                    borderRadius: 8,
                    padding: 12,
                    textAlign: 'center',
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>今日提现</Text>
                  <AmountDisplay value={currentDetail.todayWithdraw} style={{ fontWeight: 600 }} />
                </div>
                <div
                  style={{
                    background: '#fff2f0',
                    borderRadius: 8,
                    padding: 12,
                    textAlign: 'center',
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>昨日提现</Text>
                  <AmountDisplay value={currentDetail.yesterdayWithdraw} style={{ fontWeight: 600 }} />
                </div>
                <div
                  style={{
                    background: '#f5f5f5',
                    borderRadius: 8,
                    padding: 12,
                    textAlign: 'center',
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>累计提现</Text>
                  <AmountDisplay value={currentDetail.totalWithdraw} style={{ fontWeight: 600 }} />
                </div>
              </div>
            </DetailSection>

            {/* 通道余额 */}
            <DetailSection title="通道余额">
              <div
                style={{
                  background: 'linear-gradient(135deg, #1677ff10, #1677ff05)',
                  borderRadius: 12,
                  padding: 20,
                  textAlign: 'center',
                }}
              >
                <AmountDisplay
                  value={balances[currentDetail.id] || currentDetail.balance}
                  size="large"
                  style={{ fontSize: 32, fontWeight: 700, color: '#1677ff' }}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <RiTimeLine size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    最后更新：
                    {currentDetail.balanceUpdatedAt ? (
                      <TimeDisplay value={currentDetail.balanceUpdatedAt} />
                    ) : (
                      '-'
                    )}
                  </Text>
                </div>
              </div>
            </DetailSection>

            {/* 签名规则 */}
            <DetailSection title="签名规则（只读）">
              {(() => {
                const signInfo = getChannelSignatureInfo(currentDetail.code);
                return (
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="签名算法">{signInfo.algorithm}</Descriptions.Item>
                    <Descriptions.Item label="签名结果">
                      {signInfo.signatureCase === 'uppercase' ? '大写' : '小写'}
                    </Descriptions.Item>
                    <Descriptions.Item label="成功回调响应">
                      <Text code>{signInfo.callbackResponse}</Text>
                    </Descriptions.Item>
                  </Descriptions>
                );
              })()}
            </DetailSection>
          </>
        )}
      </DetailDrawer>

      {/* 全局样式 */}
      <style jsx global>{`
        .channels-page .ant-card-hoverable:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .channels-page .ant-progress-circle .ant-progress-text {
          color: inherit;
        }
      `}</style>
    </div>
  );
}
