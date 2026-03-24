/**
 * @file 创建社区帖子页
 * @description 上传提现证明的表单页面，选择已完成的提现订单并上传截图
 * @route /community/create
 *
 * 设计要点：
 * - 选择已完成的提现订单（下拉选择）
 * - 双图上传区：平台截图 + 收据截图
 * - 可选文字评论
 * - 提交按钮
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LazyMotion, domAnimation, m } from 'motion/react';
import {
  RiArrowLeftSLine,
  RiImageAddFill,
  RiCloseLine,
  RiCheckboxCircleFill,
  RiArrowDownSLine,
  RiMoneyDollarCircleFill,
} from '@remixicon/react';
import { toast } from 'sonner';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS } from '@/lib/animation';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

/** 已完成的提现订单 */
interface CompletedWithdraw {
  id: number;
  orderNo: string;
  amount: number;
  completedAt: string;
}

interface CompletedWithdrawsResponse {
  list: CompletedWithdraw[];
}

/**
 * 创建帖子页面
 */
export default function CreatePostPage() {
  const router = useRouter();
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();
  const queryClient = useQueryClient();

  const [selectedOrder, setSelectedOrder] = useState<CompletedWithdraw | null>(null);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [platformImage, setPlatformImage] = useState<File | null>(null);
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [platformPreview, setPlatformPreview] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [content, setContent] = useState('');

  const platformInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  // 获取已完成的提现订单
  const { data: withdrawsData, isLoading: withdrawsLoading } = useQuery<CompletedWithdrawsResponse>({
    queryKey: ['completed-withdraws'],
    queryFn: () => api.get('/community/completed-withdraws'),
  });

  const completedWithdraws = withdrawsData?.list ?? [];

  // 上传单张图片到服务端，返回 URL
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'community');
    const res = await api.request<{ url: string }>('/upload', {
      method: 'POST',
      body: formData as unknown as Record<string, unknown>,
    });
    return res.url;
  };

  // 提交帖子：先上传图片获取URL，再提交JSON
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder || !platformImage || !receiptImage) return;
      const [platformUrl, receiptUrl] = await Promise.all([
        uploadImage(platformImage),
        uploadImage(receiptImage),
      ]);
      return api.post('/community/posts', {
        withdrawOrderId: selectedOrder.id,
        platformImage: platformUrl,
        receiptImage: receiptUrl,
        content: content.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      toast.success(t('community.post_success', 'تم نشر المنشور بنجاح'));
      router.back();
    },
    onError: () => {
      toast.error(t('community.post_error', 'فشل في نشر المنشور، حاول مرة أخرى'));
    },
  });

  /** 处理图片选择 */
  const handleImageSelect = useCallback(
    (type: 'platform' | 'receipt') => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const previewUrl = URL.createObjectURL(file);
      if (type === 'platform') {
        setPlatformImage(file);
        setPlatformPreview(previewUrl);
      } else {
        setReceiptImage(file);
        setReceiptPreview(previewUrl);
      }
    },
    []
  );

  /** 清除图片 */
  const clearImage = (type: 'platform' | 'receipt') => {
    if (type === 'platform') {
      setPlatformImage(null);
      if (platformPreview) URL.revokeObjectURL(platformPreview);
      setPlatformPreview(null);
    } else {
      setReceiptImage(null);
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
      setReceiptPreview(null);
    }
  };

  const canSubmit = selectedOrder && platformImage && receiptImage;

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-gradient-to-b from-primary-50/60 via-white to-neutral-50">
        {/* 顶部导航 */}
        <header className="sticky top-0 z-30">
          <div
            style={{
              background: 'rgba(250,250,248,0.88)',
              backdropFilter: 'blur(20px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
              borderBottom: '1px solid rgba(0,0,0,0.04)',
            }}
          >
            <div className="flex items-center justify-between h-14 px-4">
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 rounded-xl hover:bg-neutral-100/80 active:scale-95 transition-all"
                aria-label={t('btn.back', 'رجوع')}
              >
                <RiArrowLeftSLine className="w-6 h-6 text-neutral-600" />
              </button>
              <h1 className="text-lg font-bold text-neutral-800 tracking-tight">
                {t('community.create_title', 'منشور جديد')}
              </h1>
              <div className="w-10" />
            </div>
          </div>
        </header>

        <div className="px-4 py-5 space-y-5 pb-52">
          {/* 选择提现订单 */}
          <m.div
            initial={isAnimationEnabled ? { opacity: 0, y: 12 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRINGS.gentle}
          >
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              {t('community.select_order', 'اختر طلب السحب')}
            </label>
            <button
              onClick={() => setShowOrderPicker(!showOrderPicker)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-neutral-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-primary-300/60 transition-colors"
            >
              {selectedOrder ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center">
                    <RiMoneyDollarCircleFill className="size-5 text-primary-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-neutral-800">
                      {formatCurrency(selectedOrder.amount, config)}
                    </p>
                    <p className="text-xs text-neutral-400">{selectedOrder.orderNo}</p>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-neutral-400">
                  {t('community.choose_order', 'اختر طلباً مكتملاً')}
                </span>
              )}
              <RiArrowDownSLine className={`size-5 text-neutral-400 transition-transform ${showOrderPicker ? 'rotate-180' : ''}`} />
            </button>

            {/* 订单列表下拉 */}
            {showOrderPicker && (
              <m.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 rounded-xl bg-white border border-neutral-200/60 overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
              >
                {withdrawsLoading ? (
                  <div className="p-4 text-center text-sm text-neutral-400">
                    {t('tip.loading', 'جارٍ التحميل...')}
                  </div>
                ) : completedWithdraws.length === 0 ? (
                  <div className="p-4 text-center text-sm text-neutral-400">
                    {t('community.no_withdraws', 'لا توجد لديك سحوبات مكتملة')}
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto divide-y divide-neutral-50">
                    {completedWithdraws.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderPicker(false);
                        }}
                        className="w-full flex items-center justify-between p-3.5 hover:bg-primary-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <RiCheckboxCircleFill className="size-4 text-primary-500" />
                          <span className="text-sm font-medium text-neutral-700">
                            {formatCurrency(order.amount, config)}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-400">{order.orderNo}</span>
                      </button>
                    ))}
                  </div>
                )}
              </m.div>
            )}
          </m.div>

          {/* 图片上传区 */}
          <m.div
            initial={isAnimationEnabled ? { opacity: 0, y: 12 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRINGS.gentle, delay: 0.1 }}
          >
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              {t('community.upload_screenshots', 'لقطات الشاشة')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* 平台截图 */}
              <ImageUploadArea
                preview={platformPreview}
                label={t('community.platform_screenshot', 'لقطة شاشة المنصة')}
                onSelect={() => platformInputRef.current?.click()}
                onClear={() => clearImage('platform')}
              />
              <input
                ref={platformInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect('platform')}
                className="hidden"
              />

              {/* 收据截图 */}
              <ImageUploadArea
                preview={receiptPreview}
                label={t('community.receipt_screenshot', 'لقطة شاشة الإيصال')}
                onSelect={() => receiptInputRef.current?.click()}
                onClear={() => clearImage('receipt')}
              />
              <input
                ref={receiptInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect('receipt')}
                className="hidden"
              />
            </div>
          </m.div>

          {/* 文字评论 */}
          <m.div
            initial={isAnimationEnabled ? { opacity: 0, y: 12 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRINGS.gentle, delay: 0.2 }}
          >
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              {t('community.comment_optional', 'تعليق (اختياري)')}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('community.comment_placeholder', 'شارك تجربتك...')}
              maxLength={200}
              rows={3}
              className="w-full p-4 rounded-xl bg-white border border-neutral-200/60 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 resize-none transition-all"
            />
            <p className="text-xs text-neutral-400 mt-1 text-right">{content.length}/200</p>
          </m.div>
        </div>

        {/* 底部提交按钮 — z-[60] 在浮岛导航(z-50)之上，底部留出导航高度 */}
        <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px)+68px)] bg-white/90 backdrop-blur-xl border-t border-neutral-100/60 md:pl-60 md:pb-4">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canSubmit}
            isLoading={submitMutation.isPending}
            loadingText={t('tip.submitting', 'جارٍ الإرسال...')}
            onClick={() => submitMutation.mutate()}
          >
            {t('community.submit', 'نشر')}
          </Button>
        </div>
      </div>
    </LazyMotion>
  );
}

/** 图片上传区域组件 */
function ImageUploadArea({
  preview,
  label,
  onSelect,
  onClear,
}: {
  preview: string | null;
  label: string;
  onSelect: () => void;
  onClear: () => void;
}) {
  return (
    <div className="relative">
      {preview ? (
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100">
          <img src={preview} alt={label} className="w-full h-full object-cover" />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
          >
            <RiCloseLine className="size-4 text-white" />
          </button>
          <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm">
            <span className="text-[10px] text-white font-medium">{label}</span>
          </div>
        </div>
      ) : (
        <button
          onClick={onSelect}
          className="aspect-[4/3] w-full rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 flex flex-col items-center justify-center gap-2 hover:border-primary-300 hover:bg-primary-50/30 transition-all"
        >
          <RiImageAddFill className="size-8 text-neutral-300" />
          <span className="text-xs text-neutral-400 text-center px-2 leading-tight">{label}</span>
        </button>
      )}
    </div>
  );
}
