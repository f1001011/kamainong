/**
 * @file API 请求封装
 * @description 统一的 API 请求工具，支持错误处理和类型安全
 * @reference 开发文档/03.0-前端架构.md
 */

import type { ApiResponse, ApiSuccessResponse, ApiErrorResponse } from '@/types';
import { useUserStore } from '@/stores/user';

/**
 * API 基础 URL
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * 获取当前用户 Token
 * @description 从 Zustand store 获取 token（支持 SSR 环境）
 */
function getAuthToken(): string | null {
  // 服务端渲染时无法访问 localStorage
  if (typeof window === 'undefined') {
    return null;
  }
  return useUserStore.getState().token;
}

/**
 * 请求配置选项
 */
interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** 请求体数据 */
  body?: Record<string, unknown> | FormData;
  /** 是否跳过错误提示 */
  silent?: boolean;
  /** 超时时间（毫秒） */
  timeout?: number;
}

/**
 * API 错误类
 */
export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number = 400) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

/**
 * 创建带超时的 fetch
 * @param url - 请求 URL
 * @param options - 请求选项
 * @param timeout - 超时时间
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 通用 API 请求函数
 * @param endpoint - API 端点（不含基础 URL）
 * @param options - 请求选项
 * @returns 响应数据
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    body,
    silent = false,
    timeout = 30000,
    headers: customHeaders,
    ...fetchOptions
  } = options;

  // 构建请求 URL
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  // 构建请求头
  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  // 自动添加 Authorization header（如果有 token）
  const token = getAuthToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 处理请求体
  let requestBody: BodyInit | undefined;
  if (body) {
    if (body instanceof FormData) {
      requestBody = body;
    } else {
      headers['Content-Type'] = 'application/json';
      requestBody = JSON.stringify(body);
    }
  }

  try {
    const response = await fetchWithTimeout(
      url,
      {
        ...fetchOptions,
        headers,
        body: requestBody,
        credentials: 'include', // 携带 cookie
      },
      timeout
    );

    /**
     * 优先处理 401 未授权（在 JSON 解析之前）
     * 确保无论响应体是否为合法 JSON，都能正确拦截 401 并跳转登录页
     */
    if (response.status === 401 && typeof window !== 'undefined' && token) {
      const store = useUserStore.getState();
      store.logout();
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        const redirectParam = currentPath !== '/' ? `?redirect=${encodeURIComponent(currentPath)}` : '';
        window.location.href = `/login${redirectParam}`;
        return new Promise<T>(() => {});
      }
      throw new ApiError('UNAUTHORIZED', 'يرجى تسجيل الدخول', 401);
    }

    /**
     * 处理 Token 自动续期
     * @description 依据：02.2-API规范.md 第3.1节 - 剩余≤1天时自动续期
     * 后端在响应头 X-New-Token 返回新 Token，前端需要自动更新
     */
    const newToken = response.headers.get('X-New-Token');
    if (newToken && typeof window !== 'undefined') {
      const { setToken } = useUserStore.getState();
      setToken(newToken);
      document.cookie = `token=${newToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    }

    // 解析响应
    const data: ApiResponse<T> = await response.json();

    // 检查业务错误
    if (!data.success) {
      const errorData = data as ApiErrorResponse;
      throw new ApiError(
        errorData.error?.code || 'UNKNOWN_ERROR',
        errorData.error?.message || 'حدث خطأ غير متوقع',
        response.status
      );
    }

    return (data as ApiSuccessResponse<T>).data;
  } catch (error) {
    // 处理网络错误
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('TIMEOUT', 'انتهت مهلة الطلب', 408);
    }

    if (error instanceof TypeError) {
      throw new ApiError('NETWORK_ERROR', 'خطأ في الاتصال', 0);
    }

    throw new ApiError('UNKNOWN_ERROR', 'حدث خطأ غير متوقع', 500);
  }
}

/**
 * GET 请求
 */
export function get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST 请求
 */
export function post<T>(
  endpoint: string,
  body?: Record<string, unknown>,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'POST', body });
}

/**
 * PUT 请求
 */
export function put<T>(
  endpoint: string,
  body?: Record<string, unknown>,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'PUT', body });
}

/**
 * DELETE 请求
 */
export function del<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * PATCH 请求
 */
export function patch<T>(
  endpoint: string,
  body?: Record<string, unknown>,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'PATCH', body });
}

/**
 * 获取 API 错误的本地化消息
 * @description 优先使用 t(error.code) 翻译错误码，避免直接显示后端中文消息
 * @param error - 捕获的错误对象
 * @param fallbackKey - 兜底文案 key
 * @returns 阿拉伯语错误消息
 */
export function getApiErrorMessage(error: unknown, fallbackKey: string = 'error.unknown'): string {
  // 延迟导入避免循环依赖
  const { useTextStore } = require('@/stores/text');
  const getText = useTextStore.getState().getText;

  if (error instanceof ApiError) {
    const translated = getText(`error.${error.code.toLowerCase()}`);
    if (translated && translated !== `error.${error.code.toLowerCase()}`) {
      return translated;
    }
    const directTranslation = getText(error.code);
    if (directTranslation && directTranslation !== error.code) {
      return directTranslation;
    }
  }

  return getText(fallbackKey, 'حدث خطأ');
}

// 导出默认 API 对象
const api = {
  get,
  post,
  put,
  delete: del,
  patch,
  request: apiRequest,
};

export default api;
