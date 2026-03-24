/**
 * @file 登录日志 API 服务
 * @description 管理员登录日志、用户登录日志的 API 请求封装
 * @depends 开发文档/04-后台管理端/04.10-安全管理/04.10.3-管理员登录日志页.md
 * @depends 开发文档/04-后台管理端/04.10-安全管理/04.10.4-用户登录日志页.md
 */

import { get, download } from '@/utils/request';
import type {
  AdminLoginLogQueryParams,
  AdminLoginLogListResponse,
  UserLoginLogQueryParams,
  UserLoginLogListResponse,
  LoginLogExportParams,
  OperationLogQueryParams,
  OperationLogListResponse,
} from '@/types/logs';

// ==================== 管理员登录日志 ====================

/**
 * 获取管理员登录日志列表
 * @description 依据：02.4-后台API接口清单.md 第15.2节
 * @endpoint GET /api/admin/logs/admin-login
 */
export async function fetchAdminLoginLogs(
  params: AdminLoginLogQueryParams
): Promise<AdminLoginLogListResponse> {
  // 过滤掉空值参数
  const cleanParams: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      cleanParams[key] = value;
    }
  }
  
  return get<AdminLoginLogListResponse>('/logs/admin-login', cleanParams);
}

/**
 * 导出管理员登录日志
 * @description 导出近30天内的管理员登录日志
 * @endpoint GET /api/admin/logs/admin-login/export
 */
export async function exportAdminLoginLogs(
  params: LoginLogExportParams
): Promise<void> {
  const { filters, format, startDate, endDate } = params;
  
  // 构建导出参数
  const exportParams: Record<string, unknown> = {
    ...filters,
    format,
  };
  
  if (startDate) exportParams.startDate = startDate;
  if (endDate) exportParams.endDate = endDate;
  
  const filename = `管理员登录日志_${new Date().toISOString().split('T')[0]}.${format}`;
  
  return download('/logs/admin-login/export', exportParams, filename);
}

// ==================== 用户登录日志 ====================

/**
 * 获取用户登录日志列表
 * @description 依据：02.4-后台API接口清单.md 第15.3节
 * @endpoint GET /api/admin/logs/user-login
 */
export async function fetchUserLoginLogs(
  params: UserLoginLogQueryParams
): Promise<UserLoginLogListResponse> {
  // 过滤掉空值参数
  const cleanParams: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      cleanParams[key] = value;
    }
  }
  
  return get<UserLoginLogListResponse>('/logs/user-login', cleanParams);
}

/**
 * 导出用户登录日志
 * @description 导出近30天内的用户登录日志
 * @endpoint GET /api/admin/logs/user-login/export
 */
export async function exportUserLoginLogs(
  params: LoginLogExportParams
): Promise<void> {
  const { filters, format, startDate, endDate } = params;
  
  // 构建导出参数
  const exportParams: Record<string, unknown> = {
    ...filters,
    format,
  };
  
  if (startDate) exportParams.startDate = startDate;
  if (endDate) exportParams.endDate = endDate;
  
  const filename = `用户登录日志_${new Date().toISOString().split('T')[0]}.${format}`;
  
  return download('/logs/user-login/export', exportParams, filename);
}

// ==================== 操作日志 ====================

/**
 * 获取操作日志列表
 * @description 依据：02.4-后台API接口清单.md 第15.1节
 * @endpoint GET /api/admin/logs/operation
 */
export async function fetchOperationLogs(
  params: OperationLogQueryParams
): Promise<OperationLogListResponse> {
  // 过滤掉空值参数
  const cleanParams: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      cleanParams[key] = value;
    }
  }
  
  return get<OperationLogListResponse>('/logs/operation', cleanParams);
}

/**
 * 导出操作日志
 * @description 导出近30天内的操作日志
 * @endpoint GET /api/admin/logs/operation/export
 */
export async function exportOperationLogs(
  params: LoginLogExportParams
): Promise<void> {
  const { filters, format, startDate, endDate } = params;
  
  // 构建导出参数
  const exportParams: Record<string, unknown> = {
    ...filters,
    format,
  };
  
  if (startDate) exportParams.startDate = startDate;
  if (endDate) exportParams.endDate = endDate;
  
  const filename = `操作日志_${new Date().toISOString().split('T')[0]}.${format}`;
  
  return download('/logs/operation/export', exportParams, filename);
}

// ==================== 黑名单 IP 检测 ====================

/**
 * 获取黑名单 IP 列表（用于高亮显示）
 * @description 获取 IP 类型的黑名单列表，用于在用户登录日志中高亮显示
 */
export async function fetchBlacklistIps(): Promise<string[]> {
  try {
    const response = await get<{ list: Array<{ value: string }> }>('/blacklist', {
      type: 'IP',
      pageSize: 1000,
    });
    return response.list.map((item) => item.value);
  } catch {
    // 获取失败时返回空数组，不影响页面展示
    console.warn('[登录日志] 获取黑名单IP列表失败');
    return [];
  }
}
