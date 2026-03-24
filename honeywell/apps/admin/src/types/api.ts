/**
 * @file API 类型定义
 * @description API 请求和响应的通用类型
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第6.2节 - API 响应类型定义
 */

/**
 * 通用 API 响应格式
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

/**
 * API 错误格式
 */
export interface ApiError {
  code: string;
  message: string;
  retryAfter?: number;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * 分页信息
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * 分页响应格式
 */
export interface PaginatedResponse<T> {
  list: T[];
  pagination: PaginationInfo;
}

/**
 * 批量操作响应格式
 */
export interface BatchOperationResponse {
  total: number;
  succeeded: number;
  failed: number;
  results: BatchOperationResult[];
}

/**
 * 批量操作单条结果
 */
export interface BatchOperationResult {
  id: number;
  success: boolean;
  error?: ApiError;
}

/**
 * 列表查询参数
 */
export interface ListQueryParams extends PaginationParams {
  keyword?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend';
}
