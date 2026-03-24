/**
 * @file 返回按钮处理 Hook
 * @description 处理 WebView 中的物理返回按钮
 * @reference 开发文档/03.0-前端架构.md
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 返回处理器类型
 */
type BackHandler = () => boolean;

/**
 * 返回按钮处理 Hook
 * @description 在 WebView 中拦截物理返回按钮，支持自定义处理逻辑
 * 
 * @param handler - 自定义返回处理函数，返回 true 表示已处理，返回 false 执行默认行为
 * 
 * @example
 * ```tsx
 * // 在弹窗组件中使用
 * function Modal({ isOpen, onClose }) {
 *   useBackHandler(() => {
 *     if (isOpen) {
 *       onClose();
 *       return true; // 阻止默认返回行为
 *     }
 *     return false; // 执行默认返回
 *   });
 *   
 *   return <div>...</div>;
 * }
 * ```
 */
export function useBackHandler(handler?: BackHandler): void {
  const router = useRouter();
  const handlerRef = useRef(handler);
  
  // 更新 handler 引用
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  /**
   * 处理返回事件
   */
  const handleBack = useCallback(() => {
    // 如果有自定义处理器且返回 true，则不执行默认行为
    if (handlerRef.current && handlerRef.current()) {
      return;
    }

    // 默认行为：浏览器后退
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    }
  }, [router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 监听 Android WebView 返回事件
    const win = window as Window & {
      onAndroidBack?: () => void;
    };
    win.onAndroidBack = handleBack;

    // 监听 popstate 事件（浏览器返回）
    const handlePopState = () => {
      if (handlerRef.current) {
        handlerRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      win.onAndroidBack = undefined;
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handleBack]);
}

/**
 * 确认退出 Hook
 * @description 在用户尝试退出时弹出确认对话框
 * 
 * @param shouldConfirm - 是否需要确认
 * @param message - 确认消息
 * 
 * @example
 * ```tsx
 * // 在表单页面使用
 * function FormPage() {
 *   const { isDirty } = useFormState();
 *   useExitConfirm(isDirty, '您有未保存的更改，确定要离开吗？');
 *   
 *   return <form>...</form>;
 * }
 * ```
 */
export function useExitConfirm(shouldConfirm: boolean, message: string = 'هل أنت متأكد أنك تريد المغادرة؟'): void {
  useEffect(() => {
    if (!shouldConfirm) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [shouldConfirm, message]);

  useBackHandler(() => {
    if (shouldConfirm) {
      return !window.confirm(message);
    }
    return false;
  });
}
