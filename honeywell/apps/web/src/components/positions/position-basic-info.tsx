/**
 * @file 持仓基础信息卡片组件
 * @description 展示持仓订单的基本信息，支持订单号复制
 * @depends 开发文档/03-前端用户端/03.8.2-持仓详情页.md 第3.1节
 * @depends 开发文档/01-设计系统/01.1-设计Token.md - 卡片样式
 */

'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { m } from 'motion/react';
import {
  RiGiftFill,
  RiFileCopyLine,
  RiCheckLine,
} from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { formatCurrency } from '@/lib/format';
import { formatSystemTime, DEFAULT_SYSTEM_TIMEZONE } from '@/lib/timezone';
import { SPRINGS } from '@/lib/animation/constants';
import { useState, useCallback } from 'react';
import type { PositionDetailData } from './position-detail';

/**
 * PositionBasicInfo 组件属性
 */
export interface PositionBasicInfoProps {
  /** 持仓详情数据 */
  position: PositionDetailData;
  /** 自定义类名 */
  className?: string;
}

/**
 * PositionBasicInfo 持仓基础信息卡片组件
 * @description 2026高端美学设计，核心特性：
 * - 产品信息头部（图片+名称+状态标签）
 * - 订单号可复制
 * - 金额信息网格展示
 * 
 * 依据：03.8.2-持仓详情页.md 第3.1节 - 基础信息卡片
 * 
 * @example
 * ```tsx
 * <PositionBasicInfo position={positionData} />
 * ```
 */
export function PositionBasicInfo({
  position,
  className,
}: PositionBasicInfoProps) {
  const t = useText();
  const { config } = useGlobalConfig();

  // 是否为进行中状态
  const isActive = position.status === 'ACTIVE';

  // 格式化金额
  const displayPurchaseAmount = useMemo(() => {
    return formatCurrency(position.purchaseAmount, config);
  }, [position.purchaseAmount, config]);

  const displayDailyIncome = useMemo(() => {
    return formatCurrency(position.dailyIncome, config);
  }, [position.dailyIncome, config]);

  const displayTotalIncome = useMemo(() => {
    return formatCurrency(position.totalIncome, config);
  }, [position.totalIncome, config]);

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...SPRINGS.gentle }}
      className={cn(
        // 依据：03.8.2-持仓详情页.md - 圆角 rounded-2xl · 阴影 shadow-soft · 内边距 p-5
        'p-5 bg-white rounded-2xl',
        'shadow-[0_2px_12px_rgba(0,0,0,0.04)]',
        'border border-neutral-100/80',
        className
      )}
    >
      {/* 顶部产品行 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* 产品图片 */}
          {/* 依据：03.8.2-持仓详情页.md - w-12 h-12 rounded-xl */}
          <div className="relative shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 shadow-soft">
            {position.productImage ? (
              <Image
                src={position.productImage}
                alt={position.productName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-gold-100">
                <span className="text-lg font-bold text-primary-500">
                  {position.productName.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* 产品名称 */}
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">
              {position.productName}
            </h2>
            {position.isGift && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-primary-50 text-primary-600 text-xs rounded-full">
                <RiGiftFill className="h-3 w-3" />
                {t('label.gift', 'هدية')}
              </span>
            )}
          </div>
        </div>

        {/* 状态标签 */}
        <span className={cn(
          'px-3 py-1 text-xs font-medium rounded-full',
          isActive
            ? 'bg-success/10 text-success'
            : 'bg-neutral-100 text-neutral-500'
        )}>
          {isActive
            ? t('status.active', 'نشط')
            : t('status.completed', 'مكتمل')
          }
        </span>
      </div>

      {/* 分隔线 */}
      <div className="border-t border-neutral-100 my-4" />

      {/* 订单号（可复制） */}
      <OrderNoRow orderNo={position.orderNo} />

      {/* 购买时间 */}
      <InfoRow
        label={t('label.purchase_time', 'تاريخ الشراء')}
        value={formatSystemTime(position.startAt, config.systemTimezone || DEFAULT_SYSTEM_TIMEZONE, 'yyyy-MM-dd HH:mm')}
      />

      {/* 完成时间（仅已完成持仓） */}
      {!isActive && position.endAt && (
        <InfoRow
          label={t('label.complete_time', 'تاريخ الانتهاء')}
          value={formatSystemTime(position.endAt, config.systemTimezone || DEFAULT_SYSTEM_TIMEZONE, 'yyyy-MM-dd HH:mm')}
        />
      )}

      {/* 分隔线 */}
      <div className="border-t border-neutral-100 my-4" />

      {/* 金额信息网格 */}
      {/* 依据：03.8.2-持仓详情页.md - grid-cols-2 gap-x-4 gap-y-3 */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <InfoBlock
          label={t('label.purchase_amount', 'مبلغ الاستثمار')}
          value={displayPurchaseAmount}
        />
        <InfoBlock
          label={t('label.daily_income', 'الدخل اليومي')}
          value={`+${displayDailyIncome}`}
          highlight
        />
        <InfoBlock
          label={t('label.cycle_days', 'مدة الدورة')}
          value={`${position.cycleDays} ${t('label.days', 'أيام')}`}
        />
        <InfoBlock
          label={t('label.total_income', 'إجمالي الدخل')}
          value={displayTotalIncome}
          highlight
        />
      </div>
    </m.div>
  );
}

/**
 * 订单号行组件（支持复制）
 */
function OrderNoRow({ orderNo }: { orderNo: string }) {
  const t = useText();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(orderNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 静默失败
    }
  }, [orderNo]);

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-neutral-500">
        {t('label.order_no', 'رقم الطلب')}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-neutral-600">
          {orderNo}
        </span>
        <button
          onClick={handleCopy}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            'hover:bg-neutral-100 active:bg-neutral-200',
            copied && 'text-success'
          )}
          aria-label={t('btn.copy', 'نسخ')}
        >
          {copied ? (
            <RiCheckLine className="h-4 w-4" />
          ) : (
            <RiFileCopyLine className="h-4 w-4 text-neutral-400" />
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * 信息行组件
 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm text-neutral-700">{value}</span>
    </div>
  );
}

/**
 * 信息块组件
 */
function InfoBlock({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className={cn(
        'font-mono font-semibold',
        highlight ? 'text-success' : 'text-neutral-800'
      )}>
        {value}
      </p>
    </div>
  );
}

/**
 * PositionBasicInfoSkeleton 基础信息骨架屏
 */
export function PositionBasicInfoSkeleton() {
  return (
    <div className="p-5 bg-white rounded-2xl shadow-soft animate-pulse">
      {/* 顶部产品行骨架 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-neutral-100" />
        <div className="flex-1">
          <div className="h-5 w-24 bg-neutral-100 rounded mb-2" />
          <div className="h-4 w-16 bg-neutral-100 rounded" />
        </div>
        <div className="h-6 w-16 bg-neutral-100 rounded-full" />
      </div>

      <div className="border-t border-neutral-100 my-4" />

      {/* 信息行骨架 */}
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-24 bg-neutral-100 rounded" />
            <div className="h-4 w-32 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>

      <div className="border-t border-neutral-100 my-4" />

      {/* 金额网格骨架 */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="h-3 w-20 bg-neutral-100 rounded mb-2" />
            <div className="h-5 w-24 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default PositionBasicInfo;
