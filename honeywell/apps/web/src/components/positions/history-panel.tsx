/**
 * @file 收益明细面板
 * @description ContentTabs 的 History 面板，紧凑列表展示
 */

'use client';

import { useMemo } from 'react';
import { m } from 'motion/react';
import { RiArrowDownSLine, RiTimeLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { formatCurrency } from '@/lib/format';
import { formatSystemTime, DEFAULT_SYSTEM_TIMEZONE } from '@/lib/timezone';
import { SPRINGS, STAGGER } from '@/lib/animation/constants';

interface IncomeRecordItem {
  id: number;
  settleSequence: number;
  amount: string;
  status: 'PENDING' | 'SETTLED' | 'FAILED';
  scheduleAt: string;
  settledAt: string | null;
}

interface HistoryPanelProps {
  records: IncomeRecordItem[];
  hasMore?: boolean;
  loading?: boolean;
  onLoadMore?: () => void;
  className?: string;
}

export function HistoryPanel({
  records,
  hasMore = false,
  loading = false,
  onLoadMore,
  className,
}: HistoryPanelProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  const tz = config.systemTimezone || DEFAULT_SYSTEM_TIMEZONE;

  if (records.length === 0) {
    return (
      <div className={cn('bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-neutral-100/60 py-12 text-center', className)}>
        <RiTimeLine className="h-12 w-12 text-neutral-200 mx-auto mb-3" />
        <p className="text-sm text-neutral-400">{t('empty.income_records', 'لا توجد سجلات دخل بعد')}</p>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-neutral-100/60 overflow-hidden', className)}>
      {records.map((record, index) => {
        const isSettled = record.status === 'SETTLED';
        const isFailed = record.status === 'FAILED';
        const displayAmount = formatCurrency(record.amount, config);
        const displayDate = formatSystemTime(
          isSettled && record.settledAt ? record.settledAt : record.scheduleAt,
          tz,
          'MM-dd HH:mm'
        );

        return (
          <m.div
            key={record.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: index * STAGGER.fast }}
            className={cn(
              'flex items-center px-5 h-14',
              index < records.length - 1 && 'border-b border-neutral-50'
            )}
          >
            {/* 状态点 */}
            <span className={cn(
              'w-2 h-2 rounded-full shrink-0',
              isSettled ? 'bg-success' : isFailed ? 'bg-error' : 'bg-neutral-300'
            )} />

            {/* 天数 */}
            <span className="ml-3 text-sm font-medium text-neutral-700 w-14 shrink-0">
              {t('label.day_abbr', 'اليوم')} {record.settleSequence}
            </span>

            {/* 日期 */}
            <span className="text-xs text-neutral-400 ml-2 flex-1">{displayDate}</span>

            {/* 状态标签 */}
            <span className={cn(
              'text-xs rounded-full px-2 py-0.5 mr-3',
              isSettled ? 'bg-success/10 text-success' : isFailed ? 'bg-error/10 text-error' : 'bg-neutral-100 text-neutral-500'
            )}>
              {isSettled ? t('status.settled', 'تمت التسوية') : isFailed ? t('status.failed', 'فشل') : t('status.pending', 'معلّق')}
            </span>

            {/* 金额 */}
            <span className={cn(
              'text-sm font-mono font-semibold',
              isSettled ? 'text-success' : isFailed ? 'text-error' : 'text-neutral-400'
            )}>
              +{displayAmount}
            </span>
          </m.div>
        );
      })}

      {/* 加载更多 */}
      {hasMore && (
        <div className="py-3 text-center border-t border-neutral-50">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">{t('tip.loading', 'جارٍ التحميل...')}</span>
            ) : (
              <>
                <RiArrowDownSLine className="h-4 w-4" />
                {t('btn.load_more', 'تحميل المزيد')}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
