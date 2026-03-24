/**
 * @file 投资详情面板
 * @description ContentTabs 的 Details 面板，展示订单基本信息
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { RiFileCopyLine, RiCheckLine, RiFireFill } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { formatSystemTime, DEFAULT_SYSTEM_TIMEZONE } from '@/lib/timezone';

interface DetailsPanelProps {
  orderNo: string;
  startAt: string;
  endAt: string | null;
  estimatedEndAt: string | null;
  status: 'ACTIVE' | 'COMPLETED';
  productName: string;
  productSeries: string;
  productType: string;
  isGift: boolean;
  settledStreak: number;
  className?: string;
}

export function DetailsPanel({
  orderNo,
  startAt,
  endAt,
  estimatedEndAt,
  status,
  productName,
  productSeries,
  productType,
  isGift,
  settledStreak,
  className,
}: DetailsPanelProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  const tz = config.systemTimezone || DEFAULT_SYSTEM_TIMEZONE;
  const isActive = status === 'ACTIVE';

  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(orderNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* 静默 */ }
  }, [orderNo]);

  const rows = useMemo(() => {
    const items: { label: string; value: React.ReactNode }[] = [];

    // 订单号
    items.push({
      label: t('label.order_no', 'رقم الطلب'),
      value: (
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-neutral-600 truncate max-w-[180px]">{orderNo}</span>
          <button onClick={handleCopy} className="p-1 rounded-md hover:bg-neutral-100 transition-colors" aria-label="نسخ">
            {copied
              ? <RiCheckLine className="h-3.5 w-3.5 text-success" />
              : <RiFileCopyLine className="h-3.5 w-3.5 text-neutral-300" />
            }
          </button>
        </div>
      ),
    });

    // 购买日期
    items.push({
      label: t('label.purchase_time', 'تاريخ الشراء'),
      value: formatSystemTime(startAt, tz, 'yyyy-MM-dd HH:mm'),
    });

    // 结束/预计日期
    if (isActive && estimatedEndAt) {
      items.push({
        label: t('label.estimated_end', 'التاريخ المتوقع'),
        value: formatSystemTime(estimatedEndAt, tz, 'yyyy-MM-dd HH:mm'),
      });
    } else if (!isActive && endAt) {
      items.push({
        label: t('label.complete_time', 'تاريخ الانتهاء'),
        value: formatSystemTime(endAt, tz, 'yyyy-MM-dd HH:mm'),
      });
    }

    // 产品类型
    items.push({
      label: t('label.product_type', 'نوع المنتج'),
      value: (
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-xs rounded-full px-2 py-0.5',
            productSeries === 'VIP' ? 'bg-gold-50 text-gold-700' : 'bg-primary-50 text-primary-700'
          )}>
            {productSeries}
          </span>
          <span className="text-sm text-neutral-600">{productName}</span>
        </div>
      ),
    });

    // 订单类型
    items.push({
      label: t('label.order_type', 'نوع الطلب'),
      value: isGift ? t('label.gift', 'هدية') : t('label.purchase', 'شراء'),
    });

    // 连续发放天数
    if (settledStreak > 0) {
      items.push({
        label: t('label.income_streak', 'سلسلة الأرباح'),
        value: (
          <div className="flex items-center gap-1.5">
            <RiFireFill className="h-4 w-4 text-gold-500" />
            <span className="text-sm font-medium text-neutral-700">
              {settledStreak} {t('label.consecutive_days', 'أيام متتالية')}
            </span>
          </div>
        ),
      });
    }

    return items;
  }, [orderNo, startAt, endAt, estimatedEndAt, status, productName, productSeries, isGift, settledStreak, t, tz, copied, handleCopy, isActive, productType]);

  return (
    <div className={cn('bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-neutral-100/60 p-5', className)}>
      {rows.map((row, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center justify-between py-3.5',
            i < rows.length - 1 && 'border-b border-dashed border-neutral-100'
          )}
        >
          <span className="text-sm text-neutral-500 shrink-0 mr-4">{row.label}</span>
          <div className="text-sm text-neutral-700 font-medium text-right">
            {typeof row.value === 'string' ? <span>{row.value}</span> : row.value}
          </div>
        </div>
      ))}
    </div>
  );
}
