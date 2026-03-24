/**
 * @file 日期范围筛选器
 * @description 用于资金明细页的日期范围筛选
 * @depends 开发文档/03-前端用户端/03.9-资金明细/03.9.1-资金明细页.md
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useMediaQuery } from '@/hooks/use-media-query';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { RiCalendarLine, RiCloseLine } from '@remixicon/react';
import { getGlobalConfig } from '@/stores/global-config';
import { formatSystemTime, getTodayStart } from '@/lib/timezone';

/**
 * DateRangePicker 组件属性
 */
interface DateRangePickerProps {
  /** 开始日期 */
  startDate: string | null;
  /** 结束日期 */
  endDate: string | null;
  /** 日期变更回调 */
  onChange: (start: string | null, end: string | null) => void;
}

/**
 * 快捷选项配置
 */
const QUICK_RANGES = [
  { key: 'today', labelKey: 'date.today', getDates: () => getTodayRange() },
  { key: '7days', labelKey: 'date.last_7_days', getDates: () => getLast7DaysRange() },
  { key: '30days', labelKey: 'date.last_30_days', getDates: () => getLast30DaysRange() },
  { key: 'month', labelKey: 'date.this_month', getDates: () => getThisMonthRange() },
] as const;

/**
 * 日期范围筛选器组件
 * @description 支持快捷选项和自定义日期范围
 */
export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const t = useText();
  const [isOpen, setIsOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const hasDateFilter = startDate || endDate;

  // 显示文案
  const displayText = hasDateFilter
    ? `${startDate || ''} ~ ${endDate || ''}`
    : t('filter.select_date');

  // 清除筛选
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, null);
  };

  // 应用快捷选项
  const handleQuickSelect = (getDates: () => { start: string; end: string }) => {
    const { start, end } = getDates();
    onChange(start, end);
    setIsOpen(false);
  };

  return (
    <>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-full text-sm',
          'border transition-colors',
          hasDateFilter
            ? 'border-primary-200 bg-primary-50 text-primary-600'
            : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'
        )}
      >
        <RiCalendarLine className="w-4 h-4" />
        <span className="max-w-32 truncate">{displayText}</span>
        {hasDateFilter && (
          <button
            onClick={handleClear}
            className="p-0.5 rounded-full hover:bg-primary-100"
          >
            <RiCloseLine className="w-3 h-3" />
          </button>
        )}
      </button>

      {/* 日期选择弹窗 */}
      <ResponsiveModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title={t('filter.select_date_range')}
      >
        <div className="space-y-6">
          {/* 快捷选项 */}
          <div className="grid grid-cols-2 gap-3">
            {QUICK_RANGES.map((range) => (
              <Button
                key={range.key}
                variant="secondary"
                onClick={() => handleQuickSelect(range.getDates)}
                className="justify-center"
              >
                {t(range.labelKey)}
              </Button>
            ))}
          </div>

          {/* 分隔线 */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-400">{t('label.or')}</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          {/* 自定义日期 */}
          <div className="space-y-3">
            <p className="text-sm text-neutral-500">{t('label.custom_range')}</p>
            {/* 日期输入区域 */}
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={startDate || ''}
                onChange={(e) => onChange(e.target.value || null, endDate)}
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:border-primary-300"
              />
              <span className="text-neutral-400">~</span>
              <input
                type="date"
                value={endDate || ''}
                onChange={(e) => onChange(startDate, e.target.value || null)}
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:border-primary-300"
              />
            </div>
          </div>

          {/* 确认按钮 */}
          <Button className="w-full" onClick={() => setIsOpen(false)}>
            {t('btn.confirm')}
          </Button>
        </div>
      </ResponsiveModal>
    </>
  );
}

// ========================================
// 日期范围工具函数（使用系统时区）
// ========================================

/**
 * 获取系统时区的今天日期字符串
 */
function getSystemTodayStr(): string {
  const { systemTimezone } = getGlobalConfig();
  return formatSystemTime(new Date().toISOString(), systemTimezone, 'yyyy-MM-dd');
}

/**
 * 获取系统时区中某个偏移日期的字符串
 * @param daysOffset 相对于今天的天数偏移（负数表示过去）
 */
function getSystemDateStr(daysOffset: number): string {
  const { systemTimezone } = getGlobalConfig();
  const todayStart = getTodayStart(systemTimezone);
  const targetDate = new Date(todayStart);
  targetDate.setDate(targetDate.getDate() + daysOffset);
  return formatSystemTime(targetDate.toISOString(), systemTimezone, 'yyyy-MM-dd');
}

/**
 * 获取今日日期范围（使用系统时区）
 */
function getTodayRange() {
  const today = getSystemTodayStr();
  return { start: today, end: today };
}

/**
 * 获取近7天日期范围（使用系统时区）
 */
function getLast7DaysRange() {
  return {
    start: getSystemDateStr(-6),
    end: getSystemTodayStr(),
  };
}

/**
 * 获取近30天日期范围（使用系统时区）
 */
function getLast30DaysRange() {
  return {
    start: getSystemDateStr(-29),
    end: getSystemTodayStr(),
  };
}

/**
 * 获取本月日期范围（使用系统时区）
 */
function getThisMonthRange() {
  const { systemTimezone } = getGlobalConfig();
  const todayStart = getTodayStart(systemTimezone);
  // 获取本月第一天
  const firstDayOfMonth = new Date(todayStart);
  firstDayOfMonth.setDate(1);
  
  return {
    start: formatSystemTime(firstDayOfMonth.toISOString(), systemTimezone, 'yyyy-MM-dd'),
    end: getSystemTodayStr(),
  };
}
