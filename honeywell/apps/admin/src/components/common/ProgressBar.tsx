/**
 * @file 页面切换进度条组件
 * @description 页面切换时顶部显示进度条
 */

'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

/**
 * NProgress 配置
 */
NProgress.configure({
  showSpinner: false,
  minimum: 0.1,
  speed: 400,
  trickleSpeed: 200,
});

/**
 * 进度条组件
 * @description 监听路由变化，自动显示/隐藏进度条
 */
export function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 路由变化完成，结束进度条
    NProgress.done();
  }, [pathname, searchParams]);

  return null;
}

/**
 * 开始进度条（在页面跳转前调用）
 */
export function startProgress() {
  NProgress.start();
}

/**
 * 结束进度条
 */
export function stopProgress() {
  NProgress.done();
}

export default ProgressBar;
