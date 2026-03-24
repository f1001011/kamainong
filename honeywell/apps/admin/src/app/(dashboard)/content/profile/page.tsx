/**
 * @file 个人中心配置页
 * @description 配置前端用户个人中心页的功能入口列表
 * @depends 开发文档/04-后台管理端/04.8-内容管理/04.8.6-个人中心配置页.md
 */

'use client';

import { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Card, message, Button, Modal, Switch, Alert, Tag, Spin } from 'antd';
import { ProForm, ProFormText, ProFormSelect, ProFormDependency } from '@ant-design/pro-components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, put } from '@/utils/request';
import { DragSortList, type SortableItem } from '@/components/tables/DragSortList';
import * as RiIcons from '@remixicon/react';

// ================================
// 类型定义
// ================================

/**
 * 功能入口类型
 */
interface MenuItem extends SortableItem {
  id: string;
  key: string;
  icon: string;
  route: string;
  badge?: {
    type: 'dot' | 'count';
    source?: string;
  };
  visible: boolean;
  order: number;
  [key: string]: unknown;
}

/**
 * 个人中心配置类型
 * 依据：02.4-后台API接口清单.md 第13.2节
 */
interface ProfilePageConfig {
  balanceVisible: boolean;        // 余额是否显示
  inviteCodeVisible: boolean;     // 邀请码是否显示
  vipBadgeVisible: boolean;       // VIP等级角标是否显示
  menuItems: MenuItem[];
}

// ================================
// 预设数据
// ================================

/**
 * 预设功能入口
 */
const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: 'security', key: 'security', icon: 'RiShieldLine', route: '/security', badge: undefined, visible: true, order: 1 },
  { id: 'bank_cards', key: 'bank_cards', icon: 'RiBankCardLine', route: '/bank-cards', badge: undefined, visible: true, order: 2 },
  { id: 'team', key: 'team', icon: 'RiTeamLine', route: '/team', badge: undefined, visible: true, order: 3 },
  { id: 'transactions', key: 'transactions', icon: 'RiFileListLine', route: '/transactions', badge: { type: 'dot' }, visible: true, order: 4 },
  { id: 'about', key: 'about', icon: 'RiInformationLine', route: '/about', badge: undefined, visible: true, order: 5 },
];

/**
 * 入口key对应的中文名称
 */
const KEY_NAME_MAP: Record<string, string> = {
  security: '安全设置',
  bank_cards: '银行卡管理',
  team: '我的团队',
  transactions: '交易记录',
  about: '关于我们',
};

/**
 * 入口key对应的前端文案（西班牙语）
 */
const MENU_TEXT_MAP: Record<string, string> = {
  security: 'Configuración de seguridad',
  bank_cards: 'Tarjetas bancarias',
  team: 'Mi equipo',
  transactions: 'Historial de transacciones',
  about: 'Acerca de',
};

/**
 * 图标选项（Line风格，与前端个人中心保持一致）
 */
