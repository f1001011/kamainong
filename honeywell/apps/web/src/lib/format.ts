/**
 * @file 格式化工具函数
 * @description 货币、数字等格式化函数
 * @reference 开发文档/00-项目基础/00.3-开发规范.md
 */

import type { GlobalConfig } from '@/types';
import { getGlobalConfig } from '@/stores/global-config';
import { formatSystemTime, isToday as isTodayTz } from '@/lib/timezone';

/**
 * 格式化货币
 * @description 使用全局配置中的货币符号格式化金额
 * @param amount - 金额（字符串或数字）
 * @param config - 全局配置（包含货币符号）
 * @param options - 格式化选项
 * @returns 格式化后的货币字符串（如：$ 100.000）
 */
export function formatCurrency(
  amount: string | number,
  config: Pick<GlobalConfig, 'currencySymbol'> & {
    currencyDecimals?: number;
    currencyThousandsSep?: string;
    currencySpace?: boolean;
  },
  options: {
    showSymbol?: boolean;
    decimals?: number;
    showSign?: boolean;
  } = {}
): string {
  const configDecimals = config.currencyDecimals ?? 0;
  const thousandsSep = config.currencyThousandsSep ?? ',';
  const space = config.currencySpace !== false ? ' ' : '';
  const { showSymbol = true, decimals = configDecimals, showSign = false } = options;
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) {
    return showSymbol ? `${config.currencySymbol}${space}0` : '0';
  }
  
  const absValue = decimals > 0 
    ? Math.abs(num).toFixed(decimals)
    : Math.round(Math.abs(num)).toString();
  
  const formattedValue = absValue.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);
  
  let sign = '';
  if (showSign) {
    if (num > 0) sign = '+';
    else if (num < 0) sign = '-';
  } else if (num < 0) {
    sign = '-';
  }
  
  if (showSymbol) {
    return `${sign}${config.currencySymbol}${space}${formattedValue}`;
  }
  return `${sign}${formattedValue}`;
}

/**
 * 格式化百分比
 * @param value - 小数值（如 0.05 表示 5%）
 * @param decimals - 小数位数，默认 2
 * @returns 格式化后的百分比字符串（如：5.00%）
 */
export function formatPercent(value: string | number, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0%';
  
  return `${(num * 100).toFixed(decimals)}%`;
}

/**
 * 格式化大数字
 * @description 将大数字简化显示（如：1.2K、3.5M）
 * @param value - 数字
 * @param decimals - 小数位数，默认 1
 * @returns 格式化后的字符串
 */
export function formatLargeNumber(value: number, decimals: number = 1): string {
  if (value < 1000) return value.toString();
  if (value < 1000000) return `${(value / 1000).toFixed(decimals)}K`;
  if (value < 1000000000) return `${(value / 1000000).toFixed(decimals)}M`;
  return `${(value / 1000000000).toFixed(decimals)}B`;
}

/**
 * 格式化手机号显示
 * @param phone - 手机号
 * @param countryCode - 国家代码，默认 +212（摩洛哥）
 * @returns 格式化后的手机号（如：+212 612 345 678）
 */
