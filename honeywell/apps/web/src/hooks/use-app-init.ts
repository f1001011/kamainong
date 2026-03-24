/**
 * @file 应用初始化 Hook
 * @description 应用启动时加载全局配置和文案
 * @reference 开发文档/03.0-前端架构.md
 */

'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGlobalConfigStore, useTextStore, useUserStore } from '@/stores';
import type { GlobalConfig, TextsApiResponse, User } from '@/types';
import api from '@/lib/api';

/**
 * 应用初始化状态
 */
interface AppInitState {
  /** 是否初始化完成 */
  isReady: boolean;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 初始化错误 */
  error: string | null;
}

/**
 * 应用初始化 Hook
 * @description 在应用启动时加载必要的配置和用户信息
 * 
 * @example
 * ```tsx
 * // 在根组件中使用
 * function App() {
 *   const { isReady, isLoading, error } = useAppInit();
 *   
 *   if (isLoading) return <SplashScreen />;
 *   if (error) return <ErrorScreen error={error} />;
 *   
 *   return <MainApp />;
 * }
 * ```
 */
export function useAppInit(): AppInitState {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setConfig: setGlobalConfig } = useGlobalConfigStore();
  const { setTexts, setVersion: setTextsVersion } = useTextStore();
  const { setUser, token } = useUserStore();

  // 加载全局配置
  const globalConfigQuery = useQuery<GlobalConfig>({
    queryKey: ['global-config'],
    queryFn: () => api.get('/global-config'),
    staleTime: 5 * 60 * 1000, // 5 分钟缓存
    retry: 2,
  });

  // 加载文案配置（API 返回 { version, updatedAt, texts } 结构）
  const textsQuery = useQuery<TextsApiResponse>({
    queryKey: ['texts'],
    queryFn: () => api.get('/texts'),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // 加载用户信息（如果有 token）
  const userQuery = useQuery<User>({
    queryKey: ['current-user'],
    queryFn: () => api.get('/user/profile'),
    enabled: !!token, // 仅在有 token 时请求
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  // 处理加载结果
  useEffect(() => {
    // 检查必要配置是否加载完成
    const configLoaded = globalConfigQuery.isSuccess && textsQuery.isSuccess;
    const configError = globalConfigQuery.error || textsQuery.error;

    if (configError) {
      setError('خطأ في تحميل الإعدادات');
      setIsReady(true);
      return;
    }

    if (configLoaded) {
      // 保存配置到 Store
      if (globalConfigQuery.data) {
        setGlobalConfig(globalConfigQuery.data);
      }
      if (textsQuery.data) {
        const { texts, version } = textsQuery.data;
        if (texts && typeof texts === 'object') {
          setTexts(texts);
        }
        if (version !== undefined) {
          setTextsVersion(version);
        }
      }
      
      // 处理用户信息
      if (token) {
        if (userQuery.isSuccess && userQuery.data) {
          setUser(userQuery.data);
        } else if (userQuery.isError) {
          // 仅对 401 清除，网络错误等不清除
          const error = userQuery.error as { status?: number } | undefined;
          if (error?.status === 401) {
            setUser(null);
          }
        }
      }

      // 等待用户查询完成（如果有 token）
      const userCheckComplete = !token || userQuery.isSuccess || userQuery.isError;
      
      if (userCheckComplete) {
        setIsReady(true);
      }
    }
  }, [
    globalConfigQuery.isSuccess,
    globalConfigQuery.data,
    globalConfigQuery.error,
    textsQuery.isSuccess,
    textsQuery.data,
    textsQuery.error,
    userQuery.isSuccess,
    userQuery.isError,
    userQuery.data,
    token,
    setGlobalConfig,
    setTexts,
    setTextsVersion,
    setUser,
  ]);

  const isLoading = globalConfigQuery.isLoading || textsQuery.isLoading || 
    (!!token && userQuery.isLoading);

  return {
    isReady,
    isLoading,
    error,
  };
}
