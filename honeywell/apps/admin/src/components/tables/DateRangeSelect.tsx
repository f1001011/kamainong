/**
 * @file 日期范围选择组件
 * @description 带快捷选项的日期范围选择器，自动按系统时区处理
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第11节 - 常用组件规范
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { DatePicker, Space, Button, Dropdown, Typography, message } from 'antd';
import type { MenuProps } from 'antd';
import { RiCalendarLine, RiArrowDownSLine } from '@remixicon/react';
import dayjs, { Dayjs } from 'dayjs';
import { getSystemTimezone } from '@/utils/timezone';

const { Text } = Typography;
const { RangePicker } = DatePicker;

/**
 * 日期范围值类型
 */
export type DateRangeValue = [Dayjs, Dayjs] | null;

/**
 * 快捷选项类型
 */
export interface QuickOption {
  /** 选项标签 */
  label: string;
  /** 选项值 */
  value: string;
  /** 获取日期范围 */
  getRange: () => [Dayjs, Dayjs];
}

export interface DateRangeSelectProps {
  /** 当前值 */
  value?: DateRangeValue;
  /** 值变化回调 */
  onChange?: (value: DateRangeValue, option?: QuickOption) => void;
  /** 最大跨度（天数） */
  maxRange?: number;
  /** 是否禁用未来日期 */
  disableFuture?: boolean;
  /** 自定义快捷选项 */
  quickOptions?: QuickOption[];
  /** 是否显示快捷选项 */
  showQuickOptions?: boolean;
  /** 占位符 */
  placeholder?: [string, string];
  /** 禁用状态 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 尺寸 */
  size?: 'small' | 'middle' | 'large';
}

/**
 * 默认快捷选项
 */
const getDefaultQuickOptions = (): QuickOption[] => [
  {
    label: '今日',
    value: 'today',
    getRange: () => [dayjs().startOf('day'), dayjs().endOf('day')],
  },
  {
    label: '昨日',
    value: 'yesterday',
    getRange: () => [
      dayjs().subtract(1, 'day').startOf('day'),
      dayjs().subtract(1, 'day').endOf('day'),
    ],
  },
  {
    label: '近7天',
    value: 'last7days',
    getRange: () => [
      dayjs().subtract(6, 'day').startOf('day'),
      dayjs().endOf('day'),
    ],
  },
  {
    label: '近30天',
    value: 'last30days',
    getRange: () => [
      dayjs().subtract(29, 'day').startOf('day'),
      dayjs().endOf('day'),
    ],
  },
  {
    label: '本月',
    value: 'thisMonth',
    getRange: () => [
      dayjs().startOf('month'),
      dayjs().endOf('day'),
    ],
  },
  {
    label: '上月',
    value: 'lastMonth',
    getRange: () => [
      dayjs().subtract(1, 'month').startOf('month'),
      dayjs().subtract(1, 'month').endOf('month'),
    ],
  },
];

/**
 * 日期范围选择组件
 * @description 带快捷选项的日期范围选择器
 * @example
 * <DateRangeSelect
 *   value={dateRange}
 *   onChange={setDateRange}
 *   maxRange={90}
 *   disableFuture
 * />
 */
export function DateRangeSelect({
  value,
  onChange,
  maxRange,
  disableFuture = true,
  quickOptions,
  showQuickOptions = true,
  placeholder = ['开始日期', '结束日期'],
  disabled = false,
  className,
  style,
  size = 'middle',
}: DateRangeSelectProps) {
  // 当前选中的快捷选项
  const [selectedQuick, setSelectedQuick] = useState<string | null>(null);

  // 快捷选项列表
  const options = useMemo(
    () => quickOptions || getDefaultQuickOptions(),
    [quickOptions]
  );

  /**
   * 禁用日期判断
   */
  const disabledDate = useCallback(
    (current: Dayjs) => {
      if (!current) return false;

      // 禁用未来日期
      if (disableFuture && current.isAfter(dayjs().endOf('day'))) {
        return true;
      }

      // 最大跨度限制
      if (maxRange && value) {
        const [start, end] = value;
        if (start && !end) {
          // 已选择开始日期，限制结束日期范围
          const maxEnd = start.add(maxRange - 1, 'day');
          const minStart = start.subtract(maxRange - 1, 'day');
          return current.isAfter(maxEnd) || current.isBefore(minStart);
        }
      }

      return false;
    },
    [disableFuture, maxRange, value]
  );

  /**
   * 处理日期范围变化
   */
  const handleRangeChange = useCallback(
    (dates: [Dayjs | null, Dayjs | null] | null, _dateStrings: [string, string]) => {
      // 转换类型
      const rangeValue: DateRangeValue = dates && dates[0] && dates[1]
        ? [dates[0], dates[1]]
        : null;

      // 检查最大跨度
      if (maxRange && rangeValue) {
        const [start, end] = rangeValue;
        if (start && end) {
          const diff = end.diff(start, 'day') + 1;
          if (diff > maxRange) {
            message.warning(`日期范围不能超过 ${maxRange} 天`);
            return;
          }
        }
      }

      setSelectedQuick(null);
      onChange?.(rangeValue);
    },
    [maxRange, onChange]
  );

  /**
   * 处理快捷选项点击
   */
  const handleQuickSelect = useCallback(
    (option: QuickOption) => {
      const range = option.getRange();
      setSelectedQuick(option.value);
      onChange?.(range, option);
    },
    [onChange]
  );

  // 快捷选项菜单
  const quickMenuItems: MenuProps['items'] = options.map((option) => ({
    key: option.value,
    label: (
      <span
        style={{
          color: selectedQuick === option.value ? '#1677ff' : undefined,
          fontWeight: selectedQuick === option.value ? 500 : undefined,
        }}
      >
        {option.label}
      </span>
    ),
    onClick: () => handleQuickSelect(option),
  }));

  // 获取当前显示的快捷选项标签
  const currentQuickLabel = selectedQuick
    ? options.find((o) => o.value === selectedQuick)?.label
    : null;

  return (
    <Space size={8} className={`date-range-select ${className || ''}`} style={style}>
      {/* 快捷选项下拉 */}
      {showQuickOptions && (
        <Dropdown
          menu={{ items: quickMenuItems }}
          trigger={['click']}
          disabled={disabled}
          overlayStyle={{
            borderRadius: 'var(--radius-md, 8px)',
          }}
        >
          <Button
            icon={<RiCalendarLine size={16} />}
            disabled={disabled}
            size={size}
            style={{
              minWidth: 110,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 'var(--radius-md, 8px)',
              transition: 'all 0.25s ease',
              borderColor: currentQuickLabel ? 'var(--color-primary, #1677ff)' : undefined,
              color: currentQuickLabel ? 'var(--color-primary, #1677ff)' : undefined,
            }}
          >
            <span style={{ flex: 1, textAlign: 'left' }}>
              {currentQuickLabel || '快捷选择'}
            </span>
            <RiArrowDownSLine size={16} style={{ marginLeft: 4 }} />
          </Button>
        </Dropdown>
      )}

      {/* 日期范围选择器 */}
      <RangePicker
        value={value}
        onChange={handleRangeChange}
        disabledDate={disabledDate}
        placeholder={placeholder}
        disabled={disabled}
        size={size}
        style={{ minWidth: 240 }}
        allowClear
      />

      {/* 最大跨度提示 */}
      {maxRange && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          最多 {maxRange} 天
        </Text>
      )}
    </Space>
  );
}

export default DateRangeSelect;
