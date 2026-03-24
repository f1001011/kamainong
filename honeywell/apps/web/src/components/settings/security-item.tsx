/**
 * @file 安全设置项组件
 * @description 安全设置页的列表项组件，显示图标、标题、状态/值、箭头
 * @depends 开发文档/03-前端用户端/03.7.2-安全设置页.md
 * @depends 01.1-设计Token.md - 2026高端美学配色
 */

'use client';

import { type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { m } from 'motion/react';
import {
  RiArrowRightSLine,
  RiCheckboxCircleFill,
} from '@remixicon/react';
import { cn } from '@/lib/utils';

/**
 * 安全设置项状态类型
 */
export type SecurityItemStatus = 'bound' | 'unbound' | 'custom';

/**
 * 安全设置项属性
 */
export interface SecurityItemProps {
  /** 图标组件 */
  icon: ReactNode;
  /** 标题 */
  title: string;
  /** 描述/值（如脱敏手机号） */
  value?: string;
  /** 状态类型 */
  status?: SecurityItemStatus;
  /** 自定义状态文案 */
  statusText?: string;
  /** 跳转路由 */
  route?: string;
  /** 点击回调（优先于 route） */
  onClick?: () => void;
  /** 是否显示箭头 */
  showArrow?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 安全设置项组件
 * @description 2026高端美学设计
 * - 白色卡片背景
 * - 左侧渐变图标容器
 * - 绑定状态：绿色勾
 * - hover 有背景色变化
 * 
 * @example
 * ```tsx
 * <SecurityItem
 *   icon={<RiLockPasswordLine className="w-5 h-5" />}
 *   title={t('security.change_password')}
 *   route="/settings/password"
 * />
 * 
 * <SecurityItem
 *   icon={<RiPhoneLine className="w-5 h-5" />}
 *   title={t('security.phone')}
 *   value="***-***-4321"
 *   status="bound"
 * />
 * ```
 */
export function SecurityItem({
  icon,
  title,
  value,
  status,
  statusText,
  route,
  onClick,
  showArrow = true,
  className,
}: SecurityItemProps) {
  const router = useRouter();

  /**
   * 处理点击事件
   */
  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (route) {
      router.push(route);
    }
  };

  /**
   * 渲染状态指示
   */
  const renderStatus = () => {
    // 如果有自定义状态文案
    if (statusText) {
      return (
        <span className="text-sm text-neutral-500">
          {statusText}
        </span>
      );
    }

    // 如果有值，显示值
    if (value) {
      return (
        <span className="text-sm text-neutral-500 font-medium">
          {value}
        </span>
      );
    }

    // 根据状态显示
    if (status === 'bound') {
      return (
        <div className="flex items-center gap-1.5">
          <RiCheckboxCircleFill className="w-4 h-4 text-success" />
        </div>
      );
    }

    if (status === 'unbound') {
      return (
        <span className="text-sm text-neutral-400">
          -
        </span>
      );
    }

    return null;
  };

  const isClickable = onClick || route;

  return (
    <m.button
      type="button"
      onClick={handleClick}
      disabled={!isClickable}
      whileTap={isClickable ? { scale: 0.98 } : undefined}
      className={cn(
        'w-full flex items-center gap-4 px-4 py-4',
        'text-left',
        'transition-colors duration-150',
        isClickable && 'hover:bg-neutral-50 active:bg-neutral-100 cursor-pointer',
        !isClickable && 'cursor-default',
        className
      )}
    >
      {/* 图标容器 - 2026高端美学渐变背景 */}
      <div className={cn(
        'w-10 h-10 rounded-xl',
        'flex items-center justify-center shrink-0',
        'bg-gradient-to-br from-primary-50 to-primary-50',
        'text-primary-500'
      )}>
        {icon}
      </div>

      {/* 标题 */}
      <span className="flex-1 text-sm font-medium text-neutral-700">
        {title}
      </span>

      {/* 状态/值 */}
      {renderStatus()}

      {/* 箭头 */}
      {showArrow && isClickable && (
        <RiArrowRightSLine className="w-5 h-5 text-neutral-300 shrink-0" />
      )}
    </m.button>
  );
}

SecurityItem.displayName = 'SecurityItem';
