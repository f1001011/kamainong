/**
 * @file 充值通道选择组件（品牌卡片版）
 * @description 带颜色图标和品牌感的通道卡片，选中态高亮边框
 * 单通道自动选中并隐藏选择器
 */

'use client';

import { useCallback } from 'react';
import { m } from 'motion/react';
import { RiCheckLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useText } from '@/hooks/use-text';
import { SPRINGS } from '@/lib/animation';

export interface PayChannel {
  id: number;
  code: string;
  name: string;
  icon?: string;
}

export interface ChannelSelectorProps {
  channels: PayChannel[];
  value: number | null;
  onChange: (channelId: number) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

/** 通道品牌色列表（按 index 循环） */
const CHANNEL_COLORS = [
  'bg-primary-500',
  'bg-blue-500',
  'bg-primary-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-gold-500',
];

export function ChannelSelector({
  channels,
  value,
  onChange,
  disabled = false,
  className,
}: ChannelSelectorProps) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();

  if (channels.length <= 1) return null;

  const handleSelect = useCallback((channelId: number) => {
    if (disabled) return;
    onChange(channelId);
  }, [disabled, onChange]);

  return (
    <div className={cn('space-y-2.5', className)}>
      {channels.map((channel, index) => {
        const isSelected = value === channel.id;
        const colorClass = CHANNEL_COLORS[index % CHANNEL_COLORS.length];

        return (
          <m.button
            key={channel.id}
            type="button"
            disabled={disabled}
            onClick={() => handleSelect(channel.id)}
            className={cn(
              'relative w-full flex items-center gap-3.5 p-4 rounded-xl border-2 transition-all duration-200 text-left',
              isSelected
                ? 'border-primary-500 bg-primary-50/40 shadow-[0_2px_8px_rgba(var(--color-primary-rgb),0.08)]'
                : 'border-neutral-200/80 bg-white hover:border-neutral-300',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
            {...(isAnimationEnabled && {
              whileTap: { scale: 0.98 },
              transition: SPRINGS.snappy,
            })}
          >
            {/* 品牌颜色图标 */}
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0',
              colorClass,
            )}>
              {channel.icon ? (
                <img src={channel.icon} alt="" className="w-6 h-6 object-contain" />
              ) : (
                channel.name.charAt(0).toUpperCase()
              )}
            </div>

            {/* 通道信息 */}
            <div className="flex-1 min-w-0">
              <div className={cn(
                'font-semibold text-sm',
                isSelected ? 'text-primary-600' : 'text-neutral-700',
              )}>
                {channel.name}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">
                {t('recharge.fast_processing', 'معالجة سريعة')}
              </div>
            </div>

            {/* 选中勾选 */}
            {isSelected && (
              <m.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={SPRINGS.bouncy}
                className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0"
              >
                <RiCheckLine className="w-4 h-4 text-white" />
              </m.div>
            )}
          </m.button>
        );
      })}
    </div>
  );
}

ChannelSelector.displayName = 'ChannelSelector';
