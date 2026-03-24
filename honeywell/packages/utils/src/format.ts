/**
 * @file 格式化工具函数
 * @description 提供货币、百分比、手机号、日期时间等格式化功能
 * @depends 开发文档/00-项目基础/00.3-开发规范.md - 金额与时间格式化规范
 * @depends 开发文档.md 第3节 - 时区配置
 */

import { Decimal } from 'decimal.js';

import { DEFAULT_CONFIG } from '@honeywell/config';

/**
 * 默认时区（统一从 @honeywell/config 读取，禁止硬编码）
 */
const DEFAULT_TIMEZONE = DEFAULT_CONFIG.SYSTEM_TIMEZONE;

/**
 * 默认货币符号
 */
const DEFAULT_CURRENCY_SYMBOL = 'MAD';

/** 货币格式化配置接口 */
interface CurrencyFormatConfig {
  currencySymbol?: string;
  currencySpace?: boolean;
  currencyDecimals?: number;
  currencyThousandsSep?: string;
  /** 兼容 GlobalConfig 中可能存在的其他字段 */
  [key: string]: unknown;
}

/**
 * 格式化货币金额
 * @description 依据：00.3-开发规范.md - 金额必须使用统一函数
 * MAD 格式：MAD 1,500,000（无小数位，逗号千分位）
 *
 * 支持两种调用方式：
 * 1. 配置对象（推荐）：formatCurrency(amount, config)
 * 2. 旧版兼容：formatCurrency(amount, symbol, space)
 *
 * @param amount - 金额（支持 number、string、Decimal 类型）
 * @param configOrSymbol - 配置对象或货币符号字符串
 * @param currencySpace - 旧版兼容：符号与金额间是否加空格
 * @returns 格式化后的货币字符串，如 "MAD 1,500,000"
 * @example
 * formatCurrency(1500000);                          // "MAD 1,500,000"
 * formatCurrency(1500000, globalConfig);             // "MAD 1,500,000"
 * formatCurrency(1500000, { currencySymbol: 'USD' }); // "USD 1,500,000"
 * formatCurrency(1500000, 'MAD', false);             // "MAD1,500,000"
 */
export function formatCurrency(
  amount: number | string | Decimal,
  configOrSymbol?: string | CurrencyFormatConfig | null,
  currencySpace?: boolean
): string {
  // 解析配置：区分对象参数和旧版字符串参数
  let symbol = DEFAULT_CURRENCY_SYMBOL;
  let space = true;
  let decimals = 0;
  let thousandsSep = ',';

  if (configOrSymbol != null && typeof configOrSymbol === 'object') {
    symbol = configOrSymbol.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL;
    space = configOrSymbol.currencySpace ?? true;
    decimals = configOrSymbol.currencyDecimals ?? 0;
    thousandsSep = configOrSymbol.currencyThousandsSep ?? ',';
  } else if (typeof configOrSymbol === 'string') {
    symbol = configOrSymbol;
    space = currencySpace ?? true;
  }

  // 统一转换为数字
  let num: number;
  if (amount instanceof Decimal) {
    num = amount.toNumber();
  } else {
    num = Number(amount);
  }

  // 处理 NaN 和 Infinity
  if (!Number.isFinite(num)) {
    num = 0;
  }

  // 按指定小数位数格式化
  const fixed = num.toFixed(decimals);

  // 插入千分位分隔符（仅处理整数部分）
  const [intPart, decPart] = fixed.split('.');
  const signedInt = intPart.startsWith('-') ? intPart.slice(1) : intPart;
  const isNegative = intPart.startsWith('-');
  const withSep = signedInt.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);
  const formatted = decPart !== undefined
    ? `${isNegative ? '-' : ''}${withSep}.${decPart}`
    : `${isNegative ? '-' : ''}${withSep}`;

  const spacer = space ? ' ' : '';
  return `${symbol}${spacer}${formatted}`;
}

/**
 * formatAmount 是 formatCurrency 的别名，保持向后兼容
 * @deprecated 请迁移至 formatCurrency，此别名将在未来版本移除
 */
export const formatAmount: typeof formatCurrency = formatCurrency;

