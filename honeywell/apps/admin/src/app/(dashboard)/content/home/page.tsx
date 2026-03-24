/**
 * @file 首页配置页
 * @description 配置前端用户首页的展示模块、快捷入口、推荐产品等
 * @depends 开发文档/04-后台管理端/04.8-内容管理/04.8.5-首页配置页.md
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Card, message, Button, Modal, Switch, Alert, Tag, Transfer, Spin } from 'antd';
import type { TransferProps } from 'antd';
import { ProForm, ProFormText, ProFormSwitch, ProFormDigit, ProFormSelect } from '@ant-design/pro-components';
import type { ProFormInstance } from '@ant-design/pro-components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, put } from '@/utils/request';
import { formatCurrency } from '@/utils/format';
import { DragSortList, type SortableItem } from '@/components/tables/DragSortList';
import * as RiIcons from '@remixicon/react';

// ================================
// 类型定义
// ================================

/**
 * 快捷入口类型
 */
interface QuickEntry extends SortableItem {
  id: string;
  key: string;
  icon: string;
  label: string;
  visible: boolean;
  sortOrder: number;
  /** 跳转链接（可选，支持站内路径如 /recharge 和站外URL如 https://...） */
  link?: string;
  [key: string]: unknown;
}

/**
 * 首页配置类型
 */
interface HomePageConfig {
  bannerVisible: boolean;
  todayIncomeVisible: boolean;
  signInEntryVisible: boolean;
  quickEntries: QuickEntry[];
  recommendEnabled: boolean;
  recommendTitle: string;
  recommendDisplayMode: 'scroll' | 'grid';
  recommendProductIds: number[];
  recommendMaxCount: number;
  marqueeVisible: boolean;
}

/**
 * 产品类型
 */
interface Product {
  id: number;
  code: string;
  name: string;
  type: 'TRIAL' | 'PAID';
  series: 'PO' | 'VIP';
  price: string;
  status: 'ACTIVE' | 'INACTIVE';
}

// ================================
// 预设数据
// ================================

/**
 * 预设快捷入口
 */
const DEFAULT_QUICK_ENTRIES: QuickEntry[] = [
  { id: 'telegram', key: 'telegram', icon: 'RiTelegramFill', label: 'Telegram', visible: true, sortOrder: 1 },
  { id: 'whatsapp', key: 'whatsapp', icon: 'RiWhatsappFill', label: 'WhatsApp', visible: true, sortOrder: 2 },
  { id: 'team', key: 'team', icon: 'RiTeamFill', label: 'Mi equipo', visible: true, sortOrder: 3 },
  { id: 'invite', key: 'invite', icon: 'RiGiftFill', label: 'Invitar', visible: true, sortOrder: 4 },
  { id: 'activities', key: 'activities', icon: 'RiCalendarEventFill', label: 'Actividades', visible: true, sortOrder: 5 },
  { id: 'positions', key: 'positions', icon: 'RiPieChartFill', label: 'Mis activos', visible: true, sortOrder: 6 },
];

/**
 * 入口key对应的中文名称
 */
const KEY_NAME_MAP: Record<string, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  team: '团队',
  invite: '邀请',
  activities: '活动',
  positions: '持仓',
  recharge: '充值',
  withdraw: '提现',
  support: '客服',
};

/**
 * 图标选项
 */
const ICON_OPTIONS = [
  { label: 'RiWhatsappFill (WhatsApp)', value: 'RiWhatsappFill' },
  { label: 'RiTelegramFill (Telegram)', value: 'RiTelegramFill' },
  { label: 'RiMessengerFill (Messenger)', value: 'RiMessengerFill' },
  { label: 'RiWallet3Fill (钱包)', value: 'RiWallet3Fill' },
  { label: 'RiBankFill (银行)', value: 'RiBankFill' },
  { label: 'RiTeamFill (团队)', value: 'RiTeamFill' },
  { label: 'RiGiftFill (礼物)', value: 'RiGiftFill' },
  { label: 'RiCalendarEventFill (活动)', value: 'RiCalendarEventFill' },
  { label: 'RiShoppingBag3Fill (购物)', value: 'RiShoppingBag3Fill' },
  { label: 'RiTrophyFill (奖杯)', value: 'RiTrophyFill' },
  { label: 'RiCustomerServiceFill (客服)', value: 'RiCustomerServiceFill' },
  { label: 'RiSettings3Fill (设置)', value: 'RiSettings3Fill' },
  { label: 'RiHome4Fill (首页)', value: 'RiHome4Fill' },
  { label: 'RiUserFill (用户)', value: 'RiUserFill' },
  { label: 'RiVipCrownFill (VIP)', value: 'RiVipCrownFill' },
  { label: 'RiExchangeFill (交易)', value: 'RiExchangeFill' },
  { label: 'RiPieChartFill (持仓)', value: 'RiPieChartFill' },
];

