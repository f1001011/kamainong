/**
 * @file 产品分类 Tab 组件（极简下划线式）
 * @description 金色下划线切换器，layoutId 平滑滑动动画
 */

'use client';

import { m } from 'motion/react';
import { cn } from '@/lib/utils';

export interface ProductsConfig {
  tab1Name: string;
  tab1Filter: string;
  tab2Name: string;
  tab2Filter: string;
  defaultTab: 1 | 2;
  listLayout: 'single' | 'double' | 'auto';
  cardStyle: 'standard' | 'compact' | 'large';
  vipBadgeColor: string;
  purchasedBadge: string;
  lockedTip: string;
}

export interface ProductTabsProps {
  config: ProductsConfig;
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts?: { tab1?: number; tab2?: number };
  className?: string;
}

export function ProductTabs({ config, activeTab, onTabChange, className }: ProductTabsProps) {
  const tabs = [
    { key: '1', label: config.tab1Name },
    { key: '2', label: config.tab2Name },
  ];

  return (
    <div className={cn('flex gap-6 border-b border-neutral-100', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              'relative pb-3 text-sm font-medium transition-colors duration-200',
              isActive ? 'text-neutral-800' : 'text-neutral-400',
            )}
          >
            {tab.label}
            {isActive && (
              <m.div
                layoutId="product-tab-underline"
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                style={{ background: 'var(--color-gold-500)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 获取当前 Tab 对应的筛选值
 * @description 支持逗号分隔的多值筛选，如 'VIC,NWS,QLD' 或 'FINANCIAL'
 * @returns 单值字符串或逗号分隔字符串
 */
export function getSeriesFromTab(tab: string, config: ProductsConfig): string {
  return tab === '1' ? config.tab1Filter : config.tab2Filter;
}

/**
 * 判断产品是否匹配当前 Tab 的筛选条件
 * @description 筛选值支持逗号分隔，任一匹配即命中
 * @param productSeries - 产品 series 字段
 * @param filterStr - Tab 对应的筛选串（如 'VIC,NWS,QLD'）
 */
export function matchesTabFilter(productSeries: string, filterStr: string): boolean {
  const filters = filterStr.split(',').map((s) => s.trim()).filter(Boolean);
  return filters.length === 0 || filters.includes(productSeries);
}
