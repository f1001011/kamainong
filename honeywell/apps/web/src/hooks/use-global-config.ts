/**
 * @file 全局配置 Hook
 * @description 获取全局配置的便捷 Hook
 * @reference 开发文档/03.0-前端架构.md
 */

'use client';

import { useGlobalConfigStore } from '@/stores';
import type { GlobalConfig } from '@/types';
import { DEFAULT_SYSTEM_TIMEZONE } from '@/lib/timezone';

/**
 * 默认全局配置
 * @description 配置未加载时使用的默认值
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
  rechargeTimeoutMinutes: 30,
  passwordMinLength: 6,
  passwordMaxLength: 32,
  passwordRequireLetter: true,
  passwordRequireNumber: true,
  passwordShowStrength: true,
  version: 0,
};

/**
 * 全局配置 Hook 返回类型
 */
interface UseGlobalConfigReturn {
  /** 全局配置（带默认值，永不为 null） */
  config: GlobalConfig;
  /** 是否已加载 */
  isLoaded: boolean;
  /** 加载错误 */
  error: string | null;
}

/**
 * 全局配置 Hook
 * @description 获取全局配置，自动处理未加载状态
 * @returns 全局配置对象（带默认值）
 * 
 * @example
 * ```tsx
 * const { config, isLoaded } = useGlobalConfig();
 * 
 * return (
 *   <span>{config.currencySymbol} 100.00</span>
 * );
 * ```
 */
export function useGlobalConfig(): UseGlobalConfigReturn {
  const { config, isLoaded, error } = useGlobalConfigStore();

  return {
    config: config || defaultConfig,
    isLoaded,
    error,
  };
}
