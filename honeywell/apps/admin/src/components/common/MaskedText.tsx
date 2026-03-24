/**
 * @file 脱敏显示组件
 * @description 敏感信息脱敏显示，支持点击切换显示/隐藏原值
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第11节 - 常用组件规范
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Space, Tooltip, Typography, message } from 'antd';
import {
  RiEyeLine,
  RiEyeOffLine,
  RiFileCopyLine,
  RiCheckLine,
} from '@remixicon/react';
import { maskPhone, maskBankCard, maskIdCard } from '@/utils/mask';

const { Text } = Typography;

/**
 * 脱敏类型
 */
export type MaskType = 'phone' | 'bankCard' | 'idCard';

export interface MaskedTextProps {
  /** 原始值 */
  value: string | null | undefined;
  /** 脱敏类型 */
  maskType: MaskType;
  /** 是否支持复制 */
  copyable?: boolean;
  /** 是否默认显示原值 */
  defaultVisible?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 获取脱敏后的文本
 */
function getMaskedText(value: string | null | undefined, maskType: MaskType): string {
  if (!value) return '-';
  
  switch (maskType) {
    case 'phone':
      return maskPhone(value);
    case 'bankCard':
      return maskBankCard(value);
    case 'idCard':
      return maskIdCard(value);
    default:
      return value;
  }
}

/**
 * 脱敏显示组件
 * @description 敏感信息脱敏显示，点击眼睛图标切换显示/隐藏
 * @example
 * <MaskedText value="13800138000" maskType="phone" />           // 138****38000
 * <MaskedText value="6222021234567890" maskType="bankCard" />   // ****7890
 * <MaskedText value="13800138000" maskType="phone" copyable />  // 带复制按钮
 */
export function MaskedText({
  value,
  maskType,
  copyable = true,
  defaultVisible = false,
  className,
  style,
}: MaskedTextProps) {
  // 是否显示原值
  const [visible, setVisible] = useState(defaultVisible);
  // 复制状态
  const [copied, setCopied] = useState(false);

  /**
   * 切换显示状态
   */
  const toggleVisible = useCallback(() => {
    setVisible((prev) => !prev);
  }, []);

  /**
   * 复制原值到剪贴板
   */
  const handleCopy = useCallback(async () => {
    if (!value) {
      message.warning('无内容可复制');
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      message.success('已复制');
      
      // 1秒后恢复图标
      setTimeout(() => {
        setCopied(false);
      }, 1000);
    } catch (error) {
      console.error('复制失败:', error);
      message.error('复制失败');
    }
  }, [value]);

  // 空值处理
  if (!value) {
    return (
      <Text className={className} style={style}>
        -
      </Text>
    );
  }

  // 获取显示文本
  const displayText = visible ? value : getMaskedText(value, maskType);

  return (
    <Space size={4} className={className} style={style}>
      {/* 显示文本 */}
      <Text
        style={{
          fontFamily: 'Roboto Mono, monospace',
          letterSpacing: maskType === 'bankCard' ? '1px' : undefined,
        }}
      >
        {displayText}
      </Text>

      {/* 切换按钮 */}
      <Tooltip title={visible ? '隐藏' : '显示'}>
        <span
          onClick={toggleVisible}
          style={{
            cursor: 'pointer',
            color: '#8c8c8c',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          {visible ? (
            <RiEyeOffLine size={14} />
          ) : (
            <RiEyeLine size={14} />
          )}
        </span>
      </Tooltip>

      {/* 复制按钮 */}
      {copyable && (
        <Tooltip title={copied ? '已复制' : '复制'}>
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
              <RiCheckLine size={14} />
            ) : (
              <RiFileCopyLine size={14} />
            )}
          </span>
        </Tooltip>
      )}
    </Space>
  );
}

/**
 * 手机号脱敏显示
 */
export function MaskedPhone({
  value,
  copyable = true,
  className,
  style,
}: Omit<MaskedTextProps, 'maskType'>) {
  return (
    <MaskedText
      value={value}
      maskType="phone"
      copyable={copyable}
      className={className}
      style={style}
    />
  );
}

/**
 * 银行卡号脱敏显示
 */
export function MaskedBankCard({
  value,
  copyable = true,
  className,
  style,
}: Omit<MaskedTextProps, 'maskType'>) {
  return (
    <MaskedText
      value={value}
      maskType="bankCard"
      copyable={copyable}
      className={className}
      style={style}
    />
  );
}

/**
 * 身份证号脱敏显示
 */
export function MaskedIdCard({
  value,
  copyable = true,
  className,
  style,
}: Omit<MaskedTextProps, 'maskType'>) {
  return (
    <MaskedText
      value={value}
      maskType="idCard"
      copyable={copyable}
      className={className}
      style={style}
    />
  );
}

export default MaskedText;
