/**
 * @file Query Provider
 * @description React Query 提供者，用于服务端状态管理
 * @reference 开发文档/03.0-前端架构.md
 */

'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Query Provider Props
 */
interface QueryProviderProps {
  children: ReactNode;
}

/**
 * 创建 QueryClient 实例
 * @description 配置默认选项
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 默认 5 分钟内不重新请求
        staleTime: 5 * 60 * 1000,
        // 默认缓存 30 分钟
        gcTime: 30 * 60 * 1000,
        // 失败后重试 1 次
        retry: 1,
        // 窗口获得焦点时不自动重新请求
        refetchOnWindowFocus: false,
      },
      mutations: {
        // 失败后不重试
        retry: false,
      },
    },
  });
}

// 浏览器端单例
let browserQueryClient: QueryClient | undefined = undefined;

/**
 * 获取 QueryClient 实例
 * @description 服务端每次请求创建新实例，浏览器端使用单例
 */
function getQueryClient(): QueryClient {
  // 服务端：每次创建新实例
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }
  
  // 浏览器端：使用单例
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

/**
 * Query Provider 组件
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // 使用 useState 确保 SSR 时正确创建
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
