/**
 * @file 认证状态管理
 * @description 管理管理员登录状态、Token 存储
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第4节 - 认证与权限
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 管理员信息类型
 * @description 依据：02.4-后台API接口清单.md 第1.1节 + 第14.1.1节
 */
export interface AdminInfo {
  /** 管理员ID */
  id: number;
  /** 用户名 */
  username: string;
  /** 昵称 */
  nickname: string | null;
  /** 是否启用 */
  isActive?: boolean;
  /** 最后登录时间 */
  lastLoginAt?: string;
  /** 最后登录IP */
  lastLoginIp?: string;
  /** 创建时间 */
  createdAt?: string;
}

/**
 * 认证状态类型
 */
interface AuthState {
  /** JWT Token */
  token: string | null;
  /** 管理员信息 */
  admin: AdminInfo | null;
  /** 是否已认证 */
  isAuthenticated: boolean;

  /** 设置认证信息 */
  setAuth: (token: string, admin: AdminInfo) => void;
  /** 更新 Token（用于自动续期） */
  updateToken: (token: string) => void;
  /** 更新管理员信息 */
  updateAdmin: (admin: Partial<AdminInfo>) => void;
  /** 登出 */
  logout: () => void;
  /** 检查是否已认证 */
  checkAuth: () => boolean;
}

/**
 * 认证状态 Store
 * @description 使用 persist 中间件持久化到 localStorage
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      admin: null,
      isAuthenticated: false,

      setAuth: (token, admin) => {
        set({
          token,
          admin,
          isAuthenticated: true,
        });
        // 同步到 localStorage，供 API 请求使用
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_token', token);
          // 同步到 cookie，供中间件路由守卫使用（7天有效期）
          document.cookie = `admin_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
        }
      },

      updateToken: (token) => {
        set({ token });
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_token', token);
        }
      },

      updateAdmin: (adminUpdate) => {
        const { admin } = get();
        if (admin) {
          set({
            admin: { ...admin, ...adminUpdate },
          });
        }
      },

      logout: () => {
        set({
          token: null,
          admin: null,
          isAuthenticated: false,
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_token');
          // 删除 cookie
          document.cookie = 'admin_token=; path=/; max-age=0';
          // 重定向到登录页
          window.location.href = '/login';
        }
      },

      checkAuth: () => {
        const { token, admin } = get();
        return !!token && !!admin;
      },
    }),
    {
      name: 'admin-auth',
      partialize: (state) => ({
        token: state.token,
        admin: state.admin,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * 获取当前 Token
 * @description 用于 API 请求时获取 Token
 */
export function getAdminToken(): string | null {
  // 优先从 store 获取
  const { token } = useAuthStore.getState();
  if (token) return token;

  // 回退到 localStorage
  if (typeof window !== 'undefined') {
    return localStorage.getItem('admin_token');
  }

  return null;
}

/**
 * 兼容旧版 useAdminStore
 * @deprecated 推荐使用 useAuthStore
 */
export const useAdminStore = useAuthStore;
