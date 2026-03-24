/**
 * @file 认证 Hook
 * @description 提供认证相关的功能
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/admin';

/**
 * 认证 Hook
 * @description 检查认证状态，未认证时重定向到登录页
 */
export function useAuth() {
  const router = useRouter();
  const { token, admin, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    // 检查认证状态
    if (!token || !admin) {
      router.push('/login');
    }
  }, [token, admin, router]);

  return {
    isAuthenticated,
    admin,
    logout,
  };
}

/**
 * 要求认证 Hook
 * @description 用于需要认证的页面
 */
export function useRequireAuth() {
  const { isAuthenticated, admin } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  return { admin, isAuthenticated };
}

export default useAuth;
