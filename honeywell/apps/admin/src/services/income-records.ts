/**
 * @file 收益发放管理 API 服务
 * @description 收益发放记录、异常处理相关 API 请求封装
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第18节 - 收益发放管理接口
 */

import { get, post } from '@/utils/request';
import type { PaginatedResponse } from '@/utils/request';
import type {
  IncomeRecordListItem,
  IncomeRecordListParams,
  IncomeRecordSummary,
  IncomeExceptionListItem,
  IncomeExceptionListParams,
  IncomeExceptionSummary,
  RetryIncomeResponse,
  BatchOperationResult,
  MarkHandledParams,
  BatchMarkHandledParams,
  BatchRetryParams,
} from '@/types/income-records';
import type { ProductOption } from '@/types/position-orders';

/**
 * 收益发放记录列表响应
 */
export interface IncomeRecordListResponse extends PaginatedResponse<IncomeRecordListItem> {
  summary: IncomeRecordSummary;
}

/**
 * 收益发放异常列表响应
 */
export interface IncomeExceptionListResponse extends PaginatedResponse<IncomeExceptionListItem> {
  summary: IncomeExceptionSummary;
}

/**
 * 获取收益发放记录列表
 * @description 依据：02.4-后台API接口清单.md 第18.1节
 * @endpoint GET /api/admin/income-records
 */
export async function fetchIncomeRecordList(
  params: IncomeRecordListParams
): Promise<IncomeRecordListResponse> {
  // 处理数组参数
  const processedParams: Record<string, unknown> = { ...params };

  // 状态数组转换
  if (Array.isArray(params.status) && params.status.length > 0) {
    processedParams.status = params.status.join(',');
  }

  return get<IncomeRecordListResponse>('/income-records', processedParams);
}

/**
 * 获取收益发放异常列表
 * @description 依据：02.4-后台API接口清单.md 第18.2节
 * @endpoint GET /api/admin/income-records/exceptions
 */
export async function fetchIncomeExceptionList(
  params: IncomeExceptionListParams
): Promise<IncomeExceptionListResponse> {
  // 处理数组参数
  const processedParams: Record<string, unknown> = { ...params };

  // 产品ID数组转换
  if (Array.isArray(params.productId) && params.productId.length > 0) {
    processedParams.productId = params.productId.join(',');
  }

  return get<IncomeExceptionListResponse>('/income-records/exceptions', processedParams);
}

/**
 * 手动补发收益
 * @description 依据：02.4-后台API接口清单.md 第18.3节
 * @endpoint POST /api/admin/income-records/:id/retry
 */
export async function retryIncomeRecord(
  recordId: number
): Promise<RetryIncomeResponse> {
  return post<RetryIncomeResponse>(`/income-records/${recordId}/retry`);
}

/**
 * 标记异常已处理
 * @description 依据：02.4-后台API接口清单.md 第18.4节
 * @endpoint POST /api/admin/income-records/:id/mark-handled
 */
export async function markIncomeHandled(
  recordId: number,
  params?: MarkHandledParams
): Promise<void> {
  return post<void>(`/income-records/${recordId}/mark-handled`, params);
}

/**
 * 批量补发收益
 * @description 依据：02.4-后台API接口清单.md 第18.5节
 * @endpoint POST /api/admin/income-records/batch-retry
 */
export async function batchRetryIncome(
  params: BatchRetryParams
): Promise<BatchOperationResult> {
  return post<BatchOperationResult>('/income-records/batch-retry', params);
}

/**
 * 批量标记已处理
 * @description 依据：02.4-后台API接口清单.md 第18.6节
 * @endpoint POST /api/admin/income-records/batch-mark-handled
 */
export async function batchMarkIncomeHandled(
  params: BatchMarkHandledParams
): Promise<BatchOperationResult> {
  return post<BatchOperationResult>('/income-records/batch-mark-handled', params);
}

/**
 * 获取产品列表（用于筛选下拉）
 * @description 获取所有产品用于筛选
 * @endpoint GET /api/admin/products
 */
export async function fetchProductOptions(): Promise<{ list: ProductOption[] }> {
  return get<{ list: ProductOption[] }>('/products', {
    pageSize: 100,
  });
}
