/**
 * @file API 请求封装
 * @description 统一的 HTTP 请求工具，支持 Token 自动携带和续期
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第6节 - API 请求封装
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore, getAdminToken } from '@/stores/admin';
import { showError, showWarning } from '@/utils/messageHolder';

/**
 * API 响应基础格式
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    retryAfter?: number;
  };
}

/**
 * 分页响应格式
 */
export interface PaginatedResponse<T> {
  list: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 批量操作响应格式
 */
export interface BatchOperationResponse {
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{
    id: number;
    success: boolean;
    error?: {
      code: string;
      message: string;
    };
  }>;
}

/**
 * 错误码映射
 * @description 依据：02.2-API规范.md 第4节
 */
const ERROR_MESSAGES: Record<string, string> = {
  // 通用错误
  UNAUTHORIZED: '请先登录',
  FORBIDDEN: '无权限执行此操作',
  NOT_FOUND: '资源不存在',
  VALIDATION_ERROR: '参数校验失败',
  RATE_LIMITED: '请求过于频繁',
  INTERNAL_ERROR: '服务器内部错误',
  
  // 用户相关
  USER_NOT_FOUND: '用户不存在',
  USER_BANNED: '用户已被封禁',
  
  // 订单相关
  ORDER_NOT_FOUND: '订单不存在',
  ORDER_STATUS_INVALID: '订单状态不允许此操作',
  
  // 管理员相关
  ADMIN_INVALID_CREDENTIALS: '用户名或密码错误',
  ADMIN_DISABLED: '管理员账号已禁用',
  
  // 产品相关
  PRODUCT_NOT_FOUND: '产品不存在',
  PRODUCT_ALREADY_PURCHASED: '已购买过该产品',
  
  // 余额相关
  INSUFFICIENT_BALANCE: '余额不足',
};

/**
 * 获取友好的错误消息
 */
function getErrorMessage(code: string, defaultMessage?: string): string {
  return ERROR_MESSAGES[code] || defaultMessage || '操作失败，请稍后重试';
}

/**
 * API 基础 URL
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

/**
 * 创建 Axios 实例
 */
const instance: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/admin`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 请求拦截器
 * @description 自动携带 Token
 */
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAdminToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 响应拦截器
 * @description 处理 Token 续期、错误处理
 */
instance.interceptors.response.use(
  (response) => {
    // Token 自动续期：从响应头获取新 Token
    const newToken = response.headers['x-new-token'];
    if (newToken) {
      useAuthStore.getState().updateToken(newToken);
    }

    // 业务响应处理
    const data = response.data as ApiResponse;
    
    if (!data.success) {
      const errorMessage = getErrorMessage(
        data.error?.code || 'UNKNOWN_ERROR',
        data.error?.message
      );
      showError(errorMessage);
      return Promise.reject(new Error(errorMessage));
    }

    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    const { response } = error;

    // 401 未认证
    if (response?.status === 401) {
      showError('登录已过期，请重新登录');
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    // 403 无权限
    if (response?.status === 403) {
      showError('无权限执行此操作');
      return Promise.reject(error);
    }

    // 429 限流
    if (response?.status === 429) {
      const retryAfter = response.data?.error?.retryAfter || 30;
      showWarning(`请求过于频繁，请 ${retryAfter} 秒后重试`);
      return Promise.reject(error);
    }

    // 其他错误
    const errorMessage = getErrorMessage(
      response?.data?.error?.code || 'NETWORK_ERROR',
      response?.data?.error?.message || '网络异常，请稍后重试'
    );
    showError(errorMessage);
    return Promise.reject(error);
  }
);

/**
 * 通用请求方法
 */
async function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  const response = await instance.request<ApiResponse<T>>(config);
  return response.data.data as T;
}

/**
 * 清理查询参数：移除 null、undefined、空字符串、空数组
 * 防止空值被 axios 序列化为空字符串导致后端校验失败
 */
function cleanQueryParams(params: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    cleaned[key] = value;
  }
  return cleaned;
}

/**
 * GET 请求
 */
export async function get<T = unknown>(
  url: string,
  params?: Record<string, unknown>,
  config?: AxiosRequestConfig
): Promise<T> {
  const cleanedParams = params ? cleanQueryParams(params) : undefined;
  return request<T>({ ...config, method: 'GET', url, params: cleanedParams });
}

/**
 * POST 请求
 */
export async function post<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  return request<T>({ ...config, method: 'POST', url, data });
}

/**
 * PUT 请求
 */
export async function put<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  return request<T>({ ...config, method: 'PUT', url, data });
}

/**
 * PATCH 请求
 */
export async function patch<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  return request<T>({ ...config, method: 'PATCH', url, data });
}

/**
 * DELETE 请求
 */
export async function del<T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  return request<T>({ ...config, method: 'DELETE', url });
}

/**
 * 文件上传
 */
export async function upload<T = unknown>(
  url: string,
  file: File,
  fieldName = 'file',
  config?: AxiosRequestConfig
): Promise<T> {
  const formData = new FormData();
  formData.append(fieldName, file);

  return request<T>({
    ...config,
    method: 'POST',
    url,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 文件下载
 */
export async function download(
  url: string,
  params?: Record<string, unknown>,
  filename?: string
): Promise<void> {
  const response = await instance.get(url, {
    params,
    responseType: 'blob',
  });

  // 创建下载链接
  const blob = new Blob([response.data]);
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || `export_${Date.now()}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}

export default instance;
