/**
 * @file 活动配置页面
 * @description 活动列表与配置管理，显示各活动卡片、统计数据、启用/禁用开关和配置编辑
 * @depends 开发文档/04-后台管理端/04.6-活动管理/04.6.1-活动配置页.md
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第8节 - 活动管理接口
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Switch,
  Button,
  Typography,
  Drawer,
  Form,
  InputNumber,
  Space,
  Spin,
  App,
  Descriptions,
  Tag,
  Divider,
  List,
  Empty,
} from 'antd';
import {
  RiCalendarCheckLine,
  RiVipCrownFill,
  RiUserAddLine,
  RiShoppingBag3Line,
  RiSettings3Line,
  RiGiftLine,
  RiAddLine,
  RiDeleteBin6Line,
  RiBarChartLine,
} from '@remixicon/react';
import { useRouter } from 'next/navigation';

import { get, put } from '@/utils/request';
import { AmountDisplay } from '@/components/common';
import { StatisticCard, StatisticCardGroup } from '@/components/common/StatisticCard';
import { useGlobalConfig } from '@/hooks/useGlobalConfig';

const { Title, Text, Paragraph } = Typography;

// ==================== 类型定义 ====================

/** 活动列表项 */
interface ActivityItem {
  code: string;
  name: string;
  isActive: boolean;
  participantCount: number;
  totalReward: string;
}

/** 活动详情 */
interface ActivityDetail {
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  config: Record<string, unknown>;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** 普通签到配置 */
interface NormalSignInConfig {
  dailyReward: number;
  windowDays: number;
  targetDays: number;
}

/** SVIP签到配置 */
interface SvipSignInConfig {
  rewards: Record<string, number>;
}

/** 拉新奖励配置 */
interface InviteRewardConfig {
  tiers: { count: number; reward: number }[];
}

/** 连单奖励配置 */
interface CollectionBonusConfig {
  tiers: { products: string[]; reward: number }[];
}

// ==================== 活动图标配置 ====================

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  NORMAL_SIGNIN: <RiCalendarCheckLine size={28} />,
  SVIP_SIGNIN: <RiVipCrownFill size={28} />,
  INVITE_REWARD: <RiUserAddLine size={28} />,
  COLLECTION_BONUS: <RiShoppingBag3Line size={28} />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  NORMAL_SIGNIN: '#1677ff',
  SVIP_SIGNIN: '#722ed1',
  INVITE_REWARD: '#52c41a',
  COLLECTION_BONUS: '#fa8c16',
};

const ACTIVITY_GRADIENTS: Record<string, string> = {
  NORMAL_SIGNIN: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  SVIP_SIGNIN: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  INVITE_REWARD: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  COLLECTION_BONUS: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
};

// ==================== API 请求函数 ====================

/** 获取活动列表 */
async function fetchActivities(): Promise<ActivityItem[]> {
  const res = await get<{ list: ActivityItem[] }>('/activities');
  return res.list;
}

/** 获取活动详情 */
async function fetchActivityDetail(code: string): Promise<ActivityDetail> {
  return get<ActivityDetail>(`/activities/${code}`);
}

/** 更新活动配置 */
async function updateActivity(
  code: string,
  data: { isActive?: boolean; config?: Record<string, unknown> }
): Promise<ActivityDetail> {
  return put<ActivityDetail>(`/activities/${code}`, data);
}

// ==================== 活动配置页面组件 ====================

