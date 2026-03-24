/**
 * @file 金额显示组件
 * @description 统一的金额显示组件，支持高亮、正负号等配置
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第8.2节 - 金额显示组件
 */

'use client';

import React from 'react';
import { Typography } from 'antd';
import { Decimal } from 'decimal.js';
import { formatCurrency, formatCurrencyWithSign } from '@/utils/format';

const { Text } = Typography;

export interface AmountDisplayProps {
  /** 金额值（支持 number、string、Decimal） */
  value: number | string | Decimal | null | undefined;
  /** 是否显示正负号 */
  showSign?: boolean;
  /** 是否显示货币符号（默认 true） */
  showSymbol?: boolean;
  /** 尺寸 */
  size?: 'small' | 'default' | 'large';
  /** 是否高亮显示（正数绿色，负数红色） */
  highlight?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 金额显示组件
 * @description 统一处理金额格式化和样式
 * @example
 * <AmountDisplay value={100} />                    // $ 100
 * <AmountDisplay value={100} showSign />           // +$ 100
 * <AmountDisplay value={-50} highlight />          // 红色显示 $ -50
 * <AmountDisplay value={100} size="large" />       // 大号字体
 */
export function AmountDisplay({
  value,
  showSign = false,
  showSymbol = true,
  size = 'default',
  highlight = false,
  className,
  style,
}: AmountDisplayProps) {
  // 转换为数字用于判断正负
  let numValue = 0;
  if (value !== null && value !== undefined) {
    if (value instanceof Decimal) {
      numValue = value.toNumber();
    } else {
      numValue = Number(value);
    }
  }

  // 格式化文本
  let text: string;
  if (showSign) {
    text = formatCurrencyWithSign(value);
  } else if (showSymbol) {
    text = formatCurrency(value);
  } else {
    // 不显示货币符号，只格式化数字
    text = numValue.toLocaleString('ar-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // 计算字体大小
  const fontSize: Record<string, number> = {
    small: 12,
    default: 14,
    large: 20,
  };

  // 计算颜色
  let color: string | undefined;
  if (highlight) {
    color = numValue >= 0 ? '#52c41a' : '#ff4d4f';
  }

  return (
    <Text
      className={className}
      style={{
        fontSize: fontSize[size],
        color,
        fontWeight: highlight ? 600 : 400,
        fontFamily: 'Roboto Mono, monospace',
        ...style,
      }}
    >
      {text}
    </Text>
  );
}

/**
 * 金额变动显示组件（带颜色）
 * @description 专用于显示金额变动，自动根据正负显示颜色
 */
export function AmountChange({
  value,
  size = 'default',
  className,
  style,
}: Omit<AmountDisplayProps, 'showSign' | 'highlight'>) {
  return (
    <AmountDisplay
      value={value}
      showSign
      highlight
      size={size}
      className={className}
      style={style}
    />
  );
}

export default AmountDisplay;
