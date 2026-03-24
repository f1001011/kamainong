/**
 * @file 银行卡列表页
 * @description 用户银行卡管理页面，展示已绑定的银行卡列表
 * @reference 开发文档/03-前端页面/03.6.1-银行卡列表页.md
 * 
 * 2026高端美学设计要点：
 * - 精美仿真银行卡卡片展示
 * - 添加银行卡按钮（虚线边框 + 加号图标）
 * - 删除确认弹窗（危险操作用红色）
 * - 安全提示信息
 * 
 * API调用：
 * - GET /api/bank-cards - 银行卡列表
 * - DELETE /api/bank-cards/:id - 删除银行卡
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { m, AnimatePresence } from 'motion/react';
import {
  RiArrowLeftSLine,
  RiAddLine,
  RiBankCardFill,
  RiShieldCheckLine,
  RiInformationLine,
} from '@remixicon/react';
import { toast } from 'sonner';

import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { BankCardItem, type BankCardItemData } from '@/components/bank-cards';
import { EmptyState } from '@/components/business/empty-state';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { get, del, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { SPRINGS } from '@/lib/animation';

// ============================================
// 类型定义
// ============================================

/**
 * 银行卡列表响应
 * 依据：02.3-前端API接口清单 第7.1节
 */
interface BankCardsResponse {
  list: BankCardItemData[];
  maxCount: number;
  canAdd: boolean;
}

// ============================================
// 主组件
// ============================================

