/**
 * @file 提现订单详情页
 * @description 展示单个提现订单的完整信息，包括金额、银行卡快照、状态和拒绝原因
 * @depends 开发文档/03-前端用户端/03.5-提现模块/03.5.3-提现订单详情页.md
 */

'use client';

import { use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { m } from 'motion/react';
import { RiArrowLeftLine, RiErrorWarningLine, RiAlertLine } from '@remixicon/react';
import useSWR from 'swr';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { formatSystemTime } from '@/lib/timezone';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { StatusBadge } from '@/components/business/status-badge';
import type { WithdrawOrderStatus } from '@/components/business/order-card';

/**
 * 页面参数类型
 */
interface PageParams {
  id: string;
}

/**
 * 页面属性类型
 */
interface PageProps {
  params: Promise<PageParams>;
}

/**
 * 提现订单详情数据
 * 依据：02.3-前端API接口清单.md 第6.4节
 */
interface WithdrawOrderDetail {
  id: number;
  orderNo: string;
  amount: string;
  fee: string;
  actualAmount: string;
  bankName: string;
  accountNoMask: string;
  accountName: string;
  status: WithdrawOrderStatus;
  rejectReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  completedAt: string | null;
}

/**
 * 提现状态配置映射
 * 依据：03.5.2-提现记录页.md 第3.5节 - 状态视觉
 * 待审核和处理中均使用 warning 色（橙色）
 */
const withdrawStatusConfig: Record<WithdrawOrderStatus | 'PAYOUT_FAILED', { variant: 'warning' | 'success' | 'error' | 'pending' | 'info'; textKey: string }> = {
  PENDING_REVIEW: { variant: 'warning', textKey: 'status.pending_review' },
  APPROVED: { variant: 'warning', textKey: 'status.approved' },  // 处理中使用 warning 色
  PAYOUT_FAILED: { variant: 'warning', textKey: 'status.approved' },  // 用户端显示为"处理中"
  COMPLETED: { variant: 'success', textKey: 'status.completed' },
  FAILED: { variant: 'error', textKey: 'status.failed' },
  REJECTED: { variant: 'error', textKey: 'status.rejected' },
};

/**
 * 信息项组件
 */
interface InfoItemProps {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
  mono?: boolean;
}

function InfoItem({ label, value, highlight, mono }: InfoItemProps) {
  return (
    <div className="flex justify-between items-start py-3 border-b border-neutral-100 last:border-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className={cn(
        'text-sm text-right',
        highlight && 'text-primary-500 font-semibold',
        mono && 'font-mono',
        !highlight && 'text-neutral-700'
      )}>
        {value}
      </span>
    </div>
  );
}

/**
 * 提现订单详情页面
 */
