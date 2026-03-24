/**
 * @file VIP 角标组件
 * @description 通用 VIP/SVIP 等级角标，支持个人中心、产品卡片等场景复用
 * @depends 开发文档.md 第12.3节 - 首页顶部 VIP/SVIP 角标
 * @depends 01.1-设计Token.md 第2.3节 - 2026趋势点缀色
 */

'use client';

import { cn } from '@/lib/utils';
import { RiVipCrownFill, RiVipDiamondFill } from '@remixicon/react';

/**
 * VIP 角标类型
 */
export type VipBadgeType = 'vip' | 'svip';

/**
 * VIP 角标尺寸
 */
export type VipBadgeSize = 'sm' | 'md' | 'lg';

/**
 * VIP 角标组件属性
 */
export interface VipBadgeProps {
  /** 角标类型：vip 或 svip */
  type: VipBadgeType;
  /** 等级数字 */
  level: number;
  /** 尺寸，默认 md */
  size?: VipBadgeSize;
  /** 是否显示等级数字，默认 true */
  showLevel?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * VIP 角标组件
 * @description 依据：开发文档.md 第12.3节 - VIP使用金色渐变，SVIP使用紫色渐变
 *
 * @example
 * ```tsx
 * // VIP 角标
 * <VipBadge type="vip" level={3} />
 *
 * // SVIP 角标
 * <VipBadge type="svip" level={2} size="lg" />
 *
 * // 不显示等级数字
 * <VipBadge type="vip" level={1} showLevel={false} />
 * ```
 */
export function VipBadge({
  type,
  level,
  size = 'md',
  showLevel = true,
  className,
}: VipBadgeProps) {
  // 不显示 0 级
  if (level <= 0) return null;

  // 依据：开发文档.md 第12.3节 - VIP金色系，SVIP紫色系
  const isVip = type === 'vip';

  // 尺寸配置
  const sizeConfig = {
    sm: {
      container: 'px-1 py-0.5 text-[10px] gap-0.5',
      icon: 'w-2.5 h-2.5',
    },
    md: {
      container: 'px-1.5 py-0.5 text-xs gap-0.5',
      icon: 'w-3 h-3',
    },
    lg: {
      container: 'px-2 py-1 text-sm gap-1',
      icon: 'w-4 h-4',
    },
  };

  const config = sizeConfig[size];

  // 依据：01.1-设计Token.md 第2.3节 - VIP使用金色渐变，SVIP使用lavender紫色渐变
  const styleConfig = isVip
    ? {
        // VIP - 金色渐变背景
        background: 'bg-gradient-to-r from-gold-100 to-gold-200',
        text: 'text-gold-700',
        Icon: RiVipCrownFill,
      }
    : {
        // SVIP - 紫色/lavender 渐变背景
        background: 'bg-gradient-to-r from-primary-100 to-primary-100',
        text: 'text-primary-600',
        Icon: RiVipDiamondFill,
      };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        styleConfig.background,
        styleConfig.text,
        config.container,
        className
      )}
    >
      <styleConfig.Icon className={config.icon} />
      {showLevel && (
        <span>
          {isVip ? 'V' : 'S'}
          {level}
        </span>
      )}
    </span>
  );
}
