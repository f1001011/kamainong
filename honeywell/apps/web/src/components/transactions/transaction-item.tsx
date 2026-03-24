/**
 * @file 流水列表项组件
 * @description 单条流水记录的展示组件，支持展开详情
 * @depends 开发文档/03-前端用户端/03.9-资金明细/03.9.1-资金明细页.md
 */

'use client';

import { useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { formatCurrency } from '@/lib/format';
import { formatSystemTime } from '@/lib/timezone';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS } from '@/lib/animation/constants';
import {
  RiWalletFill,
  RiLockFill,
  RiBankFill,
  RiRefund2Fill,
  RiShoppingBagFill,
  RiLineChartFill,
  RiUserAddFill,
  RiCalendarCheckFill,
  RiGiftFill,
  RiSparklingFill,
  RiAddCircleFill,
  RiIndeterminateCircleFill,
  RiArrowDownSLine,
} from '@remixicon/react';

/**
 * 流水类型配置
 * 依据：02.1-数据库设计.md TransactionType
 */
const TYPE_CONFIG: Record<string, {
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
}> = {
  RECHARGE: { icon: RiWalletFill, bgColor: 'bg-info-50', iconColor: 'text-info' },
  WITHDRAW_FREEZE: { icon: RiLockFill, bgColor: 'bg-neutral-100', iconColor: 'text-neutral-500' },
  WITHDRAW_SUCCESS: { icon: RiBankFill, bgColor: 'bg-neutral-100', iconColor: 'text-neutral-500' },
  WITHDRAW_REFUND: { icon: RiRefund2Fill, bgColor: 'bg-warning-50', iconColor: 'text-warning' },
  PURCHASE: { icon: RiShoppingBagFill, bgColor: 'bg-primary-100', iconColor: 'text-primary-500' },
  INCOME: { icon: RiLineChartFill, bgColor: 'bg-success-50', iconColor: 'text-success' },
  REFERRAL_COMMISSION: { icon: RiUserAddFill, bgColor: 'bg-primary-50', iconColor: 'text-primary-500' },
  SIGN_IN: { icon: RiCalendarCheckFill, bgColor: 'bg-primary-50', iconColor: 'text-primary-500' },
  ACTIVITY_REWARD: { icon: RiGiftFill, bgColor: 'bg-peach-100', iconColor: 'text-peach-500' },
  REGISTER_BONUS: { icon: RiSparklingFill, bgColor: 'bg-warning-50', iconColor: 'text-warning' },
  ADMIN_ADD: { icon: RiAddCircleFill, bgColor: 'bg-success-50', iconColor: 'text-success' },
  ADMIN_DEDUCT: { icon: RiIndeterminateCircleFill, bgColor: 'bg-error-50', iconColor: 'text-error' },
};

/**
 * 收入类型列表（金额显示为绿色）
 */
const INCOME_TYPES = [
  'RECHARGE', 'WITHDRAW_REFUND', 'INCOME', 'REFERRAL_COMMISSION',
  'SIGN_IN', 'ACTIVITY_REWARD', 'REGISTER_BONUS', 'ADMIN_ADD'
];

/**
 * 流水记录类型
 */
export interface TransactionRecord {
  /** 流水ID */
  id: number;
  /** 流水类型 */
  type: string;
  /** 类型名称（从文案获取） */
  typeName: string;
  /** 金额（带正负号的字符串） */
  amount: string;
  /** 变动后余额 */
  balanceAfter: string;
  /** 关联订单号 */
  relatedOrderNo?: string;
  /** 备注 */
  remark?: string;
  /** 创建时间 */
  createdAt: string;
}

/**
 * TransactionItem 组件属性
 */
interface TransactionItemProps {
  /** 流水记录数据 */
  transaction: TransactionRecord;
}

/**
 * 流水列表项组件
 * @description 展示单条流水记录，支持点击展开详情
 */
export function TransactionItem({ transaction }: TransactionItemProps) {
  const t = useText();
  const { config: globalConfig } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();
  const [isExpanded, setIsExpanded] = useState(false);

  // 获取类型配置，使用默认配置作为 fallback
  const config = TYPE_CONFIG[transaction.type] || TYPE_CONFIG.RECHARGE;
  const Icon = config.icon;
  const isIncome = INCOME_TYPES.includes(transaction.type);

  // 解析金额数值（去掉正负号用于格式化）
  const amountNum = parseFloat(transaction.amount.replace(/[+\-]/g, ''));
  const amountSign = transaction.amount.startsWith('-') ? '-' : '+';

  return (
    <m.div
      layout={isAnimationEnabled}
      className={cn(
        'bg-white rounded-2xl overflow-hidden',
        'shadow-soft border border-neutral-100/50',
        'transition-shadow hover:shadow-soft-lg'
      )}
    >
      {/* 主要内容区 - 可点击展开 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-4 flex items-center gap-4"
      >
        {/* 左侧图标 */}
        <div className={cn(
          'w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0',
          config.bgColor
        )}>
          <Icon className={cn('w-5 h-5', config.iconColor)} />
        </div>

        {/* 中间信息 */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-neutral-800 truncate">
            {transaction.typeName}
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">
            {formatSystemTime(transaction.createdAt, globalConfig.systemTimezone, 'HH:mm')}
          </p>
        </div>

        {/* 右侧金额 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn(
            'text-base font-semibold font-mono',
            isIncome ? 'text-success' : 'text-neutral-600'
          )}>
            {amountSign}{formatCurrency(amountNum, globalConfig)}
          </span>
          
          {/* 展开指示器 */}
          <m.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={SPRINGS.snappy}
          >
            <RiArrowDownSLine className="w-4 h-4 text-neutral-300" />
          </m.div>
        </div>
      </button>

      {/* 展开详情 */}
      <AnimatePresence>
        {isExpanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRINGS.gentle}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 space-y-2 border-t border-neutral-100 mt-0">
              <div className="pt-3 flex justify-between text-sm">
                <span className="text-neutral-400">{t('label.balance_after')}</span>
                <span className="text-neutral-600 font-mono">
                  {formatCurrency(parseFloat(transaction.balanceAfter), globalConfig)}
                </span>
              </div>
              
              {transaction.relatedOrderNo && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">{t('label.related_order')}</span>
                  <span className="text-neutral-500 font-mono text-xs">
                    {transaction.relatedOrderNo}
                  </span>
                </div>
              )}
              
              {transaction.remark && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">{t('label.remark')}</span>
                  <span className="text-neutral-500 text-right max-w-48 truncate">
                    {transaction.remark}
                  </span>
                </div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}
