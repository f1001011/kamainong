/**
 * @file 礼品码兑换页面
 * @description 用户输入礼品码兑换，展示兑换历史
 */

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { m, LazyMotion, domAnimation, MotionConfig, AnimatePresence } from 'motion/react';
import {
  RiGiftFill,
  RiArrowLeftSLine,
  RiCheckboxCircleFill,
  RiTimeLine,
  RiMoneyDollarCircleFill,
} from '@remixicon/react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { formatSystemTime } from '@/lib/timezone';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { listContainerVariants, listItemVariants } from '@/lib/animation/variants';

interface RedeemResponse {
  amount: string;
  giftCodeName: string;
}

interface HistoryItem {
  id: number;
  giftCodeName: string;
  amount: string;
  createdAt: string;
}

interface HistoryResponse {
  list: HistoryItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export default function GiftCodePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useText();
  const { config } = useGlobalConfig();
  const { getSpring, isAnimationEnabled } = useAnimationConfig();

  const [code, setCode] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [redeemResult, setRedeemResult] = useState<RedeemResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['giftCodeHistory'],
    queryFn: () => api.get<HistoryResponse>('/gift-code/history?page=1&pageSize=50'),
    staleTime: 30 * 1000,
  });

  const redeemMutation = useMutation({
    mutationFn: (codeStr: string) =>
      api.post<RedeemResponse>('/gift-code/redeem', { code: codeStr }),
    onSuccess: (data) => {
      setRedeemResult(data);
      setShowSuccess(true);
      setCode('');
      queryClient.invalidateQueries({ queryKey: ['giftCodeHistory'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t('toast.redeem_failed'));
    },
  });

  const handleRedeem = () => {
    const trimmed = code.trim();
    if (!trimmed) {
      toast.error(t('gift_code.enter_code'));
      inputRef.current?.focus();
      return;
    }
    redeemMutation.mutate(trimmed);
  };

  const formatDate = (dateStr: string) => {
    return formatSystemTime(dateStr, config.systemTimezone, 'yyyy-MM-dd HH:mm');
  };

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig
        transition={{ ...getSpring('gentle') }}
        reducedMotion={isAnimationEnabled ? 'never' : 'always'}
      >
        <div className="relative min-h-screen bg-[#fafaf9]">
          {/* 顶部英雄区 */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-dark-800)]/95 via-[var(--color-primary-700)]/85 to-[var(--color-primary-400)]/65" />
            <div className="relative z-10 px-4 pt-4 pb-20 md:pl-60">
              {/* 返回按钮 */}
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center gap-1 text-white/80 hover:text-white mb-4 transition-colors"
              >
                <RiArrowLeftSLine className="w-5 h-5" />
                <span className="text-sm">{t('btn.back')}</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                  <RiGiftFill className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {t('gift_code.title')}
                  </h1>
                  <p className="text-sm text-white/70">
                    {t('gift_code.subtitle')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 兑换表单卡片 */}
          <main className="relative z-10 -mt-10 md:pl-60">
            <m.div
              variants={listContainerVariants}
              initial="hidden"
              animate="visible"
              className="px-4 space-y-4 max-w-3xl mx-auto"
            >
              <m.div variants={listItemVariants}>
                <div className="card-floating p-5 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-600">
                      {t('gift_code.input_label')}
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
                      placeholder={t('gift_code.placeholder')}
                      maxLength={32}
                      className={cn(
                        'w-full h-12 px-4 rounded-xl',
                        'bg-neutral-50 border border-neutral-200',
                        'text-base font-mono tracking-wider text-center',
                        'placeholder:text-neutral-300 placeholder:font-sans placeholder:tracking-normal',
                        'focus:outline-none focus:ring-2 focus:ring-primary-400/40 focus:border-primary-400',
                        'transition-all duration-200'
                      )}
                      autoComplete="off"
                      autoCapitalize="characters"
                    />
                  </div>
                  <Button
                    variant="primary"
                    fullWidth
                    className="h-12 rounded-xl text-base font-semibold"
                    onClick={handleRedeem}
                    disabled={redeemMutation.isPending || !code.trim()}
                  >
                    {redeemMutation.isPending
                      ? t('gift_code.redeeming')
                      : t('gift_code.redeem_btn')
                    }
                  </Button>
                </div>
              </m.div>

              {/* 兑换历史 */}
              <m.div variants={listItemVariants}>
                <div className="card-floating overflow-hidden">
                  <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-neutral-700">
                      {t('gift_code.history_title')}
                    </h3>
                    {historyData?.pagination?.total ? (
                      <span className="text-xs text-neutral-400">
                        {historyData.pagination.total} {t('gift_code.records')}
                      </span>
                    ) : null}
                  </div>

                  {isHistoryLoading ? (
                    <div className="px-5 py-8 text-center">
                      <div className="w-6 h-6 border-2 border-primary-300 border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                  ) : historyData?.list?.length ? (
                    <div className="divide-y divide-neutral-50">
                      {historyData.list.map((item) => (
                        <div key={item.id} className="px-5 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                              <RiGiftFill className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-neutral-700">{item.giftCodeName}</div>
                              <div className="flex items-center gap-1 text-xs text-neutral-400">
                                <RiTimeLine className="w-3 h-3" />
                                {formatDate(item.createdAt)}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm font-bold text-emerald-600">
                            +{formatCurrency(item.amount, config)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-5 py-10 text-center">
                      <RiGiftFill className="w-10 h-10 text-neutral-200 mx-auto mb-2" />
                      <p className="text-sm text-neutral-400">
                        {t('gift_code.no_history')}
                      </p>
                    </div>
                  )}
                </div>
              </m.div>

              <div className="h-20 md:h-4" />
            </m.div>
          </main>
        </div>

        {/* 兑换成功弹窗 */}
        <AnimatePresence>
          {showSuccess && redeemResult && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6"
              onClick={() => setShowSuccess(false)}
            >
              <m.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="bg-white rounded-3xl p-8 w-full max-w-xs text-center shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                  <RiCheckboxCircleFill className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-neutral-800 mb-1">
                  {t('gift_code.success_title')}
                </h3>
                <p className="text-sm text-neutral-500 mb-4">{redeemResult.giftCodeName}</p>
                <div className="flex items-center justify-center gap-1 mb-6">
                  <RiMoneyDollarCircleFill className="w-6 h-6 text-emerald-500" />
                  <span className="text-3xl font-bold text-emerald-600">
                    +{formatCurrency(redeemResult.amount, config)}
                  </span>
                </div>
                <Button
                  variant="primary"
                  fullWidth
                  className="h-11 rounded-xl"
                  onClick={() => setShowSuccess(false)}
                >
                  {t('btn.confirm')}
                </Button>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>
      </MotionConfig>
    </LazyMotion>
  );
}
