/**
 * @file 全局配置与文案服务
 * @description 处理全局配置、文案配置的获取与缓存管理
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第1.1~1.4节
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.7节 GlobalConfig表、TextConfig表
 */

import { prisma } from '../lib/prisma';
import {
  CACHE_KEYS,
  CACHE_TTL,
  getOrSet,
  deleteCache,
} from '../lib/redis';
import { DEFAULT_CONFIG } from '@honeywell/config';

// ================================
// 类型定义
// ================================

/**
 * 全局配置响应数据结构
 * @description 包含站点基础配置、地区配置、时区配置、财务配置、安全配置
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第1.1节
 */
export interface GlobalConfigResponse {
  // === 基础配置 ===
  siteName: string;
  siteDomain: string;
  siteLogo: string;  // 前端使用 siteLogo
  
  // === 地区配置 ===
  currencySymbol: string;
  currencySpace: boolean;
  currencyDecimals: number;
  currencyThousandsSep: string;
  currencyCode: string;
  phoneAreaCode: string;
  phoneDigitCount: number;
  
  // === 时区配置 ===
  systemTimezone: string;
  timezoneDisplayName: string;
  
  // === 提现配置 ===
  withdrawFeePercent: number;
  withdrawTimeRange: string;
  withdrawMinAmount: string;
  withdrawMaxAmount: string;
  withdrawLimitDaily: number;
  withdrawQuickAmounts: number[];
  
  // === 充值配置 ===
  rechargePresets: number[];
  rechargeMinAmount: string;
  rechargeMaxAmount: string;
  rechargeMaxPending: number;
  rechargeTimeoutMinutes: number;
  rechargePageTips: string;
  withdrawPageTips: string;
  
  // === 银行卡配置 ===
  maxBindcardCount: number;
  
  // === 密码配置（依据：开发文档.md 13.11.4节）===
  passwordMinLength: number;
  passwordMaxLength: number;
  passwordRequireLetter: boolean;
  passwordRequireNumber: boolean;
  passwordShowStrength: boolean;
  
  // === 个人信息配置（依据：开发文档.md 4.2节）===
  avatarMaxSize: number;
  nicknameMinLength: number;
  nicknameMaxLength: number;
  
  // === 注册与签到配置 ===
  registerBonus: number;
  signinDailyReward: number;
  
  // === 返佣配置 ===
  commissionLevel1Rate: number;
  commissionLevel2Rate: number;
  commissionLevel3Rate: number;
  
  // === 客服配置 ===
  serviceTimeRange: string;
  
  // === 功能开关 ===
  svipRewardEnabled: boolean;
  weeklySalaryEnabled: boolean;
  prizePoolEnabled: boolean;
  spinWheelEnabled: boolean;
  communityEnabled: boolean;
  financialProductEnabled: boolean;
  
  // === 心跳配置（依据：数据库设计 2.18节）===
  heartbeatInterval: number;
  
  // === 版本信息 ===
  version: number;
  updatedAt: string;
}

/**
 * 配置版本号响应数据结构
 * @description 所有配置的版本号集合，用于前端热更新检测
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第1.3节
 */
export interface ConfigVersionsResponse {
  globalConfigVersion: number;
  globalConfigUpdatedAt: string;
  textsVersion: number;
  textsUpdatedAt: string;
  timezoneVersion: number;
  timezoneUpdatedAt: string;
}

/**
 * 文案配置响应数据结构
 * @description 所有文案的键值对集合
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第1.4节
 */
export interface TextsConfigResponse {
  version: number;
  updatedAt: string;
  texts: Record<string, string>;
}

/**
 * 文案版本号响应数据结构
 * @description 仅包含文案版本号，用于增量更新检测
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第1.2节
 */
export interface TextVersionResponse {
  version: number;
  updatedAt: string;
}

// ================================
// 辅助函数
// ================================

/**
 * 格式化金额为两位小数字符串
 * @description 依据：API接口清单要求金额字段格式为 "50.00"
 * @param value - 金额数值
 * @returns 格式化后的金额字符串（保留两位小数）
 */
function formatAmount(value: number): string {
  return value.toFixed(2);
}

/**
 * 从数据库获取单个全局配置值
 * @description 读取 GlobalConfig 表中指定 key 的值
 * @param key - 配置键
 * @returns 配置值（JSON 解析后）或 undefined
 */
