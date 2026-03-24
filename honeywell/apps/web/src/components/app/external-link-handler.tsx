/**
 * @file 站外链接处理组件
 * @description APK 内点击站外链接时用系统浏览器打开
 *
 * 三层分类：
 * 1. 本站 http/https 链接 → 留在 WebView 内导航
 * 2. 外站 http/https 链接（客服页、TG网页版等）→ Browser.open() 系统浏览器
 * 3. 协议链接（tel:、tg://、whatsapp://、mailto:）→ 不拦截，交给 WebView 原生
 *    shouldOverrideUrlLoading → launchIntent 处理，走 Android Intent
 */

'use client';

import { useEffect } from 'react';
import { isNativeApp } from '@/lib/capacitor';

const APP_HOSTS = ['www.lles-ma.com', 'lles-ma.com'];

/**
 * 判断是否为需要用系统浏览器打开的外站 http/https 链接
 * 协议链接（tel/tg/whatsapp/mailto 等）返回 false，交给原生处理
 */
function isExternalHttpUrl(href: string): boolean {
  if (!href || href.startsWith('#') || href.startsWith('javascript:')) return false;
  try {
    const url = new URL(href, window.location.origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    return !APP_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

function openInSystemBrowser(url: string): void {
  import('@capacitor/browser').then(({ Browser }) => {
    Browser.open({ url });
  });
}

export function ExternalLinkHandler() {
  useEffect(() => {
    if (!isNativeApp()) return;

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor?.href) return;
      if (isExternalHttpUrl(anchor.href)) {
        e.preventDefault();
        openInSystemBrowser(anchor.href);
      }
    };

    document.addEventListener('click', handleClick, true);

    const originalOpen = window.open;
    window.open = function open(url?: string | URL, ...rest: unknown[]): Window | null {
      const urlStr = url?.toString();
      if (urlStr && isExternalHttpUrl(urlStr)) {
        openInSystemBrowser(urlStr);
        return null;
      }
      return originalOpen.call(window, url, ...rest) as Window | null;
    };

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.open = originalOpen;
    };
  }, []);

  return null;
}
