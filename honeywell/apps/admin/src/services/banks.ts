/**
 * @file 银行管理 API 服务
 * @description 银行列表、创建、更新、删除、排序相关 API 请求封装
 * @depends 开发文档/04-后台管理端/04.9-系统设置/04.9.3-银行列表管理页.md 第九节
 */

import { get, post, put, del } from '@/utils/request';
import type {
  Bank,
  BankListQuery,
  CreateBankRequest,
  UpdateBankRequest,
  BatchStatusResult,
  SortUpdateItem,
  CodeCheckResult,
} from '@/types/banks';
import type { PaginatedResponse } from '@/types/api';

/**
 * 获取银行列表
 * @description 依据：04.9.3-银行列表管理页.md 第九节 - GET /api/admin/banks
 * @endpoint GET /api/admin/banks
 */
export async function fetchBankList(
  params?: BankListQuery
): Promise<PaginatedResponse<Bank>> {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params?.page) queryParams.page = params.page;
  if (params?.pageSize) queryParams.pageSize = params.pageSize;
  if (params?.keyword) queryParams.keyword = params.keyword;
  if (params?.isActive !== undefined) queryParams.isActive = params.isActive;

  return get<PaginatedResponse<Bank>>('/banks', queryParams);
}

/**
 * 获取银行详情
 * @description 依据：04.9.3-银行列表管理页.md 第九节 - GET /api/admin/banks/:id
 * @endpoint GET /api/admin/banks/:id
 */
export async function fetchBankDetail(bankId: number): Promise<Bank> {
  return get<Bank>(`/banks/${bankId}`);
}

/**
 * 创建银行
 * @description 依据：04.9.3-银行列表管理页.md 第九节 - POST /api/admin/banks
 * @endpoint POST /api/admin/banks
 */
export async function createBank(data: CreateBankRequest): Promise<Bank> {
  return post<Bank>('/banks', data);
}

/**
 * 更新银行
 * @description 依据：04.9.3-银行列表管理页.md 第九节 - PUT /api/admin/banks/:id
 * @endpoint PUT /api/admin/banks/:id
 * @note 编码不可修改
 */
export async function updateBank(
  bankId: number,
  data: UpdateBankRequest
): Promise<Bank> {
  return put<Bank>(`/banks/${bankId}`, data);
}

/**
 * 删除银行
 * @description 依据：04.9.3-银行列表管理页.md 第九节 - DELETE /api/admin/banks/:id
 * @endpoint DELETE /api/admin/banks/:id
 * @note 有关联银行卡的银行不可删除
 */
export async function deleteBank(bankId: number): Promise<void> {
  return del<void>(`/banks/${bankId}`);
}

/**
 * 更新银行状态（启用/禁用）
 * @description 依据：04.9.3-银行列表管理页.md 第九节 - PUT /api/admin/banks/:id/status
 * @endpoint PUT /api/admin/banks/:id/status
 */
export async function updateBankStatus(
  bankId: number,
  isActive: boolean
): Promise<Bank> {
  return put<Bank>(`/banks/${bankId}/status`, { isActive });
}

/**
 * 批量更新银行状态
 * @description 依据：04.9.3-银行列表管理页.md 第九节 - POST /api/admin/banks/batch-status
 * @endpoint POST /api/admin/banks/batch-status
 */
export async function batchUpdateBankStatus(
  ids: number[],
  isActive: boolean
): Promise<BatchStatusResult> {
  return post<BatchStatusResult>('/banks/batch-status', { ids, isActive });
}

/**
 * 批量更新银行排序
 * @description 依据：04.9.3-银行列表管理页.md 第九节 - PUT /api/admin/banks/sort
 * @endpoint PUT /api/admin/banks/sort
 */
export async function updateBankSort(items: SortUpdateItem[]): Promise<void> {
  return put<void>('/banks/sort', { items });
}

/**
 * 检查银行编码唯一性
 * @description 依据：04.9.3-银行列表管理页.md 第九节 - GET /api/admin/banks/check-code
 * @endpoint GET /api/admin/banks/check-code
 */
export async function checkBankCode(code: string): Promise<CodeCheckResult> {
  return get<CodeCheckResult>('/banks/check-code', { code });
}
