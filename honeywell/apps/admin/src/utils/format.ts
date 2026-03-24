/**
 * @file 格式化工具函数
 * @description 金额、百分比、手机号等格式化
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第8节 - 金额显示规范
 */

import { Decimal } from 'decimal.js';
import { useGlobalConfigStore, getCurrencyConfig } from '@/stores/config';

/**
 * 格式化货币金额
 * @description MAD格式：MAD 1,500,000（无小数位，逗号千分位）
 * @param amount - 金额（支持 number、string、Decimal 类型）
 * @param options - 配置选项
 * @returns 格式化后的货币字符串
 * @example
 * formatCurrency(100000);         // "MAD 100,000"
 * formatCurrency(-50000);         // "-MAD 50,000"
 */
export function formatCurrency(
  amount: number | string | Decimal | null | undefined,
  options?: {
    showSign?: boolean;
    symbol?: string;
    space?: boolean;
    decimals?: number;
    thousandsSep?: string;
  }
): string {
  if (amount === null || amount === undefined) {
    const config = getCurrencyConfig();
    const symbol = options?.symbol ?? config.symbol;
    const space = options?.space ?? config.space;
    return `${symbol}${space ? ' ' : ''}0`;
  }

  let num: number;
  if (amount instanceof Decimal) {
    num = amount.toNumber();
  } else {
    num = Number(amount);
  }

  if (!Number.isFinite(num)) {
    num = 0;
  }

  const config = getCurrencyConfig();
  const symbol = options?.symbol ?? config.symbol;
  const space = options?.space ?? config.space;
  const showSign = options?.showSign ?? false;
  const decimals = options?.decimals ?? 0;
  const thousandsSep = options?.thousandsSep ?? ',';

  const absValue = decimals > 0
    ? Math.abs(num).toFixed(decimals)
    : Math.round(Math.abs(num)).toString();
  const absFormatted = absValue.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);
  const spaceStr = space ? ' ' : '';
  
  if (showSign) {
    const signStr = num >= 0 ? '+' : '-';
    return `${signStr}${symbol}${spaceStr}${absFormatted}`;
  } else {
    const negativeStr = num < 0 ? '-' : '';
    return `${negativeStr}${symbol}${spaceStr}${absFormatted}`;
  }
}

/**
 * 格式化金额（带正负号）
 */
export function formatCurrencyWithSign(amount: number | string | Decimal | null | undefined): string {
  return formatCurrency(amount, { showSign: true });
}

/**
 * 格式化百分比
 * @param value - 百分比值（如 5 表示 5%）
 * @param decimals - 小数位数
 */
export function formatPercent(value: number | string | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) {
    return '0.00%';
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return '0.00%';
  }
  return `${num.toFixed(decimals)}%`;
}

/**
 * 格式化手机号（脱敏显示）
 * @description 中间4位用*替换
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '-';
  // 匹配中间部分，用 **** 替换
  return phone.replace(/(\d{3})\d{4}(\d{2,})/, '$1****$2');
}

/**
 * 格式化银行卡号（脱敏显示）
 * @description 只显示后4位
 */
export function maskBankCard(cardNo: string | null | undefined): string {
  if (!cardNo) return '-';
  return `****${cardNo.slice(-4)}`;
}

/**
 * 格式化身份证号（脱敏显示）
 */
export function maskIdCard(idCard: string | null | undefined): string {
  if (!idCard) return '-';
  return idCard.replace(/(\d{4})\d+(\d{4})/, '$1****$2');
}

/**
 * 格式化数字（千分位）
 */
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '0';
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return '0';
  }
  return num.toLocaleString('en-US');
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 截断文本
 */
export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}
