/**
 * @file 后台主布局组件
 * @description 基于 ProLayout 的后台管理系统主布局
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第3节 - 布局设计
 */

'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ProLayout,
  PageContainer,
} from '@ant-design/pro-components';
import type { MenuDataItem } from '@ant-design/pro-components';
import {
  Dropdown,
  Badge,
  Button,
  App,
  Spin,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  RiNotification3Line,
  RiLogoutBoxRLine,
  RiSettings3Line,
  RiLockPasswordLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
} from '@remixicon/react';
import { useAuthStore } from '@/stores/admin';
import { useGlobalConfigStore } from '@/stores/config';
import { menuRoutes } from '@/config/menu';
import { post } from '@/utils/request';

/**
 * 主布局组件属性
 */
interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * 侧边栏宽度配置
 * @description 依据：开发文档 UX设计规范 - 左侧固定菜单（240px）+ 折叠（60px）
 */
const SIDER_WIDTH = 240;
const COLLAPSED_WIDTH = 60;

/**
 * 主题色配置
 * @description 使用 Ant Design 默认蓝色主题
 */
const PRIMARY_COLOR = '#1677ff';

/**
 * 后台主布局组件
 * @description 依据：开发文档.md 第13.0.2节 - ProLayout 核心配置
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logout } = useAuthStore();
  const { config, fetchConfig } = useGlobalConfigStore();
  const { message } = App.useApp(); // 使用 App.useApp() 获取 message 实例
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // 用于避免 SSR 水合不匹配
  const [mounted, setMounted] = useState(false);

  // 客户端挂载后才执行响应式检测，避免 hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // 初始化加载全局配置
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // 响应式断点监听 - 仅在客户端挂载后执行
  useEffect(() => {
    if (!mounted) return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // 小屏自动收起侧边栏（768px-1199px）
      if (window.innerWidth < 1200 && window.innerWidth >= 768) {
        setCollapsed(true);
      } else if (window.innerWidth >= 1200) {
        setCollapsed(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [mounted]);

  /**
   * 处理登出
   */
  const handleLogout = async () => {
    try {
      await post('/auth/logout', {});
    } catch {
      // 忽略错误，直接登出
    }
    logout();
    message.success('已退出登录');
  };

  /**
   * 用户下拉菜单
   * @description 包含修改密码、个人设置、退出登录
   */
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'password',
      icon: <RiLockPasswordLine size={16} />,
      label: '修改密码',
      onClick: () => router.push('/settings/password'),
    },
    {
      key: 'settings',
      icon: <RiSettings3Line size={16} />,
      label: '个人设置',
      onClick: () => router.push('/settings/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <RiLogoutBoxRLine size={16} />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  /**
   * 菜单项渲染
   */
  const menuItemRender = (item: MenuDataItem, dom: React.ReactNode) => {
    if (item.path) {
      return <Link href={item.path}>{dom}</Link>;
    }
    return dom;
  };

  /**
   * 子菜单项渲染
   */
  const subMenuItemRender = (_: MenuDataItem, dom: React.ReactNode) => {
    return dom;
  };


  /**
   * 折叠按钮渲染
   */
  const collapsedButtonRender = () => (
    <Button
      type="text"
      icon={collapsed ? <RiMenuUnfoldLine size={20} /> : <RiMenuFoldLine size={20} />}
      onClick={() => setCollapsed(!collapsed)}
      style={{ 
        fontSize: 16, 
        width: 48, 
        height: 48, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}
    />
  );

  // 客户端挂载前显示加载占位符，避免 ProLayout 的 hydration mismatch
  // ProLayout 会根据窗口宽度动态生成响应式类名（如 screen-lg），
  // 但服务端无法获取窗口宽度，导致服务端和客户端渲染的类名不一致
  if (!mounted) {
    return (
      <Spin
        size="large"
        tip="加载中..."
        fullscreen
      />
    );
  }

  return (
    <ProLayout
      // === 基础配置 ===
      title={config.siteName || 'lendlease Admin'}
      logo={
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: PRIMARY_COLOR,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            color: '#fff',
            fontWeight: 'bold',
          }}
        >
          H
        </div>
      }
      
      // === 布局配置 ===
      layout="mix"
      fixedHeader
      fixSiderbar
      
      // === 侧边栏配置（240px展开）===
      siderWidth={SIDER_WIDTH}
      collapsed={collapsed}
      onCollapse={setCollapsed}
      collapsedButtonRender={collapsedButtonRender}
      breakpoint="lg"
      
      // === 路由与菜单 ===
      route={{ routes: menuRoutes }}
      location={{ pathname }}
      menuItemRender={menuItemRender}
      subMenuItemRender={subMenuItemRender}
      
      // === 顶栏配置 ===
      avatarProps={{
        src: undefined,
        size: 'small',
        title: admin?.nickname || admin?.username || '管理员',
        render: (props, dom) => (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            {dom}
          </Dropdown>
        ),
      }}
      actionsRender={() => [
        // 通知图标
        <Badge key="notification" count={0} size="small">
          <Button
            type="text"
            icon={<RiNotification3Line size={20} />}
            onClick={() => router.push('/notifications')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          />
        </Badge>,
        // 退出登录按钮
        <Button
          key="logout"
          type="text"
          danger
          icon={<RiLogoutBoxRLine size={18} />}
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          退出
        </Button>,
      ]}
      
      // === 页脚 ===
      footerRender={() => (
        <div style={{ textAlign: 'center', padding: '16px 0', color: 'rgba(0, 0, 0, 0.45)' }}>
          © 2026 {config.siteName || 'lendlease'}. All rights reserved.
        </div>
      )}
      
      // === Token 配置（Ant Design 默认蓝色主题）===
      token={{
        header: {
          colorBgHeader: '#fff',
          colorHeaderTitle: '#1d1d1f',
          colorTextMenu: 'rgba(0, 0, 0, 0.65)',
          colorTextMenuSecondary: 'rgba(0, 0, 0, 0.45)',
          colorTextMenuSelected: PRIMARY_COLOR,
          colorBgMenuItemSelected: `${PRIMARY_COLOR}10`,
          colorTextMenuActive: PRIMARY_COLOR,
          colorTextRightActionsItem: 'rgba(0, 0, 0, 0.65)',
        },
        sider: {
          colorMenuBackground: '#fff',
          colorMenuItemDivider: '#f0f0f0',
          colorTextMenu: 'rgba(0, 0, 0, 0.65)',
          colorTextMenuSelected: PRIMARY_COLOR,
          colorTextMenuActive: PRIMARY_COLOR,
          colorBgMenuItemSelected: `${PRIMARY_COLOR}10`,
          colorBgMenuItemHover: 'rgba(0, 0, 0, 0.04)',
        },
        pageContainer: {
          // 增加页面内边距，提升呼吸感
          paddingInlinePageContainerContent: 32,
          paddingBlockPageContainerContent: 24,
        },
      }}
      
      // === 内容区背景色 ===
      bgLayoutImgList={[]}
      contentStyle={{
        background: '#f5f7fa',
      }}
      
      // === 响应式配置 ===
      isMobile={isMobile}
    >
      {/* 
        移除 PageContainer 的默认 header，避免双重包装
        页面标题由各页面自行控制，保持灵活性
      */}
      <PageContainer
        header={{ title: '', breadcrumb: {} }}
        childrenContentStyle={{
          paddingTop: 0,
          paddingBottom: 32,
        }}
      >
        {children}
      </PageContainer>
    </ProLayout>
  );
}

export default AdminLayout;
