/**
 * @file 认证守卫组件
 * @description 全局兜底认证守卫，覆盖两种场景：
 * 1. 掉登：isAuthenticated 从 true → false 时立即跳转登录页
 * 2. 冷启动无认证：rehydrate 完成后仍无 token 但在受保护页面 → 跳转登录页
 */

'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useUserStore } from '@/stores/user';

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/welcome', '/about'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`));
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, token } = useUserStore();
  const wasAuthenticated = useRef(false);
  const redirecting = useRef(false);
  const rehydrateChecked = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      wasAuthenticated.current = true;
      redirecting.current = false;
      rehydrateChecked.current = true;
      return;
    }

    // 场景 1：掉登（从已认证变为未认证）
    if (wasAuthenticated.current && !isAuthenticated && !token && !redirecting.current) {
      redirecting.current = true;
      const currentPath = window.location.pathname;
      if (!isPublicPath(currentPath)) {
        document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
        const redirectParam = currentPath !== '/' ? `?redirect=${encodeURIComponent(currentPath)}` : '';
        window.location.href = `/login${redirectParam}`;
      }
      return;
    }

    // 场景 2：冷启动无认证（cookie 放行但 rehydrate 后 store 无 token）
    // 延迟检查确保 rehydrate 已完成
    if (!rehydrateChecked.current && !redirecting.current) {
      const timer = setTimeout(() => {
        rehydrateChecked.current = true;
        const currentState = useUserStore.getState();
        if (!currentState.isAuthenticated && !currentState.token) {
          const currentPath = window.location.pathname;
          if (!isPublicPath(currentPath)) {
            redirecting.current = true;
            document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
            const redirectParam = currentPath !== '/' ? `?redirect=${encodeURIComponent(currentPath)}` : '';
            window.location.href = `/login${redirectParam}`;
          }
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, token]);

  return <>{children}</>;
}
