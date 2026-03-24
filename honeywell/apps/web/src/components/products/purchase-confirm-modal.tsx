/**
 * @file 购买确认弹窗组件
 * @description 产品详情页 - 购买前确认弹窗，展示产品信息、余额变化
 * @depends 开发文档/03-前端/03.3-页面/03.3.2-产品详情页.md
 * @depends 开发文档/01-设计系统/01.3-组件规范.md - ResponsiveModal规范
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { m, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  RiShoppingCartLine,
  RiWalletLine,
  RiArrowDownLine,
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiVipCrownFill,
  RiLockLine,
  RiLoader4Line,
} from '@remixicon/react';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { post, get } from '@/lib/api';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useUserStore } from '@/stores/user';
import { useConfetti } from '@/components/effects/confetti';
import { useCoinFly } from '@/components/effects/coin-fly';
import { SuccessRewardModal } from '@/components/effects/success-reward-modal';
import { SPRINGS } from '@/lib/animation';
import type { Product, User } from '@/types';

/**
 * 购买确认弹窗属性
 */
export interface PurchaseConfirmModalProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onOpenChange: (open: boolean) => void;
  /** 产品数据 */
  product: Product;
  /** 购买成功回调 */
  onPurchaseSuccess?: () => void;
}

/**
 * 购买确认弹窗
 * @description 毛玻璃背景弹窗，显示产品名、价格、扣款后余额
 * 依据：03.3.2-产品详情页.md - 购买确认弹窗
 */
