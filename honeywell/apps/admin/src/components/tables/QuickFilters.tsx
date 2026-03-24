/**
 * @file 快捷筛选标签组件
 * @description 横向标签列表筛选器，支持单选/多选，可显示数量徽章
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第11节 - 常用组件规范
 */

'use client';

import React, { useCallback } from 'react';
import { Space, Tag, Badge } from 'antd';

/**
 * 筛选选项类型
 */
export interface FilterOption<T = string> {
  /** 选项值 */
  value: T;
  /** 显示标签 */
  label: string;
  /** 数量徽章 */
  count?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 徽章颜色 */
  badgeColor?: string;
}

export interface QuickFiltersProps<T = string> {
  /** 筛选选项列表 */
  options: FilterOption<T>[];
  /** 当前选中值 */
  value?: T | T[];
  /** 选中变化回调 */
  onChange?: (value: T | T[] | undefined) => void;
  /** 是否多选模式 */
  multiple?: boolean;
  /** 是否允许取消选择（单选模式） */
  allowClear?: boolean;
  /** 全选项配置（多选模式有效） */
  allOption?: {
    label: string;
    value: T;
  };
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 标签尺寸 */
  size?: 'small' | 'default';
}

/**
 * 快捷筛选标签组件
 * @description 横向标签列表，支持单选/多选，可显示数量徽章
 * @example
 * // 单选模式
 * <QuickFilters
 *   options={[
 *     { value: 'all', label: '全部' },
 *     { value: 'pending', label: '待审核', count: 15, badgeColor: 'orange' },
 *     { value: 'approved', label: '已通过' },
 *   ]}
 *   value={status}
 *   onChange={setStatus}
 * />
 *
 * // 多选模式
 * <QuickFilters
 *   options={statusOptions}
 *   value={selectedStatuses}
 *   onChange={setSelectedStatuses}
 *   multiple
 * />
 */
export function QuickFilters<T = string>({
  options,
  value,
  onChange,
  multiple = false,
  allowClear = true,
  allOption,
  className,
  style,
  size = 'default',
}: QuickFiltersProps<T>) {
  /**
   * 检查选项是否选中
   */
  const isSelected = useCallback(
    (optionValue: T): boolean => {
      if (value === undefined || value === null) return false;

      if (multiple) {
        return Array.isArray(value) && value.includes(optionValue);
      }

      return value === optionValue;
    },
    [value, multiple]
  );

  /**
   * 处理选项点击
   */
  const handleClick = useCallback(
    (optionValue: T, disabled?: boolean) => {
      if (disabled) return;

      if (multiple) {
        // 多选模式
        const currentValues = Array.isArray(value) ? [...value] : [];

        // 处理"全部"选项
        if (allOption && optionValue === allOption.value) {
          onChange?.(currentValues.length === options.length ? [] : options.map((o) => o.value));
          return;
        }

        const index = currentValues.indexOf(optionValue);
        if (index > -1) {
          currentValues.splice(index, 1);
        } else {
          currentValues.push(optionValue);
        }
        onChange?.(currentValues);
      } else {
        // 单选模式
        if (value === optionValue && allowClear) {
          onChange?.(undefined);
        } else {
          onChange?.(optionValue);
        }
      }
    },
    [value, multiple, allowClear, allOption, options, onChange]
  );

  // 计算标签样式 - 使用设计系统
  const getTagStyle = (selected: boolean, disabled?: boolean) => {
    const baseStyle: React.CSSProperties = {
      cursor: disabled ? 'not-allowed' : 'pointer',
      padding: size === 'small' ? '2px 10px' : '6px 14px',
      fontSize: size === 'small' ? 12 : 14,
      borderRadius: 'var(--radius-md, 8px)',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      margin: 0,
      userSelect: 'none',
      border: '1px solid transparent',
    };

    if (disabled) {
      return {
        ...baseStyle,
        background: 'var(--bg-hover, #f5f5f5)',
        color: 'var(--text-quaternary, #bfbfbf)',
        borderColor: 'var(--border-normal, #d9d9d9)',
      };
    }

    if (selected) {
      return {
        ...baseStyle,
        background: 'var(--bg-active, #e6f4ff)',
        color: 'var(--color-primary, #1677ff)',
        borderColor: '#91caff',
        fontWeight: 500,
        boxShadow: '0 2px 4px rgba(22, 119, 255, 0.15)',
      };
    }

    return {
      ...baseStyle,
      background: 'var(--bg-card, #fff)',
      color: 'var(--text-secondary, #595959)',
      borderColor: 'var(--border-light, #f0f0f0)',
    };
  };

  // 渲染单个选项
  const renderOption = (option: FilterOption<T>) => {
    const selected = isSelected(option.value);

    const tagContent = (
      <Tag
        key={String(option.value)}
        style={getTagStyle(selected, option.disabled)}
        onClick={() => handleClick(option.value, option.disabled)}
      >
        {option.label}
      </Tag>
    );

    // 有数量时显示徽章
    if (option.count !== undefined && option.count > 0) {
      return (
        <Badge
          key={String(option.value)}
          count={option.count}
          size="small"
          color={option.badgeColor || (selected ? '#1677ff' : '#8c8c8c')}
          offset={[-4, 0]}
          style={{
            fontSize: 10,
            height: 16,
            lineHeight: '16px',
            minWidth: 16,
            padding: '0 4px',
          }}
        >
          {tagContent}
        </Badge>
      );
    }

    return tagContent;
  };

  return (
    <div className={className} style={style}>
      <Space size={8} wrap>
        {/* 渲染"全部"选项 */}
        {allOption && (
          <Tag
            style={getTagStyle(
              multiple
                ? !Array.isArray(value) || value.length === 0
                : value === allOption.value
            )}
            onClick={() => handleClick(allOption.value)}
          >
            {allOption.label}
          </Tag>
        )}

        {/* 渲染其他选项 */}
        {options
          .filter((o) => !allOption || o.value !== allOption.value)
          .map(renderOption)}
      </Space>
    </div>
  );
}

/**
 * 状态快捷筛选（预设配置）
 * @description 常用于订单列表等场景的状态筛选
 */
export interface StatusFilterOption {
  value: string;
  label: string;
  count?: number;
  color?: string;
}

export function StatusQuickFilters({
  options,
  value,
  onChange,
  showAll = true,
  allLabel = '全部',
  className,
}: {
  options: StatusFilterOption[];
  value?: string;
  onChange?: (value: string | undefined) => void;
  showAll?: boolean;
  allLabel?: string;
  className?: string;
}) {
  const filterOptions: FilterOption<string>[] = options.map((o) => ({
    value: o.value,
    label: o.label,
    count: o.count,
    badgeColor: o.color,
  }));

  return (
    <QuickFilters
      options={filterOptions}
      value={value}
      onChange={onChange as (v: string | string[] | undefined) => void}
      allOption={showAll ? { value: '', label: allLabel } : undefined}
      className={className}
    />
  );
}

export default QuickFilters;
