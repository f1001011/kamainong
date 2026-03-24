/**
 * @file 时间轴节点组件
 * @description 奖励时间轴上的圆形节点，根据阶梯状态展示不同视觉效果
 */

'use client';

import { cn } from '@/lib/utils';
import { RiCheckLine, RiStarFill, RiLockLine } from '@remixicon/react';
import type { TierStatus } from '@/types/activity';

interface TimelineNodeProps {
  status: TierStatus;
  isNextLocked?: boolean;
}

/**
 * 时间轴节点 — 使用 flex-shrink-0 定宽，不再 absolute 定位
 */
export function TimelineNode({ status, isNextLocked = false }: TimelineNodeProps) {
  if (status === 'CLAIMED') {
    return (
      <div
        className={cn(
          'w-8 h-8 rounded-full flex-shrink-0',
          'bg-gradient-to-br from-gold-400 to-gold-500',
          'flex items-center justify-center',
          'shadow-[0_0_8px_rgba(var(--color-gold-rgb),0.4)]',
        )}
      >
        <RiCheckLine className="w-4 h-4 text-white" />
      </div>
    );
  }

  if (status === 'CLAIMABLE') {
    return (
      <div
        className={cn(
          'w-8 h-8 rounded-full flex-shrink-0',
          'bg-gradient-to-br from-primary-400 to-primary-500',
          'flex items-center justify-center',
          'animate-pulse-glow-emerald',
        )}
      >
        <RiStarFill className="w-4 h-4 text-white" />
      </div>
    );
  }

  if (isNextLocked) {
    return (
      <div
        className={cn(
          'w-8 h-8 rounded-full flex-shrink-0',
          'border-2 border-primary-300 bg-white',
          'flex items-center justify-center',
        )}
      >
        <div className="w-2.5 h-2.5 rounded-full bg-primary-200" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-7 h-7 rounded-full flex-shrink-0',
        'border-2 border-neutral-200 bg-neutral-50',
        'flex items-center justify-center',
      )}
    >
      <RiLockLine className="w-3.5 h-3.5 text-neutral-300" />
    </div>
  );
}