export function PurchaseConfirmModal({
  open,
  onOpenChange,
  product,
  onPurchaseSuccess,
}: PurchaseConfirmModalProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();
  const { user, updateBalance, setUser } = useUserStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  // 购买状态
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  // 购买成功奖励弹窗状态
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 庆祝动画 - 依据：01.2-动画系统.md 特效动画
  const { triggerConfetti, triggerBurst } = useConfetti();
  const { triggerCoinFly, CoinFlyPortal } = useCoinFly({
    targetSelector: '[data-balance-display]',
    count: 8,
  });
  
  // 按钮引用，用于金币飞出起点
  const buyButtonRef = useRef<HTMLButtonElement>(null);

  // 计算余额变化
  const currentBalance = user?.availableBalance ? parseFloat(user.availableBalance) : 0;
  const productPrice = parseFloat(product.price);
  const balanceAfter = currentBalance - productPrice;
  const isBalanceSufficient = balanceAfter >= 0;

  // 依据：核心开发规范.md - 使用 type 字段判断产品类型
  const isTrialProduct = product.type === 'TRIAL';

  // 检查VIP等级要求 - 依据：02.3-前端API接口清单.md 使用 requireVipLevel
  const userVipLevel = user?.vipLevel || 0;
  const requiredVipLevel = product.requireVipLevel ?? product.requiredVipLevel ?? 0;
  const isVipLevelMet = userVipLevel >= requiredVipLevel;

  // 获取产品图片 - 优先使用 mainImage，兼容旧字段 image
  const productImage = product.mainImage || product.image;

  // 格式化金额
  const formattedPrice = formatCurrency(productPrice, config);
  const formattedCurrentBalance = formatCurrency(currentBalance, config);
  const formattedBalanceAfter = formatCurrency(balanceAfter, config);

  /**
   * 执行购买
   * @description 依据：02.3-前端API接口清单.md - POST /api/products/:id/purchase
   */
  const handlePurchase = useCallback(async () => {
    if (!isBalanceSufficient || !isVipLevelMet) return;

    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      // 调用购买API
      const response = await post<{
        positionOrderId: number;
        orderNo: string;
        balanceAfter: string;
      }>(`/products/${product.id}/purchase`);

      // 更新用户余额（立即反映在UI上）
      updateBalance(response.balanceAfter);

      // ========================================
      // 关键：购买后刷新所有相关缓存
      // 购买会改变：余额、VIP等级、购买状态、产品可购买状态
      // 必须同时刷新 React Query 缓存和 Zustand Store
      // ========================================

      // 1. 重新获取用户信息并更新 Zustand Store（包括 VIP 等级等）
      try {
        const freshUser = await get<User>('/user/profile');
        setUser(freshUser);
      } catch {
        // 静默失败，不影响购买成功流程
      }

      // 2. 失效所有用户相关的 React Query 缓存
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });

      // 3. 失效产品相关缓存（购买状态、VIP锁定状态可能已改变）
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-config'] });

      // 4. 失效活动和签到相关缓存（VIP等级变化影响签到奖励和活动资格）
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['signinStatus'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });

      // 5. 失效首页配置缓存（推荐产品可能变化）
      queryClient.invalidateQueries({ queryKey: ['homeConfig'] });

      // 关闭确认弹窗
      onOpenChange(false);

      // ========================================
      // 购买成功 - 展示精美庆祝弹窗
      // 依据：01.2-动画系统.md 购买成功庆祝
      // ========================================
      if (isAnimationEnabled) {
        // 金币飞入动画 - 从按钮飞向余额区域
        if (buyButtonRef.current) {
          triggerCoinFly(buyButtonRef.current);
        }

        // 短暂延迟后展示成功弹窗（等金币飞完）
        setTimeout(() => {
          setShowSuccessModal(true);
        }, 800);
      } else {
        // 动画禁用 → 直接 toast + 跳转
        toast.success(t('purchase.success'), {
          description: t('purchase.success_desc'),
            icon: <RiCheckboxCircleFill className="h-5 w-5 text-primary-500" />,
        });
        router.push('/positions');
      }

      // 调用成功回调
      onPurchaseSuccess?.();

    } catch (error: unknown) {
      // 处理错误 - 依据：02.3-前端API接口清单.md 错误码
      const err = error as { code?: string; message?: string };
      let errorMessage = t('error.unknown');

      switch (err.code) {
        case 'INSUFFICIENT_BALANCE':
          errorMessage = t('error.insufficient_balance');
          break;
        case 'ALREADY_PURCHASED':
          errorMessage = t('error.already_purchased');
          break;
        case 'VIP_LEVEL_REQUIRED':
          errorMessage = t('error.vip_required');
          break;
        default:
          errorMessage = err.message || errorMessage;
      }

      setPurchaseError(errorMessage);
      toast.error(t('purchase.failed'), {
        description: errorMessage,
        icon: <RiCloseCircleFill className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setIsPurchasing(false);
    }
  }, [
    product.id,
    isBalanceSufficient,
    isVipLevelMet,
    isAnimationEnabled,
    updateBalance,
    setUser,
    queryClient,
    onOpenChange,
    onPurchaseSuccess,
    router,
    triggerConfetti,
    triggerBurst,
    triggerCoinFly,
    t,
  ]);

  return (
    <>
      <ResponsiveModal open={open} onOpenChange={onOpenChange}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="flex items-center gap-2">
            <RiShoppingCartLine className="h-5 w-5 text-primary-500" />
            {t('purchase.confirm_title')}
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            {t('purchase.confirm_desc')}
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        {/* 弹窗内容 */}
        <div className="space-y-4 py-4">
          {/* 产品信息卡片 */}
          <m.div
            className="flex items-center gap-4 rounded-xl bg-neutral-50 p-4"
            initial={isAnimationEnabled ? { opacity: 0, y: 10 } : undefined}
            animate={isAnimationEnabled ? { opacity: 1, y: 0 } : undefined}
          >
            {/* 产品图片 */}
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
              {productImage ? (
                <img
                  src={productImage}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                  <span className="text-lg font-bold text-primary-300">
                    {product.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* 产品名称和价格 */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground truncate">
                {product.name}
              </h4>
              <p className="text-xl font-bold text-primary-500 tabular-nums">
                {formattedPrice}
              </p>
            </div>

            {/* 体验标签 */}
            {isTrialProduct && (
              <span className="shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-600">
                {t('tag.trial')}
              </span>
            )}
          </m.div>

          {/* 余额变化展示 */}
          <m.div
            className="rounded-xl bg-white p-4 shadow-soft"
            initial={isAnimationEnabled ? { opacity: 0, y: 10 } : undefined}
            animate={isAnimationEnabled ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.1 }}
          >
            <div className="space-y-3">
              {/* 当前余额 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <RiWalletLine className="h-4 w-4" />
                  {t('balance.current')}
                </div>
                <span className="font-medium text-foreground tabular-nums">
                  {formattedCurrentBalance}
                </span>
              </div>

              {/* 扣款金额 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <RiArrowDownLine className="h-4 w-4" />
                  {t('balance.deduct')}
                </div>
                <span className="font-medium text-red-500 tabular-nums">
                  -{formattedPrice}
                </span>
              </div>

              {/* 分割线 */}
              <div className="border-t border-dashed border-neutral-200" />

              {/* 扣款后余额 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {t('balance.after')}
                </div>
                <span
                  className={cn(
                    'text-lg font-bold tabular-nums',
                    isBalanceSufficient ? 'text-primary-600' : 'text-red-500'
                  )}
                >
                  {formattedBalanceAfter}
                </span>
              </div>
            </div>
          </m.div>

          {/* 错误/警告提示 */}
          <AnimatePresence>
            {!isBalanceSufficient && (
              <m.div
                className="flex items-center gap-3 rounded-xl bg-red-50 p-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <RiCloseCircleFill className="h-5 w-5 shrink-0 text-red-500" />
                <p className="text-sm text-red-600">
                  {t('error.insufficient_balance')}
                </p>
              </m.div>
            )}

            {!isVipLevelMet && (
              <m.div
                className="flex items-center gap-3 rounded-xl bg-gold-50 p-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <RiLockLine className="h-5 w-5 shrink-0 text-gold-500" />
                <div className="text-sm">
                  <p className="font-medium text-gold-600">
                    {t('error.vip_required')}
                  </p>
                  <p className="text-gold-500 mt-0.5">
                    {t('error.vip_required_desc')} {requiredVipLevel}
                    {' '}{t('common.or_above')}
                  </p>
                </div>
              </m.div>
            )}

            {purchaseError && (
              <m.div
                className="flex items-center gap-3 rounded-xl bg-red-50 p-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <RiCloseCircleFill className="h-5 w-5 shrink-0 text-red-500" />
                <p className="text-sm text-red-600">{purchaseError}</p>
              </m.div>
            )}
          </AnimatePresence>
        </div>

        {/* 底部按钮 */}
        <ResponsiveModalFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isPurchasing}
            className="flex-1"
          >
            {t('btn.cancel')}
          </Button>
          <Button
            ref={buyButtonRef}
            onClick={handlePurchase}
            disabled={isPurchasing || !isBalanceSufficient || !isVipLevelMet}
            className={cn(
              'flex-1',
              // 依据：03.3.2-产品详情页.md 购买按钮 shadow-glow
              'h-12 bg-primary-500 shadow-glow hover:bg-primary-600'
            )}
          >
            {isPurchasing ? (
              <span className="flex items-center gap-2">
                <RiLoader4Line className="h-4 w-4 animate-spin" />
                {t('btn.purchasing')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <RiShoppingCartLine className="h-4 w-4" />
                {t('btn.confirm_purchase')}
              </span>
            )}
          </Button>
        </ResponsiveModalFooter>
      </ResponsiveModal>

      {/* 金币飞入动画 Portal */}
      <CoinFlyPortal />

      {/* 购买成功精美庆祝弹窗 */}
      {/* 购买成功精美庆祝弹窗 - 不传 amount，购买是花钱不是收奖励 */}
      <SuccessRewardModal
        open={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.push('/positions');
        }}
        scene="purchase"
        title={t('purchase.success')}
        subtitle={t('purchase.success_desc')}
        checkmarkTheme="primary"
        showConfetti
        showSparkles
        onPrimaryAction={() => {
          setShowSuccessModal(false);
          router.push('/positions');
        }}
        onSecondaryAction={() => {
          setShowSuccessModal(false);
          router.push('/products');
        }}
      />
    </>
  );
}
