/**
 * @file 免审核配置页
 * @description 提现免审核规则配置管理页面
 * @depends 开发文档/04-后台管理端/04.7-支付通道/04.7.1-支付通道管理页.md 第5节 - 免审核提现配置
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Space,
  Button,
  Typography,
  Switch,
  App,
  Form,
  InputNumber,
  TimePicker,
  Skeleton,
  Alert,
  Divider,
  Row,
  Col,
  Modal,
} from 'antd';
import {
  RiShieldCheckLine,
  RiTimeLine,
  RiMoneyDollarCircleLine,
  RiUserLine,
  RiCalendarLine,
  RiInformationLine,
  RiSaveLine,
  RiCheckboxCircleFill,
} from '@remixicon/react';
import dayjs, { Dayjs } from 'dayjs';

import {
  fetchAutoApproveConfig,
  updateAutoApproveConfig,
  AutoApproveConfig,
} from '@/services/channels';
import { AmountDisplay } from '@/components/common';
import { useGlobalConfig } from '@/hooks/useGlobalConfig';

const { Text, Title, Paragraph } = Typography;

/**
 * 解析时间范围字符串为 Dayjs 数组
 * @param timeRange 时间范围字符串（格式：HH:MM-HH:MM）
 */
function parseTimeRange(timeRange: string): [Dayjs, Dayjs] | null {
  if (!timeRange) return null;
  
  const match = timeRange.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
  if (!match) return null;
  
  const [, start, end] = match;
  return [dayjs(start, 'HH:mm'), dayjs(end, 'HH:mm')];
}

/**
 * 格式化 Dayjs 数组为时间范围字符串
 * @param times Dayjs 数组
 */
function formatTimeRange(times: [Dayjs, Dayjs] | null): string {
  if (!times || !times[0] || !times[1]) return '00:00-23:59';
  return `${times[0].format('HH:mm')}-${times[1].format('HH:mm')}`;
}

/**
 * 配置项卡片组件
 */
