/**
 * @file 充值订单详情页
 * @description 展示单个充值订单的完整信息，支持继续支付和取消订单
 * @depends 开发文档/03-前端用户端/03.4-充值模块/03.4.3-充值订单详情页.md
 */

'use client';

import { useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { RiArrowLeftLine, RiErrorWarningLine } from '@remixicon/react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { OrderDetail, type RechargeOrderDetail } from '@/components/business/order-detail';

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
 * 充值订单详情页面
 */
export default function RechargeOrderDetailPage({ params }: PageProps) {
  const router = useRouter();
  const t = useText();
  const { config } = useGlobalConfig();
  
  // 解包 Promise 参数
  const { id } = use(params);
  const orderId = parseInt(id, 10);

  // 取消弹窗状态
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  /**
   * 获取订单详情
   */
  const {
    data: order,
    error,
    isLoading,
    mutate,
  } = useSWR<RechargeOrderDetail>(
    isNaN(orderId) ? null : `/recharge/orders/${orderId}`,
    (url: string) => api.get<RechargeOrderDetail>(url),
    {
      revalidateOnFocus: true,
    }
  );

  /**
   * 处理倒计时归零（刷新订单状态）
   */
  const handleExpire = useCallback(() => {
    mutate();
  }, [mutate]);

  /**
   * 处理继续支付
   */
  const handleContinuePay = useCallback(() => {
    if (order?.payUrl) {
      // 跳转到支付页面
      window.location.href = order.payUrl;
    } else {
      toast.error(t('error.pay_url_invalid', 'رابط الدفع غير صالح'));
    }
  }, [order?.payUrl, t]);

  /**
   * 处理取消订单（显示确认弹窗）
   */
  const handleCancelClick = useCallback(() => {
    setShowCancelDialog(true);
  }, []);

  /**
   * 确认取消订单
   */
  const handleConfirmCancel = useCallback(async () => {
    if (!order?.id) return;

    setIsCancelling(true);
    try {
      await api.post(`/recharge/orders/${order.id}/cancel`);
      toast.success(t('toast.order_cancelled', 'تم إلغاء الطلب'));
      mutate(); // 刷新订单详情
      setShowCancelDialog(false);
    } catch (err) {
      console.error('取消订单失败:', err);
      toast.error(t('toast.cancel_failed', 'فشل في الإلغاء'));
    } finally {
      setIsCancelling(false);
    }
  }, [order?.id, t, mutate]);

  /**
   * 渲染骨架屏
   */
  const renderSkeleton = () => (
    <div className="space-y-4 px-4 py-4">
      {/* 订单号卡片骨架 */}
      <div className="bg-white rounded-xl shadow-soft p-4">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-5 w-48" />
      </div>

      {/* 金额信息卡片骨架 */}
      <div className="bg-white rounded-xl shadow-soft p-4 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* 状态卡片骨架 */}
      <div className="bg-white rounded-xl shadow-soft p-4 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* 时间卡片骨架 */}
      <div className="bg-white rounded-xl shadow-soft p-4 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>

      {/* 按钮骨架 */}
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 flex-1 rounded-xl" />
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
        {t('error.order_not_found', 'لم يتم العثور على الطلب')}
      </h3>
      <p className="text-sm text-neutral-500 text-center mb-6">
        {t('error.order_not_found_desc', 'الطلب الذي تبحث عنه غير موجود أو تم حذفه')}
      </p>
      <Button
        variant="secondary"
        onClick={() => router.push('/recharge/records')}
      >
        {t('btn.back_to_list', 'العودة إلى القائمة')}
      </Button>
    </div>
  );

  /**
   * 渲染订单详情
   */
  const renderOrderDetail = () => {
    if (!order) return null;

    return (
      <div className="px-4 py-4">
        <OrderDetail
          type="recharge"
          order={order}
          timeoutMinutes={config.rechargeTimeoutMinutes || 30}
          onExpire={handleExpire}
          onContinuePay={order.status === 'PENDING_PAYMENT' && order.payUrl ? handleContinuePay : undefined}
          onCancelOrder={order.status === 'PENDING_PAYMENT' ? handleCancelClick : undefined}
          isCancelling={isCancelling}
        />
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
            aria-label={t('btn.back', 'رجوع')}
          >
            <RiArrowLeftLine className="h-5 w-5 text-neutral-600" />
          </button>
          <h1 className="flex-1 min-w-0 text-center text-lg font-bold tracking-tight text-neutral-800 truncate">
            {t('page.recharge_detail', 'تفاصيل الإيداع')}
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

      {/* 取消确认弹窗 */}
      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        type="warning"
        title={t('dialog.cancel_order_title', 'إلغاء الطلب')}
        description={t('dialog.cancel_order_message', 'هل أنت متأكد من إلغاء هذا الطلب؟')}
        confirmText={t('btn.confirm', 'تأكيد')}
        cancelText={t('btn.cancel', 'إلغاء')}
        onConfirm={handleConfirmCancel}
        isLoading={isCancelling}
      />
    </div>
  );
}
