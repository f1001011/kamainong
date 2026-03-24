/**
 * @file 充值页（高端数字钱包版）
 * @description 余额展示条 + 大号选中金额 + 充值后余额预览 + 胶囊芯片 + 品牌通道卡 + CTA含金额 + 信任标识
 * 所有业务逻辑保持不变：通道加载、金额校验、创建订单、跳转支付
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  RiArrowRightSLine,
  RiHistoryFill,
  RiWallet3Fill,
  RiShieldCheckLine,
} from '@remixicon/react';
import { toast } from 'sonner';
import { m } from 'motion/react';

import { Button } from '@/components/ui/button';
import { TipsCard } from '@/components/ui/tips-card';
import { AmountSelector } from '@/components/ui/amount-selector';
import { ChannelSelector, type PayChannel } from '@/components/recharge';
import { Skeleton } from '@/components/ui/skeleton';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useUserStore } from '@/stores/user';
import { get, post, ApiError } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { SPRINGS } from '@/lib/animation';
import { cn } from '@/lib/utils';

interface RechargeChannelsResponse {
  channels: PayChannel[];
  presets: number[];
  minAmount: string;
  maxAmount: string;
  tips: string;
}

interface CreateRechargeRequest {
  amount: string;
  channelId?: number;
  [key: string]: unknown;
}

interface CreateRechargeResponse {
  orderId: number;
  orderNo: string;
  amount: string;
  payUrl: string;
  expireAt: string;
}

export default function RechargePage() {
  const router = useRouter();
  const t = useText();
  const { config } = useGlobalConfig();
  const { user } = useUserStore();

  const [isLoading, setIsLoading] = useState(true);
  const [channels, setChannels] = useState<PayChannel[]>([]);
  const [presets, setPresets] = useState<number[]>([]);
  const [minAmount, setMinAmount] = useState(10);
  const [maxAmount, setMaxAmount] = useState(50000);
  const [tips, setTips] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentBalance = user?.availableBalance ? parseFloat(user.availableBalance) : 0;

  const loadChannels = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await get<RechargeChannelsResponse>('/recharge/channels');
      setChannels(data.channels);
      setPresets(data.presets);
      setMinAmount(parseFloat(data.minAmount));
      setMaxAmount(parseFloat(data.maxAmount));
      setTips(data.tips || '');
      if (data.channels.length === 1) {
        setSelectedChannel(data.channels[0].id);
      }
    } catch (error) {
      console.error('加载充值通道失败:', error);
      toast.error(t('toast.network_error', 'خطأ في الاتصال'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => { loadChannels(); }, [loadChannels]);

  const finalAmount = useMemo(() => {
    if (selectedAmount !== null) return selectedAmount;
    if (customAmount) { const a = parseFloat(customAmount); return isNaN(a) ? null : a; }
    return null;
  }, [selectedAmount, customAmount]);

  const isAmountValid = useMemo(() => {
    if (finalAmount === null) return false;
    return finalAmount >= minAmount && finalAmount <= maxAmount;
  }, [finalAmount, minAmount, maxAmount]);

  const amountError = useMemo(() => {
    if (finalAmount === null) return undefined;
    if (selectedAmount !== null) return undefined;
    if (finalAmount < minAmount || finalAmount > maxAmount) {
      const minFormatted = formatCurrency(minAmount, config, { decimals: 0 });
      const maxFormatted = formatCurrency(maxAmount, config, { decimals: 0 });
      const errorTemplate = t('error.amount_out_of_range', 'يجب أن يكون المبلغ بين {min} و {max}');
      return errorTemplate.replace('{min}', minFormatted).replace('{max}', maxFormatted);
    }
    return undefined;
  }, [finalAmount, selectedAmount, minAmount, maxAmount, t, config]);

  const canSubmit = useMemo(() => {
    if (!isAmountValid) return false;
    if (channels.length > 1 && selectedChannel === null) return false;
    return true;
  }, [isAmountValid, channels.length, selectedChannel]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || finalAmount === null) return;
    if (channels.length > 1 && selectedChannel === null) {
      toast.error(t('error.select_channel', 'يرجى اختيار قناة الدفع'));
      return;
    }
    try {
      setIsSubmitting(true);
      const requestBody: CreateRechargeRequest = { amount: finalAmount.toFixed(2) };
      if (channels.length > 1 && selectedChannel !== null) {
        requestBody.channelId = selectedChannel;
      } else if (channels.length === 1) {
        requestBody.channelId = channels[0].id;
      }
      const result = await post<CreateRechargeResponse>('/recharge/create', requestBody);
      if (result.payUrl) { window.location.href = result.payUrl; }
    } catch (error) {
      console.error('创建充值订单失败:', error);
      if (error instanceof ApiError) {
        if (error.code === 'PENDING_ORDER_LIMIT') {
          toast.error(t('error.pending_order_limit', 'لديك طلبات معلقة كثيرة'), {
            action: { label: t('btn.view_record', 'عرض السجل'), onClick: () => router.push('/recharge/records') },
          });
          return;
        }
        toast.error(t(error.code, error.message));
      } else {
        toast.error(t('toast.network_error', 'خطأ في الاتصال'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, finalAmount, channels, selectedChannel, t, router]);

  const handleViewRecords = useCallback(() => { router.push('/recharge/records'); }, [router]);

  // 充值后新余额预览
  const newBalance = finalAmount && isAmountValid ? currentBalance + finalAmount : null;

  if (isLoading) return <RechargePageSkeleton />;

  return (
    <div className="min-h-screen bg-neutral-50 py-5 space-y-4 px-4">

      {/* 余额展示条 */}
      <div className="flex items-center justify-between rounded-xl px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 shadow-[0_4px_16px_rgba(var(--color-primary-rgb),0.2)]">
        <div className="flex items-center gap-2.5">
          <RiWallet3Fill className="w-5 h-5 text-white/70" />
          <span className="text-sm text-white/70 font-medium">
            {t('home.availableBalance', 'الرصيد المتاح')}
          </span>
        </div>
        <span className="text-lg font-bold font-mono text-white">
          {formatCurrency(currentBalance, config)}
        </span>
      </div>

      {/* 页面标题 */}
      <h1 className="text-xl font-bold text-neutral-800 tracking-tight">
        {t('page.recharge', 'إيداع')}
      </h1>

      {/* 金额选择卡片 */}
      <div className="rounded-2xl bg-white border border-neutral-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-5 space-y-5">

        {/* 大号选中金额展示 */}
        <div className="text-center py-2">
          <p className={cn(
            'text-4xl font-bold font-mono transition-colors duration-200',
            finalAmount && isAmountValid ? 'text-neutral-800' : 'text-neutral-200',
          )}>
            {finalAmount ? formatCurrency(finalAmount, config) : formatCurrency(0, config)}
          </p>
          {/* 充值后新余额预览 */}
          {newBalance !== null && (
            <m.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-primary-600 font-medium mt-1.5"
            >
              {t('recharge.new_balance', 'الرصيد الجديد')}: {formatCurrency(newBalance, config)}
            </m.p>
          )}
        </div>

        {/* 金额选择器 */}
        <AmountSelector
          type="recharge"
          presets={presets}
          minAmount={minAmount}
          maxAmount={maxAmount}
          value={selectedAmount}
          onChange={setSelectedAmount}
          customValue={customAmount}
          onCustomChange={setCustomAmount}
          error={amountError}
        />
      </div>

      {/* 支付通道选择 */}
      {channels.length > 1 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-neutral-400 tracking-widest uppercase whitespace-nowrap">
              {t('label.select_channel', 'قناة الدفع')}
            </span>
            <div className="flex-1 h-px bg-neutral-100" />
          </div>
          <ChannelSelector channels={channels} value={selectedChannel} onChange={setSelectedChannel} />
        </div>
      )}

      {/* 提交按钮 — 含金额 */}
      <Button
        variant="gradient"
        size="lg"
        fullWidth
        className="h-14 rounded-xl text-base font-bold tracking-wide shadow-[0_4px_20px_rgba(var(--color-primary-rgb),0.25)]"
        disabled={!canSubmit}
        isLoading={isSubmitting}
        loadingText={t('btn.processing', 'جارٍ المعالجة...')}
        onClick={handleSubmit}
      >
        {t('btn.recharge', 'إيداع')} {finalAmount && isAmountValid ? formatCurrency(finalAmount, config, { decimals: 0 }) : ''}
      </Button>

      {/* 信任标识 */}
      <div className="flex items-center justify-center gap-2">
        <RiShieldCheckLine className="w-4 h-4 text-neutral-300" />
        <span className="text-xs text-neutral-400">
          {t('recharge.secure', 'دفع آمن')} · {t('recharge.processing_time', 'المعالجة ~5 دقائق')}
        </span>
      </div>

      {/* 充值记录入口 */}
      <m.button
        type="button"
        onClick={handleViewRecords}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-white border border-neutral-100/80 hover:bg-neutral-50/80 transition-all duration-200"
        whileTap={{ scale: 0.98 }}
        transition={SPRINGS.snappy}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
            <RiHistoryFill className="w-4 h-4 text-neutral-400" />
          </div>
          <span className="text-sm text-neutral-500 font-semibold">
            {t('btn.view_recharge_history', 'عرض سجل الإيداعات')}
          </span>
        </div>
        <RiArrowRightSLine className="w-5 h-5 text-neutral-300" />
      </m.button>

      {/* 提示卡片 */}
      {tips && <TipsCard htmlContent={tips} />}
    </div>
  );
}

function RechargePageSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50 py-5 space-y-4 px-4">
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-6 w-24" />
      <div className="rounded-2xl bg-white border border-neutral-100/80 p-5 space-y-4">
        <div className="flex flex-col items-center gap-2 py-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-24 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
      <Skeleton className="h-14 w-full rounded-xl" />
    </div>
  );
}
