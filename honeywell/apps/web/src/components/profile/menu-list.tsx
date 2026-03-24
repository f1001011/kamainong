/**
 * @file 功能入口列表组件
 * @description 个人中心功能入口列表，配置化渲染，支持角标
 * @depends 开发文档/03-前端用户端/03.7.1-个人中心页.md
 * @depends 02.3-前端API接口清单.md 第1.7节 - GET /api/config/profile
 */

'use client';

import { useRouter } from 'next/navigation';
import { m } from 'motion/react';
import {
  RiArrowRightSLine,
  // Fill 变体（默认菜单项使用）
  RiLineChartFill,
  RiHistoryFill,
  RiFileListFill,
  RiExchangeFill,
  RiTeamFill,
  RiBankCardFill,
  RiShieldFill,
  RiInformationFill,
  RiCustomerServiceFill,
  RiSettings3Fill,
  RiMailFill,
  RiUserAddFill,
  RiGiftFill,
  // Line 变体（后台管理配置可能使用）
  RiLineChartLine,
  RiHistoryLine,
  RiFileListLine,
  RiExchangeLine,
  RiTeamLine,
  RiBankCardLine,
  RiShieldLine,
  RiInformationLine,
  RiCustomerServiceLine,
  RiSettings3Line,
  RiMailLine,
  RiUserAddLine,
  RiGiftLine,
  // 通用
  RiQuestionLine,
} from '@remixicon/react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { UnreadDot } from '@/components/ui/unread-dot';
import { useText } from '@/hooks/use-text';
import { listContainerVariants, listItemVariants } from '@/lib/animation/variants';

/**
 * 菜单项图标映射
 * @description 支持后台管理配置的所有图标名称（Fill + Line 变体）
 * 依据：02.3-前端API接口清单.md - icon 字段为 Remix Icon 名称
 * 说明：后台管理端可配置 Fill 或 Line 变体，前端都需要支持
 */
const iconMap: Record<string, typeof RiLineChartFill> = {
  // Fill 变体
  RiLineChartFill,
  RiHistoryFill,
  RiFileListFill,
  RiExchangeFill,
  RiTeamFill,
  RiBankCardFill,
  RiShieldFill,
  RiInformationFill,
  RiCustomerServiceFill,
  RiSettings3Fill,
  RiMailFill,
  RiUserAddFill,
  RiGiftFill,
  // Line 变体
  RiLineChartLine,
  RiHistoryLine,
  RiFileListLine,
  RiExchangeLine,
  RiTeamLine,
  RiBankCardLine,
  RiShieldLine,
  RiInformationLine,
  RiCustomerServiceLine,
  RiSettings3Line,
  RiMailLine,
  RiUserAddLine,
  RiGiftLine,
  // 通用
  RiQuestionLine,
};

/**
 * 菜单项角标类型
 */
export interface MenuBadge {
  /** 角标类型：红点或数字 */
  type: 'dot' | 'count';
  /** 数据来源字段（用于动态获取数量） */
  source?: string;
}

/**
 * 菜单项配置
 */
export interface MenuItem {
  /** 唯一标识，用于文案映射 */
  key: string;
  /** 图标名称 */
  icon: string;
  /** 跳转路由 */
  route: string;
  /** 角标配置 */
  badge: MenuBadge | null;
  /** 是否可见 */
  visible: boolean;
  /** 排序权重 */
  order: number;
}

/**
 * 功能入口列表属性
 */
export interface MenuListProps {
  /** 菜单项列表 */
  items: MenuItem[];
  /** 角标数据（用于动态显示数字角标） */
  badgeData?: Record<string, number>;
  /** 是否正在加载 */
  isLoading?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 功能入口列表组件
 * @description 依据：开发文档/03.7.1-个人中心页.md
 * 
 * 设计要点：
 * - 列表式布局，左侧图标 + 文字 + 右侧箭头
 * - hover 有背景色变化
 * - 支持红点和数字角标
 * 
 * @example
 * ```tsx
 * <MenuList
 *   items={menuItems}
 *   badgeData={{ unreadCount: 5 }}
 * />
 * ```
 */
export function MenuList({
  items,
  badgeData = {},
  isLoading = false,
  className,
}: MenuListProps) {
  const router = useRouter();
  const t = useText();

  // 加载状态
  if (isLoading) {
    return (
      <div className={cn('bg-white rounded-2xl shadow-soft-md overflow-hidden', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-50 last:border-b-0"
          >
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="w-5 h-5" />
          </div>
        ))}
      </div>
    );
  }

  // 过滤可见项并按 order 排序
  const visibleItems = items
    .filter((item) => item.visible)
    .sort((a, b) => a.order - b.order);

  if (visibleItems.length === 0) {
    return null;
  }

  /**
   * 处理菜单项点击
   */
  const handleItemClick = (route: string) => {
    router.push(route);
  };

  /**
   * 检查是否显示角标
   * @returns { show: boolean, count?: number } - show 表示是否显示，count 用于数字角标
   */
  const getBadgeInfo = (badge: MenuBadge | null): { show: boolean; count?: number } => {
    if (!badge) return { show: false };
    
    if (badge.type === 'dot') {
      // 红点类型，检查是否有对应数据
      if (badge.source && badgeData[badge.source]) {
        return { show: true }; // 显示红点
      }
      return { show: false };
    }
    
    if (badge.type === 'count' && badge.source) {
      const count = badgeData[badge.source];
      if (count && count > 0) {
        return { show: true, count }; // 显示数字
      }
    }
    
    return { show: false };
  };

  return (
    <m.div
      variants={listContainerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'bg-white rounded-2xl shadow-soft-md overflow-hidden',
        className
      )}
    >
      {visibleItems.map((item, index) => {
        // 获取图标组件
        const IconComponent = iconMap[item.icon] || RiQuestionLine;
        
        // 获取文案（通过 key 映射）
        const label = t(`menu.${item.key}`, item.key);
        
        // 获取角标信息
        const badgeInfo = getBadgeInfo(item.badge);

        return (
          <m.button
            key={item.key}
            type="button"
            variants={listItemVariants}
            onClick={() => handleItemClick(item.route)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3.5',
              'hover:bg-neutral-50 active:bg-neutral-100',
              'transition-colors duration-150',
              'text-left',
              index < visibleItems.length - 1 && 'border-b border-neutral-50'
            )}
          >
            {/* 图标容器 */}
            <div className={cn(
              'w-10 h-10 rounded-xl',
              'flex items-center justify-center',
              'bg-gradient-to-br from-primary-50 to-primary-50',
              'text-primary-500'
            )}>
              <IconComponent className="w-5 h-5" />
            </div>

            {/* 文字 */}
            <span className="flex-1 text-sm font-medium text-neutral-700">
              {label}
            </span>

            {/* 角标 - 红点(sm)或数字(md) */}
            {badgeInfo.show && (
              <UnreadDot
                count={item.badge?.type === 'dot' ? 1 : badgeInfo.count}
                size={item.badge?.type === 'dot' ? 'sm' : 'md'}
              />
            )}

            {/* 箭头 */}
            <RiArrowRightSLine className="w-5 h-5 text-neutral-300" />
          </m.button>
        );
      })}
    </m.div>
  );
}

MenuList.displayName = 'MenuList';
