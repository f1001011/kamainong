/**
 * @file 通用订单卡片组件
 * @description 充值/提现订单卡片，可根据类型显示不同信息
 * @depends 开发文档/03-前端用户端/03.4-充值模块/03.4.2-充值记录页.md
 * 
 * 复用说明：本组件被以下页面复用
 * - FE-09 充值记录页
 * - FE-11 提现记录页
 */

'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { m } from 'motion/react';
import { RiArrowRightSLine, RiBankCardFill } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { formatCurrency } from '@/lib/format';
import { formatSystemTime } from '@/lib/timezone';
import { StatusBadge } from './status-badge';
import { Countdown, calculateExpireTime } from '@/components/ui/countdown';

/**
 * 充值订单状态
 */
export type RechargeOrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'FAILED' | 'CANCELLED';

/**
 * 提现订单状态
 */
export type WithdrawOrderStatus = 'PENDING_REVIEW' | 'APPROVED' | 'PAYOUT_FAILED' | 'COMPLETED' | 'FAILED' | 'REJECTED';

/**
 * 订单类型
 */
export type OrderType = 'recharge' | 'withdraw';

/**
 * 充值订单数据
 */
export interface RechargeOrderData {
  id: number;
  orderNo: string;
  amount: string;
  actualAmount?: string | null;
  channelName?: string | null;
  status: RechargeOrderStatus;
  createdAt: string;
  expireAt?: string | null;
  paidAt?: string | null;
}

/**
 * 提现订单数据
 */
