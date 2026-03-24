/**
 * @file 全局配置获取工具
 * @description 从 GlobalConfig 表获取配置值，禁止硬编码任何配置
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.7节 - GlobalConfig表
 * @depends 开发文档/开发文档.md 第2节 - 全局与基础配置
 */

import { prisma } from './prisma';
import { redis, CACHE_KEYS, CACHE_TTL } from './redis';
import { DEFAULT_CONFIG } from '@honeywell/config';

/**
 * 配置缓存键
 */
const CONFIG_CACHE_PREFIX = 'config:item:';

/**
 * 配置默认值映射
 * @description 当数据库中无配置时使用的默认值
 * 注意：这些默认值应与文档中定义的默认值保持一致
 */
const CONFIG_DEFAULTS: Record<string, unknown> = {
  // === 充值配置（COP） ===
  rechargeTimeoutMinutes: 30,
  rechargeMaxPending: 5,
  rechargeMinAmount: 50000,
  rechargeMaxAmount: 50000000,
  rechargePresets: [50000, 100000, 200000, 500000, 1000000],

  // === 提现配置（Lendlease COP） ===
  withdrawFeePercent: 10,
  withdrawLimitDaily: 1,
  withdrawTimeRange: '10:00-17:00',
  withdrawMinAmount: 12000,
  withdrawMaxAmount: 50000000,
  withdrawRequireRecharge: true,
  withdrawRequirePurchase: true,

  // === 返佣配置（12/3/1） ===
  commissionLevel1Rate: 12,
  commissionLevel2Rate: 3,
  commissionLevel3Rate: 1,

  // === 收益发放配置 ===
  incomeMaxRetryCount: 3,

  // === 签到配置 ===
  signinWindowDays: 7,

  // === 心跳配置 ===
  heartbeatInterval: 60,
  heartbeatTimeout: 120,

  // === 时区配置（统一从常量读取） ===
  systemTimezone: DEFAULT_CONFIG.SYSTEM_TIMEZONE,

  // === 新功能开关 ===
  svipRewardEnabled: true,
  weeklySalaryEnabled: true,
  prizePoolEnabled: true,
  spinWheelEnabled: true,
  communityEnabled: true,
  financialProductEnabled: true,
  spinMaxDaily: 5,
  spinInviteThreshold: 5,
  phoneDigitCount: 9,
  serviceTimeRange: '09:00-19:00',

  // === 任务告警配置 ===
  taskFailureAlertEnabled: true,
  taskConsecutiveFailureThreshold: 3,
  taskExecutionTimeoutThreshold: 300,
  taskAlertMethod: ['admin_notification'],
};

/**
 * 将 key 从 camelCase 转换为 snake_case（数据库格式）
 * @param key camelCase 格式的 key
 * @returns snake_case 格式的 key
 */
function toSnakeCase(key: string): string {
  return key.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * 从数据库获取单个配置值
 * @param key 配置键（支持 camelCase 或 snake_case）
 * @param defaultValue 默认值
 * @returns 配置值
 * 
 * @example
 * // 获取充值超时分钟数
 * const timeout = await getConfig('rechargeTimeoutMinutes', 30);
 * // 或者
 * const timeout = await getConfig('recharge_timeout_minutes', 30);
 */
export async function getConfig<T>(key: string, defaultValue: T): Promise<T> {
  // 转换为 snake_case 格式（数据库使用 snake_case）
  const dbKey = key.includes('_') ? key : toSnakeCase(key);
  const cacheKey = `${CONFIG_CACHE_PREFIX}${dbKey}`;

  try {
    // 1. 尝试从缓存获取
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        // JSON解析失败，尝试直接返回
        return cached as unknown as T;
      }
    }

    // 2. 从数据库获取
    const config = await prisma.globalConfig.findUnique({
      where: { key: dbKey },
      select: { value: true },
    });

    if (config !== null && config.value !== null) {
      // 缓存配置值（5分钟）
      await redis.setex(cacheKey, CACHE_TTL.CONFIG_GLOBAL, JSON.stringify(config.value));
      return config.value as T;
    }

    // 3. 使用默认值
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    const fallback = CONFIG_DEFAULTS[camelKey] ?? defaultValue;
    return fallback as T;

  } catch (error) {
    console.error(`[Config] 获取配置 ${key} 失败:`, error);
    // 使用默认值
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    return (CONFIG_DEFAULTS[camelKey] ?? defaultValue) as T;
  }
}

