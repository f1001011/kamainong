/**
 * @file 持仓卡片组件
 * @description 持仓订单展示卡片，支持渐变背景、收益脉冲、实时倒计时
 * @depends 开发文档/03-页面开发/03.8.1-我的持仓页.md
 * @depends 开发文档/01-设计系统/01.1-设计Token.md - 2026高端美学配色
 * @depends 开发文档/01-设计系统/01.2-动画系统.md - 收益脉冲动画
 */

'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { m } from 'motion/react';
import { RiArrowRightSLine, RiTimeLine, RiGiftFill } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { formatCurrency } from '@/lib/format';
import { IncomeProgressBar } from '@/components/ui/progress-bar';
import { CountdownTimer, calculateNextIncomeTime } from '@/components/ui/countdown-timer';
import { IncomePulse } from '@/components/effects/pulse-wrapper';
import { SPRINGS } from '@/lib/animation/constants';

/**
 * 持仓状态类型
 */
export type PositionOrderStatus = 'ACTIVE' | 'COMPLETED';

/**
 * 持仓订单数据
 * 依据：02.3-前端API接口清单.md 第8.1节
 */
export interface PositionOrderData {
  id: number;
  orderNo: string;
  productName: string;
  productImage: string | null;
  purchaseAmount: string;
  dailyIncome: string;
  cycleDays: number;
  paidDays: number;
  earnedIncome: string;
  status: PositionOrderStatus;
  isGift: boolean;
  startAt: string;
  nextSettleAt: string | null;
}

/**
 * PositionCard 组件属性
 */
export interface PositionCardProps {
  /** 持仓订单数据 */
  position: PositionOrderData;
  /** 点击回调 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 倒计时完成回调（用于刷新数据） */
  onCountdownComplete?: () => void;
}

/**
 * 获取渐变背景样式
 * 依据：03.8.1-我的持仓页.md - 根据收益进度，卡片背景从浅色渐变到深色
 * @param progress - 进度百分比 (0-100)
 */
function getProgressGradient(progress: number): string {
  // 进度越高，背景越深（翡翠绿+香槟金）
  if (progress >= 90) {
    return 'bg-gradient-to-br from-gold-50/80 via-white to-primary-50/60';
  }
  if (progress >= 70) {
    return 'bg-gradient-to-br from-gold-50/60 via-white to-primary-50/40';
  }
  if (progress >= 50) {
    return 'bg-gradient-to-br from-gold-50/40 via-white to-primary-50/30';
  }
  if (progress >= 30) {
    return 'bg-gradient-to-br from-gold-50/20 via-white to-primary-50/20';
  }
  return 'bg-white';
}

/**
 * PositionCard 持仓卡片组件
 * @description 沉浸式持仓展示卡片，核心设计元素：
 * - 渐变进度背景：根据收益进度动态变化
 * - 收益脉冲动画：已获收益数字绿色微光呼吸
 * - 实时倒计时：下次收益时间 HH:MM:SS 每秒跳动
 * - 多层阴影悬浮：增强空间感
 * 
 * 依据：03.8.1-我的持仓页.md - 持仓卡片是本页面的核心
 * 
 * @example
 * ```tsx
 * <PositionCard
 *   position={positionOrder}
 *   onClick={() => router.push(`/positions/${positionOrder.id}`)}
 *   onCountdownComplete={() => refetch()}
 * />
 * ```
 */
