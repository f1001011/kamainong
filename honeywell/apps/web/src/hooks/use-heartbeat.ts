/**
 * @file 心跳检测 Hook
 * @description 定期验证会话有效性。通过 /user/profile 接口检测 token 是否过期，
 * 避免用户长期停留在页面上时 token 过期却无感知。
 * 如果心跳接口返回 401，api.ts 会自动处理跳转登录页。
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useUserStore } from '@/stores';
import api from '@/lib/api';

/**
 * 会话验证间隔（毫秒）- 每 60 秒验证一次
 */
const SESSION_CHECK_INTERVAL = 60 * 1000;

/**
 * 心跳检测 Hook
 * @description 已登录用户定期验证会话有效性，token 失效时由 api.ts 统一处理跳转
 */
export function useHeartbeat() {
  const { isAuthenticated, token } = useUserStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkSession = useCallback(async () => {
    if (!token) return;

    try {
      await api.get('/user/profile');
    } catch {
      // 401 由 api.ts 统一处理跳转登录页，其他错误静默忽略
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      intervalRef.current = setInterval(checkSession, SESSION_CHECK_INTERVAL);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, token, checkSession]);
}
