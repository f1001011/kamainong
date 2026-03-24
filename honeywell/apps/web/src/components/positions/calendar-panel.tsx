/**
 * @file 收益日历面板
 * @description ContentTabs 的 Calendar 面板，日历网格 + 状态着色
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { m } from 'motion/react';
import { RiArrowLeftSLine, RiArrowRightSLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { formatCurrency } from '@/lib/format';

interface IncomeRecordItem {
  id: number;
  settleSequence: number;
  amount: string;
  status: 'PENDING' | 'SETTLED' | 'FAILED';
  scheduleAt: string;
  settledAt: string | null;
}

interface CalendarPanelProps {
  records: IncomeRecordItem[];
  startAt: string;
  cycleDays: number;
  className?: string;
}

const WEEKDAYS = ['إث', 'ثل', 'أر', 'خم', 'جم', 'سب', 'أح'];
const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'];

export function CalendarPanel({
  records,
  startAt,
  cycleDays,
  className,
}: CalendarPanelProps) {
  const t = useText();
  const { config } = useGlobalConfig();

  // 起止日期
  const startDate = useMemo(() => new Date(startAt), [startAt]);
  const endDate = useMemo(() => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + cycleDays);
    return d;
  }, [startDate, cycleDays]);

  // 当前显示的月份
  const [viewMonth, setViewMonth] = useState(() => new Date(startDate.getFullYear(), startDate.getMonth(), 1));

  // 映射收益记录到日期
  const recordMap = useMemo(() => {
    const map = new Map<string, IncomeRecordItem>();
    records.forEach(r => {
      const d = new Date(r.scheduleAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      map.set(key, r);
    });
    return map;
  }, [records]);

  // 生成当月日历格
  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 获取第一天是星期几（0=周日，调整为1=周一）
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const days: (Date | null)[] = [];
    // 填充前面的空格
    for (let i = 0; i < startOffset; i++) days.push(null);
    // 填充日期
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [viewMonth]);

  // 今天
  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // 日期格状态
  const getCellStatus = useCallback((date: Date | null) => {
    if (!date) return 'empty';
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const record = recordMap.get(key);
    if (!record) return 'outside';
    if (record.status === 'SETTLED') return 'settled';
    if (record.status === 'FAILED') return 'failed';
    if (key === today) return 'today';
    return 'pending';
  }, [recordMap, today]);

  // 月度统计
  const monthStats = useMemo(() => {
    let settledAmount = 0;
    let pendingAmount = 0;
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();

    records.forEach(r => {
      const d = new Date(r.scheduleAt);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const amt = parseFloat(r.amount);
        if (r.status === 'SETTLED') settledAmount += amt;
        else if (r.status === 'PENDING') pendingAmount += amt;
      }
    });

    return {
      settled: formatCurrency(settledAmount, config),
      pending: formatCurrency(pendingAmount, config),
    };
  }, [records, viewMonth, config]);

  // 月份导航
  const canPrev = viewMonth > new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const canNext = viewMonth < new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  const prevMonth = () => {
    if (canPrev) setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    if (canNext) setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  // Tooltip 状态
  const [tooltipCell, setTooltipCell] = useState<{ key: string; record: IncomeRecordItem } | null>(null);

  return (
    <div className={cn('bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-neutral-100/60 p-5', className)}>
      {/* 月份导航 */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} disabled={!canPrev} className={cn('p-2 rounded-lg transition-colors', canPrev ? 'hover:bg-neutral-100 text-neutral-600' : 'text-neutral-200 cursor-not-allowed')}>
          <RiArrowLeftSLine className="h-5 w-5" />
        </button>
        <h3 className="text-base font-semibold text-neutral-800">
          {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </h3>
        <button onClick={nextMonth} disabled={!canNext} className={cn('p-2 rounded-lg transition-colors', canNext ? 'hover:bg-neutral-100 text-neutral-600' : 'text-neutral-200 cursor-not-allowed')}>
          <RiArrowRightSLine className="h-5 w-5" />
        </button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((day, i) => (
          <div key={day} className={cn('text-center text-[11px] font-medium uppercase', i >= 5 ? 'text-neutral-300' : 'text-neutral-400')}>
            {day}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarDays.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;

          const status = getCellStatus(date);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          const record = recordMap.get(key);
          const isToday = key === today;

          return (
            <button
              key={key}
              onClick={() => record && setTooltipCell(tooltipCell?.key === key ? null : { key, record })}
              className={cn(
                'aspect-square flex items-center justify-center rounded-xl text-sm transition-all relative',
                status === 'settled' && 'bg-success/12 text-success-600 font-semibold',
                status === 'today' && 'ring-2 ring-primary-400 bg-primary-50 text-primary-700 font-bold',
                status === 'pending' && 'bg-neutral-50 text-neutral-400',
                status === 'failed' && 'bg-error/8 text-error-600',
                status === 'outside' && 'text-neutral-200',
                record && 'cursor-pointer hover:scale-105 active:scale-95',
                !record && 'cursor-default'
              )}
            >
              {date.getDate()}
              {/* Tooltip */}
              {tooltipCell?.key === key && record && (
                <m.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-[10px] rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap z-10"
                >
                  {t('label.day_abbr')} {record.settleSequence} · +{formatCurrency(record.amount, config)} · {record.status === 'SETTLED' ? t('status.settled') : record.status === 'FAILED' ? t('status.failed') : t('status.pending')}
                </m.div>
              )}
            </button>
          );
        })}
      </div>

      {/* 图例 */}
      <div className="flex justify-center gap-5 mt-4 pt-3 border-t border-neutral-100">
        <LegendItem color="bg-success/30" label={t('status.settled')} />
        <LegendItem color="bg-neutral-200" label={t('status.pending')} />
        <LegendItem color="bg-primary-300" label={t('label.today')} />
      </div>

      {/* 月度汇总 */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-neutral-100">
        <div>
          <p className="text-[11px] text-neutral-400 uppercase tracking-wider mb-1">{t('label.earned_this_month')}</p>
          <p className="text-base font-bold font-mono text-success">+{monthStats.settled}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-neutral-400 uppercase tracking-wider mb-1">{t('label.pending_this_month')}</p>
          <p className="text-base font-bold font-mono text-neutral-600">{monthStats.pending}</p>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('w-3 h-3 rounded-sm', color)} />
      <span className="text-[11px] text-neutral-400">{label}</span>
    </div>
  );
}