/**
 * 格式化系统时间
 * @description 依据：开发文档.md 第3节 - 时区统一原则
 * 将 UTC 时间转换为系统配置时区的显示时间
 * @param date - UTC 时间（Date 对象或 ISO 字符串）
 * @param format - 输出格式，支持 'datetime' | 'date' | 'time' | 自定义格式
 * @param timezone - 目标时区，默认 Africa/Casablanca（实际使用时应从配置获取）
 * @returns 格式化后的时间字符串
 * @example
 * formatSystemTime(new Date());                    // "05/02/2026, 10:30:00"
 * formatSystemTime(new Date(), 'date');            // "05/02/2026"
 * formatSystemTime(new Date(), 'time');            // "10:30:00"
 * formatSystemTime(new Date(), 'datetime', 'Asia/Shanghai'); // 上海时间
 */
export function formatSystemTime(
  date: Date | string,
  format: 'datetime' | 'date' | 'time' | string = 'datetime',
  timezone: string = DEFAULT_TIMEZONE
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  // 处理无效日期
  if (isNaN(d.getTime())) {
    return '';
  }

  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
  };

  switch (format) {
    case 'datetime':
      return d.toLocaleString('ar-MA', {
        ...options,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    case 'date':
      return d.toLocaleDateString('ar-MA', {
        ...options,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    case 'time':
      return d.toLocaleTimeString('ar-MA', {
        ...options,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    default:
      // 自定义格式：支持 yyyy-MM-dd HH:mm:ss 模式
      return formatCustomPattern(d, format, timezone);
  }
}

/**
 * 自定义格式模式格式化
 * @param date - 日期对象
 * @param pattern - 格式模式，如 'yyyy-MM-dd HH:mm:ss'
 * @param timezone - 时区
 * @returns 格式化后的字符串
 */
function formatCustomPattern(
  date: Date,
  pattern: string,
  timezone: string
): string {
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
  }).formatToParts(date);

  // 提取各部分
  const getValue = (type: string): string => {
    const part = parts.find((p) => p.type === type);
    return part?.value || '';
  };

  const year = getValue('year');
  const month = getValue('month');
  const day = getValue('day');
  const hour = getValue('hour');
  const minute = getValue('minute');
  const second = getValue('second');

  // 替换模式
  return pattern
    .replace(/yyyy/g, year)
    .replace(/MM/g, month)
    .replace(/dd/g, day)
    .replace(/HH/g, hour)
    .replace(/mm/g, minute)
    .replace(/ss/g, second);
}

/**
 * 格式化百分比
 * @param value - 百分比值（如 5 表示 5%）
 * @param decimals - 小数位数，默认 2
 * @returns 格式化后的百分比字符串
 * @example
 * formatPercent(5);     // "5.00%"
 * formatPercent(5.5, 1); // "5.5%"
 */
export function formatPercent(value: number | string, decimals: number = 2): string {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return '0.00%';
  }
  return `${num.toFixed(decimals)}%`;
}

/**
 * 格式化手机号显示
 * @description 格式：{区号} {号码}，如 "+212 612345678"
 * @param phone - 手机号
 * @param areaCode - 区号，默认 +212（摩洛哥）
 * @returns 格式化后的手机号
 */
export function formatPhone(phone: string, areaCode: string = '+212'): string {
  // 移除已有的区号和空格
  const cleanPhone = phone.replace(/^\+\d+\s*/, '').trim();
  return `${areaCode} ${cleanPhone}`;
}

/**
 * 格式化日期时间（本地化）
 * @deprecated 推荐使用 formatSystemTime
 */
export function formatDateTime(
  date: Date | string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  return formatSystemTime(date, 'datetime', timezone);
}

/**
 * 格式化日期（本地化）
 * @deprecated 推荐使用 formatSystemTime(date, 'date')
 */
export function formatDate(
  date: Date | string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  return formatSystemTime(date, 'date', timezone);
}

/**
 * 格式化时间（本地化）
 * @deprecated 推荐使用 formatSystemTime(date, 'time')
 */
export function formatTime(
  date: Date | string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  return formatSystemTime(date, 'time', timezone);
}
