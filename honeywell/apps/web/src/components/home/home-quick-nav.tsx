/**
 * @file 首页快捷导航行 — 金字塔布局第三层（最轻量）
 * @description 一行 3~4 个小型导航入口（社交、邀请、活动等）
 * 数据来源：GET /api/config/home 的 quickEntries
 */

'use client';

import { m } from 'motion/react';
import Link from 'next/link';
import {
  RiHomeFill,
  RiWalletFill, RiWallet3Fill,
  RiBankFill, RiBankCardFill,
  RiTeamFill, RiGroupFill,
  RiGiftFill, RiTrophyFill,
  RiPieChartFill, RiShoppingBagFill,
  RiExchangeFundsFill, RiUserAddFill,
  RiHistoryFill, RiMoneyDollarCircleFill,
  RiCoinFill, RiLineChartFill,
  RiNotification3Fill, RiCustomerServiceFill,
  RiSettings4Fill, RiFileListFill,
  RiShoppingCartFill, RiArrowUpFill,
  RiWhatsappFill, RiTelegramFill, RiMessengerFill,
} from '@remixicon/react';
import { Skeleton } from '@/components/ui/skeleton';
import { useText } from '@/hooks/use-text';
import { useStaggerInView } from '@/hooks/use-in-view-animation';
import { cn } from '@/lib/utils';

export interface QuickEntryItem {
  key: string;
  icon: string;
  label: string;
  visible: boolean;
  sortOrder: number;
  showBadge?: boolean;
  link?: string;
}

export interface HomeQuickNavProps {
  entries?: QuickEntryItem[];
  isLoading?: boolean;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  RiHomeFill, RiWalletFill, RiWallet3Fill,
  RiBankFill, RiBankCardFill, RiTeamFill, RiGroupFill,
  RiGiftFill, RiTrophyFill, RiPieChartFill,
  RiShoppingBagFill, RiExchangeFundsFill, RiUserAddFill,
  RiHistoryFill, RiMoneyDollarCircleFill, RiCoinFill,
  RiLineChartFill, RiNotification3Fill, RiCustomerServiceFill,
  RiSettings4Fill, RiFileListFill, RiShoppingCartFill,
  RiArrowUpFill, RiWhatsappFill, RiTelegramFill, RiMessengerFill,
  // 兼容后端可能传入的 Line 名称，映射到 Fill 组件
  RiWhatsappLine: RiWhatsappFill, RiTelegramLine: RiTelegramFill, RiMessengerLine: RiMessengerFill,
};

const iconGradients: Record<string, string> = {
  telegram: 'linear-gradient(135deg, #40C4FF, #0088CC)',
  whatsapp: 'linear-gradient(135deg, #25D366, #075E54)',
  messenger: 'linear-gradient(135deg, #FF6CB5, #6366F1)',
  invite: 'linear-gradient(135deg, #fb7185, #e11d48)',
  activities: 'linear-gradient(135deg, var(--color-gold-400), var(--color-gold-600))',
  recharge: 'linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600))',
  withdraw: 'linear-gradient(135deg, #34d399, #059669)',
  positions: 'linear-gradient(135deg, #2dd4bf, #0d9488)',
  team: 'linear-gradient(135deg, #60a5fa, #2563eb)',
  transactions: 'linear-gradient(135deg, #22d3ee, #0891b2)',
  default: 'linear-gradient(135deg, #a8a29e, #57534e)',
};

const socialIconKeyMap: Record<string, string> = {
  RiWhatsappFill: 'whatsapp', RiWhatsappLine: 'whatsapp',
  RiTelegramFill: 'telegram', RiTelegramLine: 'telegram',
  RiMessengerFill: 'messenger', RiMessengerLine: 'messenger',
};

const routeMap: Record<string, string> = {
  recharge: '/recharge', withdraw: '/withdraw', team: '/team',
  invite: '/team?tab=invite', activities: '/activities',
  positions: '/positions', transactions: '/transactions',
};

const coveredByDashboard = new Set(['positions', 'team']);

function getIcon(name: string) {
  const variants = [name, `Ri${name}Fill`, `Ri${name}Line`];
  for (const v of variants) { if (v in iconMap) return iconMap[v]; }
  return RiHomeFill;
}

function getGradient(entry: QuickEntryItem) {
  const socialKey = socialIconKeyMap[entry.icon];
  if (socialKey) return iconGradients[socialKey] || iconGradients.default;
  return iconGradients[entry.key] || iconGradients.default;
}

export function HomeQuickNav({ entries = [], isLoading = false, className }: HomeQuickNavProps) {
  const t = useText();
  const filtered = [...entries]
    .filter((e) => e.visible !== false && !coveredByDashboard.has(e.key))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const cols = filtered.length <= 3 ? 'grid-cols-3' : 'grid-cols-4';
  const { containerRef, containerProps, itemProps } = useStaggerInView({
    itemCount: filtered.length || 4, variant: 'scaleUp', staggerSpeed: 'fast',
  });

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        <Skeleton width={80} height={14} />
        <div className="grid grid-cols-4 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 py-3">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <Skeleton width={36} height={10} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!filtered.length) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-neutral-400 tracking-widest uppercase whitespace-nowrap">
          {t('home.services')}
        </span>
        <div className="flex-1 h-px bg-neutral-100" />
      </div>
      <m.div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        {...containerProps}
        className={cn('grid gap-2.5', cols)}
      >
        {filtered.map((entry, index) => {
          const IconComponent = getIcon(entry.icon);
          const href = entry.link || routeMap[entry.key] || `/${entry.key}`;
          const isExternal = /^https?:\/\//.test(href);
          const gradient = getGradient(entry);
          const content = (
            <m.div {...itemProps(index)} whileTap={{ scale: 0.93 }}>
              <div className={cn(
                'flex flex-col items-center justify-center gap-1.5',
                'py-3 px-2 rounded-xl',
                'bg-white/80 border border-neutral-100/60',
                'transition-all duration-300',
                'hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:-translate-y-0.5',
              )}>
                <div
                  className="relative w-9 h-9 rounded-xl flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)]"
                  style={{ background: gradient }}
                >
                  <div className="absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 50%)' }} />
                  {IconComponent && <IconComponent className="w-4 h-4 relative z-10" style={{ color: '#ffffff' }} />}
                  {entry.showBadge && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white z-20" />}
                </div>
                <span className="text-[11px] font-semibold text-neutral-500 whitespace-nowrap leading-tight">
                  {entry.label}
                </span>
              </div>
            </m.div>
          );
          return isExternal ? (
            <a key={entry.key} href={href} target="_blank" rel="noopener noreferrer">{content}</a>
          ) : (
            <Link key={entry.key} href={href}>{content}</Link>
          );
        })}
      </m.div>
    </div>
  );
}