async function getConfigValue<T>(key: string): Promise<T | undefined> {
  const config = await prisma.globalConfig.findUnique({
    where: { key },
  });
  return config?.value as T | undefined;
}

/**
 * 从数据库获取多个全局配置值
 * @description 批量读取 GlobalConfig 表
 * @returns 配置键值对映射
 */
async function getAllConfigValues(): Promise<Record<string, unknown>> {
  const configs = await prisma.globalConfig.findMany();
  const result: Record<string, unknown> = {};
  for (const config of configs) {
    result[config.key] = config.value;
  }
  return result;
}

// ================================
// 核心服务函数
// ================================

/**
 * 获取全局配置
 * @description 从缓存或数据库获取全局配置，支持 5 分钟 TTL 缓存
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第1.1节
 * @returns 全局配置响应数据
 */
export async function getGlobalConfig(): Promise<GlobalConfigResponse> {
  return getOrSet<GlobalConfigResponse>(
    CACHE_KEYS.CONFIG.GLOBAL,
    async () => {
      // 从数据库获取所有配置
      const configs = await getAllConfigValues();
      
      // 构造响应数据（禁止硬编码，全部从数据库读取）
      return {
        // === 基础配置 ===
        siteName: (configs['site_name'] as string) ?? '',
        siteDomain: (configs['site_domain'] as string) ?? '',
        siteLogo: (configs['site_logo_url'] as string) ?? '',  // 前端使用 siteLogo
        
        // === 地区配置 ===
        currencySymbol: (configs['currency_symbol'] as string) ?? 'MAD',
        currencySpace: (configs['currency_space'] as boolean) ?? true,
        currencyDecimals: (configs['currency_decimals'] as number) ?? 0,
        currencyThousandsSep: (configs['currency_thousands_sep'] as string) ?? ',',
        currencyCode: (configs['currency_code'] as string) ?? 'MAD',
        phoneAreaCode: (configs['phone_area_code'] as string) ?? '+212',
        phoneDigitCount: (configs['phone_digit_count'] as number) ?? 9,
        
        // === 时区配置（禁止硬编码，必须从数据库读取）===
        systemTimezone: (configs['system_timezone'] as string) ?? DEFAULT_CONFIG.SYSTEM_TIMEZONE,
        timezoneDisplayName: (configs['timezone_display_name'] as string) ?? DEFAULT_CONFIG.TIMEZONE_DISPLAY_NAME,
        
        // === 提现配置 ===
        withdrawFeePercent: (configs['withdraw_fee_percent'] as number) ?? 10,
        withdrawTimeRange: (configs['withdraw_time_range'] as string) ?? '10:00-17:00',
        withdrawMinAmount: formatAmount((configs['withdraw_min_amount'] as number) ?? 12000),
        withdrawMaxAmount: formatAmount((configs['withdraw_max_amount'] as number) ?? 10000),
        withdrawLimitDaily: (configs['withdraw_limit_daily'] as number) ?? 1,
        withdrawQuickAmounts: (configs['withdraw_quick_amounts'] as number[]) ?? [],
        
        // === 充值配置 ===
        rechargePresets: (configs['recharge_presets'] as number[]) ?? [50, 100, 200, 500, 1000, 2000, 5000, 10000],
        rechargeMinAmount: formatAmount((configs['recharge_min_amount'] as number) ?? 10),
        rechargeMaxAmount: formatAmount((configs['recharge_max_amount'] as number) ?? 50000),
        rechargeMaxPending: (configs['recharge_max_pending'] as number) ?? 5,
        rechargeTimeoutMinutes: (configs['recharge_timeout_minutes'] as number) ?? 30,
        rechargePageTips: (configs['recharge_page_tips'] as string) ?? '',
        withdrawPageTips: (configs['withdraw_page_tips'] as string) ?? '',
        
        // === 银行卡配置 ===
        maxBindcardCount: (configs['max_bindcard_count'] as number) ?? 3,
        
        // === 密码配置 ===
        // 注意：后台保存的是 password_complexity_required（单个开关控制字母+数字要求）
        passwordMinLength: (configs['password_min_length'] as number) ?? 6,
        passwordMaxLength: (configs['password_max_length'] as number) ?? 32,
        passwordRequireLetter: (configs['password_complexity_required'] as boolean) ?? true,
        passwordRequireNumber: (configs['password_complexity_required'] as boolean) ?? true,
        passwordShowStrength: (configs['password_strength_indicator'] as boolean) ?? true,
        
        // === 个人信息配置 ===
        avatarMaxSize: (configs['avatar_max_size'] as number) ?? 2097152,
        nicknameMinLength: (configs['nickname_min_length'] as number) ?? 2,
        nicknameMaxLength: (configs['nickname_max_length'] as number) ?? 20,
        
        // === 注册与签到配置 ===
        registerBonus: (configs['register_bonus'] as number) ?? 3000,
        signinDailyReward: (configs['signin_daily_reward'] as number) ?? 100,
        
        // === 返佣配置 ===
        commissionLevel1Rate: (configs['commission_level1_rate'] as number) ?? 12,
        commissionLevel2Rate: (configs['commission_level2_rate'] as number) ?? 3,
        commissionLevel3Rate: (configs['commission_level3_rate'] as number) ?? 1,
        
        // === 客服配置 ===
        serviceTimeRange: (configs['service_time_range'] as string) ?? '09:00-19:00',
        
        // === 功能开关 ===
        svipRewardEnabled: (configs['svip_reward_enabled'] as boolean) ?? true,
        weeklySalaryEnabled: (configs['weekly_salary_enabled'] as boolean) ?? true,
        prizePoolEnabled: (configs['prize_pool_enabled'] as boolean) ?? true,
        spinWheelEnabled: (configs['spin_wheel_enabled'] as boolean) ?? true,
        communityEnabled: (configs['community_enabled'] as boolean) ?? true,
        financialProductEnabled: (configs['financial_product_enabled'] as boolean) ?? true,
        
        // === 心跳配置 ===
        heartbeatInterval: (configs['heartbeat_interval'] as number) ?? 60,
        
        // === 版本信息 ===
        version: (configs['global_config_version'] as number) ?? 1,
        updatedAt: (configs['global_config_updated_at'] as string) ?? new Date().toISOString(),
      };
    },
    CACHE_TTL.CONFIG_GLOBAL
  );
}

