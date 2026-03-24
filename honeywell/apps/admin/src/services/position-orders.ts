/**
 * @file 持仓订单 API 服务
 * @description 持仓订单列表、详情、收益记录相关 API 请求封装
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第6节 - 持仓订单接口
 */

import { get, post } from '@/utils/request';
import type { PaginatedResponse } from '@/utils/request';
import type {
  PositionOrderListItem,
  PositionOrderListParams,
  PositionOrderDetail,
  IncomeRecord,
  IncomeSummary,
  IncomeRecordParams,
  ProductOption,
  TerminateResult,
  BatchTerminateResult,
} from '@/types/position-orders';

/**
 * 获取持仓订单列表
 * @description 依据：02.4-后台API接口清单.md 第6.1节
 * @endpoint GET /api/admin/position-orders
 */
export async function fetchPositionOrderList(
  params: PositionOrderListParams
): Promise<PaginatedResponse<PositionOrderListItem>> {
  // 处理数组参数
  const processedParams: Record<string, unknown> = { ...params };

  // 产品ID数组转换
  if (Array.isArray(params.productId) && params.productId.length > 0) {
    processedParams.productId = params.productId.join(',');
  }

  // 状态数组转换
  if (Array.isArray(params.status) && params.status.length > 0) {
    processedParams.status = params.status.join(',');
  }

  // orderType 转大写（后端 enum 为 PURCHASE/GIFT）
  if (params.orderType) {
    processedParams.orderType = params.orderType.toUpperCase();
  }

  return get<PaginatedResponse<PositionOrderListItem>>(
    '/position-orders',
    processedParams
  );
}

/**
 * 获取持仓订单详情
 * @description 依据：02.4-后台API接口清单.md 第6.2节
 * @endpoint GET /api/admin/position-orders/:id
 */
export async function fetchPositionOrderDetail(
  orderId: number
): Promise<PositionOrderDetail> {
  return get<PositionOrderDetail>(`/position-orders/${orderId}`);
}

/**
 * 获取持仓订单收益发放记录
 * @description 依据：02.4-后台API接口清单.md 第6.3节
 * @endpoint GET /api/admin/position-orders/:id/incomes
 */
export async function fetchPositionOrderIncomes(
  orderId: number,
  params?: IncomeRecordParams
): Promise<PaginatedResponse<IncomeRecord> & { summary: IncomeSummary }> {
  return get<PaginatedResponse<IncomeRecord> & { summary: IncomeSummary }>(
    `/position-orders/${orderId}/incomes`,
    params as Record<string, unknown>
  );
}

/**
 * 获取产品列表（用于筛选下拉）
 * @description 获取所有上架产品用于筛选
 * @endpoint GET /api/admin/products
 */
export async function fetchProductOptions(): Promise<{ list: ProductOption[] }> {
  return get<{ list: ProductOption[] }>('/products', {
    status: 'ACTIVE',
    pageSize: 100,
  });
}

/**
 * 终止持仓订单
 * @endpoint POST /api/admin/position-orders/:id/terminate
 */
export async function terminatePositionOrder(
  orderId: number,
  params: { reason?: string }
): Promise<TerminateResult> {
  return post<TerminateResult>(`/position-orders/${orderId}/terminate`, params);
}

/**
 * 批量终止持仓订单
 * @endpoint POST /api/admin/position-orders/batch-terminate
 */
export async function batchTerminatePositionOrders(
  params: { ids: number[]; reason?: string }
): Promise<BatchTerminateResult> {
  return post<BatchTerminateResult>('/position-orders/batch-terminate', params);
}