const ICON_OPTIONS = [
  { label: 'RiShieldLine (盾牌)', value: 'RiShieldLine' },
  { label: 'RiBankCardLine (银行卡)', value: 'RiBankCardLine' },
  { label: 'RiTeamLine (团队)', value: 'RiTeamLine' },
  { label: 'RiFileListLine (文件列表)', value: 'RiFileListLine' },
  { label: 'RiInformationLine (信息)', value: 'RiInformationLine' },
  { label: 'RiWallet3Line (钱包)', value: 'RiWallet3Line' },
  { label: 'RiSettings3Line (设置)', value: 'RiSettings3Line' },
  { label: 'RiUserLine (用户)', value: 'RiUserLine' },
  { label: 'RiLockLine (锁)', value: 'RiLockLine' },
  { label: 'RiQuestionLine (问号)', value: 'RiQuestionLine' },
  { label: 'RiCustomerServiceLine (客服)', value: 'RiCustomerServiceLine' },
  { label: 'RiHistoryLine (历史)', value: 'RiHistoryLine' },
  { label: 'RiGiftLine (礼物)', value: 'RiGiftLine' },
  { label: 'RiNotification3Line (通知)', value: 'RiNotification3Line' },
  { label: 'RiExchangeLine (交易)', value: 'RiExchangeLine' },
  { label: 'RiVipCrownLine (VIP)', value: 'RiVipCrownLine' },
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

export default function ProfileConfigPage() {
  const queryClient = useQueryClient();

  // 用户信息显示配置状态
  const [balanceVisible, setBalanceVisible] = useState<boolean>(true);
  const [inviteCodeVisible, setInviteCodeVisible] = useState<boolean>(true);
  const [vipBadgeVisible, setVipBadgeVisible] = useState<boolean>(true);

  // 功能入口状态
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<MenuItem | null>(null);

  // ================================
  // API 请求
  // ================================

  /**
   * 获取个人中心配置
   */
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ['profile-config'],
    queryFn: () => get<{ pageType: string; config: ProfilePageConfig; version: number }>('/page-config/profile'),
  });

  /**
   * 更新配置
   */
  const updateMutation = useMutation({
    mutationFn: (data: ProfilePageConfig) => put('/page-config/profile', data),
    onSuccess: () => {
      message.success('个人中心配置保存成功');
      queryClient.invalidateQueries({ queryKey: ['profile-config'] });
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

      // 加载用户信息显示配置
      if (typeof config.balanceVisible === 'boolean') {
        setBalanceVisible(config.balanceVisible);
      }
      if (typeof config.inviteCodeVisible === 'boolean') {
        setInviteCodeVisible(config.inviteCodeVisible);
      }
      if (typeof config.vipBadgeVisible === 'boolean') {
        setVipBadgeVisible(config.vipBadgeVisible);
      }

      // 加载功能入口配置
      if (config.menuItems && config.menuItems.length > 0) {
        // 将原有数据转换为带id的格式
        const itemsWithId = config.menuItems.map((item: MenuItem) => ({
          ...item,
          id: item.key,
        }));
        setMenuItems(itemsWithId);
      }
    }
  }, [configData]);

  // ================================
  // 事件处理
  // ================================

  /**
   * 功能入口排序变化
   */
  const handleSortChange = (newItems: MenuItem[]) => {
    // 重新计算排序序号
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      order: index + 1,
    }));
    setMenuItems(updatedItems);
  };

  /**
   * 切换入口显示状态
   */
  const handleItemToggle = (key: string, visible: boolean) => {
    setMenuItems((items) =>
      items.map((item) => (item.key === key ? { ...item, visible } : item))
    );
  };

  /**
   * 打开入口编辑弹窗
   */
  const handleItemEdit = (item: MenuItem) => {
    setCurrentItem(item);
    setEditModalVisible(true);
  };

  /**
   * 保存入口编辑
   */
  const handleItemUpdate = async (values: Record<string, unknown>) => {
    if (!currentItem) return false;

    // 处理角标配置
    let badge: MenuItem['badge'] = undefined;
    const badgeValues = values.badge as { type?: string; source?: string } | undefined;
    if (badgeValues?.type === 'dot') {
      badge = { type: 'dot' };
    } else if (badgeValues?.type === 'count' && badgeValues?.source) {
      badge = { type: 'count', source: badgeValues.source };
    }

    setMenuItems((items) =>
      items.map((item) =>
        item.key === currentItem.key
          ? { ...item, icon: values.icon as string, route: values.route as string, badge }
          : item
      )
    );
    setEditModalVisible(false);
    setCurrentItem(null);
    return true;
  };

  /**
   * 保存配置
   */
  const handleSubmit = async () => {
    const config: ProfilePageConfig = {
      balanceVisible,
      inviteCodeVisible,
      vipBadgeVisible,
      menuItems: menuItems.map((item) => ({
        id: item.id,
        key: item.key,
        icon: item.icon,
        route: item.route,
        badge: item.badge,
        visible: item.visible,
        order: item.order,
      })),
    };

    await updateMutation.mutateAsync(config);
    return true;
  };

  /**
   * 获取角标类型文本
   */
  const getBadgeText = (badge?: MenuItem['badge']) => {
    if (!badge) return '无角标';
    if (badge.type === 'dot') return '红点';
    if (badge.type === 'count') return '数字';
    return '无角标';
  };

  // ================================
  // 渲染
  // ================================

  return (
    <PageContainer
      header={{
        title: '个人中心配置',
        breadcrumb: {
          items: [
            { title: '内容管理' },
            { title: '个人中心配置' },
          ],
        },
      }}
    >
      <Spin spinning={configLoading}>
        {/* 用户信息显示配置 */}
        <Card title="用户信息显示配置" className="mb-4">
          <Alert
            message="配置个人中心页用户信息区域的显示项"
            type="info"
            showIcon
            className="mb-4"
          />
          <div className="flex flex-wrap gap-8">
            <div className="flex items-center gap-2">
              <Switch
                checked={balanceVisible}
                onChange={setBalanceVisible}
                checkedChildren="显示"
                unCheckedChildren="隐藏"
              />
              <span className="text-sm">余额显示</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={inviteCodeVisible}
                onChange={setInviteCodeVisible}
                checkedChildren="显示"
                unCheckedChildren="隐藏"
              />
              <span className="text-sm">邀请码显示</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={vipBadgeVisible}
                onChange={setVipBadgeVisible}
                checkedChildren="显示"
                unCheckedChildren="隐藏"
              />
              <span className="text-sm">VIP等级角标</span>
            </div>
          </div>
        </Card>

        {/* 功能入口配置 */}
        <Card
          title="功能入口配置"
          className="mb-4"
          extra={
            <Button type="primary" onClick={handleSubmit} loading={updateMutation.isPending}>
              保存配置
            </Button>
          }
        >
          <Alert
            message="拖拽调整入口顺序，开关控制显示/隐藏，点击编辑可修改图标、路由和角标"
            type="info"
            showIcon
            className="mb-4"
          />
          <Alert
            message="入口名称文案由文案管理统一配置（key格式：menu.{入口key}），此处仅配置图标、路由和角标"
            type="warning"
            showIcon
            className="mb-4"
          />

          <DragSortList<MenuItem>
            items={menuItems}
            onSortChange={(newItems) => handleSortChange(newItems as MenuItem[])}
            showIndex
            renderItem={(item) => {
              const menuItem = item as MenuItem;
              return (
                <div className="flex items-center gap-4 flex-1">
                  {/* 显示开关 */}
                  <Switch
                    checked={menuItem.visible}
                    onChange={(checked) => handleItemToggle(menuItem.key, checked)}
                    checkedChildren="显示"
                    unCheckedChildren="隐藏"
                    size="small"
                  />

                  {/* 入口名称 */}
                  <span className="w-24 text-sm font-medium">
                    {KEY_NAME_MAP[menuItem.key] || menuItem.key}
                  </span>

                  {/* 图标预览 */}
                  <div className="flex items-center gap-2 w-40">
                    <div className="w-6 h-6 flex items-center justify-center bg-neutral-100 rounded">
                      <DynamicIcon name={menuItem.icon} className="w-4 h-4 text-neutral-500" />
                    </div>
                    <span className="text-xs text-neutral-500 truncate">{menuItem.icon}</span>
                  </div>

                  {/* 角标类型 */}
                  <Tag color={menuItem.badge ? 'red' : 'default'} className="w-16 text-center">
                    {getBadgeText(menuItem.badge)}
                  </Tag>

                  {/* 编辑按钮 */}
                  <Button type="link" size="small" onClick={() => handleItemEdit(menuItem)}>
                    编辑
                  </Button>
                </div>
              );
            }}
          />
        </Card>

        {/* 配置预览 */}
        <Card title="配置预览" className="mb-4">
          <Alert
            message="预览效果（模拟前端用户个人中心页功能入口区域）"
            type="info"
            showIcon
            className="mb-4"
          />
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden max-w-md mx-auto">
            {menuItems
              .filter((item) => item.visible)
              .sort((a, b) => a.order - b.order)
              .map((item, index, arr) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between px-4 py-3.5 hover:bg-neutral-50 transition-colors cursor-pointer">
                    {/* 左侧：图标 + 文案 */}
                    <div className="flex items-center gap-3">
                      <DynamicIcon name={item.icon} className="w-5 h-5 text-neutral-500" />
                      <span className="text-neutral-700">{MENU_TEXT_MAP[item.key] || item.key}</span>
                    </div>

                    {/* 右侧：角标（可选） + 箭头 */}
                    <div className="flex items-center gap-2">
                      {item.badge?.type === 'dot' && (
                        <span className="w-2 h-2 bg-red-500 rounded-full" />
                      )}
                      {item.badge?.type === 'count' && (
                        <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
                          5
                        </span>
                      )}
                      <DynamicIcon name="RiArrowRightSLine" className="w-5 h-5 text-neutral-400" />
                    </div>
                  </div>
                  {index < arr.length - 1 && (
                    <div className="border-b border-neutral-100 mx-4" />
                  )}
                </div>
              ))}
            {menuItems.filter((item) => item.visible).length === 0 && (
              <div className="py-8 text-center text-neutral-400">
                暂无显示的功能入口
              </div>
            )}
          </div>
        </Card>
      </Spin>

      {/* 入口编辑弹窗 */}
      <Modal
        title="编辑功能入口"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setCurrentItem(null);
        }}
        footer={null}
        destroyOnHidden
        width={500}
      >
        {currentItem && (
          <ProForm
            onFinish={handleItemUpdate}
            initialValues={{
              ...currentItem,
              badge: currentItem.badge
                ? { type: currentItem.badge.type, source: currentItem.badge.source }
                : { type: '' },
            }}
            submitter={{
              searchConfig: { submitText: '保存' },
              resetButtonProps: { style: { display: 'none' } },
            }}
          >
            <ProFormText
              name="key"
              label="入口标识"
              disabled
              tooltip="入口标识不可修改，用于文案映射"
            />

            <ProFormText
              name="route"
              label="跳转路由"
              placeholder="请输入跳转路径，如 /security"
              rules={[
                { required: true, message: '请输入跳转路由' },
                { pattern: /^\//, message: '路由必须以/开头' },
              ]}
              tooltip="前端页面路由路径"
            />

            <ProFormSelect
              name="icon"
              label="入口图标"
              tooltip="选择 Remix Icon 图标（Line 风格）"
              options={ICON_OPTIONS}
              rules={[{ required: true, message: '请选择图标' }]}
              fieldProps={{
                showSearch: true,
                optionFilterProp: 'label',
              }}
            />

            <ProFormSelect
              name={['badge', 'type']}
              label="角标类型"
              tooltip="红点：固定显示红点；数字：根据数据来源显示数字"
              options={[
                { label: '无角标', value: '' },
                { label: '红点', value: 'dot' },
                { label: '数字', value: 'count' },
              ]}
            />

            <ProFormDependency name={[['badge', 'type']]}>
              {({ badge }) => {
                if (badge?.type === 'count') {
                  return (
                    <ProFormSelect
                      name={['badge', 'source']}
                      label="数据来源"
                      tooltip="选择角标数字的数据来源"
                      options={[
                        { label: '未读消息数', value: 'notifications' },
                        { label: '待处理订单数', value: 'pending_orders' },
                      ]}
                      rules={[{ required: true, message: '请选择数据来源' }]}
                    />
                  );
                }
                return null;
              }}
            </ProFormDependency>
          </ProForm>
        )}
      </Modal>
    </PageContainer>
  );
}
