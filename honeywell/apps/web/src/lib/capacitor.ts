/**
 * @file Capacitor 原生平台检测工具
 * @description 用于判断当前运行环境是否为 Capacitor 原生容器（APK）
 * 直接读取 window.Capacitor 避免 SSR 环境下的导入问题
 */

let _cachedIsNative: boolean | null = null;

/**
 * 检测当前是否在 Capacitor 原生容器中运行
 * 结果会被缓存，不会重复判断
 */
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  if (_cachedIsNative !== null) return _cachedIsNative;

  try {
    const cap = (window as Record<string, unknown>).Capacitor as
      | { isNativePlatform?: () => boolean }
      | undefined;
    _cachedIsNative = cap?.isNativePlatform?.() ?? false;
  } catch {
    _cachedIsNative = false;
  }

  return _cachedIsNative;
}

/**
 * 获取当前运行平台
 * @returns 'android' | 'ios' | 'web'
 */
export function getPlatform(): string {
  if (typeof window === 'undefined') return 'web';

  try {
    const cap = (window as Record<string, unknown>).Capacitor as
      | { getPlatform?: () => string }
      | undefined;
    return cap?.getPlatform?.() ?? 'web';
  } catch {
    return 'web';
  }
}
