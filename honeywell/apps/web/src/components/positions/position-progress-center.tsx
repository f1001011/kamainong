/**
 * @file 持仓进度中心区组件
 * @description 环形进度图+收益对比卡片，作为详情页视觉焦点
 * @depends 开发文档/03-前端用户端/03.8.2-持仓详情页.md 第3.2节
 * @depends 开发文档/01-设计系统/01.1-设计Token.md - 2026高端美学
 */

'use client';

import { useMemo } from 'react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { formatCurrency } from '@/lib/format';
import { CircularProgress } from '@/components/ui/circular-progress';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { IncomePulse } from '@/components/effects/pulse-wrapper';
import { SPRINGS } from '@/lib/animation/constants';

/**
 * PositionProgressCenter 组件属性
 */
export interface PositionProgressCenterProps {
  /** 已发放天数 */
  paidDays: number;
  /** 总天数 */
  cycleDays: number;
  /** 已获收益 */
  earnedIncome: string;
  /** 总收益 */
  totalIncome: string;
  /** 是否为进行中状态 */
  isActive?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * PositionProgressCenter 持仓进度中心区组件
 * @description 2026高端美学设计，核心特性：
 * - 环形进度图居中，作为视觉锚点
 * - 中心显示天数比（已发放/总天数）
 * - 外环光晕缓慢旋转
 * - 收益对比卡片（已获/待获）并列展示
 * 
 * 依据：03.8.2-持仓详情页.md 第3.2节 - 呼吸式环形进度中心区
 * 
 * @example
 * ```tsx
 * <PositionProgressCenter
 *   paidDays={30}
 *   cycleDays={365}
 *   earnedIncome="150.00"
 *   totalIncome="1825.00"
 *   isActive
 * />
 * ```
 */
export function PositionProgressCenter({
  paidDays,
  cycleDays,
  earnedIncome,
  totalIncome,
  isActive = true,
  className,
}: PositionProgressCenterProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();

  // 计算进度百分比
  const percentage = useMemo(() => {
    return cycleDays > 0 ? (paidDays / cycleDays) * 100 : 0;
  }, [paidDays, cycleDays]);

  // 计算待获收益
  const pendingIncome = useMemo(() => {
    const total = parseFloat(totalIncome || '0');
    const earned = parseFloat(earnedIncome || '0');
    return total - earned;
  }, [totalIncome, earnedIncome]);

  // 格式化金额
  const displayEarnedIncome = useMemo(() => {
    return formatCurrency(earnedIncome, config);
  }, [earnedIncome, config]);

  const displayPendingIncome = useMemo(() => {
    return formatCurrency(pendingIncome, config);
  }, [pendingIncome, config]);

  return (
    <div className={cn(
      // 依据：03.8.2-持仓详情页.md - 渐变背景 from-white to-neutral-50
      'py-8 bg-gradient-to-b from-white to-neutral-50/50',
      className
    )}>
      {/* 环形进度图 - 居中展示 */}
      {/* 依据：03.8.2-持仓详情页.md - 尺寸 200x200 */}
      <div className="flex justify-center mb-8">
        <CircularProgress
          current={paidDays}
          total={cycleDays}
          size={200}
          strokeWidth={12}
          showGlow={isActive}
        >
          {/* 中心内容 */}
          <m.div
            initial={isAnimationEnabled ? { scale: 0.8, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ...SPRINGS.gentle }}
            className="text-center"
          >
            {/* 已发放天数 - 大字体 */}
            {/* 依据：03.8.2-持仓详情页.md - text-4xl font-bold font-mono */}
            <p className="text-4xl font-bold text-neutral-800 font-mono leading-none">
              {paidDays}
            </p>
            
            {/* 分隔线 */}
            <div className="w-12 h-px bg-neutral-300 mx-auto my-2" />
            
            {/* 总天数 */}
            {/* 依据：03.8.2-持仓详情页.md - text-2xl font-medium font-mono */}
            <p className="text-2xl font-medium text-neutral-400 font-mono leading-none">
              {cycleDays}
            </p>
            
            {/* 百分比 */}
            <p className="text-xs text-primary-500 font-medium mt-2">
              {percentage.toFixed(1)}%
            </p>
          </m.div>
        </CircularProgress>
      </div>

      {/* 收益对比卡片 - 2列网格 */}
      {/* 依据：03.8.2-持仓详情页.md - 已获收益/待获收益并列对比 */}
      <div className="mx-4 grid grid-cols-2 gap-4">
        {/* 已获收益 - 带脉冲动画 */}
        <m.div
          initial={isAnimationEnabled ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6, ...SPRINGS.gentle }}
          className="p-4 bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] text-center"
        >
          <p className="text-xs text-neutral-500 mb-2">
            {t('label.earned_income')}
          </p>
          {/* 依据：03.8.2-持仓详情页.md - 收益数字带脉冲呼吸 */}
          <IncomePulse enabled={isActive}>
            <span className="text-2xl font-bold text-success font-mono tabular-nums">
              +{displayEarnedIncome}
            </span>
          </IncomePulse>
        </m.div>

        {/* 待获收益 */}
        <m.div
          initial={isAnimationEnabled ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7, ...SPRINGS.gentle }}
          className="p-4 bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] text-center"
        >
          <p className="text-xs text-neutral-500 mb-2">
            {isActive
              ? t('label.pending_income')
              : t('label.total_income')
            }
          </p>
          <span className="text-2xl font-bold text-neutral-600 font-mono tabular-nums">
            {isActive ? displayPendingIncome : displayEarnedIncome}
          </span>
        </m.div>
      </div>
    </div>
  );
}

/**
 * PositionProgressCenterSkeleton 进度中心区骨架屏
 */
export function PositionProgressCenterSkeleton() {
  return (
    <div className="py-8 bg-gradient-to-b from-white to-neutral-50/50 animate-pulse">
      {/* 环形进度骨架 */}
      <div className="flex justify-center mb-8">
        <div className="w-48 h-48 rounded-full bg-neutral-100" />
      </div>

      {/* 收益卡片骨架 */}
      <div className="mx-4 grid grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded-xl shadow-soft">
          <div className="h-3 w-20 bg-neutral-100 rounded mx-auto mb-2" />
          <div className="h-7 w-24 bg-neutral-100 rounded mx-auto" />
        </div>
        <div className="p-4 bg-white rounded-xl shadow-soft">
          <div className="h-3 w-20 bg-neutral-100 rounded mx-auto mb-2" />
          <div className="h-7 w-24 bg-neutral-100 rounded mx-auto" />
        </div>
      </div>
    </div>
  );
}

export default PositionProgressCenter;
