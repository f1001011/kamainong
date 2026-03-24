/**
 * @file 全局配置 Hook
 * @description 提供全局配置访问
 */

'use client';

import { useEffect, useRef } from 'react';
import { useGlobalConfigStore, GlobalConfig } from '@/stores/config';

/**
 * 全局配置 Hook
 * @description 获取全局配置，自动同步更新
 */
export function useGlobalConfig(): GlobalConfig {
  const { config, fetchConfig, checkVersion, isInitialized } = useGlobalConfigStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 初始加载
    if (!isInitialized) {
      fetchConfig();
    }

    // 定时检测版本变化（每分钟）
    intervalRef.current = setInterval(() => {
      checkVersion();
    }, 60000);

    // 页面获取焦点时检测
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchConfig, checkVersion, isInitialized]);

  return config;
}

/**
 * 获取货币配置
 */
export function useCurrencyConfig() {
  const config = useGlobalConfig();
  return {
    symbol: config.currencySymbol,
    space: config.currencySpace,
  };
}

/**
 * 获取时区配置
 */
export function useTimezoneConfig() {
  const config = useGlobalConfig();
  return {
    timezone: config.systemTimezone,
    displayName: config.timezoneDisplayName,
  };
}

export default useGlobalConfig;
