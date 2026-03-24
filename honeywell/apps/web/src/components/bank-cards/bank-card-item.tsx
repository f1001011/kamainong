/**
 * @file 银行卡卡片组件
 * @description 精美仿真银行卡展示组件，模拟真实银行卡外观
 * @reference 开发文档/03-前端页面/03.6.1-银行卡列表页.md
 * 
 * 2026高端美学设计要点：
 * - 渐变背景模拟真实银行卡
 * - 圆角 rounded-2xl + 微妙阴影
 * - 银行Logo + 银行名称
 * - 脱敏卡号使用等宽字体 font-mono
 * - 持卡人姓名显示
 * - 删除按钮hover显示
 */

'use client';

import { useState, useCallback } from 'react';
import { m, AnimatePresence } from 'motion/react';
import {
  RiBankCardFill,
  RiDeleteBin6Line,
  RiShieldCheckFill,
} from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useText } from '@/hooks/use-text';
import { SPRINGS } from '@/lib/animation';

/**
 * 银行卡数据类型
 * @description 依据：02.3-前端API接口清单 第7.1节
 */
export interface BankCardItemData {
  /** 银行卡ID */
  id: number;
  /** 银行代码 */
  bankCode: string;
  /** 银行名称 */
  bankName: string;
  /** 脱敏卡号（如：****3456） */
  accountNoMask: string;
  /** 持卡人姓名 */
  accountName: string;
  /** 是否可删除（有进行中提现则不可删除） */
  canDelete?: boolean;
}

/**
 * 银行卡卡片属性
 */
