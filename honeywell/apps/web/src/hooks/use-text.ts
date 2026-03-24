/**
 * @file 文案获取 Hook
 * @description 从 Store 获取文案，支持变量替换
 * @reference 开发文档/03.0-前端架构.md
 */

'use client';

import { useCallback } from 'react';
import { useTextStore } from '@/stores';

/**
 * 文案获取函数类型
 */
type TextGetter = {
  /** 获取文案 */
  (key: string, defaultValue?: string): string;
  /** 获取带变量的文案 */
  withVars: (key: string, variables: Record<string, string | number>) => string;
};

/**
 * 文案获取 Hook
 * @description 获取文案的统一入口，支持变量替换
 * @returns 文案获取函数
 * 
 * @example
 * ```tsx
 * const t = useText();
 * 
 * // 基础用法
 * <span>{t('btn.confirm')}</span>
 * 
 * // 带默认值
 * <span>{t('custom.key')}</span>
 * 
 * // 带变量替换
 * <span>{t.withVars('welcome.message', { name: 'Juan' })}</span>
 * // 文案配置: "welcome.message": "Hola, {name}!"
 * // 输出: "Hola, Juan!"
 * ```
 */
export function useText(): TextGetter {
  const { texts } = useTextStore();

  /**
   * 获取文案
   */
  const getText = useCallback(
    (key: string, defaultValue?: string): string => {
      return texts[key] || defaultValue || key;
    },
    [texts]
  );

  /**
   * 获取带变量替换的文案
   */
  const getTextWithVars = useCallback(
    (key: string, variables: Record<string, string | number>): string => {
      let text = texts[key] || key;

      Object.entries(variables).forEach(([varKey, value]) => {
        text = text.replace(new RegExp(`\\{${varKey}\\}`, 'g'), String(value));
      });

      return text;
    },
    [texts]
  );

  // 组合函数
  const textGetter = getText as TextGetter;
  textGetter.withVars = getTextWithVars;

  return textGetter;
}