export function formatPhoneDisplay(phone: string, countryCode: string = '+212'): string {
  if (!phone) return '';
  
  const digits = phone.replace(/\D/g, '');
  
  // 9位摩洛哥手机号格式化: +212 612 345 678
  if (digits.length === 9) {
    return `${countryCode} ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  
  return `${countryCode} ${digits}`;
}

/**
 * 格式化订单号显示
 * @description 为长订单号添加空格分隔，提高可读性
 * @param orderNo - 订单号
 * @returns 格式化后的订单号
 */
export function formatOrderNo(orderNo: string): string {
  if (!orderNo) return '';
  
  // 每4个字符添加一个空格
  return orderNo.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * 解析金额字符串
 * @description 将格式化的金额字符串解析为数字
 * @param formattedAmount - 格式化的金额字符串
 * @returns 数字
 */
export function parseAmount(formattedAmount: string): number {
  if (!formattedAmount) return 0;
  
  // 移除货币符号、空格、逗号
  const cleaned = formattedAmount
    .replace(/[^0-9.-]/g, '');
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * 格式化收益天数
 * @param days - 天数
 * @param t - 文案获取函数
 * @returns 格式化后的天数字符串
 */
export function formatDays(days: number, t: (key: string) => string): string {
  if (days <= 0) return t('time.today');
  if (days === 1) return t('time.oneDay');
  return `${days} ${t('time.days')}`;
}

/**
 * 格式化倒计时
 * @param seconds - 剩余秒数
 * @returns 格式化后的倒计时字符串（如：02:30:15）
 */
export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '00:00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0'),
  ].join(':');
}

// ========================================
// 消息模块格式化函数
// 依据：03.12.1-消息列表页.md 第五节
// ========================================

import type { NotificationItem } from '@/types/notification';

/**
 * 消息日期分组结构
 */
export interface MessageGroup {
  /** 日期（ISO日期格式，如 2026-02-04） */
  date: string;
  /** 该日期下的消息列表 */
  messages: NotificationItem[];
}

/**
 * 将消息按日期分组
 * @description 依据：03.12.1-消息列表页.md - 日期分组时间线
 * @description 使用系统时区（从全局配置获取）进行日期分组
 * @param messages 消息列表
 * @returns 按日期分组的消息数组
 */
export function groupMessagesByDate(messages: NotificationItem[]): MessageGroup[] {
  const groups = new Map<string, NotificationItem[]>();
  const { systemTimezone } = getGlobalConfig();

  for (const message of messages) {
    // 使用系统时区提取日期部分（YYYY-MM-DD）
    const dateKey = formatSystemTime(message.createdAt, systemTimezone, 'yyyy-MM-dd');
    
    const existing = groups.get(dateKey) || [];
    groups.set(dateKey, [...existing, message]);
  }

  // 转换为数组，日期倒序排列
  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, messages]) => ({
      date,
      messages,
    }));
}

/**
 * 格式化消息日期显示
 * @description 依据：03.12.1-消息列表页.md - 今天/昨天/具体日期
 * @description 使用系统时区（从全局配置获取）进行日期判断
 * @param dateStr ISO日期字符串
 * @param t 文案函数
 * @returns 格式化后的日期文案
 */
export function formatMessageDate(
  dateStr: string,
  t: (key: string, defaultValue?: string) => string
): string {
  const { systemTimezone } = getGlobalConfig();
  
  // 使用系统时区判断是否是今天
  if (isTodayTz(dateStr, systemTimezone)) {
    return t('date.today');
  }

  // 使用系统时区判断是否是昨天
  if (isYesterday(dateStr, systemTimezone)) {
    return t('date.yesterday');
  }

  // 其他日期返回具体日期（使用系统时区格式化）
  return formatSystemTime(dateStr, systemTimezone, 'yyyy-MM-dd');
}

/**
 * 格式化消息时间（相对/绝对）
 * @description 依据：03.12.1-消息列表页.md - 当天显示 HH:mm，其他显示 MM-dd HH:mm
 * @description 使用系统时区（从全局配置获取）进行时间格式化
 * @param dateTimeStr ISO时间字符串
 * @returns 格式化后的时间
 */
export function formatMessageTime(dateTimeStr: string): string {
  const { systemTimezone } = getGlobalConfig();

  // 当天只显示时间
  if (isTodayTz(dateTimeStr, systemTimezone)) {
    return formatSystemTime(dateTimeStr, systemTimezone, 'HH:mm');
  }

  // 其他日期显示 MM-dd HH:mm
  return formatSystemTime(dateTimeStr, systemTimezone, 'MM-dd HH:mm');
}

/**
 * 判断给定日期是否是昨天（使用系统时区）
 * @param dateStr ISO日期字符串
 * @param timezone 系统时区
 * @returns 是否是昨天
 */
function isYesterday(dateStr: string, timezone: string): boolean {
  // 获取系统时区的"昨天"日期
  const now = new Date();
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  
  // 使用系统时区格式化昨天日期和给定日期
  const yesterdayStr = formatSystemTime(yesterdayDate.toISOString(), timezone, 'yyyy-MM-dd');
  const inputDateStr = formatSystemTime(dateStr, timezone, 'yyyy-MM-dd');
  
  return yesterdayStr === inputDateStr;
}
