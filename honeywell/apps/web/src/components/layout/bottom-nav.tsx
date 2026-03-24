/**
 * @file 底部导航组件
 * @description 建筑精度设计 — 深翡翠浮岛 + 金色小圆点指示器（去除光柱和背景色块）
 *
 * 兼容性：
 * - left/right 约束宽度，保证任何屏幕尺寸下都不溢出
 * - 导航项 flex-1 均分，最小支持 280px
 * - 文字 truncate 防溢出
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { m } from 'motion/react';
import {
  RiHomeLine,
  RiHomeFill,
  RiShoppingBagLine,
  RiShoppingBagFill,
  RiGiftLine,
  RiGiftFill,
  RiTeamLine,
  RiTeamFill,
  RiUserLine,
  RiUserFill,
} from '@remixicon/react';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  labelKey: string;
  defaultLabel: string;
  icon: typeof RiHomeLine;
  activeIcon: typeof RiHomeFill;
}

const navItems: NavItem[] = [
  {
    path: '/',
    labelKey: 'nav.home',
    defaultLabel: 'الرئيسية',
    icon: RiHomeLine,
    activeIcon: RiHomeFill,
  },
  {
    path: '/products',
    labelKey: 'nav.products',
    defaultLabel: 'المنتجات',
    icon: RiShoppingBagLine,
    activeIcon: RiShoppingBagFill,
  },
  {
    path: '/activities',
    labelKey: 'nav.activities',
    defaultLabel: 'الأنشطة',
    icon: RiGiftLine,
    activeIcon: RiGiftFill,
  },
  {
    path: '/team?tab=invite',
    labelKey: 'nav.team',
    defaultLabel: 'الفريق',
    icon: RiTeamLine,
    activeIcon: RiTeamFill,
  },
  {
    path: '/profile',
    labelKey: 'nav.profile',
    defaultLabel: 'الملف الشخصي',
    icon: RiUserLine,
    activeIcon: RiUserFill,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();

  const isActive = (itemPath: string): boolean => {
    const basePath = itemPath.split('?')[0];
    if (basePath === '/') return pathname === '/';
    return pathname.startsWith(basePath);
  };

  return (
    <nav
      className={cn(
        'fixed z-50',
        'left-3 right-3',
        'max-w-md mx-auto',
        'rounded-[28px]',
        'glass-obsidian',
        'md:hidden'
      )}
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
      }}
    >
      <div
        className="absolute top-0 left-6 right-6 h-[0.5px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 50%, transparent)',
        }}
      />

      <div className="flex items-center px-2 py-2.5">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = active ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex-1 min-w-0 touch-manipulation"
            >
              {isAnimationEnabled ? (
                <m.div
                  className="relative flex flex-col items-center justify-center py-1.5"
                  whileTap={{ scale: 0.85 }}
                >
                  {/* 金色小圆点指示器 */}
                  {active && (
                    <m.div
                      layoutId="nav-dot"
                      className="absolute -top-0.5 w-1 h-1 rounded-full"
                      style={{ background: 'var(--color-gold-on-dark)' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}

                  <Icon
                    className={cn(
                      'w-5 h-5 transition-colors duration-200',
                      active ? 'text-gold-on-dark' : 'text-white/40'
                    )}
                  />

                  <span
                    className={cn(
                      'text-[9px] font-medium mt-1 leading-tight',
                      'truncate max-w-full px-0.5',
                      active ? 'text-white/90' : 'text-white/40'
                    )}
                  >
                    {t(item.labelKey, item.defaultLabel)}
                  </span>
                </m.div>
              ) : (
                <div className="relative flex flex-col items-center justify-center py-1.5">
                  {active && (
                    <div
                      className="absolute -top-0.5 w-1 h-1 rounded-full"
                      style={{ background: 'var(--color-gold-on-dark)' }}
                    />
                  )}
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      active ? 'text-gold-on-dark' : 'text-white/40'
                    )}
                  />
                  <span
                    className={cn(
                      'text-[9px] font-medium mt-1 leading-tight',
                      'truncate max-w-full px-0.5',
                      active ? 'text-white/90' : 'text-white/40'
                    )}
                  >
                    {t(item.labelKey, item.defaultLabel)}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
