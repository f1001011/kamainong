/**
 * @file 收益时间轴组件
 * @description 纵向时间轴展示收益发放记录，连线+节点设计
 * @depends 开发文档/03-前端用户端/03.8.2-持仓详情页.md 第3.4节
 * @depends 开发文档/01-设计系统/01.2-动画系统.md - 交错入场动画
 */

'use client';

import { useMemo } from 'react';
import { m } from 'motion/react';
import {
  RiCheckboxCircleFill,
  RiTimeLine,
  RiErrorWarningFill,
  RiArrowDownLine,
} from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { formatCurrency } from '@/lib/format';
import { formatSystemTime, DEFAULT_SYSTEM_TIMEZONE } from '@/lib/timezone';
import { SPRINGS, STAGGER } from '@/lib/animation/constants';
import type { IncomeRecordItem } from './position-detail';

/**
 * IncomeTimeline 组件属性
 */
export interface IncomeTimelineProps {
  /** 收益记录列表 */
  records: IncomeRecordItem[];
  /** 是否有更多数据 */
  hasMore?: boolean;
  /** 是否正在加载更多 */
  loading?: boolean;
  /** 加载更多回调 */
  onLoadMore?: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * IncomeTimeline 收益时间轴组件
 * @description 2026高端美学设计，核心特性：
 * - 纵向时间轴连线设计
 * - 节点圆圈状态区分（绿色已发放、灰色待发放、红色失败）
 * - 交错入场动画（每项延迟50ms）
 * - 卡片 hover 右移+阴影扩散
 * 
 * 依据：03.8.2-持仓详情页.md 第3.4节 - 收益发放记录时间轴设计
 * 
 * @example
 * ```tsx
 * <IncomeTimeline
 *   records={incomeRecords}
 *   hasMore={hasNextPage}
 *   loading={isLoadingMore}
 *   onLoadMore={() => fetchNextPage()}
 * />
 * ```
 */
export function IncomeTimeline({
  records,
  hasMore = false,
  loading = false,
  onLoadMore,
  className,
}: IncomeTimelineProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();

  // 空状态
  if (records.length === 0) {
    return (
      <div className={cn('py-8 text-center', className)}>
        <RiTimeLine className="h-12 w-12 text-neutral-200 mx-auto mb-3" />
        <p className="text-sm text-neutral-400">
          {t('empty.income_records', 'لا توجد سجلات دخل بعد')}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('', className)}>
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-neutral-800">
          {t('title.income_records', 'سجل الأرباح')}
        </h3>
        <span className="text-xs text-neutral-400">
          {t('label.total_records', 'الإجمالي')}: {records.length}
        </span>
      </div>

      {/* 时间轴列表 */}
      <div className="relative">
        {/* 时间轴连线 */}
        {/* 依据：03.8.2-持仓详情页.md - 连线渐变从顶部到底部渐隐 */}
        <div
          className="absolute left-3 top-4 bottom-4 w-px"
          style={{
            background: 'linear-gradient(to bottom, var(--color-primary-400) 0%, #e7e5e4 50%, transparent 100%)',
          }}
        />

        {/* 记录列表 */}
        <div className="space-y-3">
          {records.map((record, index) => (
            <IncomeTimelineItem
              key={record.id}
              record={record}
              index={index}
              isLatest={index === 0}
              isAnimationEnabled={isAnimationEnabled}
            />
          ))}
        </div>
      </div>

      {/* 加载更多 */}
      {hasMore && (
        <div className="flex justify-center pt-6">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
              'text-sm text-primary-500 hover:text-primary-600',
              'hover:bg-primary-50 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {loading ? (
              <span className="animate-pulse">{t('tip.loading', 'جارٍ التحميل...')}</span>
            ) : (
              <>
                <RiArrowDownLine className="h-4 w-4" />
                {t('btn.load_more', 'تحميل المزيد')}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * 时间轴单项组件属性
 */
interface IncomeTimelineItemProps {
  record: IncomeRecordItem;
  index: number;
  isLatest: boolean;
  isAnimationEnabled: boolean;
}

/**
 * 时间轴单项组件
 */
function IncomeTimelineItem({
  record,
  index,
  isLatest,
  isAnimationEnabled,
}: IncomeTimelineItemProps) {
  const t = useText();
  const { config } = useGlobalConfig();

  // 格式化金额
  const displayAmount = useMemo(() => {
    return formatCurrency(record.amount, config);
  }, [record.amount, config]);

  // 状态判断
  const isSettled = record.status === 'SETTLED';
  const isFailed = record.status === 'FAILED';
  const isPending = record.status === 'PENDING';

  // 节点颜色
  const nodeColorClass = cn(
    'border-2 bg-white',
    isSettled && 'border-success',
    isFailed && 'border-error',
    isPending && 'border-neutral-300'
  );

  // 状态图标
  const StatusIcon = isSettled
    ? RiCheckboxCircleFill
    : isFailed
      ? RiErrorWarningFill
      : RiTimeLine;

  // 状态图标颜色
  const iconColorClass = cn(
    'h-4 w-4',
    isSettled && 'text-success',
    isFailed && 'text-error',
    isPending && 'text-neutral-400'
  );

  // 状态文案
  const statusText = isSettled
    ? t('status.settled', 'تمت التسوية')
    : isFailed
      ? t('status.failed', 'فشل')
      : t('status.pending', 'معلّق');

  // 状态标签颜色
  const statusBadgeClass = cn(
    'px-2 py-0.5 text-xs rounded-full',
    isSettled && 'bg-success/10 text-success',
    isFailed && 'bg-error/10 text-error',
    isPending && 'bg-neutral-100 text-neutral-500'
  );

  return (
    <m.div
      className="relative pl-10"
      initial={isAnimationEnabled ? { opacity: 0, x: -20 } : false}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        delay: index * STAGGER.fast,
        ...SPRINGS.snappy,
      }}
    >
      {/* 时间轴节点 */}
      {/* 依据：03.8.2-持仓详情页.md - 节点缩放弹出，每个节点延迟50ms */}
      <m.div
        initial={isAnimationEnabled ? { scale: 0 } : false}
        animate={{ scale: 1 }}
        transition={{
          duration: 0.3,
          delay: index * STAGGER.fast + 0.1,
          ...SPRINGS.bouncy,
        }}
        className={cn(
          'absolute left-0 top-3 w-6 h-6 rounded-full',
          'flex items-center justify-center',
          nodeColorClass
        )}
      >
        <StatusIcon className={iconColorClass} />
      </m.div>

      {/* 记录卡片 */}
      {/* 依据：03.8.2-持仓详情页.md - hover 右移 x:4px + 阴影扩散 */}
      <m.div
        whileHover={isAnimationEnabled ? {
          x: 4,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        } : undefined}
        transition={SPRINGS.snappy}
        className={cn(
          'p-4 bg-white rounded-xl border transition-all cursor-default',
          isLatest
            ? 'border-primary-200 shadow-[0_2px_12px_rgba(var(--color-gold-rgb),0.1)]'
            : 'border-neutral-100 hover:border-neutral-200'
        )}
      >
        {/* 顶部信息行 */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-700">
            {t('label.day_n', 'اليوم')} {record.settleSequence}
          </span>
          <span className={statusBadgeClass}>
            {statusText}
          </span>
        </div>

        {/* 时间和金额 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            {isSettled && record.settledAt
              ? formatSystemTime(record.settledAt, config.systemTimezone || DEFAULT_SYSTEM_TIMEZONE, 'yyyy-MM-dd HH:mm')
              : formatSystemTime(record.scheduleAt, config.systemTimezone || DEFAULT_SYSTEM_TIMEZONE, 'yyyy-MM-dd HH:mm')
            }
          </span>
          <span className={cn(
            'text-base font-mono font-semibold',
            isSettled ? 'text-success' : isPending ? 'text-neutral-400' : 'text-error'
          )}>
            +{displayAmount}
          </span>
        </div>
      </m.div>
    </m.div>
  );
}

/**
 * IncomeTimelineSkeleton 时间轴骨架屏
 */
export function IncomeTimelineSkeleton() {
  return (
    <div className="animate-pulse">
      {/* 标题骨架 */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-32 bg-neutral-100 rounded" />
        <div className="h-4 w-16 bg-neutral-100 rounded" />
      </div>

      {/* 列表骨架 */}
      <div className="relative">
        <div className="absolute left-3 top-4 bottom-4 w-px bg-neutral-100" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative pl-10">
              <div className="absolute left-0 top-3 w-6 h-6 rounded-full bg-neutral-100" />
              <div className="p-4 bg-white rounded-xl border border-neutral-100">
                <div className="flex justify-between mb-2">
                  <div className="h-4 w-16 bg-neutral-100 rounded" />
                  <div className="h-5 w-16 bg-neutral-100 rounded-full" />
                </div>
                <div className="flex justify-between">
                  <div className="h-3 w-24 bg-neutral-100 rounded" />
                  <div className="h-5 w-20 bg-neutral-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default IncomeTimeline;
