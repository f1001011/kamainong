/**
 * @file 认证页面布局
 * @description 登录等认证页面的布局，已登录用户自动重定向到仪表盘
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';
import { useAuthStore } from '@/stores/admin';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [checking, setChecking] = useState(true);

  /**
   * 检查登录状态，已登录则重定向到仪表盘
   */
  useEffect(() => {
    // 等待 Zustand hydration 完成
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      const { isAuthenticated: authStatus } = useAuthStore.getState();
      if (authStatus) {
        router.replace('/');
      } else {
        setChecking(false);
      }
    });

    // 如果已经 hydrated，直接检查
    if (useAuthStore.persist.hasHydrated()) {
      if (isAuthenticated) {
        router.replace('/');
      } else {
        setChecking(false);
      }
    }

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, router]);

  // 检查中显示加载状态
  if (checking) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return <>{children}</>;
}
