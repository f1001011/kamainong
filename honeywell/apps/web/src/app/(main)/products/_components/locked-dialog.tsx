/**
 * @file VIP 锁定提示弹窗
 * @description 点击锁定产品时显示的等级不足提示弹窗
 * @depends 开发文档/03-前端用户端/03.3-产品模块/03.3.1-产品列表页.md
 */

'use client';

import { useRouter } from 'next/navigation';
import { RiLockFill, RiVipCrownFill } from '@remixicon/react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { useText } from '@/hooks/use-text';
import type { ProductData } from '@/components/business/product-card';

/**
 * LockedDialog 组件属性
 */
export interface LockedDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onOpenChange: (open: boolean) => void;
  /** 锁定的产品 */
  product: ProductData | null;
}

/**
 * LockedDialog VIP 锁定提示弹窗
 * @description 依据：03.3.1-产品列表页.md 第6.6节 - 锁定状态交互
 * 
 * @example
 * ```tsx
 * <LockedDialog
 *   open={lockedDialog.open}
 *   onOpenChange={(open) => setLockedDialog({ ...lockedDialog, open })}
 *   product={lockedDialog.product}
 * />
 * ```
 */
export function LockedDialog({
  open,
  onOpenChange,
  product,
}: LockedDialogProps) {
  const t = useText();
  const router = useRouter();

  if (!product) return null;

  const requiredLevel = product.requireVipLevel;

  /**
   * 跳转到产品列表查看可升级的产品
   */
  const handleViewProducts = () => {
    onOpenChange(false);
    // 跳转到 Po 系列产品，因为 Po 系列可以升级 VIP 等级
    router.push('/products?tab=1');
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={t('dialog.vip_required_title')}
    >
      <div className="flex flex-col items-center py-4">
        {/* 图标 */}
        <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
          <RiLockFill className="w-10 h-10 text-neutral-400" />
        </div>

        {/* 提示内容 */}
        <div className="text-center space-y-2 mb-6">
          <p className="text-neutral-600">
            {t('dialog.vip_required_msg')
              .replace('{level}', String(requiredLevel))}
          </p>
          
          {/* VIP 等级展示 */}
          <div className="flex items-center justify-center gap-2 py-3 px-4 bg-gold-50 rounded-xl">
            <RiVipCrownFill className="w-5 h-5 text-gold-500" />
            <span className="text-gold-700 font-semibold">
              {t('dialog.required_level')}: VIP{requiredLevel}
            </span>
          </div>

          <p className="text-sm text-neutral-500">
            {t('dialog.upgrade_tip')}
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col w-full gap-3">
          <Button
            variant="primary"
            onClick={handleViewProducts}
            className="w-full"
          >
            {t('btn.view_products')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            {t('btn.cancel')}
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
