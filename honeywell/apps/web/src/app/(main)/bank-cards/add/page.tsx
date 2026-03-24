/**
 * @file 添加银行卡页
 * @description 用户添加新银行卡的表单页面
 * @reference 开发文档/03-前端页面/03.6.2-添加编辑银行卡页.md
 * 
 * 2026高端美学设计要点：
 * - 简洁专业的表单布局
 * - 银行选择器支持搜索
 * - 实时表单校验
 * - 安全提示信息
 * 
 * API调用：
 * - GET /api/banks - 获取银行列表
 * - POST /api/bank-cards - 添加银行卡
 */

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { m } from 'motion/react';
import {
  RiArrowLeftSLine,
  RiShieldCheckLine,
  RiLockLine,
} from '@remixicon/react';

import { Card } from '@/components/ui/card';
import { BankCardForm } from '@/components/bank-cards';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { cn } from '@/lib/utils';
import { SPRINGS } from '@/lib/animation';

// ============================================
// 主组件
// ============================================

export default function AddBankCardPage() {
  const router = useRouter();
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();

  // ============================================
  // 事件处理
  // ============================================

  /**
   * 返回上一页
   */
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  /**
   * 添加成功回调
   * @description 依据：03.6.2-添加编辑银行卡页.md - 绑卡成功后跳转提现页
   */
  const handleSuccess = useCallback(() => {
    router.push('/withdraw');
  }, [router]);

  /**
   * 取消回调
   */
  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  // ============================================
  // 渲染
  // ============================================

  return (
    <div className="min-h-screen bg-immersive">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-10 h-14 flex items-center justify-between px-4 bg-white/65 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/40 shadow-[0_1px_12px_rgba(0,0,0,0.03)]">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-neutral-100 transition-colors"
        >
          <RiArrowLeftSLine className="w-6 h-6 text-neutral-600" />
        </button>
        
        <h1 className="text-lg font-bold tracking-tight text-neutral-700">
          {t('page.add_bank_card')}
        </h1>
        
        {/* 占位，保持标题居中 */}
        <div className="w-10" />
      </div>

      {/* 页面内容 */}
      <div className="px-4 py-5">
        <div className="max-w-lg mx-auto space-y-5">
          {/* 安全提示卡片 */}
          <m.div
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl',
              'bg-primary-50/50 border border-primary-100'
            )}
            {...(isAnimationEnabled && {
              initial: { opacity: 0, y: -10 },
              animate: { opacity: 1, y: 0 },
              transition: SPRINGS.gentle,
            })}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 flex-shrink-0">
              <RiShieldCheckLine className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-primary-700">
                {t('tip.add_card_secure')}
              </div>
              <div className="text-xs text-primary-600/80 mt-0.5">
                {t('tip.add_card_secure_desc')}
              </div>
            </div>
          </m.div>

          {/* 表单卡片 */}
          <Card padding="lg" className="bg-white/75 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-2xl">
            <BankCardForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </Card>

          {/* 底部安全提示 */}
          <m.div
            className="flex items-center justify-center gap-2 text-xs text-neutral-400"
            {...(isAnimationEnabled && {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              transition: { ...SPRINGS.gentle, delay: 0.2 },
            })}
          >
            <RiLockLine className="w-4 h-4" />
            <span>{t('tip.data_encrypted')}</span>
          </m.div>
        </div>
      </div>
    </div>
  );
}
