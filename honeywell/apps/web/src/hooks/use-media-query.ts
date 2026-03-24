/**
 * @file 媒体查询 Hook
 * @description 响应式断点检测，仅使用 768px 单一断点
 * @reference 开发文档/01-设计系统/01.4-响应式规范.md
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * 唯一响应式断点
 * @description 遵循单一断点规范，768px 以下为移动端
 */
const BREAKPOINT_MD = 768;

/**
 * 媒体查询 Hook
 * @param query - 媒体查询字符串
 * @returns 是否匹配
 * 
 * @example
 * ```tsx
 * const isDesktop = useMediaQuery('(min-width: 768px)');
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // 服务端渲染时跳过
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    
    // 初始值
    setMatches(mediaQuery.matches);

    // 监听变化
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * 设备类型 Hook
 * @description 判断当前是移动端还是桌面端
 * @returns 设备相关状态和工具
 * 
 * @example
 * ```tsx
 * const { isMobile, isDesktop } = useDevice();
 * 
 * return isMobile ? <MobileView /> : <DesktopView />;
 * ```
 */
export function useDevice() {
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINT_MD}px)`);
  const isMobile = !isDesktop;

  return {
    /** 是否为移动端（< 768px） */
    isMobile,
    /** 是否为桌面端（>= 768px） */
    isDesktop,
    /** 断点值 */
    breakpoint: BREAKPOINT_MD,
  };
}

/**
 * 窗口尺寸 Hook
 * @description 获取当前窗口尺寸
 * @returns 窗口宽度和高度
 * 
 * @example
 * ```tsx
 * const { width, height } = useWindowSize();
 * ```
 */
export function useWindowSize() {
  const [size, setSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // 初始值
    updateSize();

    // 监听窗口大小变化
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return size;
}

/**
 * 安全区域 Hook
 * @description 获取 iOS 安全区域尺寸
 * @returns 安全区域边距
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0', 10),
        bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
        left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0', 10),
        right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0', 10),
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  return safeArea;
}
