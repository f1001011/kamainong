/**
 * @file 通用工具函数
 * @description 前端通用工具函数集合
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并 Tailwind CSS 类名
 * @description 使用 clsx 和 tailwind-merge 智能合并类名
 * @param inputs - 类名参数
 * @returns 合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * 延迟函数
 * @param ms - 延迟毫秒数
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 生成随机字符串
 * @param length - 字符串长度
 * @returns 随机字符串
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 手机号脱敏
 * @param phone - 手机号
 * @returns 脱敏后的手机号（如：912***456）
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return phone;
  const start = phone.slice(0, 3);
  const end = phone.slice(-3);
  return `${start}***${end}`;
}

/**
 * 银行卡号脱敏
 * @param cardNumber - 银行卡号
 * @returns 脱敏后的卡号（如：****1234）
 */
export function maskCardNumber(cardNumber: string): string {
  if (!cardNumber || cardNumber.length < 4) return cardNumber;
  return `****${cardNumber.slice(-4)}`;
}

/**
 * 判断是否在 WebView 环境中
 * @returns 是否在 WebView 中
 */
export function isInWebView(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof (window as Window & { AndroidBridge?: unknown; webkit?: unknown }).AndroidBridge !== 'undefined' ||
    typeof (window as Window & { webkit?: { messageHandlers?: unknown } }).webkit?.messageHandlers !== 'undefined';
}

/**
 * 调用 JS Bridge 保存图片
 * @param imageUrl - 图片 URL
 */
export function saveImageToBridge(imageUrl: string): void {
  if (typeof window === 'undefined') return;
  
  const win = window as Window & {
    AndroidBridge?: { saveImage: (url: string) => void };
    webkit?: { messageHandlers?: { saveImage?: { postMessage: (data: { url: string }) => void } } };
  };

  // Android
  if (win.AndroidBridge?.saveImage) {
    win.AndroidBridge.saveImage(imageUrl);
    return;
  }

  // iOS
  if (win.webkit?.messageHandlers?.saveImage) {
    win.webkit.messageHandlers.saveImage.postMessage({ url: imageUrl });
    return;
  }
}

/**
 * 防抖函数
 * @param fn - 要防抖的函数
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * 节流函数
 * @param fn - 要节流的函数
 * @param limit - 时间限制（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: Parameters<T>) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 复制文本到剪贴板
 * @param text - 要复制的文本
 * @returns 是否复制成功
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 降级方案
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * 检查是否为有效的摩洛哥手机号
 * @param phone - 手机号
 * @returns 是否有效（9位数字，以5/6/7开头）
 */
export function isValidMoroccoPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^[567]\d{8}$/.test(cleaned);
}

/**
 * 获取设备类型
 * @returns 设备类型
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}
