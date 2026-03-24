/**
 * @file Tab 分段内容区组件
 * @description 渐进式披露，三个 Tab：详情/日历/历史
 */

'use client';

import { useState, useCallback } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';

type TabKey = 'details' | 'calendar' | 'history';

interface ContentTabsProps {
  detailsContent: React.ReactNode;
  calendarContent: React.ReactNode;
  historyContent: React.ReactNode;
  className?: string;
}

export function ContentTabs({
  detailsContent,
  calendarContent,
  historyContent,
  className,
}: ContentTabsProps) {
  const t = useText();
  const [activeTab, setActiveTab] = useState<TabKey>('details');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'details', label: t('tab.details') },
    { key: 'calendar', label: t('tab.calendar') },
    { key: 'history', label: t('tab.history') },
  ];

  const content = {
    details: detailsContent,
    calendar: calendarContent,
    history: historyContent,
  };

  return (
    <div className={cn('mx-4 mt-6', className)}>
      {/* Tab 栏 */}
      <div className="flex border-b border-neutral-100">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'relative flex-1 py-3 text-sm font-medium transition-colors text-center',
              activeTab === tab.key ? 'text-neutral-800' : 'text-neutral-400'
            )}
          >
            {tab.label}
            {activeTab === tab.key && (
              <m.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary-500 rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <AnimatePresence mode="wait">
        <m.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="mt-4"
        >
          {content[activeTab]}
        </m.div>
      </AnimatePresence>
    </div>
  );
}
