/**
 * @file 提现订单 API 服务
 * @description 提现订单列表、详情、审核相关 API 请求封装
 * @depends 开发文档/04-后台管理端/04.4-订单管理/04.4.3-提现订单列表页.md
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第5节 - 提现订单接口
 */

import { get, post } from '@/utils/request';
import type { PaginatedResponse } from '@/utils/request';
import type {
  WithdrawOrderListItem,
  WithdrawOrderListParams,
  WithdrawOrderDetail,
  WithdrawOrderSummary,
  BankOption,
  AdminOption,
  ApproveWithdrawParams,
  RejectWithdrawParams,
  BatchApproveParams,
  BatchRejectParams,
  BatchReviewResult,
  QueryUpstreamResult,
  DismissPayoutFailedParams,
  RetryPayoutParams,
  TransferChannelOption,
} from '@/types/withdraw-orders';

/**
 * 提现订单列表响应类型
 */
export interface WithdrawOrderListResponse extends PaginatedResponse<WithdrawOrderListItem> {
  summary: WithdrawOrderSummary;
}

/**
 * 获取提现订单列表
 * @description 依据：02.4-后台API接口清单.md 第5.1节
 * @endpoint GET /api/admin/withdraw-orders
 */
export async function fetchWithdrawOrderList(
  params: WithdrawOrderListParams
): Promise<WithdrawOrderListResponse> {
  // 处理数组参数
  const processedParams: Record<string, unknown> = { ...params };

  // 银行编码数组转换
  if (Array.isArray(params.bankCode) && params.bankCode.length > 0) {
    processedParams.bankCode = params.bankCode.join(',');
  }

  // 状态数组转换
  if (Array.isArray(params.status) && params.status.length > 0) {
    processedParams.status = params.status.join(',');
  }

  return get<WithdrawOrderListResponse>('/withdraw-orders', processedParams);
}

/**
 * 获取提现订单详情
 * @description 依据：02.4-后台API接口清单.md 第5.1节
 * @endpoint GET /api/admin/withdraw-orders/:id
 */
export async function fetchWithdrawOrderDetail(
  orderId: number
): Promise<WithdrawOrderDetail> {
  return get<WithdrawOrderDetail>(`/withdraw-orders/${orderId}`);
}

/**
 * 审核通过
 * @description 依据：04.4.3-提现订单列表页.md 第4.2节
 * @endpoint POST /api/admin/withdraw-orders/:id/approve
 */
export async function approveWithdrawOrder(
  params: ApproveWithdrawParams
): Promise<{ success: boolean; message?: string }> {
  return post<{ success: boolean; message?: string }>(
    `/withdraw-orders/${params.id}/approve`
  );
}

/**
 * 审核拒绝
 * @description 依据：04.4.3-提现订单列表页.md 第4.3节
 * @endpoint POST /api/admin/withdraw-orders/:id/reject
 */
export async function rejectWithdrawOrder(
  params: RejectWithdrawParams
): Promise<{ success: boolean; message?: string }> {
  return post<{ success: boolean; message?: string }>(
    `/withdraw-orders/${params.id}/reject`,
    { reason: params.reason }
  );
}

/**
 * 批量审核通过
 * @description 依据：04.4.3-提现订单列表页.md 第5.2节
 * @endpoint POST /api/admin/withdraw-orders/batch-approve
 */
export async function batchApproveWithdraw(
  params: BatchApproveParams
): Promise<BatchReviewResult> {
  return post<BatchReviewResult>('/withdraw-orders/batch-approve', params);
}

/**
 * 批量审核拒绝
 * @description 依据：04.4.3-提现订单列表页.md 第5.3节
 * @endpoint POST /api/admin/withdraw-orders/batch-reject
 */
export async function batchRejectWithdraw(
  params: BatchRejectParams
): Promise<BatchReviewResult> {
  return post<BatchReviewResult>('/withdraw-orders/batch-reject', params);
}

/**
 * 查询上游状态
 * @description 依据：04.4.3-提现订单列表页.md 第4.4节
 * @endpoint POST /api/admin/withdraw-orders/:id/query-upstream
 */
export async function queryUpstreamStatus(
  orderId: number
): Promise<QueryUpstreamResult> {
  return post<QueryUpstreamResult>(`/withdraw-orders/${orderId}/query-upstream`);
}

/**
 * 获取银行列表（用于筛选下拉）
 * @description 获取所有支持的银行
 * @endpoint GET /api/admin/banks
 */
export async function fetchBankOptions(): Promise<{ list: BankOption[] }> {
  return get<{ list: BankOption[] }>('/banks');
}

/**
 * 获取管理员列表（用于审核人筛选）
 * @description 获取所有管理员
 * @endpoint GET /api/admin/admins
 */
export async function fetchAdminOptions(): Promise<{ list: AdminOption[] }> {
  return get<{ list: AdminOption[] }>('/admins', { status: 'ACTIVE' });
}

/**
 * 驳回代付失败订单（退回余额）
 * @description 将 PAYOUT_FAILED 订单退款给用户
 * @endpoint POST /api/admin/withdraw-orders/:id/dismiss
 */
export async function dismissPayoutFailed(
  params: DismissPayoutFailedParams
): Promise<{ success: boolean; message?: string }> {
  return post<{ success: boolean; message?: string }>(
    `/withdraw-orders/${params.id}/dismiss`,
    { reason: params.reason }
  );
}

/**
 * 重试代付（选择新通道）
 * @description 将 PAYOUT_FAILED 订单重新提交到指定通道
 * @endpoint POST /api/admin/withdraw-orders/:id/retry
 */
export async function retryPayout(
  params: RetryPayoutParams
): Promise<{ success: boolean; message?: string }> {
  return post<{ success: boolean; message?: string }>(
    `/withdraw-orders/${params.id}/retry`,
    { channelId: params.channelId }
  );
}

/**
 * 获取可用代付通道列表
 * @description 获取所有启用代付的通道，供重试时选择
 * @endpoint GET /api/admin/withdraw-orders/transfer-channels
 */
export async function fetchTransferChannels(
  excludeChannelId?: number
): Promise<{ list: TransferChannelOption[] }> {
  const params: Record<string, unknown> = {};
  if (excludeChannelId) {
    params.excludeChannelId = excludeChannelId;
  }
  return get<{ list: TransferChannelOption[] }>('/withdraw-orders/transfer-channels', params);
}