export default function WithdrawOrderDetailPage({ params }: PageProps) {
  const router = useRouter();
  const t = useText();
  const { config } = useGlobalConfig();

  // 解包 Promise 参数
  const { id } = use(params);
  const orderId = parseInt(id, 10);

  /**
   * 获取订单详情
   */
  const {
    data: order,
    error,
    isLoading,
  } = useSWR<WithdrawOrderDetail>(
    isNaN(orderId) ? null : `/withdraw/orders/${orderId}`,
    (url: string) => api.get<WithdrawOrderDetail>(url),
    {
      revalidateOnFocus: true,
    }
  );

  // 获取状态配置
  const statusConfig = useMemo(() => {
    if (!order) return null;
    return withdrawStatusConfig[order.status];
  }, [order]);

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

  // 动画变体
  const cardVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
  };

  /**
   * 渲染骨架屏
   * 依据：03.5.3-提现订单详情页.md 第7.1节
   */
  const renderSkeleton = () => (
    <div className="space-y-4 px-4 py-4">
      {/* 订单号卡片骨架 */}
      <div className="bg-white rounded-xl shadow-soft p-4">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-5 w-52" />
      </div>

      {/* 金额信息卡片骨架 */}
      <div className="bg-white rounded-xl shadow-soft p-4 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-28" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* 银行卡信息卡片骨架 */}
      <div className="bg-white rounded-xl shadow-soft p-4 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      {/* 状态与时间卡片骨架 */}
      <div className="bg-white rounded-xl shadow-soft p-4 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
    </div>
  );

  /**
   * 渲染错误状态
   */
  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="mb-4 rounded-full p-3 bg-red-50">
        <RiErrorWarningLine className="h-12 w-12 text-error" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-800 mb-2">
        {t('error.order_not_found')}
      </h3>
      <p className="text-sm text-neutral-500 text-center mb-6">
        {t('error.order_not_found_desc')}
      </p>
      <Button
        variant="secondary"
        onClick={() => router.push('/withdraw/records')}
      >
        {t('btn.back_to_list')}
      </Button>
    </div>
  );

  /**
   * 渲染订单详情
   * 依据：03.5.3-提现订单详情页.md 第4.2节 - 页面结构
   */
  const renderOrderDetail = () => {
    if (!order || !statusConfig) return null;

    return (
      <div className="space-y-4 px-4 py-4">
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
                  {t('biz.order_no')}
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
              label={t('biz.apply_amount')}
              value={
                <span className="font-mono text-lg font-bold text-primary-500">
                  {formatAmount(order.amount)}
                </span>
              }
              highlight
            />
            <InfoItem
              label={`${t('biz.fee')} (${config.withdrawFeePercent || 5}%)`}
              value={formatAmount(order.fee)}
              mono
            />
            <InfoItem
              label={t('biz.actual_amount')}
              value={
                <span className="font-mono text-success font-semibold">
                  {formatAmount(order.actualAmount)}
                </span>
              }
            />
          </Card>
        </m.div>

        {/* 银行卡信息卡片（快照） */}
        <m.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.16 }}
        >
          <Card className="p-4">
            <InfoItem
              label={t('label.bank')}
              value={order.bankName}
            />
            <InfoItem
              label={t('label.account_no')}
              value={order.accountNoMask}
              mono
            />
            <InfoItem
              label={t('label.account_name')}
              value={order.accountName}
            />
          </Card>
        </m.div>

        {/* 状态与时间卡片 */}
        <m.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.24 }}
        >
          <Card className="p-4">
            <InfoItem
              label={t('biz.status')}
              value={
                <StatusBadge variant={statusConfig.variant} size="md" dot>
                  {t(statusConfig.textKey)}
                </StatusBadge>
              }
            />
            <InfoItem
              label={t('biz.create_time')}
              value={formatTime(order.createdAt)}
            />
            {order.reviewedAt && (
              <InfoItem
                label={t('biz.review_time')}
                value={formatTime(order.reviewedAt)}
              />
            )}
            {order.completedAt && (
              <InfoItem
                label={t('biz.complete_time')}
                value={formatTime(order.completedAt)}
              />
            )}
          </Card>
        </m.div>

        {/* 拒绝原因卡片（仅已拒绝状态显示） */}
        {order.status === 'REJECTED' && order.rejectReason && (
          <m.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.32 }}
          >
            <Card className="p-4 bg-red-50 border border-red-100">
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <RiAlertLine className="h-5 w-5 text-error" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-error mb-1">
                    {t('biz.reject_reason')}
                  </p>
                  <p className="text-sm text-neutral-700">
                    {order.rejectReason}
                  </p>
                </div>
              </div>
            </Card>
          </m.div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-immersive">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-20 bg-white/65 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/40 shadow-[0_1px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label={t('btn.back')}
          >
            <RiArrowLeftLine className="h-5 w-5 text-neutral-600" />
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-neutral-800">
            {t('page.withdraw_detail')}
          </h1>
          {/* 占位，保持标题居中 */}
          <div className="w-9" />
        </div>
      </header>

      {/* 内容区域 */}
      <main>
        {isLoading ? (
          renderSkeleton()
        ) : error || !order ? (
          renderError()
        ) : (
          renderOrderDetail()
        )}
      </main>
    </div>
  );
}
