/**
 * @file 菜单配置
 * @description 后台管理系统侧边栏菜单配置，使用 Remix Icon
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第3.4节 - 侧边栏菜单结构
 */

import {
  RiDashboardLine,
  RiBarChartLine,
  RiUserLine,
  RiShoppingBagLine,
  RiShoppingCartLine,
  RiGiftLine,
  RiBankCardLine,
  RiFileTextLine,
  RiTranslate,
  RiMoneyDollarCircleLine,
  RiMailLine,
  RiForbidLine,
  RiSettings3Line,
  RiFileSearchLine,
  RiUserSettingsLine,
  RiTeamLine,
  RiTimerLine,
  RiLiveLine,
  RiLockLine,
  RiChat3Fill,
  RiVipCrownFill,
} from '@remixicon/react';
import type { MenuDataItem } from '@ant-design/pro-components';

/**
 * 图标样式
 */
const iconStyle = { fontSize: 18 };

/**
 * 菜单路由配置
 * @description 依据：开发文档.md 第13.24节 - 完整菜单层级
 * 使用 Remix Icon 替代 Ant Design Icons
 * 
 * 路由已根据实际页面文件结构更新
 */
export const menuRoutes: MenuDataItem[] = [
  {
    path: '/',
    name: '仪表盘',
    icon: <RiDashboardLine style={iconStyle} />,
  },
  {
    path: '/realtime',
    name: '实时监控',
    icon: <RiLiveLine style={iconStyle} />,
  },
  {
    path: '/reports',
    name: '数据报表',
    icon: <RiBarChartLine style={iconStyle} />,
    children: [
      { path: '/reports/financial', name: '财务报表' },
      { path: '/reports/users', name: '用户报表' },
      { path: '/reports/products', name: '产品报表' },
      { path: '/reports/commission', name: '返佣报表' },
    ],
  },
  {
    path: '/users',
    name: '用户管理',
    icon: <RiUserLine style={iconStyle} />,
    children: [
      { path: '/users/list', name: '用户列表' },
      { path: '/users/:id', name: '用户详情', hideInMenu: true },
    ],
  },
  {
    path: '/orders',
    name: '订单管理',
    icon: <RiShoppingBagLine style={iconStyle} />,
    children: [
      { path: '/orders/positions', name: '持仓订单' },
      { path: '/orders/recharge', name: '充值订单' },
      { path: '/orders/withdraw', name: '提现订单' },
    ],
  },
  {
    path: '/products',
    name: '产品管理',
    icon: <RiShoppingCartLine style={iconStyle} />,
  },
  {
    key: 'activities-menu',
    path: '/activities',
    name: '活动管理',
    icon: <RiGiftLine style={iconStyle} />,
    children: [
      { key: 'activities-config', path: '/activities/config', name: '活动配置' },
      { key: 'activities-data', path: '/activities/data', name: '活动数据明细' },
      { key: 'spin-wheel', path: '/activities/spin-wheel', name: '转盘配置' },
      { key: 'spin-wheel-records', path: '/activities/spin-wheel/records', name: '转盘记录' },
      { key: 'weekly-salary', path: '/activities/weekly-salary', name: '周薪配置' },
      { key: 'weekly-salary-records', path: '/activities/weekly-salary/records', name: '周薪记录' },
      { key: 'prize-pool', path: '/activities/prize-pool', name: '奖池配置' },
      { key: 'prize-pool-records', path: '/activities/prize-pool/records', name: '奖池记录' },
      { key: 'gift-codes', path: '/activities/gift-codes', name: '礼品码管理' },
    ],
  },
  {
    key: 'community-menu',
    path: '/community',
    name: '广场管理',
    icon: <RiChat3Fill style={iconStyle} />,
    children: [
      { key: 'community-review', path: '/community/review', name: '帖子审核' },
      { key: 'community-posts', path: '/community/posts', name: '所有帖子' },
      { key: 'community-config', path: '/community/config', name: '奖励配置' },
    ],
  },
  {
    key: 'svip-menu',
    path: '/svip',
    name: 'SVIP管理',
    icon: <RiVipCrownFill style={iconStyle} />,
    children: [
      { key: 'svip-records', path: '/svip/records', name: '奖励记录' },
      { key: 'svip-status', path: '/svip/status', name: '状态查询' },
    ],
  },
  {
    path: '/channels-menu',
    name: '支付通道',
    icon: <RiBankCardLine style={iconStyle} />,
    children: [
      { path: '/channels', name: '通道列表' },
      { path: '/channels/auto-approve', name: '免审核配置' },
    ],
  },
  {
    path: '/content',
    name: '内容管理',
    icon: <RiFileTextLine style={iconStyle} />,
    children: [
      { path: '/content/banners', name: '轮播Banner' },
      { path: '/content/announcements', name: '系统公告' },
      { path: '/content/service-links', name: '客服链接' },
      { path: '/content/poster', name: '邀请海报' },
      { path: '/content/about', name: '关于我们' },
      { path: '/content/home', name: '首页配置' },
      { path: '/content/profile', name: '个人中心配置' },
    ],
  },
  {
    path: '/settings/texts',
    name: '文案管理',
    icon: <RiTranslate style={iconStyle} />,
  },
  {
    path: '/finance',
    name: '财务管理',
    icon: <RiMoneyDollarCircleLine style={iconStyle} />,
    children: [
      { path: '/income/records', name: '收益发放管理' },
      { path: '/income/exceptions', name: '收益异常处理' },
      { path: '/commissions', name: '返佣记录' },
    ],
  },
  {
    path: '/team',
    name: '团队管理',
    icon: <RiTeamLine style={iconStyle} />,
    children: [
      { path: '/team/query', name: '团队关系查询' },
      { path: '/team/marketing-channels', name: '渠道链接' },
    ],
  },
  {
    path: '/notifications',
    name: '站内信',
    icon: <RiMailLine style={iconStyle} />,
  },
  {
    path: '/security',
    name: '安全管理',
    icon: <RiForbidLine style={iconStyle} />,
    children: [
      { path: '/security/blacklist', name: '黑名单管理' },
    ],
  },
  {
    path: '/settings',
    name: '系统设置',
    icon: <RiSettings3Line style={iconStyle} />,
    children: [
      { path: '/settings/global', name: '全局配置' },
      { path: '/settings/banks', name: '银行列表' },
      { path: '/settings/account-locks', name: '账户锁定' },
    ],
  },
  {
    path: '/tasks',
    name: '定时任务',
    icon: <RiTimerLine style={iconStyle} />,
  },
  {
    path: '/logs',
    name: '日志管理',
    icon: <RiFileSearchLine style={iconStyle} />,
    children: [
      { path: '/logs/operation', name: '操作日志' },
      { path: '/logs/admin-login', name: '管理员登录日志' },
      { path: '/logs/user-login', name: '用户登录日志' },
    ],
  },
  {
    path: '/admins',
    name: '管理员',
    icon: <RiUserSettingsLine style={iconStyle} />,
  },
];

/**
 * 获取菜单项的路径映射
 * 用于面包屑导航等场景
 */
export function getMenuPathMap(routes: MenuDataItem[], parentPath = ''): Map<string, string> {
  const map = new Map<string, string>();
  
  routes.forEach((route) => {
    if (route.path && route.name) {
      map.set(route.path, route.name);
    }
    if (route.children) {
      const childMap = getMenuPathMap(route.children, route.path);
      childMap.forEach((value, key) => {
        map.set(key, value);
      });
    }
  });
  
  return map;
}