export function PositionCard({
  position,
  onClick,
  className,
  onCountdownComplete,
}: PositionCardProps) {
  const router = useRouter();
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();

  // 计算进度百分比
  const progress = useMemo(() => {
    return (position.paidDays / position.cycleDays) * 100;
  }, [position.paidDays, position.cycleDays]);

  // 获取渐变背景
  const gradientBg = useMemo(() => getProgressGradient(progress), [progress]);

  // 是否为进行中状态
  const isActive = position.status === 'ACTIVE';

  // 计算下次收益时间
  const nextIncomeTime = useMemo(() => {
    return calculateNextIncomeTime(position.nextSettleAt);
  }, [position.nextSettleAt]);

  // 格式化金额
  const displayPurchaseAmount = useMemo(() => {
    return formatCurrency(position.purchaseAmount, config);
  }, [position.purchaseAmount, config]);

  const displayDailyIncome = useMemo(() => {
    return formatCurrency(position.dailyIncome, config);
  }, [position.dailyIncome, config]);

  const displayEarnedIncome = useMemo(() => {
    return formatCurrency(position.earnedIncome, config);
  }, [position.earnedIncome, config]);

  // 处理点击
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/positions/${position.id}`);
    }
  };

  // 剩余天数
  const remainingDays = position.cycleDays - position.paidDays;

  return (
    <m.div
      onClick={handleClick}
      className={cn(
        'relative overflow-hidden rounded-2xl cursor-pointer',
        // 基础样式
        'border border-neutral-100/80',
        // 渐变背景
        gradientBg,
        // 多层阴影效果
        // 依据：03.8.1-我的持仓页.md - 3层阴影堆叠（base+hover+glow）
        'shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04),0_8px_24px_rgba(var(--color-gold-rgb),0.04)]',
        'hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06),0_12px_32px_rgba(var(--color-gold-rgb),0.08)]',
        'transition-shadow duration-300',
        className
      )}
      whileTap={{ scale: 0.98 }}
      transition={SPRINGS.snappy}
    >
      {/* 赠送标识 */}
      {position.isGift && (
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100 text-primary-600 text-xs font-medium">
            <RiGiftFill className="h-3 w-3" />
            {t('label.gift')}
          </span>
        </div>
      )}

      {/* 状态角标 */}
      {!isActive && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 text-xs font-medium">
            {t('status.completed')}
          </span>
        </div>
      )}

      {/* 内容区域 */}
      <div className="p-4">
        {/* 上方：产品信息 */}
        <div className="flex items-start gap-3">
          {/* 产品图片 */}
          <div className="relative shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-neutral-100">
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

          {/* 产品名称和日收益 */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-neutral-800 truncate">
              {position.productName}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-neutral-400">
                {t('label.daily_income')}
              </span>
              <span className="text-sm font-medium text-primary-500">
                +{displayDailyIncome}
              </span>
            </div>
          </div>

          {/* 右侧箭头 */}
          <div className="shrink-0 self-center">
            <RiArrowRightSLine className="h-5 w-5 text-neutral-300" />
          </div>
        </div>

        {/* 中间：收益进度 */}
        <div className="mt-4">
          {/* 进度条 */}
          <IncomeProgressBar
            paidDays={position.paidDays}
            cycleDays={position.cycleDays}
            showDays
          />
        </div>

        {/* 下方：收益信息和倒计时 */}
        <div className="mt-4 flex items-end justify-between">
          {/* 已获收益 - 带脉冲动画 */}
          <div className="flex flex-col">
            <span className="text-xs text-neutral-400">
              {t('label.earned_income')}
            </span>
            <IncomePulse enabled={isActive}>
              <span className={cn(
                'text-lg font-bold font-mono tabular-nums',
                isActive ? 'text-success' : 'text-neutral-600'
              )}>
                +{displayEarnedIncome}
              </span>
            </IncomePulse>
          </div>

          {/* 下次收益倒计时 / 已完成状态 */}
          {isActive && nextIncomeTime ? (
            <div className="flex flex-col items-end">
              <span className="text-xs text-neutral-400 mb-1">
                {t('label.next_income')}
              </span>
              <CountdownTimer
                targetTime={nextIncomeTime}
                onComplete={onCountdownComplete}
                variant="minimal"
                size="sm"
                animated
              />
            </div>
          ) : isActive ? (
            <div className="flex items-center gap-1 text-xs text-neutral-400">
              <RiTimeLine className="h-3.5 w-3.5" />
              <span>{remainingDays} {t('label.days_remaining')}</span>
            </div>
          ) : (
            <div className="text-xs text-neutral-400">
              {t('label.all_income_received')}
            </div>
          )}
        </div>
      </div>

      {/* 底部装饰渐变线 */}
      {isActive && (
        <div className="h-1 bg-gradient-to-r from-primary-400/60 via-primary-500 to-gold-400/60" />
      )}
    </m.div>
  );
}

/**
 * PositionCardSkeleton 持仓卡片骨架屏
 */
export function PositionCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-neutral-100/80 overflow-hidden animate-pulse">
      <div className="p-4">
        {/* 上方骨架 */}
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-xl bg-neutral-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-neutral-100 rounded w-24" />
            <div className="h-3 bg-neutral-100 rounded w-32" />
          </div>
        </div>
        
        {/* 中间进度条骨架 */}
        <div className="mt-4">
          <div className="flex justify-between mb-1.5">
            <div className="h-3 bg-neutral-100 rounded w-16" />
            <div className="h-3 bg-neutral-100 rounded w-12" />
          </div>
          <div className="h-1.5 bg-neutral-100 rounded-full" />
        </div>
        
        {/* 下方骨架 */}
        <div className="mt-4 flex justify-between items-end">
          <div className="space-y-1">
            <div className="h-3 bg-neutral-100 rounded w-20" />
            <div className="h-5 bg-neutral-100 rounded w-24" />
          </div>
          <div className="space-y-1 text-right">
            <div className="h-3 bg-neutral-100 rounded w-16" />
            <div className="h-4 bg-neutral-100 rounded w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
