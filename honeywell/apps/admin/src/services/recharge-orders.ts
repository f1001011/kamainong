/**
 * @file 充值订单 API 服务
 * @description 充值订单列表、详情、手动充值、查询上游相关 API 请求封装
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第4节 - 充值订单接口
 */

import { get, post } from '@/utils/request';
import type { PaginatedResponse } from '@/utils/request';
import type {
  RechargeOrderListItem,
  RechargeOrderListParams,
  RechargeOrderDetail,
  RechargeOrderSummary,
  ManualRechargeParams,
  ManualRechargeResult,
  QueryUpstreamResult,
  BatchQueryUpstreamResult,
  ChannelOption,
  UserSearchResult,
} from '@/types/recharge-orders';

/**
 * 充值订单列表响应类型
 */
export interface RechargeOrderListResponse extends PaginatedResponse<RechargeOrderListItem> {
  summary: RechargeOrderSummary;
}

/**
 * 获取充值订单列表
 * @description 依据：02.4-后台API接口清单.md 第4.1节
 * @endpoint GET /api/admin/recharge-orders
 */
export async function fetchRechargeOrderList(
  params: RechargeOrderListParams
): Promise<RechargeOrderListResponse> {
  // 处理数组参数
  const processedParams: Record<string, unknown> = { ...params };

  // 通道ID数组转换
  if (Array.isArray(params.channelId) && params.channelId.length > 0) {
    processedParams.channelId = params.channelId.join(',');
  }

  // 状态数组转换
  if (Array.isArray(params.status) && params.status.length > 0) {
    processedParams.status = params.status.join(',');
  }

  return get<RechargeOrderListResponse>('/recharge-orders', processedParams);
}

/**
 * 获取充值订单详情
 * @description 依据：02.4-后台API接口清单.md 第4.1节
 * @endpoint GET /api/admin/recharge-orders/:id
 */
export async function fetchRechargeOrderDetail(
  orderId: number
): Promise<RechargeOrderDetail> {
  return get<RechargeOrderDetail>(`/recharge-orders/${orderId}`);
}

/**
 * 手动充值（生成支付订单）
 * @description 依据：02.4-后台API接口清单.md 第4.2节
 * @endpoint POST /api/admin/recharge-orders/manual
 */
export async function createManualRecharge(
  params: ManualRechargeParams
): Promise<ManualRechargeResult> {
  return post<ManualRechargeResult>('/recharge-orders/manual', params);
}

/**
 * 查询上游状态（单条）
 * @description 依据：02.4-后台API接口清单.md 第4.3节
 * @endpoint POST /api/admin/recharge-orders/:id/query-upstream
 */
export async function queryUpstreamStatus(
  orderId: number
): Promise<QueryUpstreamResult> {
  return post<QueryUpstreamResult>(`/recharge-orders/${orderId}/query-upstream`);
}

/**
 * 批量查询上游状态
 * @description 依据：02.4-后台API接口清单.md 第4.3节
 * @endpoint POST /api/admin/recharge-orders/batch-query-upstream
 */
export async function batchQueryUpstream(
  ids: number[]
): Promise<BatchQueryUpstreamResult> {
  return post<BatchQueryUpstreamResult>('/recharge-orders/batch-query-upstream', { ids });
}

/**
 * 获取支付通道列表（用于筛选下拉）
 * @description 获取所有启用的支付通道
 * @endpoint GET /api/admin/channels
 */
export async function fetchChannelOptions(): Promise<{ list: ChannelOption[] }> {
  return get<{ list: ChannelOption[] }>('/channels', { payEnabled: true });
}

/**
 * 搜索用户（用于手动充值）
 * @description 通过手机号或ID搜索用户
 * @endpoint GET /api/admin/users
 */
export async function searchUserForRecharge(
  keyword: string
): Promise<UserSearchResult | null> {
  try {
    const result = await get<{ list: UserSearchResult[] }>('/users', {
      keyword,
      pageSize: 1,
    });

    return result.list.length > 0 ? result.list[0] : null;
  } catch {
    return null;
  }
}