/**
 * 获取配置版本号集合
 * @description 获取所有配置的版本号，用于前端热更新检测
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第1.3节
 * @returns 配置版本号响应数据
 */
export async function getConfigVersions(): Promise<ConfigVersionsResponse> {
  // 版本号查询不缓存，直接从数据库获取最新值
  const versionKeys = [
    'global_config_version',
    'global_config_updated_at',
    'texts_version',
    'texts_updated_at',
    'timezone_version',
    'timezone_updated_at',
  ];
  
  const configs = await prisma.globalConfig.findMany({
    where: { key: { in: versionKeys } },
  });
  
  const configMap: Record<string, unknown> = {};
  for (const config of configs) {
    configMap[config.key] = config.value;
  }
  
  return {
    globalConfigVersion: (configMap['global_config_version'] as number) ?? 1,
    globalConfigUpdatedAt: (configMap['global_config_updated_at'] as string) ?? new Date().toISOString(),
    textsVersion: (configMap['texts_version'] as number) ?? 1,
    textsUpdatedAt: (configMap['texts_updated_at'] as string) ?? new Date().toISOString(),
    timezoneVersion: (configMap['timezone_version'] as number) ?? 1,
    timezoneUpdatedAt: (configMap['timezone_updated_at'] as string) ?? new Date().toISOString(),
  };
}

/**
 * 获取文案配置
 * @description 从缓存或数据库获取所有文案配置，支持 5 分钟 TTL 缓存
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第1.4节
 * @returns 文案配置响应数据
 */
export async function getTextsConfig(): Promise<TextsConfigResponse> {
  return getOrSet<TextsConfigResponse>(
    CACHE_KEYS.TEXT.ES,
    async () => {
      // 获取所有文案
      const textConfigs = await prisma.textConfig.findMany();
      
      // 构建文案键值对
      const texts: Record<string, string> = {};
      for (const text of textConfigs) {
        texts[text.key] = text.value;
      }
      
      // 获取版本号
      const versionConfig = await prisma.globalConfig.findUnique({
        where: { key: 'texts_version' },
      });
      const updatedAtConfig = await prisma.globalConfig.findUnique({
        where: { key: 'texts_updated_at' },
      });
      
      return {
        version: (versionConfig?.value as number) ?? 1,
        updatedAt: (updatedAtConfig?.value as string) ?? new Date().toISOString(),
        texts,
      };
    },
    CACHE_TTL.TEXT
  );
}

