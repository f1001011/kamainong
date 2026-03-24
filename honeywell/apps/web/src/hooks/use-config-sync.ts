/**
 * @file 配置同步 Hook
 * @description 定期检查配置版本并热更新
 * @reference 开发文档/03.0-前端架构.md
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useGlobalConfigStore, useTextStore } from '@/stores';
import type { GlobalConfig } from '@/types';
import api from '@/lib/api';

/**
 * 文案配置响应（与后端 getTextsConfig 返回结构一致）
 */
interface TextsConfigResponse {
  version: number;
  updatedAt: string;
  texts: Record<string, string>;
}

/**
 * 配置版本响应
 * @description 与后端 /api/config/versions 返回的字段名保持一致
 */
interface ConfigVersions {
  globalConfigVersion: number;
  globalConfigUpdatedAt: string;
  textsVersion: number;
  textsUpdatedAt: string;
  timezoneVersion: number;
  timezoneUpdatedAt: string;
}

/**
 * 配置同步间隔（毫秒）
 */
const SYNC_INTERVAL = 60 * 1000; // 1 分钟

/**
 * 配置同步 Hook
 * @description 定期检查配置版本，有更新时自动刷新
 * 
 * @example
 * ```tsx
 * // 在根组件中使用
 * function App() {
 *   useConfigSync();
 *   return <MainApp />;
 * }
 * ```
 */
export function useConfigSync(): void {
  const queryClient = useQueryClient();
  const { version: globalConfigVersion, setConfig: setGlobalConfig } = useGlobalConfigStore();
  const { version: textsVersion, setTexts, setVersion: setTextsVersion } = useTextStore();

  // 定期检查配置版本
  const { data: versions } = useQuery<ConfigVersions>({
    queryKey: ['config-versions'],
    queryFn: () => api.get('/config/versions'),
    refetchInterval: SYNC_INTERVAL,
    staleTime: SYNC_INTERVAL - 5000, // 稍早于刷新间隔
    retry: false,
  });

  /**
   * 刷新全局配置
   */
  const refreshGlobalConfig = useCallback(async () => {
    try {
      const config = await api.get<GlobalConfig>('/global-config');
      setGlobalConfig(config);
      // 更新 React Query 缓存
      queryClient.setQueryData(['global-config'], config);
    } catch {
      // 静默失败，下次再试
    }
  }, [setGlobalConfig, queryClient]);

  /**
   * 刷新文案配置
   * @description 从 API 获取完整文案配置，解构后更新 store
   */
  const refreshTexts = useCallback(async () => {
    try {
      const response = await api.get<TextsConfigResponse>('/texts');
      // 解构响应：texts 是键值对，version 是版本号
      setTexts(response.texts);
      setTextsVersion(response.version);
      queryClient.setQueryData(['texts'], response);
    } catch {
      // 静默失败
    }
  }, [setTexts, setTextsVersion, queryClient]);

  // 监听版本变化，触发更新
  useEffect(() => {
    if (!versions) return;

    // 检查全局配置版本
    if (versions.globalConfigVersion > globalConfigVersion) {
      refreshGlobalConfig();
    }

    // 检查文案版本
    if (versions.textsVersion > textsVersion) {
      refreshTexts();
    }
  }, [versions, globalConfigVersion, textsVersion, refreshGlobalConfig, refreshTexts]);
}
