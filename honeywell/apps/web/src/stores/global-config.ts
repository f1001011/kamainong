/**
 * @file 全局配置 Store
 * @description 管理全局配置状态（站点名称、货币符号、各项限制等）
 * @reference 开发文档/03.0-前端架构.md
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GlobalConfig } from '@/types';
import { DEFAULT_SYSTEM_TIMEZONE } from '@/lib/timezone';

/**
 * 全局配置 Store 状态
 */
interface GlobalConfigState {
  /** 全局配置 */
  config: GlobalConfig | null;
  /** 配置版本号 */
  version: number;
  /** 是否已加载 */
  isLoaded: boolean;
  /** 加载错误 */
  error: string | null;
  /** 设置配置 */
  setConfig: (config: GlobalConfig) => void;
  /** 设置版本号 */
  setVersion: (version: number) => void;
  /** 设置加载状态 */
  setLoaded: (loaded: boolean) => void;
  /** 设置错误 */
  setError: (error: string | null) => void;
  /** 重置配置 */
  reset: () => void;
}

/**
 * 默认全局配置
 * @description 用于配置加载前的占位值
 */
const defaultConfig: GlobalConfig = {
  siteName: 'lendlease',
  siteLogo: '/images/logo.png',
  currencySymbol: 'د.م.',
  currencyCode: 'MAD',
  currencyDecimals: 2,
  currencyThousandsSep: ',',
  currencySpace: true,
  systemTimezone: DEFAULT_SYSTEM_TIMEZONE,
  serviceWhatsapp: '',
  registerBonus: 3000,
  withdrawFeePercent: 10,
  minRechargeAmount: 50000,
  maxRechargeAmount: 500000,
  minWithdrawAmount: 12000,
  maxWithdrawTimesPerDay: 1,
  inviteCommissionPercent: 0.12,
  passwordMinLength: 6,
  passwordMaxLength: 32,
  passwordRequireLetter: true,
  passwordRequireNumber: true,
  passwordShowStrength: true,
  version: 0,
};

/**
 * 全局配置 Store
 */
export const useGlobalConfigStore = create<GlobalConfigState>()(
  persist(
    (set) => ({
      config: null,
      version: 0,
      isLoaded: false,
      error: null,

      setConfig: (config) =>
        set({
          config,
          version: config.version,
          isLoaded: true,
          error: null,
        }),

      setVersion: (version) => set({ version }),

      setLoaded: (isLoaded) => set({ isLoaded }),

      setError: (error) => set({ error, isLoaded: true }),

      reset: () =>
        set({
          config: null,
          version: 0,
          isLoaded: false,
          error: null,
        }),
    }),
    {
      name: 'global-config-storage',
      partialize: (state) => ({
        config: state.config,
        version: state.version,
      }),
      skipHydration: true,
    }
  )
);

/**
 * 获取全局配置（带默认值）
 * @description 在配置未加载时返回默认值，避免空值错误
 */
export function getGlobalConfig(): GlobalConfig {
  const state = useGlobalConfigStore.getState();
  return state.config || defaultConfig;
}
