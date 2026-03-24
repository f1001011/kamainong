/**
 * @file Capacitor 原生平台适配 Provider
 * @description 处理 APK 运行时的原生能力：
 * 1. 外部链接拦截 - WhatsApp/Telegram/电话/邮件等跳转至系统浏览器
 * 2. Android 返回键 - 支持历史回退和最小化
 * 3. 状态栏配置 - 深色主题与品牌配色
 * 4. 开屏动画挂载
 * 5. window.open 拦截 - 确保所有外部弹窗正确处理
 */

'use client';

import { useEffect, type ReactNode } from 'react';
import { isNativeApp } from '@/lib/capacitor';
import { NativeSplashScreen } from '@/components/splash/native-splash-screen';

const INTERNAL_DOMAINS = ['lles-ma.com'];

/**
 * 判断 URL 是否为站外链接
 * 包含：tel: mailto: whatsapp: tg: sms: intent: 以及非本站域名
 */
function isExternalUrl(href: string): boolean {
  if (/^(tel:|mailto:|whatsapp:|tg:|intent:|sms:)/i.test(href)) return true;

  try {
    const url = new URL(href, window.location.origin);
    if (url.origin === window.location.origin) return false;
    return !INTERNAL_DOMAINS.some(
      (d) => url.hostname === d || url.hostname.endsWith('.' + d)
    );
  } catch {
    return false;
  }
}

/**
 * 用 Capacitor Browser 插件在系统浏览器中打开链接
 * @param fallbackOpen 原始 window.open 引用，防止被覆盖后的无限递归
 */
let _originalWindowOpen: typeof window.open | null = null;

async function openExternal(href: string) {
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url: href, windowName: '_system' });
  } catch {
    const safeOpen = _originalWindowOpen ?? window.open;
    safeOpen.call(window, href, '_system');
  }
}

interface CapacitorProviderProps {
  children: ReactNode;
}

export function CapacitorProvider({ children }: CapacitorProviderProps) {
  /**
   * 拦截所有 <a> 标签点击，外部链接用系统浏览器打开
   * 使用 capture 阶段确保优先于其他事件处理器
   */
  useEffect(() => {
    if (!isNativeApp()) return;

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      if (isExternalUrl(href)) {
        e.preventDefault();
        e.stopPropagation();
        openExternal(href);
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  /**
   * 覆盖 window.open，拦截外部弹窗（如客服跳转）
   */
  useEffect(() => {
    if (!isNativeApp()) return;

    const originalOpen = window.open.bind(window);
    _originalWindowOpen = originalOpen;

    window.open = (
      url?: string | URL,
      target?: string,
      features?: string
    ): WindowProxy | null => {
      const href = url?.toString();
      if (href && isExternalUrl(href)) {
        openExternal(href);
        return null;
      }
      return originalOpen(url, target, features);
    };

    return () => {
      window.open = originalOpen;
    };
  }, []);

  /**
   * Android 物理返回键：优先浏览器历史回退，无历史时最小化应用
   */
  useEffect(() => {
    if (!isNativeApp()) return;

    let cleanup: (() => void) | undefined;

    import('@capacitor/app')
      .then(({ App }) => {
        const listener = App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            App.minimizeApp();
          }
        });
        cleanup = () => {
          listener.then((h) => h.remove());
        };
      })
      .catch(() => {});

    return () => cleanup?.();
  }, []);

  /**
   * 状态栏深色主题
   */
  useEffect(() => {
    if (!isNativeApp()) return;

    import('@capacitor/status-bar')
      .then(({ StatusBar, Style }) => {
        StatusBar.setStyle({ style: Style.Dark });
        StatusBar.setBackgroundColor({ color: '#0A1A12' });
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <NativeSplashScreen />
      {children}
    </>
  );
}
