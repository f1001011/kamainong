/**
 * @file 账户锁定管理 API 服务
 * @description 银行账户-手机号锁定记录的查询、切换状态、删除等 API 请求封装
 */

import { get, patch, del } from '@/utils/request';
import type {
  AccountLockListResponse,
  ToggleLockResponse,
} from '@/types/account-locks';

/**
 * 获取锁定记录列表
 * @endpoint GET /api/admin/account-locks
 */
export async function fetchAccountLockList(params?: {
  page?: number;
  pageSize?: number;
  phone?: string;
  accountNoMask?: string;
  isLocked?: boolean;
}): Promise<AccountLockListResponse> {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params?.page) queryParams.page = params.page;
  if (params?.pageSize) queryParams.pageSize = params.pageSize;
  if (params?.phone) queryParams.phone = params.phone;
  if (params?.accountNoMask) queryParams.accountNoMask = params.accountNoMask;
  if (params?.isLocked !== undefined) queryParams.isLocked = params.isLocked;

  return get<AccountLockListResponse>('/account-locks', queryParams);
}

/**
 * 切换锁定状态（解锁/重锁）
 * @endpoint PATCH /api/admin/account-locks/:id
 */
export async function toggleAccountLock(id: number): Promise<ToggleLockResponse> {
  return patch<ToggleLockResponse>(`/account-locks/${id}`);
}

/**
 * 删除锁定记录
 * @endpoint DELETE /api/admin/account-locks/:id
 */
export async function deleteAccountLock(id: number): Promise<void> {
  return del<void>(`/account-locks/${id}`);
}
