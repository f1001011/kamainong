/**
 * @file 用户状态 Store
 * @description 管理用户登录状态和用户信息
 * @reference 开发文档/03.0-前端架构.md
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserVipInfo } from '@/types';

/**
 * 用户 Store 状态
 */
interface UserState {
  /** 用户信息 */
  user: User | null;
  /** VIP 信息 */
  vipInfo: UserVipInfo | null;
  /** 是否已登录 */
  isAuthenticated: boolean;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 登录 token（用于 API 请求） */
  token: string | null;
  /** 设置用户信息 */
  setUser: (user: User | null) => void;
  /** 设置 VIP 信息 */
  setVipInfo: (vipInfo: UserVipInfo | null) => void;
  /** 设置 token */
  setToken: (token: string | null) => void;
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void;
  /** 更新余额 */
  updateBalance: (availableBalance: string, frozenBalance?: string) => void;
  /** 登出 */
  logout: () => void;
}

/**
 * 用户 Store
 * @description 认证状态 isAuthenticated 同时基于 token 和 user 判断：
 * - 有 token 即视为已认证（页面刷新后 token 从 localStorage 恢复）
 * - setUser(null) 且无 token 时才视为未认证
 */
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      vipInfo: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,

      setUser: (user) =>
        set({
          user,
          // 有 user 或有 token 都视为已认证
          isAuthenticated: user !== null || get().token !== null,
        }),

      setVipInfo: (vipInfo) => set({ vipInfo }),

      /**
       * 设置 Token
       * @description 同时更新 isAuthenticated 状态，确保 token 存在时即视为已认证
       */
      setToken: (token) => set({
        token,
        isAuthenticated: token !== null,
      }),

      setLoading: (isLoading) => set({ isLoading }),

      updateBalance: (availableBalance, frozenBalance) => {
        const currentUser = get().user;
        if (!currentUser) return;

        set({
          user: {
            ...currentUser,
            availableBalance,
            ...(frozenBalance !== undefined && { frozenBalance }),
          },
        });
      },

      logout: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
        }
        set({
          user: null,
          vipInfo: null,
          isAuthenticated: false,
          token: null,
        });
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        token: state.token,
      }),
      skipHydration: true,
      onRehydrateStorage: () => {
        return (state, error) => {
          if (!error && state?.token) {
            useUserStore.setState({ isAuthenticated: true });
          }
        };
      },
    }
  )
);

/**
 * 获取当前用户
 * @description 用于非组件环境获取用户信息
 */
export function getCurrentUser(): User | null {
  return useUserStore.getState().user;
}

/**
 * 检查是否已登录
 * @description 用于非组件环境检查登录状态
 */
export function isLoggedIn(): boolean {
  return useUserStore.getState().isAuthenticated;
}
