/**
 * @file 复制按钮组件
 * @description 点击复制内容到剪贴板，支持显示文本和状态反馈
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第11节 - 常用组件规范
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Tooltip, Typography, message, Space } from 'antd';
import { RiFileCopyLine, RiCheckLine } from '@remixicon/react';

const { Text } = Typography;

export interface CopyButtonProps {
  /** 要复制的文本 */
  text: string | null | undefined;
  /** 是否显示文本内容 */
  showText?: boolean;
  /** 文本最大显示长度（超出截断） */
  maxLength?: number;
  /** 复制成功提示文字 */
  successMessage?: string;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 按钮尺寸 */
  size?: 'small' | 'default' | 'large';
  /** 使用等宽字体 */
  monospace?: boolean;
}

/**
 * 复制按钮组件
 * @description 点击复制到剪贴板，复制成功显示对勾图标
 * @example
 * <CopyButton text="RC20260205ABC123" />                      // 仅图标
 * <CopyButton text="RC20260205ABC123" showText />             // 显示文本+图标
 * <CopyButton text="RC20260205ABC123" showText maxLength={10} /> // 截断显示
 */
export function CopyButton({
  text,
  showText = false,
  maxLength,
  successMessage = '已复制',
  className,
  style,
  size = 'default',
  monospace = true,
}: CopyButtonProps) {
  // 复制状态
  const [copied, setCopied] = useState(false);

  /**
   * 复制到剪贴板
   */
  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    // 阻止事件冒泡
    e.stopPropagation();

    if (!text) {
      message.warning('无内容可复制');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      message.success(successMessage);

      // 1秒后恢复图标
      setTimeout(() => {
        setCopied(false);
      }, 1000);
    } catch (error) {
      console.error('复制失败:', error);
      message.error('复制失败');
    }
  }, [text, successMessage]);

  // 空值处理
  if (!text) {
    return <Text type="secondary">-</Text>;
  }

  // 计算图标尺寸
  const iconSize: Record<string, number> = {
    small: 12,
    default: 14,
    large: 16,
  };

  // 计算字体大小
  const fontSize: Record<string, number> = {
    small: 12,
    default: 14,
    large: 16,
  };

  // 显示文本（可能截断）
  const displayText = maxLength && text.length > maxLength
    ? `${text.slice(0, maxLength)}...`
    : text;

  // 是否需要显示完整文本的 tooltip
  const needTooltip = maxLength && text.length > maxLength;

  const copyIcon = (
    <Tooltip title={copied ? '已复制' : '点击复制'}>
      <span
        onClick={handleCopy}
        style={{
          cursor: 'pointer',
          color: copied ? '#52c41a' : '#8c8c8c',
          display: 'inline-flex',
          alignItems: 'center',
          transition: 'color 0.2s',
        }}
      >
        {copied ? (
          <RiCheckLine size={iconSize[size]} />
        ) : (
          <RiFileCopyLine size={iconSize[size]} />
        )}
      </span>
    </Tooltip>
  );

  // 仅显示图标
  if (!showText) {
    return (
      <span className={className} style={style}>
        {copyIcon}
      </span>
    );
  }

  // 显示文本 + 图标
  const textContent = (
    <Text
      style={{
        fontSize: fontSize[size],
        fontFamily: monospace ? 'Roboto Mono, monospace' : undefined,
      }}
    >
      {displayText}
    </Text>
  );

  return (
    <Space size={4} className={className} style={style}>
      {needTooltip ? (
        <Tooltip title={text}>
          {textContent}
        </Tooltip>
      ) : (
        textContent
      )}
      {copyIcon}
    </Space>
  );
}

/**
 * 订单号复制组件
 * @description 专用于显示订单号，等宽字体
 */
export function OrderNoCopy({
  orderNo,
  className,
  style,
}: {
  orderNo: string | null | undefined;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <CopyButton
      text={orderNo}
      showText
      monospace
      className={className}
      style={style}
    />
  );
}

export default CopyButton;
