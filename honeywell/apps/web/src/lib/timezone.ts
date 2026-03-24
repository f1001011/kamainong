/**
 * @file 时区处理工具
 * @description 统一使用系统时区（从全局配置获取）进行时间显示
 * @reference 开发文档/00-项目基础/00.3-开发规范.md
 */

/**
 * 默认系统时区（统一在此定义，禁止在其他文件硬编码）
 * @description 与 packages/config DEFAULT_CONFIG.SYSTEM_TIMEZONE 保持一致
 */
export const DEFAULT_SYSTEM_TIMEZONE = 'Africa/Casablanca';

/**
 * 默认时区显示名称
 */
export const DEFAULT_TIMEZONE_DISPLAY_NAME = 'توقيت المغرب (UTC+1)';

/**
 * 时间格式化选项
 */
export interface FormatOptions {
  /** 日期格式 */
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  /** 时间格式 */
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  /** 是否显示日期 */
  showDate?: boolean;
  /** 是否显示时间 */
  showTime?: boolean;
}

/**
 * 格式化为系统时区时间
 * @description 将 UTC 时间转换为系统时区显示
 * @param utcDate - UTC 时间字符串或 Date 对象
 * @param timezone - 系统时区（如：Africa/Casablanca）
 * @param format - 格式化模式
 * @returns 格式化后的时间字符串
 */
export function formatSystemTime(
  utcDate: string | Date,
  timezone: string,
  format: string = 'yyyy-MM-dd HH:mm:ss'
): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  // 使用 Intl.DateTimeFormat 进行时区转换
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
  };
  
  // 根据格式添加选项
  if (format.includes('yyyy')) {
    options.year = 'numeric';
  }
  if (format.includes('MM')) {
    options.month = '2-digit';
  }
  if (format.includes('dd')) {
    options.day = '2-digit';
  }
  if (format.includes('HH')) {
    options.hour = '2-digit';
    options.hour12 = false;
  }
  if (format.includes('mm')) {
    options.minute = '2-digit';
  }
  if (format.includes('ss')) {
    options.second = '2-digit';
  }
  
  try {
    const formatter = new Intl.DateTimeFormat('ar-MA', options);
    const parts = formatter.formatToParts(date);
    
    // 构建格式化字符串
    let result = format;
    const partValues: Record<string, string> = {};
    
    for (const part of parts) {
      partValues[part.type] = part.value;
    }
    
    result = result.replace('yyyy', partValues.year || '');
    result = result.replace('MM', partValues.month || '');
    result = result.replace('dd', partValues.day || '');
    result = result.replace('HH', partValues.hour || '');
    result = result.replace('mm', partValues.minute || '');
    result = result.replace('ss', partValues.second || '');
    
    return result;
  } catch {
    // 降级处理
    return date.toISOString();
  }
}

/**
 * 格式化为相对时间
 * @description 显示相对时间（如：刚刚、5分钟前、2小时前）
 * @param utcDate - UTC 时间字符串或 Date 对象
 * @param timezone - 系统时区（从 GlobalConfig 获取）
 * @param t - 文案获取函数
 * @returns 相对时间字符串
 */
export function formatRelativeTime(
  utcDate: string | Date,
  timezone: string,
  t: (key: string) => string
): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffSeconds < 60) {
    return t('time.justNow') || 'الآن';
  }
  
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} ${t('time.minutesAgo') || 'د'}`;
  }
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} ${t('time.hoursAgo') || 'س'}`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} ${t('time.daysAgo') || 'ي'}`;
  }
  
  // 超过7天显示具体日期（使用传入的时区配置，禁止硬编码）
  return formatSystemTime(date, timezone, 'yyyy-MM-dd');
}

/**
 * 格式化日期（仅日期部分）
 * @param utcDate - UTC 时间字符串或 Date 对象
 * @param timezone - 系统时区
 * @returns 格式化后的日期字符串（如：2024-01-15）
 */
export function formatDate(
  utcDate: string | Date,
  timezone: string
): string {
  return formatSystemTime(utcDate, timezone, 'yyyy-MM-dd');
}

/**
 * 格式化时间（仅时间部分）
 * @param utcDate - UTC 时间字符串或 Date 对象
 * @param timezone - 系统时区
 * @returns 格式化后的时间字符串（如：14:30:00）
 */
export function formatTime(
  utcDate: string | Date,
  timezone: string
): string {
  return formatSystemTime(utcDate, timezone, 'HH:mm:ss');
}

/**
 * 获取今天的开始时间（系统时区）
 * @param timezone - 系统时区
 * @returns 今天开始时间的 Date 对象
 */
export function getTodayStart(timezone: string): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateStr = formatter.format(now);
  return new Date(`${dateStr}T00:00:00`);
}

/**
 * 获取今天的结束时间（系统时区）
 * @param timezone - 系统时区
 * @returns 今天结束时间的 Date 对象
 */
export function getTodayEnd(timezone: string): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateStr = formatter.format(now);
  return new Date(`${dateStr}T23:59:59.999`);
}

/**
 * 检查日期是否是今天（系统时区）
 * @param utcDate - UTC 时间字符串或 Date 对象
 * @param timezone - 系统时区
 * @returns 是否是今天
 */
export function isToday(utcDate: string | Date, timezone: string): boolean {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const today = new Date();
  
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  return formatter.format(date) === formatter.format(today);
}
