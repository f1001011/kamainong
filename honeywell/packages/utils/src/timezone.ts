/**
 * @file 时区处理工具
 * @description 处理时区转换、时间计算等功能
 * @depends 开发文档.md 第3节 - 时区配置
 * @depends 02.1-数据库设计.md - GlobalConfig.system_timezone 配置
 * 
 * 核心原则：
 * - 数据库存储 UTC 时间
 * - 显示时按 GlobalConfig.system_timezone 配置转换
 * - 默认时区 Africa/Casablanca (UTC+1)，但禁止在业务逻辑中硬编码
 */

import { DEFAULT_CONFIG } from '@honeywell/config';

/**
 * 默认时区（仅作为回退值，实际应从数据库获取）
 * @description 统一从 @honeywell/config 读取，禁止硬编码
 */
const DEFAULT_TIMEZONE = DEFAULT_CONFIG.SYSTEM_TIMEZONE;

/**
 * 全局时区缓存（用于存储从数据库获取的系统时区）
 * 注意：这是一个简单的缓存机制，实际生产环境应使用 Redis 缓存
 */
let cachedSystemTimezone: string | null = null;

/**
 * 时区配置获取器类型
 * 用于注入数据库查询函数，避免循环依赖
 */
type TimezoneConfigGetter = () => Promise<string | null>;

/**
 * 外部注入的时区配置获取器
 */
let timezoneConfigGetter: TimezoneConfigGetter | null = null;

/**
 * 注册时区配置获取器
 * @description 由 API 服务启动时调用，注入从数据库获取时区配置的函数
 * @param getter - 获取系统时区的异步函数
 */
export function registerTimezoneConfigGetter(getter: TimezoneConfigGetter): void {
  timezoneConfigGetter = getter;
}

/**
 * 获取系统配置的时区
 * @description 依据：开发文档.md 第3节 - 时区配置从数据库读取
 * 优先从缓存获取，缓存未命中则从数据库读取
 * @returns 系统配置的时区标识符（如 'Africa/Casablanca'）
 */
export async function getSystemTimezone(): Promise<string> {
  // 如果有缓存，直接返回
  if (cachedSystemTimezone) {
    return cachedSystemTimezone;
  }

  // 如果有注入的配置获取器，尝试从数据库获取
  if (timezoneConfigGetter) {
    try {
      const timezone = await timezoneConfigGetter();
      if (timezone) {
        cachedSystemTimezone = timezone;
        return timezone;
      }
    } catch (error) {
      // 数据库查询失败，使用默认值
      console.error('获取系统时区配置失败，使用默认时区:', error);
    }
  }

  // 回退到默认时区
  return DEFAULT_TIMEZONE;
}

/**
 * 同步获取系统时区（用于不支持异步的场景）
 * @description 优先返回缓存值，无缓存时返回默认值
 * @returns 系统时区或默认时区
 */
export function getSystemTimezoneSync(): string {
  return cachedSystemTimezone || DEFAULT_TIMEZONE;
}

/**
 * 设置系统时区缓存
 * @description 供外部模块（如配置服务）在启动时设置
 * @param timezone - 时区标识符
 */
export function setSystemTimezoneCache(timezone: string): void {
  cachedSystemTimezone = timezone;
}

/**
 * 清除系统时区缓存
 * @description 当后台修改时区配置时调用
 */
export function clearSystemTimezoneCache(): void {
  cachedSystemTimezone = null;
}

/**
 * 将 UTC 时间转换为指定时区的 Date 对象
 * @description 依据：开发文档.md 第3节 - toSystemTime 函数
 * @param date - UTC 时间（Date 对象或 ISO 字符串）
 * @param timezone - 目标时区，默认为系统配置时区
 * @returns 转换后的 Date 对象（注意：JS Date 本身没有时区，这里返回的是"看起来像目标时区"的本地时间）
 */
export function convertToTimezone(
  date: Date | string,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  const d = typeof date === 'string' ? new Date(date) : date;

  // 处理无效日期
  if (isNaN(d.getTime())) {
    return new Date(NaN);
  }

  // 使用 Intl.DateTimeFormat 获取时区感知的各部分
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);

  // 提取各部分
  const getValue = (type: string): number => {
    const part = parts.find((p) => p.type === type);
    return part ? parseInt(part.value, 10) : 0;
  };

  // 构建新的 Date 对象
  return new Date(
    getValue('year'),
    getValue('month') - 1, // 月份从 0 开始
    getValue('day'),
    getValue('hour'),
    getValue('minute'),
    getValue('second')
  );
}

