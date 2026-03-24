/**
 * @file 客户端 Providers
 * @description 包含需要在客户端运行的 Provider 组件
 */

'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProgressBar } from '@/components/common';

/**
 * 创建 QueryClient 实例
 * @description 配置全局默认行为
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 窗口重新获取焦点时不自动重新请求
        refetchOnWindowFocus: false,
        // 默认不重试失败的请求
        retry: 1,
        // 数据缓存时间: 5分钟
        staleTime: 5 * 60 * 1000,
      },
    },
  });
}

/**
 * 浏览器端单例 QueryClient
 */
let browserQueryClient: QueryClient | undefined = undefined;

/**
 * 获取 QueryClient 实例
 * @description 服务端每次创建新实例，浏览器端使用单例
 */
function getQueryClient() {
  if (typeof window === 'undefined') {
    // 服务端：每次请求创建新实例
    return makeQueryClient();
  } else {
    // 浏览器端：使用单例
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}

/**
 * React Query Provider
 * @description 为应用提供 React Query 数据请求能力
 */
export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * 进度条 Provider
 * @description 监听路由变化显示进度条
 */
export function ProgressBarProvider() {
  return <ProgressBar />;
}
