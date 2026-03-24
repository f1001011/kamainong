/**
 * @file 黑名单服务
 * @description 黑名单管理相关的 API 请求封装
 * @depends 开发文档/04-后台管理端/04.10-安全管理/04.10.2-黑名单管理页.md 第十一节
 */

import { get, post, del } from '@/utils/request';
import type {
  Blacklist,
  BlacklistFormData,
  BlacklistQueryParams,
  BlacklistListResponse,
  BatchImportResponse,
  BatchDeleteResponse,
} from '@/types/blacklist';

/**
 * 获取黑名单列表
 * @param params 查询参数
 */
export async function getBlacklistList(
  params: BlacklistQueryParams
): Promise<BlacklistListResponse> {
  return get<BlacklistListResponse>('/blacklist', params as unknown as Record<string, unknown>);
}

/**
 * 添加黑名单
 * @param data 黑名单数据
 */
export async function addBlacklist(
  data: BlacklistFormData
): Promise<Blacklist> {
  return post<Blacklist>('/blacklist', data);
}

/**
 * 删除黑名单
 * @param id 黑名单ID
 */
export async function deleteBlacklist(
  id: number
): Promise<void> {
  return del<void>(`/blacklist/${id}`);
}

/**
 * 批量删除黑名单
 * @param ids 黑名单ID列表
 */
export async function batchDeleteBlacklist(
  ids: number[]
): Promise<BatchDeleteResponse> {
  return post<BatchDeleteResponse>('/blacklist/batch-delete', { ids });
}

/**
 * 批量导入黑名单
 * @param data 批量导入数据
 */
export async function batchImportBlacklist(
  data: { type: string; values: string[]; reason?: string }
): Promise<BatchImportResponse> {
  return post<BatchImportResponse>('/blacklist/batch-import', data);
}

/**
 * 获取黑名单统计数量
 * @description 获取各类型黑名单的数量，用于 Tab 显示
 */
export async function getBlacklistCounts(): Promise<{
  phone: number;
  ip: number;
  bank_card: number;
}> {
  return get<{ phone: number; ip: number; bank_card: number }>('/blacklist/counts');
}