/**
 * 批量获取配置值
 * @param keys 配置键数组
 * @returns 配置键值映射
 * 
 * @example
 * const configs = await getConfigs([
 *   'rechargeTimeoutMinutes',
 *   'rechargeMaxPending'
 * ]);
 */
export async function getConfigs(keys: string[]): Promise<Record<string, unknown>> {
  const dbKeys = keys.map(k => k.includes('_') ? k : toSnakeCase(k));
  
  try {
    const configs = await prisma.globalConfig.findMany({
      where: { key: { in: dbKeys } },
      select: { key: true, value: true },
    });

    const result: Record<string, unknown> = {};
    const configMap = new Map(configs.map(c => [c.key, c.value]));

    for (let i = 0; i < keys.length; i++) {
      const originalKey = keys[i];
      const dbKey = dbKeys[i];
      const value = configMap.get(dbKey);
      
      if (value !== undefined) {
        result[originalKey] = value;
      } else {
        // 使用默认值
        const camelKey = originalKey.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[originalKey] = CONFIG_DEFAULTS[camelKey];
      }
    }

    return result;
  } catch (error) {
    console.error('[Config] 批量获取配置失败:', error);
    // 返回默认值
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[key] = CONFIG_DEFAULTS[camelKey];
    }
    return result;
  }
}

/**
 * 获取系统时区
 * @description 依据：开发文档.md 第3节 - 时区配置从数据库获取，禁止硬编码
 * @returns 系统时区字符串（如 'Africa/Casablanca'）
 */
export async function getSystemTimezone(): Promise<string> {
  return getConfig('systemTimezone', DEFAULT_CONFIG.SYSTEM_TIMEZONE);
}

/**
 * 获取当前系统时间（基于配置的时区）
 * @returns 系统时区的当前时间
 */
export async function getSystemTime(): Promise<Date> {
  const timezone = await getSystemTimezone();
  const now = new Date();
  
  // 转换为系统时区的时间
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(now);
  const getValue = (type: string) => parts.find(p => p.type === type)?.value || '0';
  
  return new Date(
    parseInt(getValue('year')),
    parseInt(getValue('month')) - 1,
    parseInt(getValue('day')),
    parseInt(getValue('hour')),
    parseInt(getValue('minute')),
    parseInt(getValue('second'))
  );
}

/**
 * 获取系统时区的今日开始时间（00:00:00）
 * @returns 今日开始时间
 */
export async function getSystemTodayStart(): Promise<Date> {
  const systemTime = await getSystemTime();
  systemTime.setHours(0, 0, 0, 0);
  return systemTime;
}

/**
 * 获取系统时区的昨日日期范围
 * @returns { start: 昨日开始, end: 昨日结束(今日开始) }
 */
export async function getYesterdayRange(): Promise<{ start: Date; end: Date }> {
  const todayStart = await getSystemTodayStart();
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  
  return {
    start: yesterdayStart,
    end: todayStart,
  };
}

/**
 * 获取货币符号（带缓存）
 * @description 从 GlobalConfig 获取 currency_symbol，供通知/流水等场景使用
 */
export async function getCurrencySymbol(): Promise<string> {
  return getConfig<string>('currency_symbol', '$');
}

/**
 * 格式化货币金额为通知展示用字符串
 * @description 自动读取配置中的货币符号，生成如 "$ 50.000" 格式
 */
export async function formatNotificationAmount(amount: number | { toFixed: (n: number) => string }): Promise<string> {
  const symbol = await getCurrencySymbol();
  const num = typeof amount === 'number' ? amount : Number(amount);
  const formatted = Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${symbol} ${formatted}`;
}

/**
 * 清除配置缓存
 * @description 后台修改配置后调用，确保前端获取最新配置
 * @param key 配置键（可选，不传则清除所有）
 */
export async function clearConfigCache(key?: string): Promise<void> {
  if (key) {
    const dbKey = key.includes('_') ? key : toSnakeCase(key);
    await redis.del(`${CONFIG_CACHE_PREFIX}${dbKey}`);
  } else {
    // 清除所有配置缓存
    const keys = await redis.keys(`${CONFIG_CACHE_PREFIX}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    // 同时清除全局配置缓存
    await redis.del(CACHE_KEYS.CONFIG.GLOBAL);
  }
}