/**
 * 获取指定时区的当前时间
 * @param timezone - 时区标识符
 * @returns 当前时间在指定时区的表示
 */
export function getNow(timezone: string = DEFAULT_TIMEZONE): Date {
  return convertToTimezone(new Date(), timezone);
}

/**
 * 获取指定时区今日的起始时间（00:00:00）
 * @description 用于签到、统计等需要日期边界的场景
 * @param timezone - 时区标识符
 * @returns 今日 00:00:00 的 Date 对象
 */
export function getTodayStart(timezone: string = DEFAULT_TIMEZONE): Date {
  const now = getNow(timezone);
  now.setHours(0, 0, 0, 0);
  return now;
}

/**
 * 获取指定时区今日的结束时间（23:59:59.999）
 * @param timezone - 时区标识符
 * @returns 今日 23:59:59.999 的 Date 对象
 */
export function getTodayEnd(timezone: string = DEFAULT_TIMEZONE): Date {
  const now = getNow(timezone);
  now.setHours(23, 59, 59, 999);
  return now;
}

/**
 * 判断当前时间是否在指定时间范围内
 * @description 用于提现时间窗口判断等场景
 * @param timeRange - 时间范围字符串，格式 "HH:mm-HH:mm"，如 "10:00-17:00"
 * @param timezone - 时区标识符
 * @returns 是否在时间范围内
 * @example
 * isInTimeRange('10:00-17:00');           // 判断当前是否在 10:00-17:00 之间
 * isInTimeRange('22:00-06:00');           // 支持跨日时间段
 */
export function isInTimeRange(
  timeRange: string,
  timezone: string = DEFAULT_TIMEZONE
): boolean {
  const [start, end] = timeRange.split('-');
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);

  const now = getNow(timezone);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // 处理跨日情况（如 22:00-06:00）
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * 将 UTC 时间转换为指定时区时间
 * @deprecated 推荐使用 convertToTimezone
 */
export function utcToTimezone(
  date: Date,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  return convertToTimezone(date, timezone);
}

/**
 * 计算两个日期之间的天数差
 * @param date1 - 第一个日期
 * @param date2 - 第二个日期
 * @returns 天数差（绝对值）
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / oneDay);
}

/**
 * 添加指定小时数
 * @param date - 原始日期
 * @param hours - 要添加的小时数（可为负数）
 * @returns 新的 Date 对象
 */
export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

/**
 * 添加指定天数
 * @param date - 原始日期
 * @param days - 要添加的天数（可为负数）
 * @returns 新的 Date 对象
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 添加指定分钟数
 * @param date - 原始日期
 * @param minutes - 要添加的分钟数（可为负数）
 * @returns 新的 Date 对象
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * 判断两个日期是否是同一天（基于时区）
 * @param date1 - 第一个日期
 * @param date2 - 第二个日期
 * @param timezone - 时区标识符
 * @returns 是否为同一天
 */
export function isSameDay(
  date1: Date,
  date2: Date,
  timezone: string = DEFAULT_TIMEZONE
): boolean {
  const d1 = convertToTimezone(date1, timezone);
  const d2 = convertToTimezone(date2, timezone);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * 获取系统时区的日期边界（用于签到、统计等）
 * @description 依据：开发文档.md 第3节 - getSystemDateBounds
 * @param timezone - 时区标识符
 * @returns 包含今日起止时间（UTC）的对象
 */
export function getSystemDateBounds(timezone: string = DEFAULT_TIMEZONE): {
  start: Date;
  end: Date;
} {
  return {
    start: getTodayStart(timezone),
    end: getTodayEnd(timezone),
  };
}

/**
 * 判断日期是否为今天（基于时区）
 * @param date - 要判断的日期
 * @param timezone - 时区标识符
 * @returns 是否为今天
 */
export function isToday(
  date: Date,
  timezone: string = DEFAULT_TIMEZONE
): boolean {
  return isSameDay(date, new Date(), timezone);
}

/**
 * 判断日期是否为昨天（基于时区）
 * @param date - 要判断的日期
 * @param timezone - 时区标识符
 * @returns 是否为昨天
 */
export function isYesterday(
  date: Date,
  timezone: string = DEFAULT_TIMEZONE
): boolean {
  const yesterday = addDays(new Date(), -1);
  return isSameDay(date, yesterday, timezone);
}