function ConfigItem({
  icon,
  title,
  description,
  children,
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        background: disabled ? '#fafafa' : '#fff',
        borderRadius: 12,
        padding: 20,
        border: '1px solid #f0f0f0',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.3s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: disabled ? '#f0f0f0' : 'linear-gradient(135deg, #1677ff15, #1677ff08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 4 }}>
            {title}
          </Text>
          <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
            {description}
          </Text>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * 免审核配置页面
 * @description 依据：04.7.1-支付通道管理页.md 第5节
 */
export default function AutoApproveConfigPage() {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  const globalConfig = useGlobalConfig();

  // 状态
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AutoApproveConfig | null>(null);
  const [enabled, setEnabled] = useState(false);

  /**
   * 加载配置
   */
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAutoApproveConfig();
      setConfig(data);
      setEnabled(data.enabled);
      
      // 填充表单
      form.setFieldsValue({
        enabled: data.enabled,
        threshold: parseFloat(data.threshold),
        dailyLimit: data.dailyLimit,
        timeRange: parseTimeRange(data.timeRange),
        newUserDays: data.newUserDays,
      });
    } catch (error) {
      console.error('加载免审核配置失败:', error);
      message.error('加载免审核配置失败');
    } finally {
      setLoading(false);
    }
  }, [form, message]);

  /**
   * 保存配置
   */
  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      
      // 构建配置参数
      const newConfig: Partial<AutoApproveConfig> = {
        enabled: values.enabled,
        threshold: values.threshold.toFixed(2),
        dailyLimit: values.dailyLimit,
        timeRange: formatTimeRange(values.timeRange),
        newUserDays: values.newUserDays,
      };

      // 检查配置变化
      const changes: string[] = [];
      if (config) {
        if (values.enabled !== config.enabled) {
          changes.push(`免审核开关：${config.enabled ? '开启' : '关闭'} -> ${values.enabled ? '开启' : '关闭'}`);
        }
        if (parseFloat(values.threshold.toFixed(2)) !== parseFloat(config.threshold)) {
          changes.push(`金额阈值：$ ${config.threshold} -> $ ${values.threshold.toFixed(2)}`);
        }
        if (values.dailyLimit !== config.dailyLimit) {
          changes.push(`每日限次：${config.dailyLimit}次 -> ${values.dailyLimit}次`);
        }
        const newTimeRange = formatTimeRange(values.timeRange);
        if (newTimeRange !== config.timeRange) {
          changes.push(`生效时间：${config.timeRange} -> ${newTimeRange}`);
        }
        if (values.newUserDays !== config.newUserDays) {
          changes.push(`新用户冷却期：${config.newUserDays}天 -> ${values.newUserDays}天`);
        }
      }

      // 如果有变化，弹出确认框
      if (changes.length > 0) {
        const confirmed = await new Promise<boolean>((resolve) => {
          modal.confirm({
            title: '确认保存免审核配置？',
            content: (
              <div>
                <Paragraph style={{ marginBottom: 12 }}>新配置将立即生效：</Paragraph>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {changes.map((change, index) => (
                    <li key={index} style={{ color: '#595959', marginBottom: 4 }}>
                      {change}
                    </li>
                  ))}
                </ul>
                <Alert
                  type="warning"
                  message="配置变更后，新提交的提现订单将按新规则判断"
                  style={{ marginTop: 16 }}
                  showIcon
                />
              </div>
            ),
            okText: '确认保存',
            cancelText: '取消',
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });

        if (!confirmed) return;
      }

      setSaving(true);
      const updatedConfig = await updateAutoApproveConfig(newConfig);
      setConfig(updatedConfig);
      setEnabled(updatedConfig.enabled);
      message.success('免审核配置保存成功');
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return; // 表单验证错误
      }
      console.error('保存免审核配置失败:', error);
      message.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }, [config, form, message, modal]);

  /**
   * 处理开关变化
   */
  const handleEnabledChange = useCallback((checked: boolean) => {
    setEnabled(checked);
    form.setFieldValue('enabled', checked);
  }, [form]);

  // 初始加载
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // 骨架屏
  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 2 }} />
        <div style={{ marginTop: 24 }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            免审核配置
          </Title>
          <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
            配置提现订单自动审核通过的条件规则
          </Text>
        </div>
        <Button
          type="primary"
          icon={<RiSaveLine size={16} />}
          onClick={handleSave}
          loading={saving}
        >
          保存配置
        </Button>
      </div>

      {/* 规则预览卡片 */}
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 12,
          background: enabled
            ? 'linear-gradient(135deg, #f6ffed 0%, #fff 100%)'
            : '#fafafa',
          border: enabled ? '1px solid #b7eb8f' : '1px solid #f0f0f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: enabled ? '#52c41a20' : '#00000008',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {enabled ? (
              <RiCheckboxCircleFill size={28} style={{ color: '#52c41a' }} />
            ) : (
              <RiShieldCheckLine size={28} style={{ color: '#8c8c8c' }} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text strong style={{ fontSize: 16 }}>
                {enabled ? '免审核功能已启用' : '免审核功能已关闭'}
              </Text>
              <Form form={form} component={false}>
                <Form.Item name="enabled" valuePropName="checked" noStyle>
                  <Switch
                    checked={enabled}
                    onChange={handleEnabledChange}
                    checkedChildren="开"
                    unCheckedChildren="关"
                  />
                </Form.Item>
              </Form>
            </div>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {enabled
                ? '满足条件的提现订单将自动通过审核'
                : '所有提现订单需人工审核'}
            </Text>
          </div>
        </div>

        {/* 当前生效规则预览 */}
        {enabled && config && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <div style={{ padding: '8px 12px', background: '#fff', borderRadius: 8 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                <RiInformationLine size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                当前生效规则
              </Text>
              <Text style={{ fontSize: 14 }}>
                单笔金额 {'<='} <AmountDisplay value={config.threshold} style={{ fontWeight: 600, color: '#1677ff' }} />
                ，每日最多 <Text strong style={{ color: '#1677ff' }}>{config.dailyLimit}</Text> 次，
                生效时间 <Text strong style={{ color: '#1677ff' }}>{config.timeRange}</Text>
                {config.newUserDays > 0 && (
                  <>，注册超过 <Text strong style={{ color: '#1677ff' }}>{config.newUserDays}</Text> 天</>
                )}
                的用户可享受免审核
              </Text>
            </div>
          </>
        )}
      </Card>

      {/* 配置表单 */}
      <Card style={{ borderRadius: 12 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            enabled: false,
            threshold: 100,
            dailyLimit: 1,
            timeRange: [dayjs('00:00', 'HH:mm'), dayjs('23:59', 'HH:mm')],
            newUserDays: 0,
          }}
        >
          <Row gutter={[24, 24]}>
            {/* 单笔金额阈值 */}
            <Col xs={24} lg={12}>
              <ConfigItem
                icon={<RiMoneyDollarCircleLine size={22} style={{ color: enabled ? '#1677ff' : '#8c8c8c' }} />}
                title="单笔金额阈值"
                description="提现金额小于或等于此值时可免审核"
                disabled={!enabled}
              >
                <Form.Item
                  name="threshold"
                  rules={[
                    { required: true, message: '请输入金额阈值' },
                    { type: 'number', min: 0, message: '金额必须大于等于0' },
                  ]}
                  style={{ marginBottom: 0 }}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    precision={2}
                    prefix={globalConfig.currencySymbol}
                    placeholder="请输入金额阈值"
                    disabled={!enabled}
                  />
                </Form.Item>
              </ConfigItem>
            </Col>

            {/* 每日免审次数 */}
            <Col xs={24} lg={12}>
              <ConfigItem
                icon={<RiCalendarLine size={22} style={{ color: enabled ? '#1677ff' : '#8c8c8c' }} />}
                title="每日免审次数"
                description="每用户每日最多享受免审核的次数"
                disabled={!enabled}
              >
                <Form.Item
                  name="dailyLimit"
                  rules={[
                    { required: true, message: '请输入每日限次' },
                    { type: 'number', min: 0, max: 100, message: '次数必须在0-100之间' },
                  ]}
                  style={{ marginBottom: 0 }}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    max={100}
                    precision={0}
                    suffix="次/用户/日"
                    placeholder="请输入每日限次"
                    disabled={!enabled}
                  />
                </Form.Item>
              </ConfigItem>
            </Col>

            {/* 生效时间范围 */}
            <Col xs={24} lg={12}>
              <ConfigItem
                icon={<RiTimeLine size={22} style={{ color: enabled ? '#1677ff' : '#8c8c8c' }} />}
                title="生效时间范围"
                description="仅在此时间段内提交的提现可免审（系统时区）"
                disabled={!enabled}
              >
                <Form.Item
                  name="timeRange"
                  rules={[{ required: true, message: '请选择时间范围' }]}
                  style={{ marginBottom: 0 }}
                >
                  <TimePicker.RangePicker
                    style={{ width: '100%' }}
                    format="HH:mm"
                    placeholder={['开始时间', '结束时间']}
                    disabled={!enabled}
                  />
                </Form.Item>
              </ConfigItem>
            </Col>

            {/* 新用户冷却期 */}
            <Col xs={24} lg={12}>
              <ConfigItem
                icon={<RiUserLine size={22} style={{ color: enabled ? '#1677ff' : '#8c8c8c' }} />}
                title="新用户冷却期"
                description="注册满N天后才可享受免审核，设为0表示无限制"
                disabled={!enabled}
              >
                <Form.Item
                  name="newUserDays"
                  rules={[
                    { required: true, message: '请输入冷却期天数' },
                    { type: 'number', min: 0, max: 365, message: '天数必须在0-365之间' },
                  ]}
                  style={{ marginBottom: 0 }}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    max={365}
                    precision={0}
                    suffix="天"
                    placeholder="请输入冷却期天数"
                    disabled={!enabled}
                  />
                </Form.Item>
              </ConfigItem>
            </Col>
          </Row>
        </Form>

        {/* 配置说明 */}
        <Divider style={{ margin: '24px 0 16px' }} />
        <Alert
          type="info"
          showIcon
          icon={<RiInformationLine size={16} />}
          message="免审核判断逻辑说明"
          description={
            <ol style={{ margin: '8px 0 0', paddingLeft: 20, color: '#595959' }}>
              <li>当前时间在普通提现时间窗口内（全局提现时间配置）</li>
              <li>当前时间在免审核生效时间段内</li>
              <li>{'提现金额 <= 金额阈值'}</li>
              <li>{'用户当日免审次数 < 每日限次'}</li>
              <li>{'用户注册天数 >= 新用户冷却期'}</li>
              <li style={{ color: '#faad14', fontWeight: 500 }}>以上条件需全部满足才会自动通过审核</li>
            </ol>
          }
          style={{ background: '#f6f8fa', border: '1px solid #e8e8e8' }}
        />
      </Card>
    </div>
  );
}