export interface BankCardItemProps {
  /** 银行卡数据 */
  card: BankCardItemData;
  /** 是否显示删除按钮 */
  showDelete?: boolean;
  /** 删除回调 */
  onDelete?: (id: number) => void;
  /** 点击卡片回调 */
  onClick?: (card: BankCardItemData) => void;
  /** 是否正在删除中 */
  isDeleting?: boolean;
  /** 动画延迟索引 */
  animationDelay?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 银行品牌渐变色配置
 * @description 根据银行代码返回对应的渐变色（摩洛哥银行）
 */
const bankGradients: Record<string, string> = {
  // 摩洛哥主要银行的品牌色
  'MAD001': 'from-blue-700 via-blue-600 to-blue-500', // Attijariwafa Bank
  'MAD002': 'from-red-600 via-red-500 to-gold-400', // BMCE Bank of Africa
  'MAD003': 'from-primary-600 via-primary-500 to-primary-400', // Banque Populaire
  'MAD004': 'from-blue-600 via-blue-500 to-blue-400', // CIH Bank
  'MAD005': 'from-red-700 via-red-600 to-rose-500', // Crédit du Maroc
  'MAD006': 'from-indigo-600 via-indigo-500 to-violet-400', // BMCI
  'MAD007': 'from-primary-600 via-primary-500 to-primary-400', // Société Générale Maroc
  'MAD008': 'from-purple-600 via-purple-500 to-fuchsia-400', // Al Barid Bank
  'MAD009': 'from-sky-600 via-sky-500 to-cyan-400', // Crédit Agricole du Maroc
  'MAD010': 'from-amber-600 via-amber-500 to-yellow-400', // Bank Al-Maghrib
  // 默认渐变
  'default': 'from-neutral-700 via-neutral-600 to-neutral-500',
};

/**
 * 获取银行渐变色
 */
function getBankGradient(bankCode: string): string {
  return bankGradients[bankCode] || bankGradients['default'];
}

/**
 * 格式化卡号显示
 * @description 将脱敏卡号格式化为 **** **** **** 3456 格式
 */
function formatCardNumber(accountNoMask: string): string {
  // 如果是简短格式（如 ****3456），转换为完整格式
  const lastFour = accountNoMask.replace(/[*\s]/g, '').slice(-4);
  return `****  ****  ****  ${lastFour}`;
}

/**
 * 银行卡卡片组件
 * @description 精美仿真银行卡展示，hover时显示删除按钮
 * 
 * @example
 * ```tsx
 * <BankCardItem
 *   card={cardData}
 *   showDelete
 *   onDelete={(id) => handleDelete(id)}
 * />
 * ```
 */
export function BankCardItem({
  card,
  showDelete = true,
  onDelete,
  onClick,
  isDeleting = false,
  animationDelay = 0,
  className,
}: BankCardItemProps) {
  const { isAnimationEnabled } = useAnimationConfig();
  const t = useText();
  
  // 控制删除按钮hover显示
  const [isHovered, setIsHovered] = useState(false);

  // 获取银行渐变色
  const gradientClass = getBankGradient(card.bankCode);

  /**
   * 处理删除点击
   */
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (card.canDelete !== false && onDelete) {
      onDelete(card.id);
    }
  }, [card.id, card.canDelete, onDelete]);

  /**
   * 处理卡片点击
   */
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(card);
    }
  }, [card, onClick]);

  return (
    <m.div
      className={cn(
        // 银行卡容器 - 模拟真实银行卡比例
        'relative w-full aspect-[1.586/1] max-w-[360px] cursor-pointer',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      // 动画效果
      {...(isAnimationEnabled && {
        initial: { opacity: 0, y: 20, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -20, scale: 0.95 },
        transition: { ...SPRINGS.gentle, delay: animationDelay * 0.1 },
        whileHover: { scale: 1.02, y: -4 },
        whileTap: { scale: 0.98 },
      })}
    >
      {/* 银行卡主体 */}
      <div
        className={cn(
          // 银行卡样式 - 渐变背景 + 圆角 + 阴影
          'absolute inset-0 rounded-2xl bg-gradient-to-br p-5 overflow-hidden',
          'shadow-soft-lg hover:shadow-glow transition-shadow duration-300',
          gradientClass
        )}
      >
        {/* 装饰性纹理背景 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-white/20" />
          <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute right-1/4 bottom-1/4 w-24 h-24 rounded-full bg-white/5" />
        </div>

        {/* 卡片内容 */}
        <div className="relative h-full flex flex-col justify-between text-white">
          {/* 顶部：银行信息 + 安全图标 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm">
                <RiBankCardFill className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-semibold truncate max-w-[160px]">
                  {card.bankName}
                </div>
                <div className="text-xs text-white/70">
                  {card.bankCode}
                </div>
              </div>
            </div>
            
            {/* 安全标识 */}
            <div className="flex items-center gap-1 text-white/80">
              <RiShieldCheckFill className="w-4 h-4" />
              <span className="text-xs">{t('label.secure')}</span>
            </div>
          </div>

          {/* 中部：卡号（等宽字体） */}
          <div className="py-3">
            <div className="font-mono text-xl md:text-2xl tracking-wider font-medium">
              {formatCardNumber(card.accountNoMask)}
            </div>
          </div>

          {/* 底部：持卡人姓名 */}
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-white/60 uppercase tracking-wide mb-1">
                {t('label.card_holder')}
              </div>
              <div className="text-sm font-medium truncate max-w-[180px]">
                {card.accountName}
              </div>
            </div>
            
            {/* 芯片装饰 */}
            <div className="w-12 h-9 rounded-md bg-gradient-to-br from-gold-300 via-gold-400 to-gold-500 opacity-80" />
          </div>
        </div>

        {/* 删除按钮（hover时显示） */}
        <AnimatePresence>
          {showDelete && isHovered && card.canDelete !== false && (
            <m.button
              type="button"
              className={cn(
                'absolute top-3 right-3 flex items-center justify-center',
                'w-9 h-9 rounded-full bg-error/90 text-white',
                'hover:bg-error-600 transition-colors',
                'shadow-soft-lg backdrop-blur-sm'
              )}
              onClick={handleDelete}
              disabled={isDeleting}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={SPRINGS.snappy}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <RiDeleteBin6Line className="w-4 h-4" />
            </m.button>
          )}
        </AnimatePresence>

        {/* 不可删除提示（hover时显示） */}
        <AnimatePresence>
          {showDelete && isHovered && card.canDelete === false && (
            <m.div
              className={cn(
                'absolute top-3 right-3 px-2 py-1 rounded-md',
                'bg-black/60 text-white/90 text-xs backdrop-blur-sm'
              )}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={SPRINGS.snappy}
            >
              {t('tip.card_in_use')}
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {/* 删除中遮罩 */}
      {isDeleting && (
        <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </m.div>
  );
}

BankCardItem.displayName = 'BankCardItem';