/**
 * 获取文案版本号
 * @description 仅获取文案版本号，用于增量更新检测
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第1.2节
 * @returns 文案版本号响应数据
 */
export async function getTextVersion(): Promise<TextVersionResponse> {
  // 版本号查询不缓存，直接从数据库获取最新值
  const versionConfig = await prisma.globalConfig.findUnique({
    where: { key: 'texts_version' },
  });
  const updatedAtConfig = await prisma.globalConfig.findUnique({
    where: { key: 'texts_updated_at' },
  });
  
  return {
    version: (versionConfig?.value as number) ?? 1,
    updatedAt: (updatedAtConfig?.value as string) ?? new Date().toISOString(),
  };
}

// ================================
// 缓存管理函数
// ================================

/**
 * 清除全局配置缓存
 * @description 当后台修改全局配置时调用
 */
export async function clearGlobalConfigCache(): Promise<void> {
  await deleteCache(CACHE_KEYS.CONFIG.GLOBAL);
}

/**
 * 清除文案配置缓存
 * @description 当后台修改文案时调用
 */
export async function clearTextsCache(): Promise<void> {
  await deleteCache(CACHE_KEYS.TEXT.ES);
}

/**
 * 清除所有配置缓存
 * @description 当需要完全刷新配置时调用
 */
export async function clearAllConfigCache(): Promise<void> {
  await Promise.all([
    clearGlobalConfigCache(),
    clearTextsCache(),
  ]);
}

// ================================
// 版本号更新函数（供后台管理使用）
// ================================

/**
 * 递增全局配置版本号
 * @description 更新全局配置时调用，自动递增版本号
 */
export async function incrementGlobalConfigVersion(): Promise<void> {
  const currentVersion = await getConfigValue<number>('global_config_version') ?? 0;
  const newVersion = currentVersion + 1;
  const now = new Date().toISOString();
  
  await prisma.$transaction([
    prisma.globalConfig.upsert({
      where: { key: 'global_config_version' },
      update: { value: newVersion },
      create: { key: 'global_config_version', value: newVersion, description: '全局配置版本号' },
    }),
    prisma.globalConfig.upsert({
      where: { key: 'global_config_updated_at' },
      update: { value: now },
      create: { key: 'global_config_updated_at', value: now, description: '全局配置更新时间' },
    }),
  ]);
  
  // 清除缓存
  await clearGlobalConfigCache();
}

/**
 * 递增文案配置版本号
 * @description 更新文案时调用，自动递增版本号
 */
export async function incrementTextsVersion(): Promise<void> {
  const currentVersion = await getConfigValue<number>('texts_version') ?? 0;
  const newVersion = currentVersion + 1;
  const now = new Date().toISOString();
  
  await prisma.$transaction([
    prisma.globalConfig.upsert({
      where: { key: 'texts_version' },
      update: { value: newVersion },
      create: { key: 'texts_version', value: newVersion, description: '文案版本号' },
    }),
    prisma.globalConfig.upsert({
      where: { key: 'texts_updated_at' },
      update: { value: now },
      create: { key: 'texts_updated_at', value: now, description: '文案更新时间' },
    }),
  ]);
  
  // 清除缓存
  await clearTextsCache();
}

/**
 * 递增时区配置版本号
 * @description 更新时区配置时调用，自动递增版本号
 */
export async function incrementTimezoneVersion(): Promise<void> {
  const currentVersion = await getConfigValue<number>('timezone_version') ?? 0;
  const newVersion = currentVersion + 1;
  const now = new Date().toISOString();
  
  await prisma.$transaction([
    prisma.globalConfig.upsert({
      where: { key: 'timezone_version' },
      update: { value: newVersion },
      create: { key: 'timezone_version', value: newVersion, description: '时区配置版本号' },
    }),
    prisma.globalConfig.upsert({
      where: { key: 'timezone_updated_at' },
      update: { value: now },
      create: { key: 'timezone_updated_at', value: now, description: '时区配置更新时间' },
    }),
  ]);
  
  // 清除全局配置缓存（时区配置属于全局配置的一部分）
  await clearGlobalConfigCache();
}
