/**
 * @file 支付通道基类
 * @description 提供支付通道的通用功能：签名、HTTP请求、日期格式化等
 * @depends 开发文档/05-后端服务/05.2-支付通道集成.md 第2.3节 - 基础通道类
 */

import crypto from 'crypto';
import { DEFAULT_CONFIG } from '@honeywell/config';
import { ChannelConfig } from './types';

/**
 * 支付通道基类
 */
export abstract class BaseChannel {
  protected readonly config: ChannelConfig;

  constructor(config: ChannelConfig) {
    this.config = config;
  }

  /**
   * MD5加密
   * @param str 待加密字符串
   * @returns MD5哈希值
   */
  protected md5(str: string): string {
    return crypto.createHash('md5').update(str, 'utf8').digest('hex');
  }

  /**
   * 参数按ASCII排序并拼接
   * @param params 参数对象
   * @returns 拼接后的字符串
   */
  protected sortAndJoin(params: Record<string, string>): string {
    const keys = Object.keys(params).filter(
      (key) =>
        params[key] !== '' &&
        params[key] !== null &&
        params[key] !== undefined
    );
    keys.sort();
    return keys.map((key) => `${key}=${params[key]}`).join('&');
  }

  /**
   * 将对象转换为 form-urlencoded 格式
   * @param params 参数对象
   * @returns 编码后的字符串
   */
  protected toFormUrlEncoded(params: Record<string, string>): string {
    return Object.keys(params)
      .filter(
        (key) =>
          params[key] !== '' &&
          params[key] !== null &&
          params[key] !== undefined
      )
      .map(
        (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
      )
      .join('&');
  }

  /**
   * 格式化日期时间
   * @param date 日期对象
   * @returns 格式化后的字符串 (YYYY-MM-DD HH:mm:ss)
   */
  protected formatDateTime(date: Date = new Date()): string {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: DEFAULT_CONFIG.SYSTEM_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const get = (type: string) => parts.find(p => p.type === type)?.value || '00';
    return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
  }

  /**
   * 格式化金额（保留2位小数）
   * @param amount 金额
   * @returns 格式化后的金额字符串
   */
  protected formatAmount(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toFixed(2);
  }

  /**
   * 发送HTTP POST请求
   * @param url 请求URL
   * @param data 请求数据
   * @returns 响应数据
   */
  protected async httpPost(
    url: string,
    data: string
  ): Promise<Record<string, unknown>> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: data,
    });

    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch {
      // 某些通道可能返回非JSON格式
      console.error('[PaymentChannel] 响应解析失败:', text);
      throw new Error(`响应解析失败: ${text}`);
    }
  }
}
