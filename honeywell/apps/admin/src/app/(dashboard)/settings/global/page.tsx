/**
 * @file 全局配置页
 * @description 全站核心配置管理，包含基础信息、财务规则、安全配置等
 * @depends 开发文档/04-后台管理端/04.9-系统设置/04.9.1-全局配置页.md
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  Button,
  Space,
  Collapse,
  Typography,
  Divider,
  Tag,
  Spin,
  Badge,
  Card,
  message,
  TimePicker,
  Tooltip,
} from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import {
  RiSettings4Line,
  RiTimeLine,
  RiMoneyDollarCircleLine,
  RiWalletLine,
  RiTeamLine,
  RiShieldLine,
  RiSpeedLine,
  RiSettings3Line,
  RiCalendarCheckLine,
  RiChat3Line,
  RiFileListLine,
  RiSaveLine,
  RiRefreshLine,
  RiGlobalLine,
  RiImageLine,
  RiUploadCloud2Line,
  RiHeartPulseLine,
  RiAlarmWarningLine,
  RiToggleLine,
  RiLockLine,
  RiGamepadLine,
  RiExchangeDollarLine,
} from '@remixicon/react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { AmountDisplay } from '@/components/common/AmountDisplay';
import { TimeDisplay } from '@/components/common/TimeDisplay';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import RichTextEditor from '@/components/common/RichTextEditor';
import { showSuccess } from '@/utils/messageHolder';

import { fetchGlobalConfig, updateGlobalConfig } from '@/services/global-config';
import { useGlobalConfigStore } from '@/stores/config';
import { DEFAULT_TIMEZONE } from '@/utils/timezone';

import type {
  GlobalConfigData,
  GlobalConfigFormValues,
  EmptyStateConfig,
} from '@/types/global-config';

import {
  TIMEZONE_OPTIONS,
  TOAST_POSITION_OPTIONS,
  CRITICAL_CONFIG_FIELDS,
} from '@/types/global-config';

dayjs.extend(utc);
dayjs.extend(timezone);

const { Text, Paragraph } = Typography;

// ============================================================================
// 类型定义
// ============================================================================

/** 配置分组 */
interface ConfigGroup {
  key: string;
  title: string;
  icon: React.ReactNode;
  count: number;
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 将配置数据转换为表单数据
 */
function transformConfigToForm(config: GlobalConfigData): GlobalConfigFormValues {
  // 提现时间窗口拆分
  const [withdrawStartTime, withdrawEndTime] = config.withdrawTimeRange
    .split('-')
    .map((t) => t.trim());

  // 头像大小 bytes -> MB
  const avatarMaxSizeMB = config.avatarMaxSize / (1024 * 1024);

  return {
    ...config,
    withdrawStartTime: withdrawStartTime || '10:00',
    withdrawEndTime: withdrawEndTime || '17:00',
    avatarMaxSizeMB,
    // 处理快捷金额数组为字符串数组（用于 Select tags 模式）
    withdrawQuickAmounts: config.withdrawQuickAmounts?.map(String) || [],
    rechargePresets: config.rechargePresets?.map(String) || [],
  } as unknown as GlobalConfigFormValues;
}

/**
 * 深度过滤对象中的 null 和 undefined 值
 * @description 
 *  - Ant Design 的 InputNumber/Select 等组件空值返回 null
 *  - JSON.stringify 会将 undefined 转为 null
 *  - 后端需要有效值或不传（即不能传 null）
 */
function deepCleanNulls(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    // 跳过 null 和 undefined
    if (value === null || value === undefined) continue;
    
    // 数组保持原样（已经是有效值）
    if (Array.isArray(value)) {
      result[key] = value;
      continue;
    }
    
    // 对象递归清理（用于空状态配置等嵌套对象）
    if (typeof value === 'object' && value !== null) {
      const cleaned = deepCleanNulls(value as Record<string, unknown>);
      // 只有非空对象才保留
      if (Object.keys(cleaned).length > 0) {
        result[key] = cleaned;
      }
      continue;
    }
    
    // 基本类型直接保留
    result[key] = value;
  }
  return result;
}

/**
 * 将表单数据转换为配置数据
 * @description 依据：02.4-后台API接口清单.md - PUT /api/admin/config
 *              处理流程：
 *              1. 合并/转换特殊字段（时间窗口、头像大小、金额数组）
 *              2. 排除只读字段和表单辅助字段
 *              3. 深度清理 null/undefined 值
 */
function transformFormToConfig(values: GlobalConfigFormValues): Partial<GlobalConfigData> {
  // ========================================
  // 步骤1: 特殊字段转换
  // ========================================
  
  // 提现时间窗口合并
  const withdrawTimeRange = values.withdrawStartTime && values.withdrawEndTime
    ? `${values.withdrawStartTime}-${values.withdrawEndTime}`
    : undefined;

  // 头像大小 MB -> bytes（avatarMaxSizeMB 可能为 null）
  const avatarMaxSizeMB = values.avatarMaxSizeMB;
  const avatarMaxSize = (avatarMaxSizeMB !== null && avatarMaxSizeMB !== undefined && avatarMaxSizeMB > 0)
    ? Math.round(avatarMaxSizeMB * 1024 * 1024)
    : undefined;

  // 处理快捷金额数组（从字符串转回数字，Ant Design Select tags 模式返回字符串数组）
  const withdrawQuickAmounts = Array.isArray(values.withdrawQuickAmounts)
    ? (values.withdrawQuickAmounts as unknown as (string | number)[])
        .map((v) => parseInt(String(v), 10))
        .filter((n) => !isNaN(n) && n > 0)
        .sort((a, b) => a - b)
    : undefined;

  const rechargePresets = Array.isArray(values.rechargePresets)
    ? (values.rechargePresets as unknown as (string | number)[])
        .map((v) => parseInt(String(v), 10))
        .filter((n) => !isNaN(n) && n > 0)
        .sort((a, b) => a - b)
    : undefined;

  // ========================================
  // 步骤2: 排除不需要发送的字段
  // ========================================
  
  // 需要排除的字段：
  // - withdrawStartTime, withdrawEndTime: 已合并为 withdrawTimeRange
  // - avatarMaxSizeMB: 已转换为 avatarMaxSize (bytes)
  // - globalConfigVersion, globalConfigUpdatedAt: 只读字段，由服务端管理
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { 
    withdrawStartTime, 
    withdrawEndTime, 
    avatarMaxSizeMB: _avatarMaxSizeMB,
    globalConfigVersion,
    globalConfigUpdatedAt,
    ...rest 
  } = values;

  // ========================================
  // 步骤3: 组装并深度清理 null/undefined 值
  // ========================================
  const configData: Record<string, unknown> = {
    ...rest,
    ...(withdrawTimeRange !== undefined ? { withdrawTimeRange } : {}),
    ...(avatarMaxSize !== undefined ? { avatarMaxSize } : {}),
    ...(withdrawQuickAmounts !== undefined ? { withdrawQuickAmounts } : {}),
    ...(rechargePresets !== undefined ? { rechargePresets } : {}),
  };

  // 深度清理所有 null/undefined 值
  return deepCleanNulls(configData) as Partial<GlobalConfigData>;
}

