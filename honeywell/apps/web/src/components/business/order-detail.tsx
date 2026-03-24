/**
 * @file 通用订单详情组件
 * @description 充值/提现订单详情展示，支持信息分组卡片
 * @depends 开发文档/03-前端用户端/03.4-充值模块/03.4.3-充值订单详情页.md
 * 
 * 复用说明：本组件被以下页面复用
 * - FE-09 充值订单详情页
 * - FE-11 提现订单详情页
 */

'use client';

import { useMemo, type ReactNode } from 'react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { formatCurrency } from '@/lib/format';
import { formatSystemTime } from '@/lib/timezone';
import { StatusBadge } from './status-badge';
import { CopyButton } from '@/components/ui/copy-button';
import { Countdown, calculateExpireTime } from '@/components/ui/countdown';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type {
  RechargeOrderStatus,
  WithdrawOrderStatus,
  OrderType,
} from './order-card';

/**
 * 充值订单详情数据
 */
export interface RechargeOrderDetail {
  id: number;
  orderNo: string;
  amount: string;
  actualAmount?: string | null;
  channelName?: string | null;
  status: RechargeOrderStatus;
  payUrl?: string | null;
  expireAt?: string | null;
  createdAt: string;
  paidAt?: string | null;
}

/**
 * 提现订单详情数据
 */
export interface WithdrawOrderDetail {
  id: number;
  orderNo: string;
  amount: string;
  fee?: string;
  actualAmount?: string;
  bankName?: string;
  accountNoMask?: string;
  accountName?: string;
  status: WithdrawOrderStatus;
  rejectReason?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  completedAt?: string | null;
}

/**
 * OrderDetail 组件属性
 */
export interface OrderDetailProps {
  /** 订单类型 */
  type: OrderType;
  /** 订单详情数据 */
  order: RechargeOrderDetail | WithdrawOrderDetail;
  /** 充值订单超时时间（分钟） */
  timeoutMinutes?: number;
  /** 倒计时归零回调 */
  onExpire?: () => void;
  /** 继续支付回调（仅充值待支付） */
  onContinuePay?: () => void;
  /** 取消订单回调（仅充值待支付） */
  onCancelOrder?: () => void;
  /** 取消中 loading 状态 */
  isCancelling?: boolean;
  /** 自定义类名 */
  className?: string;
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
 */
const withdrawStatusConfig: Record<WithdrawOrderStatus, { variant: 'warning' | 'success' | 'error' | 'pending' | 'info'; textKey: string }> = {
  PENDING_REVIEW: { variant: 'warning', textKey: 'status.pending_review' },
  APPROVED: { variant: 'info', textKey: 'status.approved' },
  PAYOUT_FAILED: { variant: 'info', textKey: 'status.approved' }, // 用户端显示为"处理中"
  COMPLETED: { variant: 'success', textKey: 'status.completed' },
  FAILED: { variant: 'error', textKey: 'status.failed' },
  REJECTED: { variant: 'error', textKey: 'status.rejected' },
};

/**
 * 信息项组件
 */
interface InfoItemProps {
  label: string;
  value: ReactNode;
  highlight?: boolean;
  warning?: boolean;
}

function InfoItem({ label, value, highlight, warning }: InfoItemProps) {
  return (
    <div className="flex justify-between items-start py-3 border-b border-neutral-100 last:border-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className={cn(
        'text-sm text-right',
        highlight && 'text-primary-500 font-semibold',
        warning && 'text-warning-600 font-medium',
        !highlight && !warning && 'text-neutral-700'
      )}>
        {value}
      </span>
    </div>
  );
}

/**
 * OrderDetail 通用订单详情组件
 * @description 订单详情信息分组展示，支持充值/提现两种类型
 * 
 * @example
 * ```tsx
 * // 充值订单详情
 * <OrderDetail
 *   type="recharge"
 *   order={rechargeOrder}
 *   onContinuePay={() => window.location.href = order.payUrl}
 *   onCancelOrder={handleCancel}
 *   isCancelling={isCancelling}
 *   onExpire={() => refetch()}
 * />
 * 
 * // 提现订单详情
 * <OrderDetail
 *   type="withdraw"
 *   order={withdrawOrder}
 * />
 * ```
 */