export default function ActivityConfigPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const globalConfig = useGlobalConfig();
  
  // 状态
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<ActivityDetail | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // 表单实例
  const [form] = Form.useForm();

  // 加载活动列表
  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchActivities();
      setActivities(data);
    } catch (error) {
      console.error('获取活动列表失败:', error);
      message.error('获取活动列表失败');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // 切换活动启用状态
  const handleToggleActive = useCallback(async (code: string, isActive: boolean) => {
    try {
      await updateActivity(code, { isActive });
      setActivities((prev) =>
        prev.map((item) => (item.code === code ? { ...item, isActive } : item))
      );
      message.success(isActive ? '活动已启用' : '活动已禁用');
    } catch (error) {
      console.error('切换活动状态失败:', error);
      message.error('操作失败');
    }
  }, [message]);

  // 打开配置抽屉
  const handleOpenConfig = useCallback(async (code: string) => {
    setDrawerVisible(true);
    setConfigLoading(true);
    try {
      const detail = await fetchActivityDetail(code);
      setCurrentActivity(detail);
      
      // 根据活动类型设置表单值
      if (detail.config) {
        form.setFieldsValue(detail.config);
      }
    } catch (error) {
      console.error('获取活动详情失败:', error);
      message.error('获取活动配置失败');
    } finally {
      setConfigLoading(false);
    }
  }, [form, message]);

  // 关闭配置抽屉
  const handleCloseDrawer = useCallback(() => {
    setDrawerVisible(false);
    setCurrentActivity(null);
    form.resetFields();
  }, [form]);

  // 保存配置
  const handleSaveConfig = useCallback(async () => {
    if (!currentActivity) return;
    
    try {
      const values = await form.validateFields();
      setSaving(true);
      
      await updateActivity(currentActivity.code, { config: values });
      message.success('配置已保存');
      handleCloseDrawer();
      loadActivities(); // 刷新列表
    } catch (error) {
      console.error('保存配置失败:', error);
      if (error instanceof Error) {
        message.error(error.message || '保存失败');
      }
    } finally {
      setSaving(false);
    }
  }, [currentActivity, form, message, handleCloseDrawer, loadActivities]);

  // 跳转到活动数据明细
  const handleViewData = useCallback(() => {
    router.push('/activities/data');
  }, [router]);

  // ==================== 渲染配置表单 ====================

  /** 渲染普通签到配置表单 */
  const renderNormalSignInForm = () => (
    <>
      <Form.Item
        label="每日奖励金额"
        name="dailyReward"
        rules={[{ required: true, message: '请输入每日奖励金额' }]}
        tooltip="用户每次签到可获得的奖励金额"
      >
        <InputNumber
          min={0.01}
          step={0.01}
          precision={2}
          prefix={globalConfig.currencySymbol}
          style={{ width: '100%' }}
          placeholder="请输入每日奖励金额"
        />
      </Form.Item>
      <Form.Item
        label="签到窗口期（天）"
        name="windowDays"
        rules={[{ required: true, message: '请输入签到窗口期' }]}
        tooltip="连续签到的有效天数范围"
      >
        <InputNumber
          min={1}
          max={365}
          precision={0}
          style={{ width: '100%' }}
          placeholder="请输入签到窗口期"
        />
      </Form.Item>
      <Form.Item
        label="目标签到天数"
        name="targetDays"
        rules={[{ required: true, message: '请输入目标签到天数' }]}
        tooltip="完成签到任务所需的总天数"
      >
        <InputNumber
          min={1}
          max={365}
          precision={0}
          style={{ width: '100%' }}
          placeholder="请输入目标签到天数"
        />
      </Form.Item>
    </>
  );

  /** 渲染SVIP签到配置表单 */
  const renderSvipSignInForm = () => (
    <>
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        配置各SVIP等级的签到奖励金额，等级1-8对应SVIP1-SVIP8
      </Paragraph>
      <Form.Item label="等级奖励配置" required>
        <Card size="small" style={{ background: '#fafafa' }}>
          <Row gutter={[16, 16]}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((level) => (
              <Col span={12} key={level}>
                <Form.Item
                  name={['rewards', level.toString()]}
                  label={
                    <Space>
                      <RiVipCrownFill size={16} style={{ color: '#722ed1' }} />
                      <span>SVIP{level}</span>
                    </Space>
                  }
                  rules={[{ required: true, message: `请输入SVIP${level}奖励` }]}
                  style={{ marginBottom: 8 }}
                >
                  <InputNumber
                    min={0.01}
                    step={1}
                    precision={2}
                    prefix={globalConfig.currencySymbol}
                    style={{ width: '100%' }}
                    placeholder={`SVIP${level}奖励`}
                  />
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Card>
      </Form.Item>
    </>
  );

  /** 渲染拉新奖励配置表单 */
  const renderInviteRewardForm = () => (
    <>
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        配置阶梯奖励，邀请人数达到指定数量可领取对应奖励。人数必须递增。
      </Paragraph>
      <Form.List name="tiers">
        {(fields, { add, remove }) => (
          <>
            <List
              dataSource={fields}
              renderItem={(field, index) => (
                <List.Item
                  key={field.key}
                  style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
                >
                  <Row gutter={16} style={{ width: '100%' }} align="middle">
                    <Col span={2}>
                      <Tag color="blue">档{index + 1}</Tag>
                    </Col>
                    <Col span={9}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'count']}
                        label="邀请人数"
                        rules={[{ required: true, message: '请输入邀请人数' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          min={1}
                          precision={0}
                          suffix="人"
                          style={{ width: '100%' }}
                          placeholder="邀请人数"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={9}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'reward']}
                        label="奖励金额"
                        rules={[{ required: true, message: '请输入奖励金额' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          min={0.01}
                          step={1}
                          precision={2}
                          prefix={globalConfig.currencySymbol}
                          style={{ width: '100%' }}
                          placeholder="奖励金额"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4} style={{ textAlign: 'right' }}>
                      {fields.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<RiDeleteBin6Line size={16} />}
                          onClick={() => remove(field.name)}
                        />
                      )}
                    </Col>
                  </Row>
                </List.Item>
              )}
            />
            <Button
              type="dashed"
              onClick={() => add({ count: undefined, reward: undefined })}
              block
              icon={<RiAddLine size={16} />}
              style={{ marginTop: 16 }}
            >
              添加档位
            </Button>
          </>
        )}
      </Form.List>
    </>
  );

  /** 渲染连单奖励配置表单 */
  const renderCollectionBonusForm = () => (
    <>
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        配置产品组合奖励，购买指定产品组合后可领取对应奖励。每档产品必须包含上一档所有产品。
      </Paragraph>
      <Form.List name="tiers">
        {(fields, { add, remove }) => (
          <>
            <List
              dataSource={fields}
              renderItem={(field, index) => (
                <List.Item
                  key={field.key}
                  style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
                >
                  <Row gutter={16} style={{ width: '100%' }} align="middle">
                    <Col span={2}>
                      <Tag color="purple">档{index + 1}</Tag>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'products']}
                        label="所需产品"
                        rules={[{ required: true, message: '请输入产品编码' }]}
                        style={{ marginBottom: 0 }}
                        tooltip="输入产品编码，多个用英文逗号分隔，如: VIP1,VIP2"
                      >
                        <InputNumber
                          style={{ width: '100%', display: 'none' }}
                        />
                        <input
                          type="text"
                          className="ant-input"
                          style={{ width: '100%', padding: '4px 11px', border: '1px solid #d9d9d9', borderRadius: 6 }}
                          placeholder="产品编码，如: VIP1,VIP2"
                          defaultValue={
                            form.getFieldValue(['tiers', field.name, 'products'])?.join(',') || ''
                          }
                          onChange={(e) => {
                            const products = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                            form.setFieldValue(['tiers', field.name, 'products'], products);
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'reward']}
                        label="奖励金额"
                        rules={[{ required: true, message: '请输入奖励金额' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          min={0.01}
                          step={1}
                          precision={2}
                          prefix={globalConfig.currencySymbol}
                          style={{ width: '100%' }}
                          placeholder="奖励金额"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4} style={{ textAlign: 'right' }}>
                      {fields.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<RiDeleteBin6Line size={16} />}
                          onClick={() => remove(field.name)}
                        />
                      )}
                    </Col>
                  </Row>
                </List.Item>
              )}
            />
            <Button
              type="dashed"
              onClick={() => add({ products: [], reward: undefined })}
              block
              icon={<RiAddLine size={16} />}
              style={{ marginTop: 16 }}
            >
              添加档位
            </Button>
          </>
        )}
      </Form.List>
    </>
  );

  /** 根据活动类型渲染配置表单 */
  const renderConfigForm = () => {
    if (!currentActivity) return null;
    
    switch (currentActivity.code) {
      case 'NORMAL_SIGNIN':
        return renderNormalSignInForm();
      case 'SVIP_SIGNIN':
        return renderSvipSignInForm();
      case 'INVITE_REWARD':
        return renderInviteRewardForm();
      case 'COLLECTION_BONUS':
        return renderCollectionBonusForm();
      default:
        return <Empty description="未知的活动类型" />;
    }
  };

  // ==================== 渲染活动卡片 ====================

  const renderActivityCard = (activity: ActivityItem) => {
    const icon = ACTIVITY_ICONS[activity.code];
    const color = ACTIVITY_COLORS[activity.code];
    const gradient = ACTIVITY_GRADIENTS[activity.code];

    return (
      <Col xs={24} sm={12} lg={8} xl={6} key={activity.code}>
        <Card
          hoverable
          style={{
            borderRadius: 16,
            overflow: 'hidden',
            height: '100%',
          }}
          styles={{
            body: { padding: 0 },
          }}
        >
          {/* 顶部渐变区域 */}
          <div
            style={{
              background: gradient,
              padding: '24px 20px',
              color: '#fff',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {icon}
              </div>
              <div>
                <Title level={5} style={{ color: '#fff', margin: 0 }}>
                  {activity.name}
                </Title>
                <Tag
                  color={activity.isActive ? 'success' : 'default'}
                  style={{ marginTop: 4 }}
                >
                  {activity.isActive ? '已启用' : '已禁用'}
                </Tag>
              </div>
            </div>
            
            {/* 启用/禁用开关 */}
            <div style={{ position: 'absolute', top: 16, right: 16 }}>
              <Switch
                checked={activity.isActive}
                onChange={(checked) => handleToggleActive(activity.code, checked)}
                checkedChildren="开"
                unCheckedChildren="关"
              />
            </div>
          </div>

          {/* 统计数据区域 */}
          <div style={{ padding: '20px' }}>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>参与人数</Text>
                  <div style={{ fontSize: 24, fontWeight: 600, color }}>
                    {activity.participantCount.toLocaleString()}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>发放金额</Text>
                  <div style={{ fontSize: 24, fontWeight: 600, color }}>
                    <AmountDisplay value={activity.totalReward} showSymbol={false} />
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* 操作按钮 */}
          <Divider style={{ margin: 0 }} />
          <div style={{ padding: '12px 20px', display: 'flex', gap: 8 }}>
            <Button
              type="primary"
              ghost
              icon={<RiSettings3Line size={16} />}
              onClick={() => handleOpenConfig(activity.code)}
              style={{ flex: 1 }}
            >
              配置
            </Button>
          </div>
        </Card>
      </Col>
    );
  };

  // ==================== 页面渲染 ====================

  return (
    <div className="activity-config-page">
      {/* 页面标题 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>活动配置</Title>
          <Text type="secondary">管理各类营销活动的配置和开关</Text>
        </div>
        <Button
          type="primary"
          icon={<RiBarChartLine size={16} />}
          onClick={handleViewData}
        >
          查看活动数据
        </Button>
      </div>

      {/* 活动卡片网格 */}
      <Spin spinning={loading}>
        {activities.length > 0 ? (
          <Row gutter={[24, 24]}>
            {activities.map(renderActivityCard)}
          </Row>
        ) : !loading && (
          <Card>
            <Empty description="暂无活动配置" />
          </Card>
        )}
      </Spin>

      {/* 配置编辑抽屉 */}
      <Drawer
        title={
          <Space>
            {currentActivity && ACTIVITY_ICONS[currentActivity.code]}
            <span>{currentActivity?.name || '活动配置'}</span>
          </Space>
        }
        width={560}
        open={drawerVisible}
        onClose={handleCloseDrawer}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCloseDrawer}>取消</Button>
              <Button
                type="primary"
                onClick={handleSaveConfig}
                loading={saving}
              >
                保存配置
              </Button>
            </Space>
          </div>
        }
      >
        <Spin spinning={configLoading}>
          {currentActivity && (
            <>
              {/* 活动基本信息 */}
              <Descriptions
                column={1}
                size="small"
                style={{ marginBottom: 24 }}
              >
                <Descriptions.Item label="活动代码">
                  <Tag>{currentActivity.code}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  <Tag color={currentActivity.isActive ? 'success' : 'default'}>
                    {currentActivity.isActive ? '已启用' : '已禁用'}
                  </Tag>
                </Descriptions.Item>
                {currentActivity.description && (
                  <Descriptions.Item label="活动描述">
                    {currentActivity.description}
                  </Descriptions.Item>
                )}
              </Descriptions>

              <Divider>配置参数</Divider>

              {/* 配置表单 */}
              <Form
                form={form}
                layout="vertical"
                initialValues={currentActivity.config}
              >
                {renderConfigForm()}
              </Form>
            </>
          )}
        </Spin>
      </Drawer>
    </div>
  );
}
