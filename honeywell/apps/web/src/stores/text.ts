/**
 * @file 文案配置 Store
 * @description 管理前端所有文案配置（支持后台动态修改）
 * @reference 开发文档/03.0-前端架构.md
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TextConfig } from '@/types';
import { arTexts } from '@/locales';

/**
 * 文案 Store 状态
 */
interface TextState {
  /** 文案配置 */
  texts: TextConfig;
  /** 配置版本号 */
  version: number;
  /** 是否已加载 */
  isLoaded: boolean;
  /** 设置文案 */
  setTexts: (texts: TextConfig) => void;
  /** 设置版本号 */
  setVersion: (version: number) => void;
  /** 设置加载状态 */
  setLoaded: (loaded: boolean) => void;
  /** 获取单个文案 */
  getText: (key: string, defaultValue?: string) => string;
  /** 重置 */
  reset: () => void;
}

/**
 * 默认文案配置
 * @description 阿拉伯语默认值，用于配置加载前
 * 依据：开发规范.md 第2.7节 - 用户前端文案默认值使用阿拉伯语
 */
const defaultTexts: TextConfig = arTexts;

/**
 * 文案 Store
 */
export const useTextStore = create<TextState>()(
  persist(
    (set, get) => ({
      texts: defaultTexts,
      version: 0,
      isLoaded: false,

      setTexts: (texts) =>
        set({
          texts: { ...defaultTexts, ...texts },
          isLoaded: true,
        }),

      setVersion: (version) => set({ version }),

      setLoaded: (isLoaded) => set({ isLoaded }),

      getText: (key, defaultValue) => {
        const texts = get().texts;
        return texts[key] || defaultValue || key;
      },

      reset: () =>
        set({
          texts: defaultTexts,
          version: 0,
          isLoaded: false,
        }),
    }),
    {
      name: 'text-storage',
      version: 2,
      migrate: () => ({
        texts: defaultTexts,
        version: 0,
      }),
      partialize: (state) => ({
        texts: state.texts,
        version: state.version,
      }),
      skipHydration: true,
    }
  )
);

/**
 * 获取文案（非 Hook 版本）
 * @description 用于非组件环境获取文案
 */
export function t(key: string, defaultValue?: string): string {
  return useTextStore.getState().getText(key, defaultValue);
}

/**
 * 获取带变量替换的文案
 * @param key - 文案 key
 * @param variables - 变量对象
 * @returns 替换后的文案
 */
export function tWithVars(key: string, variables: Record<string, string | number>): string {
  let text = useTextStore.getState().getText(key);
  
  Object.entries(variables).forEach(([varKey, value]) => {
    text = text.replace(new RegExp(`\\{${varKey}\\}`, 'g'), String(value));
  });
  
  return text;
}