// ================================
// 动态图标组件
// ================================

/**
 * 动态渲染 Remix Icon
 */
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = RiIcons[name as keyof typeof RiIcons] as React.ComponentType<{ className?: string }>;
  if (!IconComponent) {
    return <span className={className}>?</span>;
  }
  return <IconComponent className={className} />;
}

// ================================
// 主页面组件
// ================================

export default function HomeConfigPage() {
  const formRef = useRef<ProFormInstance>(null);
  const queryClient = useQueryClient();

  // 快捷入口状态
  const [quickEntries, setQuickEntries] = useState<QuickEntry[]>(DEFAULT_QUICK_ENTRIES);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<QuickEntry | null>(null);

  // 推荐产品状态
  const [recommendProductIds, setRecommendProductIds] = useState<number[]>([]);

  // ================================
  // API 请求
  // ================================

  /**
   * 获取首页配置
   */
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ['home-config'],
    queryFn: () => get<{ pageType: string; config: HomePageConfig; version: number }>('/page-config/home'),
  });

  /**
   * 获取产品列表（用于推荐产品选择）
   */
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products-for-recommend'],
    queryFn: () => get<{ list: Product[] }>('/products', { status: 'ACTIVE', pageSize: '100' }),
  });

  /**
   * 更新配置
   */
  const updateMutation = useMutation({
    mutationFn: (data: Partial<HomePageConfig>) => put('/page-config/home', data),
    onSuccess: () => {
      message.success('首页配置保存成功');
      queryClient.invalidateQueries({ queryKey: ['home-config'] });
    },
    onError: (error: Error) => {
      message.error(error?.message || '保存失败');
    },
  });

  // ================================
  // 初始化数据
  // ================================

  useEffect(() => {
    if (configData?.config) {
      const config = configData.config;
      // 设置表单值
      formRef.current?.setFieldsValue({
        bannerVisible: config.bannerVisible ?? true,
        todayIncomeVisible: config.todayIncomeVisible ?? true,
        signInEntryVisible: config.signInEntryVisible ?? true,
        recommendEnabled: config.recommendEnabled ?? true,
        recommendTitle: config.recommendTitle || 'Recomendados',
        recommendMaxCount: config.recommendMaxCount || 6,
        marqueeVisible: config.marqueeVisible ?? false,
      });

      // 设置快捷入口
      if (config.quickEntries && config.quickEntries.length > 0) {
        // 将原有数据转换为带id的格式
        const entriesWithId = config.quickEntries.map((entry: QuickEntry) => ({
          ...entry,
          id: entry.key,
        }));
        setQuickEntries(entriesWithId);
      }

      // 设置推荐产品
      if (config.recommendProductIds) {
        setRecommendProductIds(config.recommendProductIds);
      }
    }
  }, [configData]);

  // ================================
  // 事件处理
  // ================================

  /**
   * 快捷入口排序变化
   */
  const handleEntrySortChange = (newItems: QuickEntry[]) => {
    // 重新计算排序序号
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      sortOrder: index + 1,
    }));
    setQuickEntries(updatedItems);
  };

  /**
   * 切换入口显示状态
   */
  const handleEntryToggle = (key: string, visible: boolean) => {
    setQuickEntries((items) =>
      items.map((item) => (item.key === key ? { ...item, visible } : item))
    );
  };

  /**
   * 打开入口编辑弹窗
   */
  const handleEntryEdit = (entry: QuickEntry) => {
    setCurrentEntry(entry);
    setEditModalVisible(true);
  };

  /**
   * 保存入口编辑
   */
  const handleEntryUpdate = async (values: { icon: string; label: string; link?: string }) => {
    if (!currentEntry) return false;

    setQuickEntries((items) =>
      items.map((item) =>
        item.key === currentEntry.key
          ? { ...item, icon: values.icon, label: values.label, link: values.link || undefined }
          : item
      )
    );
    setEditModalVisible(false);
    setCurrentEntry(null);
    return true;
  };

  /**
   * 推荐产品穿梭框变更
   */
  const handleProductTransfer: TransferProps['onChange'] = (nextTargetKeys) => {
    setRecommendProductIds(nextTargetKeys.map((k) => parseInt(String(k))));
  };

  /**
   * 保存配置
   */
  const handleSubmit = async (values: Record<string, unknown>) => {
    // 构建配置对象
    const config: Partial<HomePageConfig> = {
      bannerVisible: values.bannerVisible as boolean ?? true,
      todayIncomeVisible: values.todayIncomeVisible as boolean ?? true,
      signInEntryVisible: values.signInEntryVisible as boolean ?? true,
      quickEntries: quickEntries.map((entry) => ({
        id: entry.id,
        key: entry.key,
        icon: entry.icon,
        label: entry.label,
        visible: entry.visible,
        sortOrder: entry.sortOrder,
        ...(entry.link ? { link: entry.link } : {}),
      })),
      recommendEnabled: values.recommendEnabled as boolean ?? true,
      recommendTitle: values.recommendTitle as string || 'Recomendados',
      recommendDisplayMode: 'scroll',
      recommendProductIds: recommendProductIds,
      recommendMaxCount: values.recommendMaxCount as number || 6,
      marqueeVisible: values.marqueeVisible as boolean ?? false,
    };

    await updateMutation.mutateAsync(config);
    return true;
  };

  // ================================
  // 获取产品列表
  // ================================

  const allProducts: Product[] = productsData?.list || [];

  // ================================
  // 渲染
  // ================================

  return (
    <PageContainer
      header={{
        title: '首页配置',
        breadcrumb: {
          items: [
            { title: '内容管理' },
            { title: '首页配置' },
          ],
        },
      }}
    >
      <Spin spinning={configLoading || productsLoading}>
        <ProForm
          formRef={formRef}
          onFinish={handleSubmit}
          submitter={{
            searchConfig: { submitText: '保存配置' },
            resetButtonProps: { style: { display: 'none' } },
          }}
        >
          {/* 模块显示开关 */}
          <Card title="模块显示开关" className="mb-4">
            <Alert
              message="开关控制首页各模块的显示/隐藏，关闭后用户端将不显示对应区域"
              type="info"
              showIcon
              className="mb-4"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ProFormSwitch
                name="bannerVisible"
                label="Banner轮播"
                tooltip="控制首页顶部Banner轮播区是否显示"
                fieldProps={{
                  checkedChildren: '开启',
                  unCheckedChildren: '关闭',
                }}
              />
              <ProFormSwitch
                name="todayIncomeVisible"
                label="今日收益显示"
                tooltip="控制资产卡片中今日收益是否显示"
                fieldProps={{
                  checkedChildren: '开启',
                  unCheckedChildren: '关闭',
                }}
              />
              <ProFormSwitch
                name="signInEntryVisible"
                label="签到入口"
                tooltip="控制签到浮动按钮是否显示（位于资产卡片右上角）"
                fieldProps={{
                  checkedChildren: '开启',
                  unCheckedChildren: '关闭',
                }}
              />
              <ProFormSwitch
                name="marqueeVisible"
                label="跑马灯"
                tooltip="控制跑马灯是否显示（保留功能）"
                fieldProps={{
                  checkedChildren: '开启',
                  unCheckedChildren: '关闭',
                }}
              />
            </div>
          </Card>

          {/* 快捷入口配置 */}
          <Card title="快捷入口配置" className="mb-4">
            <Alert
              message="拖拽调整入口顺序，开关控制显示/隐藏，点击编辑修改图标和文案"
              type="info"
              showIcon
              className="mb-4"
            />
          <DragSortList<QuickEntry>
            items={quickEntries}
            onSortChange={(newItems) => handleEntrySortChange(newItems as QuickEntry[])}
            showIndex
            renderItem={(item) => {
              const entry = item as QuickEntry;
              return (
                <div className="flex items-center gap-4 flex-1">
                  {/* 显示开关 */}
                  <Switch
                    checked={entry.visible}
                    onChange={(checked) => handleEntryToggle(entry.key, checked)}
                    checkedChildren="显示"
                    unCheckedChildren="隐藏"
                    size="small"
                  />

                  {/* 入口名称 */}
                  <span className="w-16 text-sm text-neutral-500">
                    {KEY_NAME_MAP[entry.key] || entry.key}
                  </span>

                  {/* 图标预览 */}
                  <div className="w-8 h-8 flex items-center justify-center bg-blue-50 rounded">
                    <DynamicIcon name={entry.icon} className="w-5 h-5 text-blue-500" />
                  </div>

                  {/* 显示文案 */}
                  <span className="flex-1 text-sm font-medium">{entry.label}</span>

                  {/* 跳转链接 */}
                  {entry.link && (
                    <Tag color={entry.link.startsWith('http') ? 'orange' : 'blue'}>
                      {entry.link.startsWith('http') ? '站外' : '站内'}: {entry.link.length > 30 ? entry.link.slice(0, 30) + '...' : entry.link}
                    </Tag>
                  )}

                  {/* 编辑按钮 */}
                  <Button type="link" size="small" onClick={() => handleEntryEdit(entry)}>
                    编辑
                  </Button>
                </div>
              );
            }}
          />
          </Card>

          {/* 产品推荐配置 */}
          <Card title="产品推荐配置" className="mb-4">
            <ProFormSwitch
              name="recommendEnabled"
              label="推荐产品开关"
              tooltip="控制首页推荐产品区域是否显示"
              fieldProps={{
                checkedChildren: '开启',
                unCheckedChildren: '关闭',
              }}
            />

            <ProFormText
              name="recommendTitle"
              label="推荐区标题"
              placeholder="请输入推荐区域标题"
              rules={[
                { required: true, message: '请输入推荐区标题' },
                { max: 20, message: '最多20个字符' },
              ]}
              width="md"
            />

            <ProFormDigit
              name="recommendMaxCount"
              label="最大展示数量"
              tooltip="推荐区最多展示的产品数量"
              min={1}
              max={10}
              fieldProps={{ precision: 0 }}
              width="sm"
            />

            <ProForm.Item
              label="推荐产品选择"
              tooltip="从左侧选择产品添加到右侧，选中的产品将按顺序展示在首页推荐区"
            >
              <Transfer
                dataSource={allProducts.map((p) => ({
                  key: p.id.toString(),
                  title: `${p.name} - ${formatCurrency(p.price)}`,
                  description: `${p.type === 'TRIAL' ? '体验产品' : '付费产品'} | ${p.series}系列`,
                }))}
                targetKeys={recommendProductIds.map((id) => id.toString())}
                onChange={handleProductTransfer}
                render={(item) => (
                  <span>
                    {item.title}
                    <Tag
                      color={item.description?.includes('体验') ? 'blue' : 'orange'}
                      className="ml-2"
                    >
                      {item.description?.split(' | ')[0]}
                    </Tag>
                  </span>
                )}
                titles={['可选产品', '已选产品']}
                operations={['添加', '移除']}
                showSearch
                filterOption={(inputValue, item) =>
                  item.title?.toLowerCase().includes(inputValue.toLowerCase()) || false
                }
                listStyle={{
                  width: 350,
                  height: 300,
                }}
              />
            </ProForm.Item>

            {recommendProductIds.length > 0 && (
              <Alert
                message={`已选择 ${recommendProductIds.length} 个产品，产品将按选择顺序展示`}
                type="success"
                showIcon
                className="mt-2"
              />
            )}
          </Card>
        </ProForm>
      </Spin>

      {/* 入口编辑弹窗 */}
      <Modal
        title="编辑快捷入口"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setCurrentEntry(null);
        }}
        footer={null}
        destroyOnHidden
      >
        {currentEntry && (
          <ProForm
            onFinish={handleEntryUpdate}
            initialValues={currentEntry}
            submitter={{
              searchConfig: { submitText: '保存' },
              resetButtonProps: { style: { display: 'none' } },
            }}
          >
            <ProFormText
              name="key"
              label="入口标识"
              disabled
              tooltip="入口标识不可修改"
            />
            <ProFormSelect
              name="icon"
              label="入口图标"
              tooltip="选择 Remix Icon 图标"
              options={ICON_OPTIONS}
              rules={[{ required: true, message: '请选择图标' }]}
              fieldProps={{
                showSearch: true,
                optionFilterProp: 'label',
              }}
            />
            <ProFormText
              name="label"
              label="显示文案"
              placeholder="请输入入口显示名称"
              rules={[
                { required: true, message: '请输入显示文案' },
                { max: 10, message: '最多10个字符' },
              ]}
            />
            <ProFormText
              name="link"
              label="跳转链接"
              placeholder="站内路径如 /recharge，站外链接如 https://wa.me/123456"
              tooltip="留空则使用默认路由。填写 https:// 开头的链接将在新窗口打开（站外跳转），填写 / 开头的路径为站内跳转。"
              rules={[
                { max: 500, message: '链接最长500个字符' },
                {
                  pattern: /^(\/[^\s]*|https?:\/\/[^\s]+)?$/,
                  message: '请输入有效链接：站内路径以 / 开头，站外链接以 http:// 或 https:// 开头',
                },
              ]}
            />
          </ProForm>
        )}
      </Modal>
    </PageContainer>
  );
}