export function OrderDetail({
  type,
  order,
  timeoutMinutes = 30,
  onExpire,
  onContinuePay,
  onCancelOrder,
  isCancelling = false,
  className,
}: OrderDetailProps) {
  const t = useText();
  const { config } = useGlobalConfig();

  // 获取状态配置
  const statusConfig = useMemo(() => {
    if (type === 'recharge') {
      return rechargeStatusConfig[(order as RechargeOrderDetail).status];
    }
    return withdrawStatusConfig[(order as WithdrawOrderDetail).status];
  }, [type, order]);

  // 是否为待支付状态（充值）
  const isPendingPayment = type === 'recharge' && (order as RechargeOrderDetail).status === 'PENDING_PAYMENT';

  // 计算过期时间
  const expireTime = useMemo(() => {
    if (!isPendingPayment) return null;
    const rechargeOrder = order as RechargeOrderDetail;
    if (rechargeOrder.expireAt) {
      return rechargeOrder.expireAt;
    }
    return calculateExpireTime(rechargeOrder.createdAt, timeoutMinutes);
  }, [isPendingPayment, order, timeoutMinutes]);

  // 格式化金额
  const formatAmount = (amount: string | undefined | null) => {
    if (!amount) return '-';
    return formatCurrency(amount, config);
  };

  // 格式化时间
  const formatTime = (time: string | undefined | null) => {
    if (!time) return '-';
    return formatSystemTime(time, config.systemTimezone, 'yyyy-MM-dd HH:mm:ss');
  };

  // 金额差异判断（充值）
  const hasAmountDiff = useMemo((): boolean => {
    if (type !== 'recharge') return false;
    const rechargeOrder = order as RechargeOrderDetail;
    return Boolean(rechargeOrder.actualAmount && rechargeOrder.amount !== rechargeOrder.actualAmount);
  }, [type, order]);

  // 动画变体
  const cardVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* 订单编号卡片 */}
      <m.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0 }}
      >
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-500 mb-1">
                {t('biz.order_no', 'رقم الطلب')}
              </p>
              <p className="font-mono text-neutral-800 break-all">
                {order.orderNo}
              </p>
            </div>
            <CopyButton text={order.orderNo} iconSize="md" />
          </div>
        </Card>
      </m.div>

      {/* 金额信息卡片 */}
      <m.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.08 }}
      >
        <Card className="p-4">
          <InfoItem
            label={t('biz.apply_amount', 'المبلغ المطلوب')}
            value={<span className="font-mono text-lg font-bold text-primary-500">{formatAmount(order.amount)}</span>}
          />
          
          {/* 充值：实际到账 */}
          {type === 'recharge' && (
            <InfoItem
              label={t('biz.actual_amount', 'المبلغ المستلم')}
              value={
                <span className={cn('font-mono', hasAmountDiff && 'text-warning-600 font-semibold')}>
                  {formatAmount((order as RechargeOrderDetail).actualAmount)}
                </span>
              }
              warning={hasAmountDiff}
            />
          )}

          {/* 提现：手续费和实际到账 */}
          {type === 'withdraw' && (
            <>
              <InfoItem
                label={t('biz.fee', 'الرسوم')}
                value={<span className="font-mono">{formatAmount((order as WithdrawOrderDetail).fee)}</span>}
              />
              <InfoItem
                label={t('biz.actual_amount', 'المبلغ المستلم')}
                value={
                  <span className="font-mono text-success font-semibold">
                    {formatAmount((order as WithdrawOrderDetail).actualAmount)}
                  </span>
                }
                highlight
              />
            </>
          )}
        </Card>
      </m.div>

      {/* 状态与通道卡片 */}
      <m.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.16 }}
      >
        <Card className="p-4">
          <InfoItem
            label={t('biz.status', 'الحالة')}
            value={
              <StatusBadge variant={statusConfig.variant} size="md" dot>
                {t(statusConfig.textKey)}
              </StatusBadge>
            }
          />

          {/* 充值：支付通道 */}
          {type === 'recharge' && (order as RechargeOrderDetail).channelName && (
            <InfoItem
              label={t('biz.channel_name', 'قناة الدفع')}
              value={(order as RechargeOrderDetail).channelName}
            />
          )}

          {/* 提现：银行卡信息 */}
          {type === 'withdraw' && (
            <>
              {(order as WithdrawOrderDetail).bankName && (
                <InfoItem
                  label={t('biz.bank_name', 'البنك')}
                  value={(order as WithdrawOrderDetail).bankName}
                />
              )}
              {(order as WithdrawOrderDetail).accountNoMask && (
                <InfoItem
                  label={t('biz.account_no', 'رقم الحساب')}
                  value={<span className="font-mono">{(order as WithdrawOrderDetail).accountNoMask}</span>}
                />
              )}
              {(order as WithdrawOrderDetail).accountName && (
                <InfoItem
                  label={t('biz.account_name', 'صاحب الحساب')}
                  value={(order as WithdrawOrderDetail).accountName}
                />
              )}
            </>
          )}

          {/* 提现：拒绝原因 */}
          {type === 'withdraw' && (order as WithdrawOrderDetail).rejectReason && (
            <InfoItem
              label={t('biz.reject_reason', 'سبب الرفض')}
              value={
                <span className="text-error">
                  {(order as WithdrawOrderDetail).rejectReason}
                </span>
              }
            />
          )}
        </Card>
      </m.div>

      {/* 时间信息卡片 */}
      <m.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.24 }}
      >
        <Card className="p-4">
          <InfoItem
            label={t('biz.create_time', 'تاريخ الإنشاء')}
            value={formatTime(order.createdAt)}
          />

          {/* 待支付倒计时 */}
          {isPendingPayment && expireTime && (
            <div className="py-3 border-b border-neutral-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500">
                  {t('biz.expire_time', 'وقت الانتهاء')}
                </span>
                <Countdown
                  expireAt={expireTime}
                  onExpire={onExpire}
                  variant="badge"
                  showIcon
                />
              </div>
            </div>
          )}

          {/* 充值完成时间 */}
          {type === 'recharge' && (order as RechargeOrderDetail).paidAt && (
            <InfoItem
              label={t('biz.complete_time', 'تاريخ الدفع')}
              value={formatTime((order as RechargeOrderDetail).paidAt)}
            />
          )}

          {/* 提现审核时间 */}
          {type === 'withdraw' && (order as WithdrawOrderDetail).reviewedAt && (
            <InfoItem
              label={t('biz.review_time', 'تاريخ المراجعة')}
              value={formatTime((order as WithdrawOrderDetail).reviewedAt)}
            />
          )}

          {/* 提现完成时间 */}
          {type === 'withdraw' && (order as WithdrawOrderDetail).completedAt && (
            <InfoItem
              label={t('biz.complete_time', 'تاريخ الإكمال')}
              value={formatTime((order as WithdrawOrderDetail).completedAt)}
            />
          )}
        </Card>
      </m.div>

      {/* 操作按钮（仅充值待支付） */}
      {isPendingPayment && (onContinuePay || onCancelOrder) && (
        <m.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.32 }}
          className="flex gap-3 pt-2"
        >
          {onCancelOrder && (
            <Button
              variant="secondary"
              fullWidth
              onClick={onCancelOrder}
              isLoading={isCancelling}
              disabled={isCancelling}
            >
              {t('btn.cancel_order', 'إلغاء الطلب')}
            </Button>
          )}
          {onContinuePay && (
            <Button
              variant="primary"
              fullWidth
              onClick={onContinuePay}
              disabled={isCancelling}
            >
              {t('btn.continue_pay', 'متابعة الدفع')}
            </Button>
          )}
        </m.div>
      )}
    </div>
  );
}
