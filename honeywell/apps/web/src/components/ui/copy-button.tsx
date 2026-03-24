/**
 * @file 复制按钮组件
 * @description 一键复制文本到剪贴板，支持复制成功状态反馈
 * @depends 开发文档/03-前端用户端/03.4-充值模块/03.4.3-充值订单详情页.md
 * @depends 开发文档/01-设计系统/01.2-动画系统.md
 * 
 * 2026高端美学设计要点：
 * - 精美的图标切换动画（复制图标 → 勾 → 复制图标）
 * - 弹性缩放反馈
 * - 成功状态的颜色过渡
 * - Toast 提示复制成功
 */

'use client';

import { useState, useCallback } from 'react';
import { m, AnimatePresence, LazyMotion, domAnimation } from 'motion/react';
import { RiFileCopyLine, RiCheckboxCircleFill } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { toast } from 'sonner';
import { SPRINGS } from '@/lib/animation/constants';

/**
 * CopyButton 组件属性
 */
export interface CopyButtonProps {
  /** 要复制的文本 */
  text: string;
  /** 自定义类名 */
  className?: string;
  /** 自定义图标尺寸 */
  iconSize?: 'sm' | 'md' | 'lg';
  /** 是否显示文案标签 */
  showLabel?: boolean;
  /** 复制成功回调 */
  onCopySuccess?: () => void;
  /** 复制失败回调 */
  onCopyError?: (error: Error) => void;
  /** 按钮变体 */
  variant?: 'default' | 'ghost' | 'outline';
  /** 是否禁用 Toast 提示 */
  disableToast?: boolean;
}

/**
 * 图标尺寸映射
 */
const iconSizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

/**
 * 按钮变体样式
 */
const variantStyles = {
  default: 'text-neutral-400 hover:text-primary-500 hover:bg-primary-50 active:bg-primary-100',
  ghost: 'text-neutral-400 hover:text-primary-500',
  outline: 'text-neutral-400 hover:text-primary-500 border border-neutral-200 hover:border-primary-300 hover:bg-primary-50',
};

/**
 * CopyButton 复制按钮组件
 * @description 点击后将文本复制到剪贴板，支持精美的动画反馈
 * 
 * @example
 * ```tsx
 * <CopyButton text="RC20260203A1B2C3D4E5" />
 * 
 * // 带标签
 * <CopyButton text={orderNo} showLabel />
 * 
 * // 自定义回调
 * <CopyButton 
 *   text={orderNo} 
 *   onCopySuccess={() => console.log('已复制')} 
 * />
 * 
 * // 轮廓变体
 * <CopyButton text={code} variant="outline" />
 * ```
 */
export function CopyButton({
  text,
  className,
  iconSize = 'md',
  showLabel = false,
  onCopySuccess,
  onCopyError,
  variant = 'default',
  disableToast = false,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();

  /**
   * 处理复制操作
   * 依据：开发文档.md 第12.4节 - 复制功能
   */
  const handleCopy = useCallback(async () => {
    try {
      // 优先使用 Clipboard API
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback: 使用 execCommand
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      // 设置复制成功状态
      setCopied(true);
      
      // Toast 提示
      if (!disableToast) {
        toast.success(t('toast.copy_success', 'تم النسخ بنجاح'));
      }
      
      // 调用成功回调
      onCopySuccess?.();

      // 2秒后重置状态
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('复制失败:', error);
      if (!disableToast) {
        toast.error(t('toast.copy_failed', 'خطأ في النسخ'));
      }
      onCopyError?.(error as Error);
    }
  }, [text, t, onCopySuccess, onCopyError, disableToast]);

  // 图标切换动画变体
  const iconVariants = {
    initial: { scale: 0.5, opacity: 0, rotate: -90 },
    animate: { 
      scale: 1, 
      opacity: 1, 
      rotate: 0,
      transition: SPRINGS.bouncy
    },
    exit: { 
      scale: 0.5, 
      opacity: 0, 
      rotate: 90,
      transition: { duration: 0.15 }
    },
  };

  return (
    <LazyMotion features={domAnimation}>
      <m.button
        type="button"
        onClick={handleCopy}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg p-1.5',
          'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300',
          variantStyles[variant],
          copied && 'text-success hover:text-success',
          className
        )}
        whileHover={isAnimationEnabled ? { scale: 1.05 } : undefined}
        whileTap={isAnimationEnabled ? { scale: 0.9 } : undefined}
        aria-label={copied ? t('status.copied', 'تم النسخ') : t('btn.copy', 'نسخ')}
      >
        {/* 图标切换动画 */}
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <m.span
              key="check"
              variants={isAnimationEnabled ? iconVariants : undefined}
              initial="initial"
              animate="animate"
              exit="exit"
              className="inline-flex"
            >
              <RiCheckboxCircleFill className={cn(iconSizeMap[iconSize], 'text-success')} />
            </m.span>
          ) : (
            <m.span
              key="copy"
              variants={isAnimationEnabled ? iconVariants : undefined}
              initial="initial"
              animate="animate"
              exit="exit"
              className="inline-flex"
            >
              <RiFileCopyLine className={iconSizeMap[iconSize]} />
            </m.span>
          )}
        </AnimatePresence>

        {/* 文案标签 */}
        {showLabel && (
          <AnimatePresence mode="wait" initial={false}>
            <m.span
              key={copied ? 'copied' : 'copy'}
              initial={isAnimationEnabled ? { opacity: 0, y: 5 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={isAnimationEnabled ? { opacity: 0, y: -5 } : undefined}
              transition={{ duration: 0.15 }}
              className="text-xs"
            >
              {copied ? t('status.copied', 'تم النسخ') : t('btn.copy', 'نسخ')}
            </m.span>
          </AnimatePresence>
        )}
      </m.button>
    </LazyMotion>
  );
}
