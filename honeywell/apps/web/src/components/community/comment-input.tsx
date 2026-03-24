/**
 * @file 评论输入组件
 * @description 评论输入框 + 发送按钮，支持加载态
 */

'use client';

import { useState, useCallback } from 'react';
import { RiSendPlaneFill } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';

export interface CommentInputProps {
  /** 发送评论回调 */
  onSubmit: (content: string) => void | Promise<void>;
  /** 是否加载中 */
  loading?: boolean;
  /** 自定义样式 */
  className?: string;
}

/**
 * 评论输入组件
 */
export function CommentInput({ onSubmit, loading = false, className }: CommentInputProps) {
  const t = useText();
  const [content, setContent] = useState('');

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || loading) return;
    await onSubmit(trimmed);
    setContent('');
  }, [content, loading, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 bg-white rounded-2xl border border-neutral-100/60',
        'shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
        className,
      )}
    >
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('community.comment_placeholder', 'اكتب تعليقاً...')}
        disabled={loading}
        className={cn(
          'flex-1 h-10 px-3 bg-neutral-50 rounded-xl text-sm text-neutral-700',
          'placeholder:text-neutral-400 outline-none',
          'focus:bg-neutral-100/60 transition-colors',
          'disabled:opacity-50',
        )}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!content.trim() || loading}
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0',
          'bg-primary-500 text-white',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'active:scale-95 transition-all',
        )}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <RiSendPlaneFill className="size-5" />
        )}
      </button>
    </div>
  );
}