// ============================================================================
// 实时时区时钟组件
// ============================================================================

interface TimezoneClock {
  timezone: string;
}

/**
 * 实时时区时钟
 * @description 显示指定时区的当前时间，每秒更新
 */
function TimezoneClock({ timezone }: TimezoneClock) {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = dayjs().tz(timezone);
      setCurrentTime(now.format('YYYY-MM-DD HH:mm:ss'));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [timezone]);

  const tzOption = TIMEZONE_OPTIONS.find((opt) => opt.value === timezone);
  const displayName = tzOption?.label || timezone;

  return (
    <div
      style={{
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #1677ff10 0%, #1677ff05 100%)',
        borderRadius: 8,
        border: '1px solid #1677ff20',
      }}
    >
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
        当前时区时间
      </Text>
      <Text
        strong
        style={{
          fontSize: 20,
          fontFamily: 'Roboto Mono, monospace',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {currentTime}
      </Text>
      <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
        ({displayName})
      </Text>
    </div>
  );
}

// ============================================================================
// 空状态配置表单组件
// ============================================================================

interface EmptyStateFormProps {
  name: string;
  label: string;
  hasButton?: boolean;
}

/**
 * 空状态配置表单项
 */
function EmptyStateFormItem({ name, label, hasButton = false }: EmptyStateFormProps) {
  return (
    <Card size="small" title={label} style={{ marginBottom: 16 }}>
      <Form.Item
        name={[name, 'imageUrl']}
        label="图片URL"
        rules={[{ required: true, message: '请输入图片URL' }]}
      >
        <Input placeholder="输入图片URL，如 /images/empty/positions.png" />
      </Form.Item>

      <Form.Item
        name={[name, 'title']}
        label="标题"
        rules={[{ required: true, message: '请输入标题' }]}
      >
        <Input placeholder="如：暂无数据" />
      </Form.Item>

      <Form.Item
        name={[name, 'description']}
        label="描述"
        rules={[{ required: true, message: '请输入描述' }]}
      >
        <Input.TextArea rows={2} placeholder="如：暂时没有任何记录" />
      </Form.Item>

      {hasButton && (
        <>
          <Form.Item name={[name, 'buttonText']} label="按钮文字">
            <Input placeholder="如：去购买（可选）" />
          </Form.Item>

          <Form.Item name={[name, 'buttonLink']} label="按钮链接">
            <Input placeholder="如：/products（可选）" />
          </Form.Item>
        </>
      )}
    </Card>
  );
}

// ============================================================================
// 金额预览标签组件
// ============================================================================

interface AmountPreviewTagProps {
  value: string | number | undefined;
  label?: string;
}

/**
 * 金额预览标签
 */
function AmountPreviewTag({ value, label }: AmountPreviewTagProps) {
  if (!value && value !== 0) return null;

  return (
    <Tag color="blue" style={{ marginLeft: 8 }}>
      {label && `${label}: `}
      <AmountDisplay value={value} size="small" />
    </Tag>
  );
}

// ============================================================================
// 主页面组件
// ============================================================================

/**
 * 全局配置页
 * @description 管理全站核心配置
 */
export default function GlobalConfigPage() {
  const [form] = Form.useForm<GlobalConfigFormValues>();

  // 状态
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingValues, setPendingValues] = useState<GlobalConfigFormValues | null>(null);
  const [changedCriticalFields, setChangedCriticalFields] = useState<string[]>([]);

  // ========================================
  // 富文本编辑器重建计数器
  // 每次配置加载完成后递增，作为 RichTextEditor 的 key
  // key 变化 → React 销毁旧编辑器、创建新编辑器 → 新编辑器直接拿到正确的 form 值
  // 彻底避免 Quill 异步初始化与 form 值设置的时序问题
  // ========================================
  const [editorKey, setEditorKey] = useState(0);

  // 初始数据（用于重置和对比）
  const initialValuesRef = useRef<GlobalConfigFormValues | null>(null);

  // 配置版本信息
  const [version, setVersion] = useState<number>(0);
  const [updatedAt, setUpdatedAt] = useState<string>('');

  // 时区选择状态（用于实时预览）
  const [selectedTimezone, setSelectedTimezone] = useState<string>(DEFAULT_TIMEZONE);

  // 全局配置 store（用于同步更新）
  const { fetchConfig } = useGlobalConfigStore();

  // ============================================================================
  // 数据加载
  // ============================================================================

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const config = await fetchGlobalConfig();
      const formValues = transformConfigToForm(config);

      form.setFieldsValue(formValues);
      initialValuesRef.current = formValues;
      setVersion(config.globalConfigVersion);
      setUpdatedAt(config.globalConfigUpdatedAt);
      setSelectedTimezone(config.systemTimezone);

      // 递增编辑器 key，强制所有 RichTextEditor 重建
      // 新建的编辑器会从 Form.Item 直接拿到已设置好的值
      setEditorKey(prev => prev + 1);
    } catch (error) {
      console.error('加载配置失败:', error);
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // ============================================================================
  // 表单提交
  // ============================================================================

  /**
   * 检查是否修改了关键配置
   */
  const checkCriticalChanges = useCallback((values: GlobalConfigFormValues): string[] => {
    if (!initialValuesRef.current) return [];

    const changed: string[] = [];
    CRITICAL_CONFIG_FIELDS.forEach((field) => {
      const initialValue = initialValuesRef.current?.[field as keyof GlobalConfigFormValues];
      const currentValue = values[field as keyof GlobalConfigFormValues];

      if (initialValue !== currentValue) {
        changed.push(field);
      }
    });

    return changed;
  }, []);

  /**
   * 获取关键字段的中文名
   */
  const getCriticalFieldName = (field: string): string => {
    const names: Record<string, string> = {
      withdrawFeePercent: '提现手续费率',
      commissionLevel1Rate: '一级返佣比例',
      commissionLevel2Rate: '二级返佣比例',
      commissionLevel3Rate: '三级返佣比例',
      registerBonus: '注册奖励金额',
      systemTimezone: '系统时区',
    };
    return names[field] || field;
  };

  /**
   * 表单提交处理
   */
  const handleSubmit = async (values: GlobalConfigFormValues) => {
    // 检查关键配置变更
    const criticalChanges = checkCriticalChanges(values);

    if (criticalChanges.length > 0) {
      // 需要二次确认
      setChangedCriticalFields(criticalChanges);
      setPendingValues(values);
      setConfirmModalVisible(true);
      return;
    }

    // 直接保存
    await saveConfig(values);
  };

  /**
   * 保存配置
   */
  const saveConfig = async (values: GlobalConfigFormValues) => {
    setSaving(true);
    try {
      const configData = transformFormToConfig(values);
      const result = await updateGlobalConfig(configData);

      // 更新版本信息
      setVersion(result.globalConfigVersion);
      setUpdatedAt(result.globalConfigUpdatedAt);

      // 更新初始值（保存当前表单值的快照）
      initialValuesRef.current = { ...values };

      // 同步更新全局配置 store
      await fetchConfig();

      // 重新设置表单值，确保 RichTextEditor 正确同步
      form.setFieldsValue(values);

      showSuccess(`配置保存成功，版本号：v${result.globalConfigVersion}`);
    } catch (error) {
      console.error('保存配置失败:', error);
    } finally {
      setSaving(false);
      setConfirmModalVisible(false);
      setPendingValues(null);
    }
  };

  /**
   * 确认保存关键配置
   */
  const handleConfirmSave = async () => {
    if (pendingValues) {
      await saveConfig(pendingValues);
    }
  };

  /**
   * 重置表单
   */
  const handleReset = () => {
    if (initialValuesRef.current) {
      form.setFieldsValue(initialValuesRef.current);
      setSelectedTimezone(initialValuesRef.current.systemTimezone);
      message.info('已重置为初始值');
    }
  };

  // ============================================================================
  // 配置分组
  // ============================================================================

  const configGroups: ConfigGroup[] = useMemo(
    () => [
      { key: 'basic', title: '基础信息', icon: <RiSettings4Line size={18} />, count: 8 },
      { key: 'timezone', title: '时区配置', icon: <RiTimeLine size={18} />, count: 2 },
      { key: 'finance', title: '财务配置', icon: <RiMoneyDollarCircleLine size={18} />, count: 9 },
      { key: 'recharge', title: '充值配置', icon: <RiWalletLine size={18} />, count: 7 },
      { key: 'commission', title: '返佣配置', icon: <RiTeamLine size={18} />, count: 3 },
      { key: 'security', title: '安全配置', icon: <RiShieldLine size={18} />, count: 7 },
      { key: 'rateLimit', title: 'API速率限制', icon: <RiSpeedLine size={18} />, count: 6 },
      { key: 'signin', title: '签到配置', icon: <RiCalendarCheckLine size={18} />, count: 4 },
      { key: 'heartbeat', title: '心跳配置', icon: <RiHeartPulseLine size={18} />, count: 3 },
      { key: 'taskAlert', title: '定时任务告警', icon: <RiAlarmWarningLine size={18} />, count: 4 },
      { key: 'upload', title: '文件上传限制', icon: <RiUploadCloud2Line size={18} />, count: 4 },
      { key: 'other', title: '其他配置', icon: <RiSettings3Line size={18} />, count: 9 },
      { key: 'featureToggle', title: '功能开关', icon: <RiToggleLine size={18} />, count: 6 },
      { key: 'withdrawPrereq', title: '提现前置条件', icon: <RiLockLine size={18} />, count: 2 },
      { key: 'spinWheel', title: '转盘配置', icon: <RiGamepadLine size={18} />, count: 2 },
      { key: 'currencyFormat', title: '货币格式化', icon: <RiExchangeDollarLine size={18} />, count: 3 },
      { key: 'tips', title: '提示文案配置', icon: <RiChat3Line size={18} />, count: 4 },
      { key: 'emptyState', title: '空状态配置', icon: <RiFileListLine size={18} />, count: 6 },
    ],
    []
  );

  // ============================================================================
  // 渲染折叠面板内容
  // ============================================================================

  const renderCollapseItems = () => [
    // 基础信息
    {
      key: 'basic',
      label: (
        <Space>
          <RiSettings4Line size={18} />
          <span>基础信息</span>
          <Badge count={8} showZero color="#1677ff" />
        </Space>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <Form.Item
            name="siteName"
            label="网站名称"
            rules={[
              { required: true, message: '请输入网站名称' },
              { max: 50, message: '最多50个字符' },
            ]}
          >
            <Input placeholder="请输入网站名称" maxLength={50} showCount />
          </Form.Item>

          <Form.Item
            name="siteDomain"
            label="网站域名"
            rules={[
              { required: true, message: '请输入网站域名' },
              {
                pattern: /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i,
                message: '请输入有效的域名',
              },
            ]}
          >
            <Input placeholder="如：example.com" />
          </Form.Item>

          <Form.Item
            name="siteLogoUrl"
            label="网站Logo URL"
            extra="支持 PNG/JPG/GIF，建议尺寸 200×60px"
          >
            <Input placeholder="请输入Logo图片URL" prefix={<RiImageLine size={16} />} />
          </Form.Item>

          <Form.Item label="货币配置" required>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item
                name="currencySymbol"
                noStyle
                rules={[{ required: true, message: '请输入货币符号' }]}
              >
                <Input style={{ width: 100 }} placeholder="$" />
              </Form.Item>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: 32,
                  paddingLeft: 12,
                }}
              >
                <Form.Item name="currencySpace" noStyle valuePropName="checked">
                  <Switch checkedChildren="有空格" unCheckedChildren="无空格" />
                </Form.Item>
              </div>
            </Space.Compact>
          </Form.Item>

          <Form.Item
            name="phoneAreaCode"
            label="手机区号"
            rules={[
              { required: true, message: '请输入手机区号' },
              { pattern: /^\+\d{1,4}$/, message: '请输入有效的区号，如 +212' },
            ]}
          >
            <Input style={{ width: 150 }} placeholder="+212" />
          </Form.Item>

          <Form.Item
            name="phoneDigitCount"
            label="手机号位数"
            rules={[{ required: true, message: '请输入手机号位数' }]}
            extra="摩洛哥手机号为9位"
          >
            <InputNumber min={7} max={15} precision={0} style={{ width: 150 }} placeholder="10" />
          </Form.Item>

          <Form.Item
            name="serviceTimeRange"
            label="客服服务时间"
            rules={[
              { required: true, message: '请输入客服时间' },
              { pattern: /^\d{2}:\d{2}-\d{2}:\d{2}$/, message: '格式如 09:00-19:00' },
            ]}
            extra="格式：HH:mm-HH:mm，如 09:00-19:00"
          >
            <Input style={{ width: 200 }} placeholder="09:00-19:00" />
          </Form.Item>
        </div>
      ),
    },

    // 时区配置
    {
      key: 'timezone',
      label: (
        <Space>
          <RiTimeLine size={18} />
          <span>时区配置</span>
          <Badge count={2} showZero color="#1677ff" />
        </Space>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <Form.Item
            name="systemTimezone"
            label="系统时区"
            rules={[{ required: true, message: '请选择系统时区' }]}
            extra="修改时区会影响全站时间显示"
          >
            <Select
              options={TIMEZONE_OPTIONS}
              placeholder="请选择时区"
              style={{ width: 300 }}
              onChange={(value) => setSelectedTimezone(value)}
            />
          </Form.Item>

          <Form.Item label="当前时区时间">
            <TimezoneClock timezone={selectedTimezone} />
          </Form.Item>

          <Form.Item name="timezoneDisplayName" label="时区显示名称">
            <Input placeholder="如：摩洛哥时间 (UTC+1)" style={{ width: 300 }} />
          </Form.Item>
        </div>
      ),
    },

    // 财务配置
    {
      key: 'finance',
      label: (
        <Space>
          <RiMoneyDollarCircleLine size={18} />
          <span>财务配置</span>
          <Badge count={9} showZero color="#1677ff" />
        </Space>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <Divider orientation="left" plain>
            提现设置
          </Divider>

          <Form.Item
            name="withdrawFeePercent"
            label="提现手续费率"
            rules={[
              { required: true, message: '请输入手续费率' },
              { type: 'number', min: 0, max: 100, message: '请输入0-100之间的数字' },
            ]}
          >
            <InputNumber
              min={0}
              max={100}
              precision={2}
              addonAfter="%"
              style={{ width: 150 }}
              placeholder="5"
            />
          </Form.Item>

          <Form.Item
            name="withdrawLimitDaily"
            label="每日提现次数限制"
            rules={[{ required: true, message: '请输入次数限制' }]}
          >
            <InputNumber min={1} max={10} precision={0} style={{ width: 150 }} placeholder="1" />
          </Form.Item>

          <Form.Item label="提现时间窗口" required>
            <Space>
              <Form.Item
                name="withdrawStartTime"
                noStyle
                rules={[{ required: true, message: '请选择开始时间' }]}
                getValueProps={(value) => ({
                  value: value ? dayjs(value, 'HH:mm') : null,
                })}
                getValueFromEvent={(time) => (time ? time.format('HH:mm') : '')}
              >
                <TimePicker format="HH:mm" placeholder="开始时间" />
              </Form.Item>
              <span>至</span>
              <Form.Item
                name="withdrawEndTime"
                noStyle
                rules={[{ required: true, message: '请选择结束时间' }]}
                getValueProps={(value) => ({
                  value: value ? dayjs(value, 'HH:mm') : null,
                })}
                getValueFromEvent={(time) => (time ? time.format('HH:mm') : '')}
              >
                <TimePicker format="HH:mm" placeholder="结束时间" />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item label="提现金额范围" required>
            <Space>
              <Form.Item
                name="withdrawMinAmount"
                noStyle
                rules={[{ required: true, message: '请输入最低金额' }]}
              >
                <InputNumber min={0} precision={2} placeholder="最低" style={{ width: 150 }} />
              </Form.Item>
              <span>-</span>
              <Form.Item
                name="withdrawMaxAmount"
                noStyle
                rules={[{ required: true, message: '请输入最高金额' }]}
              >
                <InputNumber min={0} precision={2} placeholder="最高" style={{ width: 150 }} />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item
            name="withdrawQuickAmounts"
            label="提现快捷金额"
            extra="输入数字并按回车添加，支持多个金额"
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="输入金额后按回车"
              tokenSeparators={[',']}
            />
          </Form.Item>

          <Divider orientation="left" plain>
            注册设置
          </Divider>

          <Form.Item
            name="registerBonus"
            label={
              <Space>
                <span>注册奖励金额</span>
                <Form.Item noStyle shouldUpdate={(prev, cur) => prev.registerBonus !== cur.registerBonus}>
                  {({ getFieldValue }) => <AmountPreviewTag value={getFieldValue('registerBonus')} />}
                </Form.Item>
              </Space>
            }
          >
            <InputNumber min={0} precision={2} style={{ width: 150 }} placeholder="20" />
          </Form.Item>

          <Form.Item
            name="registerIpLimit"
            label="同IP注册限制"
            extra="同一IP地址最多可注册的账号数量"
          >
            <InputNumber min={1} max={100} precision={0} style={{ width: 150 }} placeholder="5" />
          </Form.Item>
        </div>
      ),
    },

    // 充值配置
    {
      key: 'recharge',
      label: (
        <Space>
          <RiWalletLine size={18} />
          <span>充值配置</span>
          <Badge count={7} showZero color="#1677ff" />
        </Space>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <Form.Item
            name="rechargePresets"
            label="充值预设档位"
            extra="用户可快速选择的充值金额"
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="输入金额后按回车"
              tokenSeparators={[',']}
            />
          </Form.Item>

          <Form.Item label="充值金额范围" required>
            <Space>
              <Form.Item
                name="rechargeMinAmount"
                noStyle
                rules={[{ required: true, message: '请输入最低金额' }]}
              >
                <InputNumber min={0} precision={2} placeholder="最低" style={{ width: 150 }} />
              </Form.Item>
              <span>-</span>
              <Form.Item
                name="rechargeMaxAmount"
                noStyle
                rules={[{ required: true, message: '请输入最高金额' }]}
              >
                <InputNumber min={0} precision={2} placeholder="最高" style={{ width: 150 }} />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item
            name="rechargeTimeoutMinutes"
            label="订单超时时间"
            rules={[{ required: true, message: '请输入超时时间' }]}
          >
            <InputNumber
              min={1}
              max={1440}
              precision={0}
              addonAfter="分钟"
              style={{ width: 180 }}
              placeholder="30"
            />
          </Form.Item>

          <Form.Item
            name="rechargeMaxPending"
            label="最大待支付订单数"
            extra="用户同时可存在的未支付充值订单数量"
          >
            <InputNumber min={1} max={20} precision={0} style={{ width: 150 }} placeholder="5" />
          </Form.Item>

          <Form.Item
            name="rechargePageTips"
            label="充值页提示文案"
            extra="显示在充值页面的提示信息"
          >
            <RichTextEditor key={`rechargePageTips-${editorKey}`} height={150} placeholder="请输入充值页提示文案..." />
          </Form.Item>

          <Form.Item
            name="withdrawPageTips"
            label="提现页提示文案"
            extra="显示在提现页面的提示信息"
          >
            <RichTextEditor key={`withdrawPageTips-${editorKey}`} height={150} placeholder="请输入提现页提示文案..." />
          </Form.Item>
        </div>
      ),
    },

    // 返佣配置
    {
      key: 'commission',
      label: (
        <Space>
          <RiTeamLine size={18} />
          <span>返佣配置</span>
          <Badge count={3} showZero color="#1677ff" />
        </Space>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            返佣在用户首次购买付费产品（type=PAID）或理财产品（type=FINANCIAL）时触发，体验产品（type=TRIAL）不触发返佣
          </Text>

          <Form.Item
            name="commissionLevel1Rate"
            label="一级返佣比例"
            rules={[{ type: 'number', min: 0, max: 100, message: '请输入0-100之间的数字' }]}
          >
            <InputNumber
              min={0}
              max={100}
              precision={2}
              addonAfter="%"
              style={{ width: 150 }}
              placeholder="20"
            />
          </Form.Item>

          <Form.Item
            name="commissionLevel2Rate"
            label="二级返佣比例"
            rules={[{ type: 'number', min: 0, max: 100, message: '请输入0-100之间的数字' }]}
          >
            <InputNumber
              min={0}
              max={100}
              precision={2}
              addonAfter="%"
              style={{ width: 150 }}
              placeholder="2"
            />
          </Form.Item>

          <Form.Item
            name="commissionLevel3Rate"
            label="三级返佣比例"
            rules={[{ type: 'number', min: 0, max: 100, message: '请输入0-100之间的数字' }]}
          >
            <InputNumber
              min={0}
              max={100}
              precision={2}
              addonAfter="%"
              style={{ width: 150 }}
              placeholder="1"
            />
          </Form.Item>
        </div>
      ),
    },

    // 安全配置
    {
      key: 'security',
      label: (
        <Space>
          <RiShieldLine size={18} />
          <span>安全配置</span>
          <Badge count={7} showZero color="#1677ff" />
        </Space>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <Form.Item
            name="tokenExpiresDays"
            label="Token有效期"
            rules={[{ required: true, message: '请输入有效期' }]}
          >
            <InputNumber
              min={1}
              max={30}
              precision={0}
              addonAfter="天"
              style={{ width: 150 }}
              placeholder="7"
            />
          </Form.Item>

          <Form.Item
            name="tokenRenewThresholdDays"
            label="Token续期阈值"
            extra="当 Token 剩余有效期小于此天数时自动续期"
          >
            <InputNumber
              min={1}
              max={7}
              precision={0}
              addonAfter="天"
              style={{ width: 150 }}
              placeholder="1"
            />
          </Form.Item>

          <Form.Item
            name="maxBindcardCount"
            label="最大绑卡数量"
            extra="用户最多可绑定的银行卡数量"
          >
            <InputNumber min={1} max={10} precision={0} style={{ width: 150 }} placeholder="3" />
          </Form.Item>

          <Form.Item
            name="passwordMinLength"
            label="密码最小长度"
            rules={[{ type: 'number', min: 4, max: 20, message: '请输入4-20之间的数字' }]}
          >
            <InputNumber min={4} max={20} precision={0} style={{ width: 150 }} placeholder="6" />
          </Form.Item>

          <Form.Item
            name="passwordMaxLength"
            label="密码最大长度"
            rules={[{ type: 'number', min: 16, max: 128, message: '请输入16-128之间的数字' }]}
          >
            <InputNumber min={16} max={128} precision={0} style={{ width: 150 }} placeholder="32" />
          </Form.Item>

          <Form.Item
            name="passwordComplexityRequired"
            label="密码复杂度要求"
            valuePropName="checked"
            extra="开启后密码必须包含字母和数字"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>

          <Form.Item
            name="passwordStrengthIndicator"
            label="密码强度指示器"
            valuePropName="checked"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
        </div>
      ),
    },

    // API速率限制
    {
      key: 'rateLimit',
      label: (
        <Space>
          <RiSpeedLine size={18} />
          <span>API速率限制</span>
          <Badge count={6} showZero color="#1677ff" />
        </Space>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <Form.Item
            name="rateLimitGlobal"
            label="全局请求限制"
            extra="单IP每分钟最大请求数"
          >
            <InputNumber
              min={10}
              max={1000}
              precision={0}
              addonAfter="次/分钟/IP"
              style={{ width: 200 }}
              placeholder="120"
            />
          </Form.Item>

          <Form.Item
            name="rateLimitLogin"
            label="登录接口限制"
            extra="单IP每分钟最大登录尝试次数"
          >
            <InputNumber
              min={1}
              max={100}
              precision={0}
              addonAfter="次/分钟/IP"
              style={{ width: 200 }}
              placeholder="10"
            />
          </Form.Item>

          <Form.Item name="rateLimitRegister" label="注册接口限制">
            <InputNumber
              min={1}
              max={100}
              precision={0}
              addonAfter="次/分钟/IP"
              style={{ width: 200 }}
              placeholder="5"
            />
          </Form.Item>

          <Form.Item
            name="rateLimitRecharge"
            label="充值接口限制"
            extra="单用户每分钟最大充值请求次数"
          >
            <InputNumber
              min={1}
              max={100}
              precision={0}
              addonAfter="次/分钟/用户"
              style={{ width: 200 }}
              placeholder="10"
            />
          </Form.Item>

          <Form.Item name="rateLimitWithdraw" label="提现接口限制">
            <InputNumber
              min={1}
              max={100}
              precision={0}
              addonAfter="次/分钟/用户"
              style={{ width: 200 }}
              placeholder="5"
            />
          </Form.Item>

          <Form.Item name="rateLimitSignin" label="签到接口限制">
            <InputNumber
              min={1}
              max={100}
              precision={0}
              addonAfter="次/分钟/用户"
              style={{ width: 200 }}
              placeholder="5"
            />
          </Form.Item>
        </div>
      ),
    },

    // 签到配置
    {
      key: 'signin',
      label: (
        <Space>
          <RiCalendarCheckLine size={18} />
          <span>签到配置</span>
          <Badge count={4} showZero color="#1677ff" />
        </Space>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <Form.Item
            name="signinStreakDisplayEnabled"
            label="连续签到展示"
            valuePropName="checked"
            extra="是否在签到页面显示连续签到天数"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>

          <Form.Item
            name="signinStreakRewardEnabled"
            label="连续签到奖励"
            valuePropName="checked"
            extra="开启后达到指定天数可获得额外奖励"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.signinStreakRewardEnabled !== cur.signinStreakRewardEnabled}>
            {({ getFieldValue }) =>
              getFieldValue('signinStreakRewardEnabled') && (
                <>
                  <Form.Item
                    name="signinStreak7DaysReward"
                    label={
                      <Space>
                        <span>7天连续奖励</span>
                        <Form.Item noStyle shouldUpdate>
                          {() => <AmountPreviewTag value={getFieldValue('signinStreak7DaysReward')} />}
                        </Form.Item>
                      </Space>
                    }
                  >
                    <InputNumber min={0} precision={2} style={{ width: 150 }} placeholder="5" />
                  </Form.Item>

                  <Form.Item
                    name="signinStreak30DaysReward"
                    label={
                      <Space>
                        <span>30天连续奖励</span>
                        <Form.Item noStyle shouldUpdate>
                          {() => <AmountPreviewTag value={getFieldValue('signinStreak30DaysReward')} />}
                        </Form.Item>
                      </Space>
                    }
                  >
                    <InputNumber min={0} precision={2} style={{ width: 150 }} placeholder="20" />
                  </Form.Item>
                </>
              )
            }
          </Form.Item>
        </div>
      ),
    },

    // 心跳配置
    {
      key: 'heartbeat',
      label: (
        <Space>
          <RiHeartPulseLine size={18} />
          <span>心跳配置</span>
          <Badge count={3} showZero color="#1677ff" />
        </Space>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <Form.Item
            name="heartbeatInterval"
            label="心跳上报间隔"
            extra="客户端向服务器发送心跳的间隔时间"
          >
            <InputNumber
              min={10}
              max={300}
              precision={0}
              addonAfter="秒"
              style={{ width: 150 }}
              placeholder="60"
            />
          </Form.Item>

          <Form.Item
            name="heartbeatTimeout"
            label="心跳超时时间"
            extra="超过此时间未收到心跳则判定用户离线，建议为心跳间隔的2倍"
          >
            <InputNumber
              min={30}
              max={600}
              precision={0}
              addonAfter="秒"
              style={{ width: 150 }}
              placeholder="120"
            />
          </Form.Item>

          <Form.Item
            name="incomeMaxRetryCount"
            label="收益发放重试次数"
            extra="收益发放失败后的最大重试次数"
          >
            <InputNumber min={1} max={10} precision={0} style={{ width: 150 }} placeholder="3" />
          </Form.Item>
        </div>
      ),
    },

    // 定时任务告警
    {
      key: 'taskAlert',
      label: (
        <Space>
          <RiAlarmWarningLine size={18} />
          <span>定时任务告警</span>
          <Badge count={4} showZero color="#1677ff" />
        </Space>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <Form.Item
            name="taskFailureAlertEnabled"
            label="任务失败告警"
            valuePropName="checked"
            extra="开启后定时任务连续失败将触发告警"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.taskFailureAlertEnabled !== cur.taskFailureAlertEnabled}>
            {({ getFieldValue }) =>
              getFieldValue('taskFailureAlertEnabled') && (
                <>
                  <Form.Item
                    name="taskConsecutiveFailureThreshold"
                    label="连续失败告警阈值"
                    extra="任务连续失败达到此次数后触发告警"
                  >
                    <InputNumber
                      min={1}
                      max={20}
                      precision={0}
                      addonAfter="次"
                      style={{ width: 150 }}
                      placeholder="3"
                    />
                  </Form.Item>

                  <Form.Item
                    name="taskExecutionTimeoutThreshold"
                    label="执行超时阈值"
                    extra="任务执行时间超过此阈值视为超时"
                  >
                    <InputNumber
                      min={30}
                      max={3600}
                      precision={0}
                      addonAfter="秒"
                      style={{ width: 180 }}
                      placeholder="300"
                    />
                  </Form.Item>

                  <Form.Item
                    name="taskAlertMethod"
                    label="告警方式"
                    extra="选择告警通知方式"
                  >
                    <Select
                      mode="multiple"
                      style={{ width: 300 }}
                      placeholder="选择告警方式"
                      options={[
                        { value: 'admin_notification', label: '后台通知' },
                        { value: 'email', label: '邮件通知' },
                        { value: 'webhook', label: 'Webhook' },
                      ]}
                    />
                  </Form.Item>
                </>
              )
            }
          </Form.Item>
        </div>
      ),
    },

    // 文件上传限制
    {
      key: 'upload',
      label: (
        <Space>
          <RiUploadCloud2Line size={18} />
          <span>文件上传限制</span>
          <Badge count={4} showZero color="#1677ff" />
        </Space>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <Form.Item
            name="productImageMaxSize"
            label="产品图片大小限制"
            extra="单张产品图片的最大允许大小（字节），5242880 = 5MB"
          >
            <InputNumber
              min={1048576}
              max={20971520}
              precision={0}
              addonAfter="字节"
              style={{ width: 220 }}
              placeholder="5242880"
            />
          </Form.Item>

          <Form.Item
            name="bannerMaxSize"
            label="Banner图片大小限制"
            extra="轮播Banner图片的最大允许大小（字节），5242880 = 5MB"
          >
            <InputNumber
              min={1048576}
              max={20971520}
              precision={0}
              addonAfter="字节"
              style={{ width: 220 }}
              placeholder="5242880"
            />
          </Form.Item>

          <Form.Item
            name="posterBgMaxSize"
            label="邀请海报背景大小限制"
            extra="邀请海报背景图的最大允许大小（字节），10485760 = 10MB"
          >
            <InputNumber
              min={1048576}
              max={52428800}
              precision={0}
              addonAfter="字节"
              style={{ width: 220 }}
              placeholder="10485760"
            />
          </Form.Item>

          <Form.Item
            name="allowedImageTypes"
            label="允许的图片格式"
            extra="多个格式用逗号分隔，如 JPG,PNG,GIF,WEBP"
          >
            <Input placeholder="JPG,PNG,GIF,WEBP" style={{ width: 300 }} />
          </Form.Item>
        </div>
      ),
    },

    // 其他配置
    {
      key: 'other',
      label: (
        <Space>
          <RiSettings3Line size={18} />
          <span>其他配置</span>
          <Badge count={9} showZero color="#1677ff" />
        </Space>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <Divider orientation="left" plain>
            Toast配置
          </Divider>

          <Form.Item name="toastDuration" label="Toast显示时长">
            <InputNumber
              min={1000}
              max={10000}
              precision={0}
              addonAfter="毫秒"
              style={{ width: 180 }}
              placeholder="3000"
            />
          </Form.Item>

          <Form.Item name="toastPosition" label="Toast位置">
            <Select
              options={TOAST_POSITION_OPTIONS}
              style={{ width: 180 }}
              placeholder="选择位置"
            />
          </Form.Item>

          <Divider orientation="left" plain>
            用户头像/昵称
          </Divider>

          <Form.Item
            name="avatarMaxSizeMB"
            label="头像大小限制"
            rules={[{ type: 'number', min: 0.5, max: 10, message: '请输入0.5-10之间的数字' }]}
          >
            <InputNumber
              min={0.5}
              max={10}
              precision={1}
              addonAfter="MB"
              style={{ width: 150 }}
              placeholder="2"
            />
          </Form.Item>

          <Form.Item name="avatarFormats" label="头像支持格式" extra="多个格式用逗号分隔">
            <Input placeholder="jpg,png,gif" style={{ width: 250 }} />
          </Form.Item>

          <Form.Item name="nicknameMinLength" label="昵称最小长度">
            <InputNumber min={1} max={10} precision={0} style={{ width: 150 }} placeholder="2" />
          </Form.Item>

          <Form.Item name="nicknameMaxLength" label="昵称最大长度">
            <InputNumber min={5} max={50} precision={0} style={{ width: 150 }} placeholder="20" />
          </Form.Item>

          <Form.Item
            name="sensitiveWordFilterEnabled"
            label="敏感词过滤"
            valuePropName="checked"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>

          <Divider orientation="left" plain>
            列表配置
          </Divider>

          <Form.Item
            name="transactionTimeFilterEnabled"
            label="资金明细时间筛选"
            valuePropName="checked"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>

          <Form.Item name="defaultPageSize" label="默认分页大小">
            <InputNumber min={10} max={100} precision={0} style={{ width: 150 }} placeholder="20" />
          </Form.Item>
        </div>
      ),
    },

    // 功能开关
    {
      key: 'featureToggle',
      label: (
        <Space>
          <RiToggleLine size={18} />
          <span>功能开关</span>
          <Badge count={6} showZero color="#1677ff" />
        </Space>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            控制各功能模块的启用/禁用状态，关闭后前端将隐藏对应入口
          </Text>

          <Form.Item
            name="svipRewardEnabled"
            label="SVIP奖励功能"
            valuePropName="checked"
            extra="开启后SVIP用户每日可获得签到奖励"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>

          <Form.Item
            name="weeklySalaryEnabled"
            label="周薪功能"
            valuePropName="checked"
            extra="开启后符合条件的用户每周可领取周薪奖励"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>

          <Form.Item
            name="prizePoolEnabled"
            label="奖池功能"
            valuePropName="checked"
            extra="开启后前端显示奖池入口"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>

          <Form.Item
            name="spinWheelEnabled"
            label="转盘功能"
            valuePropName="checked"
            extra="开启后前端显示转盘抽奖入口"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>

          <Form.Item
            name="communityEnabled"
            label="社区功能"
            valuePropName="checked"
            extra="开启后前端显示社区板块"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>

          <Form.Item
            name="financialProductEnabled"
            label="理财产品功能"
            valuePropName="checked"
            extra="开启后前端显示理财产品入口"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
        </div>
      ),
    },

    // 提现前置条件
    {
      key: 'withdrawPrereq',
      label: (
        <Space>
          <RiLockLine size={18} />
          <span>提现前置条件</span>
          <Badge count={2} showZero color="#1677ff" />
        </Space>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            配置用户提现前需满足的前置条件
          </Text>

          <Form.Item
            name="withdrawRequireRecharge"
            label="提现需先充值"
            valuePropName="checked"
            extra="开启后用户必须有充值记录才能提现"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>

          <Form.Item
            name="withdrawRequirePurchase"
            label="提现需先购买产品"
            valuePropName="checked"
            extra="开启后用户必须购买过产品才能提现"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
        </div>
      ),
    },

    // 转盘配置
    {
      key: 'spinWheel',
      label: (
        <Space>
          <RiGamepadLine size={18} />
          <span>转盘配置</span>
          <Badge count={2} showZero color="#1677ff" />
        </Space>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <Form.Item
            name="spinMaxDaily"
            label="每日最大转盘次数"
            rules={[{ type: 'number', min: 0, max: 100, message: '请输入0-100之间的数字' }]}
            extra="每个用户每天可使用的转盘次数上限"
          >
            <InputNumber
              min={0}
              max={100}
              precision={0}
              addonAfter="次/日"
              style={{ width: 180 }}
              placeholder="3"
            />
          </Form.Item>

          <Form.Item
            name="spinInviteThreshold"
            label="转盘邀请门槛"
            rules={[{ type: 'number', min: 0, max: 100, message: '请输入0-100之间的数字' }]}
            extra="邀请达到此人数后获得额外转盘次数"
          >
            <InputNumber
              min={0}
              max={100}
              precision={0}
              addonAfter="人"
              style={{ width: 180 }}
              placeholder="1"
            />
          </Form.Item>
        </div>
      ),
    },

    // 货币格式化
    {
      key: 'currencyFormat',
      label: (
        <Space>
          <RiExchangeDollarLine size={18} />
          <span>货币格式化</span>
          <Badge count={3} showZero color="#1677ff" />
        </Space>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <Form.Item
            name="currencyDecimals"
            label="小数位数"
            rules={[{ type: 'number', min: 0, max: 4, message: '请输入0-4之间的数字' }]}
            extra="金额显示的小数位数"
          >
            <InputNumber
              min={0}
              max={4}
              precision={0}
              style={{ width: 150 }}
              placeholder="2"
            />
          </Form.Item>

          <Form.Item
            name="currencyThousandsSep"
            label="千位分隔符"
            extra="金额千位分隔符，常见的有逗号(,)和点号(.)"
          >
            <Input style={{ width: 150 }} placeholder="," maxLength={1} />
          </Form.Item>

          <Form.Item
            name="currencyCode"
            label="货币代码"
            extra="ISO 4217货币代码，如 COP、USD、EUR"
          >
            <Input style={{ width: 150 }} placeholder="MAD" maxLength={5} />
          </Form.Item>
        </div>
      ),
    },

    // 提示文案配置
    {
      key: 'tips',
      label: (
        <Space>
          <RiChat3Line size={18} />
          <span>提示文案配置</span>
          <Badge count={4} showZero color="#1677ff" />
        </Space>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <Form.Item
            name="withdrawThresholdNotMetTip"
            label="提现门槛未满足提示"
            extra="用户未满足提现条件时显示的提示文案"
          >
            <RichTextEditor key={`withdrawThresholdNotMetTip-${editorKey}`} height={120} placeholder="请输入提示文案..." />
          </Form.Item>

          <Form.Item
            name="insufficientBalanceTip"
            label="余额不足提示"
            extra="用户余额不足时显示的提示文案"
          >
            <RichTextEditor key={`insufficientBalanceTip-${editorKey}`} height={120} placeholder="请输入提示文案..." />
          </Form.Item>

          <Form.Item
            name="vipLevelRequiredTip"
            label="等级不足提示"
            extra="用户等级不足以购买产品时显示的提示文案"
          >
            <RichTextEditor key={`vipLevelRequiredTip-${editorKey}`} height={120} placeholder="请输入提示文案..." />
          </Form.Item>

          <Form.Item name="logoutConfirmTip" label="退出登录确认文案">
            <Input.TextArea rows={2} placeholder="确定要退出登录吗？" />
          </Form.Item>
        </div>
      ),
    },

    // 空状态配置
    {
      key: 'emptyState',
      label: (
        <Space>
          <RiFileListLine size={18} />
          <span>空状态配置</span>
          <Badge count={6} showZero color="#1677ff" />
        </Space>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <EmptyStateFormItem name="emptyStatePositions" label="持仓列表空状态" hasButton />
          <EmptyStateFormItem name="emptyStateRecharge" label="充值记录空状态" />
          <EmptyStateFormItem name="emptyStateWithdraw" label="提现记录空状态" />
          <EmptyStateFormItem name="emptyStateTransaction" label="资金明细空状态" />
          <EmptyStateFormItem name="emptyStateTeam" label="团队成员空状态" hasButton />
          <EmptyStateFormItem name="emptyStateMessage" label="消息列表空状态" />
        </div>
      ),
    },
  ];

  // ============================================================================
  // 渲染
  // ============================================================================

  return (
    <PageContainer
      header={{
        title: '全局配置',
      }}
      content={
        <div>
          <Paragraph type="secondary">
            管理全站核心配置，修改后将自动同步到前端和后端
          </Paragraph>
          {version > 0 && (
            <Space style={{ marginTop: 8 }}>
              <Tag color="blue">版本：v{version}</Tag>
              {updatedAt && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  最后更新：<TimeDisplay value={updatedAt} />
                </Text>
              )}
            </Space>
          )}
        </div>
      }
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            currencySpace: true,
            passwordComplexityRequired: true,
            passwordStrengthIndicator: true,
            sensitiveWordFilterEnabled: true,
            transactionTimeFilterEnabled: true,
            signinStreakDisplayEnabled: true,
            signinStreakRewardEnabled: false,
          }}
        >
          <Card>
            <Collapse
              defaultActiveKey={['basic', 'timezone', 'finance', 'recharge']}
              items={renderCollapseItems()}
              expandIconPosition="end"
              style={{ background: 'transparent' }}
            />
          </Card>

          {/* 底部操作栏 */}
          <div
            style={{
              position: 'sticky',
              bottom: 0,
              background: '#fff',
              padding: '16px 24px',
              marginTop: 24,
              borderRadius: 8,
              boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text type="secondary">
              修改配置后将自动递增版本号，前端会自动同步最新配置
            </Text>
            <Space>
              <Button icon={<RiRefreshLine size={16} />} onClick={handleReset}>
                重置
              </Button>
              <Button
                type="primary"
                icon={<RiSaveLine size={16} />}
                loading={saving}
                htmlType="submit"
              >
                保存配置
              </Button>
            </Space>
          </div>
        </Form>
      </Spin>

      {/* 关键配置修改确认弹窗 */}
      <ConfirmModal
        open={confirmModalVisible}
        onClose={() => {
          setConfirmModalVisible(false);
          setPendingValues(null);
        }}
        onConfirm={handleConfirmSave}
        title="确认修改关键配置"
        content="您正在修改以下关键配置，这可能会影响系统的财务和安全设置。"
        type="warning"
        confirmText="确认保存"
        loading={saving}
        impacts={changedCriticalFields.map((field) => getCriticalFieldName(field))}
      />
    </PageContainer>
  );
}
