/**
 * @file 时间显示组件
 * @description 统一的时间显示组件，自动处理时区转换
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第7.3节 - 时间显示组件
 */

'use client';

import React from 'react';
import { Tooltip } from 'antd';
import {
  formatSystemTime,
  formatSystemDate,
  formatRelativeTime,
  getTimezoneDisplayName,
} from '@/utils/timezone';

export interface TimeDisplayProps {
  /** 时间值（UTC 时间） */
  value: string | Date | null | undefined;
  /** 显示格式 */
  format?: 'datetime' | 'date' | 'time' | 'relative' | string;
  /** 是否显示时区提示 */
  showTooltip?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 时间显示组件
 * @description 自动将 UTC 时间转换为系统配置时区显示
 * @example
 * <TimeDisplay value="2026-02-05T10:30:00Z" />                    // 完整日期时间
 * <TimeDisplay value="2026-02-05T10:30:00Z" format="date" />      // 仅日期
 * <TimeDisplay value="2026-02-05T10:30:00Z" format="relative" />  // 相对时间
 */
export function TimeDisplay({
  value,
  format = 'datetime',
  showTooltip = true,
  className,
  style,
}: TimeDisplayProps) {
  // 空值处理
  if (!value) {
    return (
      <span className={className} style={style}>
        -
      </span>
    );
  }

  // 根据格式类型获取显示文本
  let displayText: string;
  let fullText: string;

  switch (format) {
    case 'datetime':
      displayText = formatSystemTime(value, 'YYYY-MM-DD HH:mm:ss');
      fullText = displayText;
      break;
    case 'date':
      displayText = formatSystemDate(value);
      fullText = formatSystemTime(value, 'YYYY-MM-DD HH:mm:ss');
      break;
    case 'time':
      displayText = formatSystemTime(value, 'HH:mm:ss');
      fullText = formatSystemTime(value, 'YYYY-MM-DD HH:mm:ss');
      break;
    case 'relative':
      displayText = formatRelativeTime(value);
      fullText = formatSystemTime(value, 'YYYY-MM-DD HH:mm:ss');
      break;
    default:
      // 自定义格式
      displayText = formatSystemTime(value, format);
      fullText = formatSystemTime(value, 'YYYY-MM-DD HH:mm:ss');
  }

  // 相对时间或仅日期时显示 tooltip
  const needTooltip = showTooltip && (format === 'relative' || format === 'date');
  const timezoneDisplayName = getTimezoneDisplayName();

  const content = (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums', ...style }}>
      {displayText}
    </span>
  );

  if (needTooltip) {
    return (
      <Tooltip title={`${fullText} (${timezoneDisplayName})`}>
        {content}
      </Tooltip>
    );
  }

  return content;
}

/**
 * 相对时间显示组件
 * @description 便捷组件，默认显示相对时间
 */
export function RelativeTime({
  value,
  className,
  style,
}: Omit<TimeDisplayProps, 'format'>) {
  return (
    <TimeDisplay
      value={value}
      format="relative"
      showTooltip
      className={className}
      style={style}
    />
  );
}

/**
 * 日期显示组件
 * @description 便捷组件，默认显示日期
 */
export function DateDisplay({
  value,
  className,
  style,
}: Omit<TimeDisplayProps, 'format'>) {
  return (
    <TimeDisplay
      value={value}
      format="date"
      showTooltip
      className={className}
      style={style}
    />
  );
}

export default TimeDisplay;
