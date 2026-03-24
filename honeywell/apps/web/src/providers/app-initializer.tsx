/**
 * @file 应用初始化组件
 * @description 在应用启动时加载全局配置、文案、用户信息
 * @reference 开发文档/03.0-前端架构.md
 *
 * 核心机制：
 * 1. 先 rehydrate localStorage 作为占位数据（避免空白）
 * 2. API 返回后强制覆盖 localStorage 旧数据
 * 3. 通过 apiLoaded ref 确保 API 数据优先级高于 localStorage
 */

'use client';

import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useGlobalConfigStore, useTextStore, useUserStore } from '@/stores';
import { useHeartbeat } from '@/hooks/use-heartbeat';
import type { GlobalConfig, TextsApiResponse, User } from '@/types';
import api from '@/lib/api';

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const { setConfig: setGlobalConfig } = useGlobalConfigStore();
  const { setTexts, setVersion: setTextsVersion } = useTextStore();
  const { setUser, token } = useUserStore();
  const queryClient = useQueryClient();
  const textsApiLoaded = useRef(false);

  // 定期验证会话有效性，防止用户长时间停留导致 token 过期无感知
  useHeartbeat();

  // 客户端挂载后恢复 persist 数据（仅 user 和 globalConfig）
  // 文案不从 localStorage 恢复，始终等 API 返回最新数据
  useEffect(() => {
    useUserStore.persist.rehydrate();
    useGlobalConfigStore.persist.rehydrate();

    // rehydrate 后检查：cookie 有 token 但 localStorage 没有 → 从 cookie 恢复
    // 防止 cookie 放行了中间件但 store 无 token 导致查询不触发、无法检测 401 的死区
    const state = useUserStore.getState();
    if (!state.token) {
      const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (cookieToken) {
        state.setToken(cookieToken);
      }
    }
  }, []);

  const globalConfigQuery = useQuery<GlobalConfig>({
    queryKey: ['global-config'],
    queryFn: () => api.get('/global-config'),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const textsQuery = useQuery<TextsApiResponse>({
    queryKey: ['texts'],
    queryFn: () => api.get('/texts'),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const userQuery = useQuery<User>({
    queryKey: ['current-user'],
    queryFn: () => api.get('/user/profile'),
    enabled: !!token,
    staleTime: 30 * 1000,
    retry: 1,
    refetchOnWindowFocus: 'always',
  });

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted && token) {
        queryClient.invalidateQueries({ queryKey: ['current-user'] });
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [token, queryClient]);

  useEffect(() => {
    if (globalConfigQuery.isSuccess && globalConfigQuery.data) {
      setGlobalConfig(globalConfigQuery.data);
    }
  }, [globalConfigQuery.isSuccess, globalConfigQuery.data, setGlobalConfig]);

  // 文案加载：API 返回后立即写入 store，标记已加载
  useEffect(() => {
    if (textsQuery.isSuccess && textsQuery.data) {
      const { texts, version } = textsQuery.data;
      if (texts && typeof texts === 'object') {
        textsApiLoaded.current = true;
        setTexts(texts);
      }
      if (version !== undefined) {
        setTextsVersion(version);
      }
    }
  }, [textsQuery.isSuccess, textsQuery.data, setTexts, setTextsVersion]);

  useEffect(() => {
    if (!token) return;

    if (userQuery.isSuccess && userQuery.data) {
      setUser(userQuery.data);
    } else if (userQuery.isError) {
      const error = userQuery.error as { status?: number; code?: string } | undefined;
      const isUnauthorized = error?.status === 401 || error?.code === 'UNAUTHORIZED';
      if (isUnauthorized) {
        setUser(null);
        useUserStore.setState({ token: null, isAuthenticated: false });
        if (typeof document !== 'undefined') {
          document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
          const currentPath = window.location.pathname;
          const skipPaths = ['/login', '/register', '/forgot-password', '/welcome'];
          if (!skipPaths.includes(currentPath)) {
            const redirectParam = currentPath !== '/' ? `?redirect=${encodeURIComponent(currentPath)}` : '';
            window.location.href = `/login${redirectParam}`;
          }
        }
      }
    }
  }, [token, userQuery.isSuccess, userQuery.isError, userQuery.error, userQuery.data, setUser]);

  return <>{children}</>;
}
