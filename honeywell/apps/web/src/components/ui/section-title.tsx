/**
 * @file SectionTitle 区块标题组件
 * @description 提取自首页，用于展示带金色渐变分割线的区块标题
 */

'use client';

import { m } from 'motion/react';
import { useText } from '@/hooks/use-text';
import { cn } from '@/lib/utils';

interface SectionTitleProps {
  /** 文案配置 key */
  textKey: string;
  /** 无配置时的默认文案 */
  fallback: string;
  /** 可选的外层 className */
  className?: string;
}

/**
 * 区块标题：左侧文案 + 右侧金色渐变分割线（入场动画）
 */
export function SectionTitle({ textKey, fallback, className }: SectionTitleProps) {
  const t = useText();
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-neutral-400 whitespace-nowrap">
        {t(textKey, fallback)}
      </span>
      <m.div
        className="flex-1 h-[0.5px] origin-left"
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: 'linear-gradient(90deg, rgba(var(--color-gold-rgb), 0.25), transparent 80%)',
        }}
      />
    </div>
  );
}
