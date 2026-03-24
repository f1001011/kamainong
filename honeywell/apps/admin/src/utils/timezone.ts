/**
 * @file 时区处理工具
 * @description 处理时区转换和时间格式化
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第7节 - 时区处理
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { useGlobalConfigStore, getTimezoneConfig } from '@/stores/config';

// 加载 dayjs 插件
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

import { DEFAULT_TIMEZONE, DEFAULT_TIMEZONE_DISPLAY_NAME } from './timezone-defaults';
export { DEFAULT_TIMEZONE, DEFAULT_TIMEZONE_DISPLAY_NAME };

/**
 * 获取系统配置的时区
 */
export function getSystemTimezone(): string {
  const config = getTimezoneConfig();
  return config.timezone || DEFAULT_TIMEZONE;
}

/**
 * 将 UTC 时间转换为系统时区时间
 * @param utcDate - UTC 时间（字符串或 Date 对象）
 * @param format - 输出格式
 */
export function formatSystemTime(
  utcDate: string | Date | null | undefined,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string {
  if (!utcDate) return '-';

  const timezone = getSystemTimezone();
  const date = dayjs(utcDate).tz(timezone);

  if (!date.isValid()) {
    return '-';
  }

  return date.format(format);
}

/**
 * 格式化为日期（不含时间）
 */
export function formatSystemDate(utcDate: string | Date | null | undefined): string {
  return formatSystemTime(utcDate, 'YYYY-MM-DD');
}

/**
 * 格式化为时间（不含日期）
 */
export function formatSystemTimeOnly(utcDate: string | Date | null | undefined): string {
  return formatSystemTime(utcDate, 'HH:mm:ss');
}

/**
 * 格式化为相对时间
 * @description 如 "3分钟前"、"2小时前"、"昨天"
 */
export function formatRelativeTime(utcDate: string | Date | null | undefined): string {
  if (!utcDate) return '-';

  const date = dayjs(utcDate);
  if (!date.isValid()) {
    return '-';
  }

  const now = dayjs();
  const diffMinutes = now.diff(date, 'minute');
  const diffHours = now.diff(date, 'hour');
  const diffDays = now.diff(date, 'day');

  // 1分钟内显示"刚刚"
  if (diffMinutes < 1) {
    return '刚刚';
  }

  // 1小时内显示"X分钟前"
  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  }

  // 24小时内显示"X小时前"
  if (diffHours < 24) {
    return `${diffHours}小时前`;
  }

  // 30天内显示"X天前"
  if (diffDays < 30) {
    return `${diffDays}天前`;
  }

  // 超过30天显示完整日期
  return formatSystemDate(utcDate);
}

/**
 * 获取时区显示名称
 */
export function getTimezoneDisplayName(): string {
  const config = getTimezoneConfig();
  return config.displayName || DEFAULT_TIMEZONE_DISPLAY_NAME;
}

/**
 * 检查时间是否在指定范围内
 * @param timeRange - 时间范围，格式 "HH:mm-HH:mm"
 */
export function isInTimeRange(timeRange: string): boolean {
  const timezone = getSystemTimezone();
  const now = dayjs().tz(timezone);
  const currentTime = now.format('HH:mm');

  const [start, end] = timeRange.split('-');
  if (!start || !end) return true;

  // 处理跨天的情况
  if (start <= end) {
    return currentTime >= start && currentTime <= end;
  } else {
    return currentTime >= start || currentTime <= end;
  }
}

/**
 * 将本地时间转换为 UTC 时间
 * @description 用于将用户选择的时间转换为 UTC 存储
 */
export function toUTC(localDate: Date | string | dayjs.Dayjs): string {
  const timezone = getSystemTimezone();
  return dayjs.tz(localDate, timezone).utc().toISOString();
}

/**
 * dayjs 实例（已配置时区）
 */
export { dayjs };
