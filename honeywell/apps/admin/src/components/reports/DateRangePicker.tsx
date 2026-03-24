/**
 * @file 日期范围选择器组件
 * @description 报表页面通用的日期筛选器，支持快捷选项和自定义范围
 * @depends 开发文档/04-后台管理端/04.2-数据报表/ - UX设计规范
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Space, Radio, DatePicker, Button } from 'antd';
import { RiCalendarLine, RiRefreshLine } from '@remixicon/react';
import { dayjs, getSystemTimezone } from '@/utils/timezone';
import { getDateRangeByQuickOption } from '@/services/reports';
import type { Dayjs } from 'dayjs';
import type { QuickDateRange, DateRangeParams } from '@/types/reports';

const { RangePicker } = DatePicker;

/**
 * 快捷选项配置
 */
const QUICK_OPTIONS: { value: QuickDateRange; label: string }[] = [
  { value: 'today', label: '今日' },
  { value: 'yesterday', label: '昨日' },
  { value: 'last7days', label: '近7天' },
  { value: 'last30days', label: '近30天' },
  { value: 'thisMonth', label: '本月' },
  { value: 'lastMonth', label: '上月' },
];

/**
 * 最大允许的日期跨度（天）
 */
const MAX_DATE_RANGE = 90;

interface DateRangePickerProps {
  /** 默认快捷选项 */
  defaultQuickOption?: QuickDateRange;
  /** 日期范围变化回调 */
  onChange?: (range: DateRangeParams) => void;
  /** 是否显示重置按钮 */
  showReset?: boolean;
  /** 禁用状态 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 日期范围选择器
 * @description 提供快捷选项和自定义日期范围选择
 */
export function DateRangePicker({
  defaultQuickOption = 'last7days',
  onChange,
  showReset = true,
  disabled = false,
  className,
}: DateRangePickerProps) {
  // 当前选中的快捷选项
  const [quickOption, setQuickOption] = useState<QuickDateRange>(defaultQuickOption);
  
  // 自定义日期范围
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null);
  
  // 是否显示自定义日期选择器
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // 系统时区
  const timezone = getSystemTimezone();

  /**
   * 获取当前日期范围
   */
  const getCurrentRange = useCallback((): DateRangeParams => {
    if (quickOption === 'custom' && customRange) {
      return {
        startDate: customRange[0].format('YYYY-MM-DD'),
        endDate: customRange[1].format('YYYY-MM-DD'),
      };
    }
    return getDateRangeByQuickOption(quickOption);
  }, [quickOption, customRange]);

  /**
   * 快捷选项变化
   */
  const handleQuickOptionChange = (value: QuickDateRange) => {
    setQuickOption(value);
    
    if (value === 'custom') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
      const range = getDateRangeByQuickOption(value);
      onChange?.(range);
    }
  };

  /**
   * 自定义日期范围变化
   */
  const handleCustomRangeChange = (dates: [Dayjs, Dayjs] | null) => {
    if (dates && dates[0] && dates[1]) {
      setCustomRange(dates);
      setQuickOption('custom');
      onChange?.({
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
      });
    }
  };

  /**
   * 重置为默认
   */
  const handleReset = () => {
    setQuickOption(defaultQuickOption);
    setCustomRange(null);
    setShowCustomPicker(false);
    const range = getDateRangeByQuickOption(defaultQuickOption);
    onChange?.(range);
  };

  /**
   * 禁用超过90天的日期范围
   */
  const disabledDate = (current: Dayjs, info: { from?: Dayjs }) => {
    if (info.from) {
      const diff = Math.abs(current.diff(info.from, 'day'));
      return diff > MAX_DATE_RANGE;
    }
    return false;
  };

  // 初始化时触发一次 onChange
  useEffect(() => {
    const range = getDateRangeByQuickOption(defaultQuickOption);
    onChange?.(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`report-date-picker ${className || ''}`}>
      <Space size={12} wrap>
        {/* 快捷选项 */}
        <Radio.Group
          value={quickOption === 'custom' ? undefined : quickOption}
          onChange={(e) => handleQuickOptionChange(e.target.value)}
          disabled={disabled}
          optionType="button"
          buttonStyle="solid"
        >
          {QUICK_OPTIONS.map((opt) => (
            <Radio.Button key={opt.value} value={opt.value}>
              {opt.label}
            </Radio.Button>
          ))}
        </Radio.Group>

        {/* 自定义按钮 */}
        <Button
          type={quickOption === 'custom' ? 'primary' : 'default'}
          icon={<RiCalendarLine size={16} />}
          onClick={() => {
            setShowCustomPicker(!showCustomPicker);
            if (!showCustomPicker && quickOption !== 'custom') {
              // 初始化自定义范围为当前范围
              const range = getCurrentRange();
              setCustomRange([
                dayjs(range.startDate).tz(timezone),
                dayjs(range.endDate).tz(timezone),
              ]);
            }
          }}
          disabled={disabled}
        >
          自定义
        </Button>

        {/* 自定义日期选择器 */}
        {showCustomPicker && (
          <RangePicker
            value={customRange}
            onChange={(dates) => handleCustomRangeChange(dates as [Dayjs, Dayjs] | null)}
            disabledDate={(current, info) => disabledDate(current, info)}
            disabled={disabled}
            allowClear={false}
            placeholder={['开始日期', '结束日期']}
            format="YYYY-MM-DD"
          />
        )}

        {/* 重置按钮 */}
        {showReset && (
          <Button
            icon={<RiRefreshLine size={16} />}
            onClick={handleReset}
            disabled={disabled}
          >
            重置
          </Button>
        )}
      </Space>

      {/* 显示当前选择的日期范围 */}
      <div className="date-range-display">
        <span className="date-range-label">
          当前范围：{getCurrentRange().startDate} 至 {getCurrentRange().endDate}
        </span>
      </div>
    </div>
  );
}

export default DateRangePicker;
