/**
 * @file 帖子状态徽标组件
 * @description 审核状态色标：待审核(琥珀) / 已通过(绿) / 已拒绝(红)
 */

'use client';

import {
  RiTimeLine,
  RiCheckboxCircleFill,
  RiCloseCircleFill,
} from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';

export type PostStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PostStatusBadgeProps {
  /** 审核状态 */
  status: PostStatus;
  /** 自定义样式 */
  className?: string;
}

/** 状态配置映射 */
const STATUS_CONFIG: Record<PostStatus, {
  icon: typeof RiTimeLine;
  textKey: string;
  defaultText: string;
  colorClass: string;
}> = {
  PENDING: {
    icon: RiTimeLine,
    textKey: 'community.status.pending',
    defaultText: 'قيد المراجعة',
    colorClass: 'bg-gold-50 text-gold-600 border-gold-200/60',
  },
  APPROVED: {
    icon: RiCheckboxCircleFill,
    textKey: 'community.status.approved',
    defaultText: 'تمت الموافقة',
    colorClass: 'bg-primary-50 text-primary-600 border-primary-200/60',
  },
  REJECTED: {
    icon: RiCloseCircleFill,
    textKey: 'community.status.rejected',
    defaultText: 'مرفوض',
    colorClass: 'bg-red-50 text-red-600 border-red-200/60',
  },
};

/**
 * 帖子审核状态徽标
 */
export function PostStatusBadge({ status, className }: PostStatusBadgeProps) {
  const t = useText();
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border',
        cfg.colorClass,
        className,
      )}
    >
      <Icon className="size-3.5" />
      {t(cfg.textKey, cfg.defaultText)}
    </span>
  );
}