export interface WithdrawOrderData {
  id: number;
  orderNo: string;
  amount: string;
  fee?: string;
  actualAmount?: string;
  bankName?: string;
  accountNoMask?: string;
  status: WithdrawOrderStatus;
  rejectReason?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

/**
 * OrderCard 组件属性
 */
export interface OrderCardProps {
  /** 订单类型 */
  type: OrderType;
  /** 订单数据 */
  order: RechargeOrderData | WithdrawOrderData;
  /** 点击回调 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 倒计时归零回调（仅充值待支付状态） */
  onExpire?: () => void;
  /** 充值订单超时时间（分钟） */
  timeoutMinutes?: number;
}

/**
 * 充值状态配置映射
 */
const rechargeStatusConfig: Record<RechargeOrderStatus, { variant: 'warning' | 'success' | 'error' | 'pending'; textKey: string }> = {
  PENDING_PAYMENT: { variant: 'warning', textKey: 'status.pending_payment' },
  PAID: { variant: 'success', textKey: 'status.paid' },
  FAILED: { variant: 'error', textKey: 'status.failed' },
  CANCELLED: { variant: 'pending', textKey: 'status.cancelled' },
};

/**
 * 提现状态配置映射
 * 依据：03.5.2-提现记录页.md 第3.5节 - 状态视觉
 */
const withdrawStatusConfig: Record<WithdrawOrderStatus, { variant: 'warning' | 'success' | 'error' | 'pending' | 'info'; textKey: string }> = {
  PENDING_REVIEW: { variant: 'warning', textKey: 'status.pending_review' },
  APPROVED: { variant: 'warning', textKey: 'status.approved' },  // 处理中使用 warning 色
  PAYOUT_FAILED: { variant: 'warning', textKey: 'status.approved' },  // 用户端显示为"处理中"，与 APPROVED 一致
  COMPLETED: { variant: 'success', textKey: 'status.completed' },
  FAILED: { variant: 'error', textKey: 'status.failed' },
  REJECTED: { variant: 'error', textKey: 'status.rejected' },
};

/**
 * 状态色条颜色映射
 */
const statusBarColors: Record<string, string> = {
  warning: 'bg-warning',
  success: 'bg-success',
  error: 'bg-error',
  pending: 'bg-neutral-400',
  info: 'bg-info',
};

/**
 * OrderCard 通用订单卡片组件
 * @description 充值/提现订单列表项，支持左侧状态色条
 * 
 * @example
 * ```tsx
 * // 充值订单卡片
 * <OrderCard
 *   type="recharge"
 *   order={rechargeOrder}
 *   onClick={() => router.push(`/recharge/records/${order.id}`)}
 *   onExpire={() => refetch()}
 * />
 * 
 * // 提现订单卡片
 * <OrderCard
 *   type="withdraw"
 *   order={withdrawOrder}
 *   onClick={() => router.push(`/withdraw/records/${order.id}`)}
 * />
 * ```
 */
export function OrderCard({
  type,
  order,
  onClick,
  className,
  onExpire,
  timeoutMinutes = 30,
}: OrderCardProps) {
  const t = useText();
  const router = useRouter();
  const { config } = useGlobalConfig();

  // 获取状态配置
  const statusConfig = useMemo(() => {
    if (type === 'recharge') {
      return rechargeStatusConfig[(order as RechargeOrderData).status];
    }
    return withdrawStatusConfig[(order as WithdrawOrderData).status];
  }, [type, order]);

  // 是否为待支付状态（充值）
  const isPendingPayment = type === 'recharge' && (order as RechargeOrderData).status === 'PENDING_PAYMENT';

  // 计算过期时间
  const expireTime = useMemo(() => {
    if (!isPendingPayment) return null;
    const rechargeOrder = order as RechargeOrderData;
    if (rechargeOrder.expireAt) {
      return rechargeOrder.expireAt;
    }
    // 如果没有 expireAt，根据创建时间 + 超时时间计算
    return calculateExpireTime(rechargeOrder.createdAt, timeoutMinutes);
  }, [isPendingPayment, order, timeoutMinutes]);

  // 格式化金额
  const displayAmount = useMemo(() => {
    return formatCurrency(order.amount, config);
  }, [order.amount, config]);

  // 格式化实际到账金额（仅提现）
  const displayActualAmount = useMemo(() => {
    if (type !== 'withdraw') return null;
    const withdrawOrder = order as WithdrawOrderData;
    if (!withdrawOrder.actualAmount) return null;
    return formatCurrency(withdrawOrder.actualAmount, config);
  }, [type, order, config]);

  // 格式化时间
  const displayTime = useMemo(() => {
    return formatSystemTime(order.createdAt, config.systemTimezone, 'yyyy-MM-dd HH:mm');
  }, [order.createdAt, config.systemTimezone]);

  // 处理点击事件
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // 默认跳转到详情页
      const basePath = type === 'recharge' ? '/recharge/records' : '/withdraw/records';
      router.push(`${basePath}/${order.id}`);
    }
  };

  // 提现订单的银行卡信息
  const renderBankInfo = () => {
    if (type !== 'withdraw') return null;
    const withdrawOrder = order as WithdrawOrderData;
    if (!withdrawOrder.bankName) return null;

    return (
      <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-1">
        <RiBankCardFill className="h-3.5 w-3.5" />
        <span>{withdrawOrder.bankName}</span>
        {withdrawOrder.accountNoMask && (
          <span className="font-mono">{withdrawOrder.accountNoMask}</span>
        )}
      </div>
    );
  };

  return (
    <m.div
      onClick={handleClick}
      className={cn(
        'relative flex bg-white rounded-xl shadow-soft overflow-hidden cursor-pointer',
        'hover:shadow-soft-lg transition-shadow',
        className
      )}
      whileTap={{ scale: 0.98 }}
    >
      {/* 左侧状态色条 */}
      <div className={cn(
        'w-1 shrink-0',
        statusBarColors[statusConfig.variant]
      )} />

      {/* 内容区域 */}
      <div className="flex-1 p-4 min-w-0">
        {/* 上方：订单号 + 状态标签 */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-mono text-neutral-800 truncate">
            {order.orderNo}
          </span>
          <StatusBadge variant={statusConfig.variant} size="sm">
            {t(statusConfig.textKey)}
          </StatusBadge>
        </div>

        {/* 中间：金额 */}
        {/* 依据：03.5.2-提现记录页.md 第4.4节 - 订单卡片信息布局 */}
        <div className="mt-3 flex items-center gap-2">
          <span className={cn(
            'text-lg font-bold font-mono',
            isPendingPayment ? 'text-primary-500' : 
            statusConfig.variant === 'success' ? 'text-success' : 'text-neutral-700'
          )}>
            {displayAmount}
          </span>
          {/* 提现订单显示：申请金额 → 实际到账 */}
          {displayActualAmount && (
            <>
              <span className="text-neutral-400">→</span>
              <span className="text-lg font-bold font-mono text-success">
                {displayActualAmount}
              </span>
            </>
          )}
        </div>

        {/* 提现：银行卡信息 */}
        {renderBankInfo()}

        {/* 倒计时（仅充值待支付） */}
        {isPendingPayment && expireTime && (
          <div className="mt-2">
            <Countdown
              expireAt={expireTime}
              onExpire={onExpire}
              showIcon
              showLabel
              variant="inline"
            />
          </div>
        )}

        {/* 下方：创建时间 */}
        <div className="mt-2 text-xs text-neutral-400">
          {displayTime}
        </div>
      </div>

      {/* 右侧箭头 */}
      <div className="flex items-center pr-3">
        <RiArrowRightSLine className="h-5 w-5 text-neutral-300" />
      </div>
    </m.div>
  );
}