export default function BankCardsPage() {
  const router = useRouter();
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();

  // === 数据状态 ===
  const [isLoading, setIsLoading] = useState(true);
  const [cards, setCards] = useState<BankCardItemData[]>([]);
  const [maxCount, setMaxCount] = useState(3);
  const [canAdd, setCanAdd] = useState(true);

  // === 删除状态 ===
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<BankCardItemData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ============================================
  // 数据加载
  // ============================================

  /**
   * 加载银行卡列表
   */
  const loadBankCards = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await get<BankCardsResponse>('/bank-cards');
      
      setCards(data.list || []);
      setMaxCount(data.maxCount || 3);
      setCanAdd(data.canAdd !== false);
    } catch (error) {
      console.error('加载银行卡列表失败:', error);
      toast.error(t('error.load_cards_failed'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // 页面加载时获取数据
  useEffect(() => {
    loadBankCards();
  }, [loadBankCards]);

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
   * 跳转到添加银行卡页
   */
  const handleAddCard = useCallback(() => {
    router.push('/bank-cards/add');
  }, [router]);

  /**
   * 打开删除确认弹窗
   */
  const handleDeleteClick = useCallback((id: number) => {
    const card = cards.find(c => c.id === id);
    if (card) {
      setCardToDelete(card);
      setDeleteDialogOpen(true);
    }
  }, [cards]);

  /**
   * 确认删除银行卡
   */
  const handleConfirmDelete = useCallback(async () => {
    if (!cardToDelete) return;

    try {
      setIsDeleting(true);
      
      // 调用删除 API
      await del(`/bank-cards/${cardToDelete.id}`);

      // 成功提示
      toast.success(t('toast.card_deleted'));

      // 关闭弹窗
      setDeleteDialogOpen(false);
      setCardToDelete(null);

      // 刷新列表
      await loadBankCards();
    } catch (error) {
      console.error('删除银行卡失败:', error);

      if (error instanceof ApiError) {
        switch (error.code) {
          case 'BANK_CARD_IN_USE':
            toast.error(t('error.card_in_use'));
            break;
          case 'BANK_CARD_LAST_ONE':
            toast.error(t('error.card_last_one'));
            break;
          default:
            toast.error(error.message || t('error.delete_failed'));
        }
      } else {
        toast.error(t('error.network'));
      }
    } finally {
      setIsDeleting(false);
    }
  }, [cardToDelete, t, loadBankCards]);

  /**
   * 取消删除
   */
  const handleCancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setCardToDelete(null);
  }, []);

  // ============================================
  // 渲染
  // ============================================

  // 加载中骨架屏
  if (isLoading) {
    return <BankCardsPageSkeleton />;
  }

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
          {t('page.bank_cards')}
        </h1>
        
        {/* 占位，保持标题居中 */}
        <div className="w-10" />
      </div>

      {/* 页面内容 */}
      <div className="px-4 py-5">
        <div className="max-w-2xl mx-auto space-y-5">
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
                {t('tip.cards_secure_title')}
              </div>
              <div className="text-xs text-primary-600/80 mt-0.5">
                {t('tip.cards_secure_desc')}
              </div>
            </div>
          </m.div>

          {/* 银行卡数量提示 */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">
              {t('label.bound_cards')}: {cards.length}/{maxCount}
            </span>
            {cards.length >= maxCount && (
              <span className="text-gold-600 flex items-center gap-1">
                <RiInformationLine className="w-4 h-4" />
                {t('tip.max_cards_reached')}
              </span>
            )}
          </div>

          {/* 银行卡列表 */}
          {cards.length > 0 ? (
            <div className="grid gap-4">
              <AnimatePresence mode="popLayout">
                {cards.map((card, index) => (
                  <BankCardItem
                    key={card.id}
                    card={card}
                    showDelete
                    onDelete={handleDeleteClick}
                    animationDelay={index}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            // 空状态 - 依据：03.6.1文案规范
            <EmptyState
              icon={<RiBankCardFill className="w-12 h-12 text-neutral-300" />}
              title={t('empty.no_card')}
              description={t('empty.no_card_desc')}
              actionText={t('btn.add_card')}
              onAction={handleAddCard}
            />
          )}

          {/* 添加银行卡按钮（虚线边框） */}
          {canAdd && cards.length > 0 && cards.length < maxCount && (
            <m.button
              type="button"
              onClick={handleAddCard}
              className={cn(
                'w-full aspect-[1.586/1] max-w-[360px] mx-auto',
                'flex flex-col items-center justify-center gap-3',
                'rounded-2xl border-2 border-dashed border-neutral-200',
                'hover:border-primary-300 hover:bg-primary-50/30',
                'transition-colors cursor-pointer'
              )}
              {...(isAnimationEnabled && {
                initial: { opacity: 0, scale: 0.95 },
                animate: { opacity: 1, scale: 1 },
                transition: SPRINGS.gentle,
                whileHover: { scale: 1.02 },
                whileTap: { scale: 0.98 },
              })}
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-100">
                <RiAddLine className="w-7 h-7 text-neutral-400" />
              </div>
              <div className="text-center">
                <div className="text-base font-medium text-neutral-600">
                  {t('btn.add_new_card')}
                </div>
                <div className="text-sm text-neutral-400 mt-1">
                  {t('tip.add_card_hint')}
                </div>
              </div>
            </m.button>
          )}

          {/* 底部提示 */}
          <div className="pt-4 text-center text-xs text-neutral-400">
            <p>{t('tip.withdraw_bank_note')}</p>
          </div>
        </div>
      </div>

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        type="danger"
        title={t('dialog.delete_card_title')}
        description={
          cardToDelete ? (
            <div className="space-y-2">
              <p>{t('dialog.delete_card_msg')}</p>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-50 text-neutral-600">
                <RiBankCardFill className="w-5 h-5 text-neutral-400" />
                <span className="font-mono">{cardToDelete.accountNoMask}</span>
                <span className="text-neutral-400">|</span>
                <span className="truncate">{cardToDelete.bankName}</span>
              </div>
            </div>
          ) : undefined
        }
        confirmText={t('btn.delete')}
        cancelText={t('btn.cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}

// ============================================
// 骨架屏组件
// ============================================

/**
 * 银行卡列表页骨架屏
 */
function BankCardsPageSkeleton() {
  return (
    <div className="min-h-screen bg-immersive">
      {/* 顶部导航骨架 */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-neutral-100">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="w-32 h-6" />
        <div className="w-10" />
      </div>

      {/* 内容骨架 */}
      <div className="px-4 py-5">
        <div className="max-w-2xl mx-auto space-y-5">
          {/* 安全提示骨架 */}
          <Skeleton className="w-full h-20 rounded-xl" />

          {/* 数量提示骨架 */}
          <div className="flex justify-between">
            <Skeleton className="w-32 h-5" />
          </div>

          {/* 银行卡骨架 */}
          {[1, 2].map((i) => (
            <div key={i} className="w-full aspect-[1.586/1] max-w-[360px] mx-auto">
              <Skeleton className="w-full h-full rounded-2xl" />
            </div>
          ))}

          {/* 添加按钮骨架 */}
          <div className="w-full aspect-[1.586/1] max-w-[360px] mx-auto">
            <Skeleton className="w-full h-full rounded-2xl border-2 border-dashed" />
          </div>
        </div>
      </div>
    </div>
  );
}
