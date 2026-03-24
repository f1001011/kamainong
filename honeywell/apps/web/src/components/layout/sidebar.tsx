/**
 * @file 侧边栏组件
 * @description "Metropolitan Prestige 2.0" - 深翡翠侧边栏 + 金色选中指示条
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { m } from 'motion/react';
import {
  RiHomeLine,
  RiHomeFill,
  RiShoppingBagLine,
  RiShoppingBagFill,
  RiWalletLine,
  RiWalletFill,
  RiUserLine,
  RiUserFill,
  RiExchangeFundsLine,
  RiExchangeFundsFill,
  RiTeamLine,
  RiTeamFill,
  RiGiftLine,
  RiGiftFill,
  RiChat3Line,
  RiChat3Fill,
  RiGamepadLine,
  RiGamepadFill,
  RiSettings4Line,
  RiSettings4Fill,
} from '@remixicon/react';
import { useText } from '@/hooks/use-text';
import { useGlobalConfigStore } from '@/stores/global-config';
import { useUserStore } from '@/stores/user';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { cn } from '@/lib/utils';
import { SPRINGS } from '@/lib/animation/constants';

interface NavItem {
  path: string;
  labelKey: string;
  icon: typeof RiHomeLine;
  activeIcon: typeof RiHomeFill;
  divider?: boolean;
}

const mainNavItems: NavItem[] = [
  {
    path: '/',
    labelKey: 'nav.home',
    icon: RiHomeLine,
    activeIcon: RiHomeFill,
  },
  {
    path: '/products',
    labelKey: 'nav.products',
    icon: RiShoppingBagLine,
    activeIcon: RiShoppingBagFill,
  },
  {
    path: '/team',
    labelKey: 'nav.team',
    icon: RiWalletLine,
    activeIcon: RiWalletFill,
  },
  {
    path: '/profile',
    labelKey: 'nav.profile',
    icon: RiUserLine,
    activeIcon: RiUserFill,
  },
];

const secondaryNavItems: NavItem[] = [
  {
    path: '/positions',
    labelKey: 'nav.positions',
    icon: RiExchangeFundsLine,
    activeIcon: RiExchangeFundsFill,
    divider: true,
  },
  {
    path: '/team',
    labelKey: 'nav.team',
    icon: RiTeamLine,
    activeIcon: RiTeamFill,
  },
  {
    path: '/activities',
    labelKey: 'nav.activities',
    icon: RiGiftLine,
    activeIcon: RiGiftFill,
  },
  {
    path: '/community',
    labelKey: 'nav.community',
    icon: RiChat3Line,
    activeIcon: RiChat3Fill,
  },
  {
    path: '/activities/spin-wheel',
    labelKey: 'nav.spin_wheel',
    icon: RiGamepadLine,
    activeIcon: RiGamepadFill,
  },
  {
    path: '/settings',
    labelKey: 'nav.settings',
    icon: RiSettings4Line,
    activeIcon: RiSettings4Fill,
  },
];

function SidebarNavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();
  const Icon = isActive ? item.activeIcon : item.icon;

  const content = (
    <div
      className={cn(
        'relative flex items-center gap-3 px-4 py-3 rounded-xl',
        'transition-all duration-200',
        isActive
          ? 'bg-primary-800/50 text-white'
          : 'text-white/60 hover:bg-white/5 hover:text-white/80'
      )}
    >
      {isActive && (
        isAnimationEnabled ? (
          <m.div
            layoutId="sidebar-indicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full"
            transition={SPRINGS.elegant}
            style={{
              background: 'var(--color-gold-500)',
              boxShadow: '0 0 8px rgba(var(--color-gold-rgb),0.4)',
            }}
          />
        ) : (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full"
            style={{
              background: 'var(--color-gold-500)',
              boxShadow: '0 0 8px rgba(var(--color-gold-rgb),0.4)',
            }} />
        )
      )}
      
      <Icon className={cn(
        'w-5 h-5 flex-shrink-0 transition-all duration-200',
        isActive && 'text-gold-on-dark'
      )} />
      <span className={cn(
        'text-sm transition-all duration-200',
        isActive ? 'font-bold' : 'font-medium'
      )}>
        {t(item.labelKey)}
      </span>
    </div>
  );

  if (isAnimationEnabled) {
    return (
      <Link href={item.path}>
        <m.div
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          transition={SPRINGS.precise}
        >
          {content}
        </m.div>
      </Link>
    );
  }

  return <Link href={item.path}>{content}</Link>;
}

export function Sidebar() {
  const pathname = usePathname();
  const t = useText();
  const { config } = useGlobalConfigStore();
  const { user } = useUserStore();

  const isActive = (itemPath: string): boolean => {
    if (itemPath === '/') return pathname === '/';
    return pathname.startsWith(itemPath);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0',
        'w-60',
        'bg-dark-950',
        'border-r border-white/5',
        'flex flex-col',
        'z-40',
        'hidden md:flex'
      )}
    >
      <div className="px-6 py-6 border-b border-white/8">
        <Link href="/" className="flex items-center gap-3 group">
          {config?.siteLogo ? (
            <Image
              src={config.siteLogo}
              alt={config.siteName || 'Logo'}
              width={140}
              height={36}
              className="h-8 w-auto object-contain brightness-0 invert"
            />
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-primary">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-lg font-bold text-white tracking-tight group-hover:text-gold-on-dark transition-colors font-heading">
                {config?.siteName || 'lendlease'}
              </span>
            </>
          )}
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {mainNavItems.map((item) => (
          <SidebarNavItem
            key={item.path + item.labelKey}
            item={item}
            isActive={isActive(item.path)}
          />
        ))}

        <div className="my-4 mx-4 h-[0.5px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {secondaryNavItems.map((item) => (
          <SidebarNavItem
            key={item.path + item.labelKey}
            item={item}
            isActive={isActive(item.path)}
          />
        ))}
      </nav>

      {user && (
        <div className="px-4 py-4 border-t border-white/8">
          <Link href="/profile">
            <div
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl',
                'bg-white/5 backdrop-blur-sm',
                'border border-white/8',
                'hover:bg-white/8 hover:border-white/12',
                'transition-all duration-200'
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-primary">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.nickname || 'Avatar'}
                    width={40}
                    height={40}
                    className="rounded-xl object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {(user.nickname || user.phone || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {user.nickname || user.phone}
                </p>
                <p className="text-xs text-white/40 font-medium">
                  {t('sidebar.viewProfile')}
                </p>
              </div>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}
