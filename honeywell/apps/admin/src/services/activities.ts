/**
 * @file 活动管理 API 服务
 * @description 活动数据明细相关 API 请求封装
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第8节 - 活动管理接口
 */

import { get } from '@/utils/request';

// ==================== 类型定义 ====================

/** 分页参数基础类型 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  [key: string]: unknown; // 添加索引签名以兼容 Record<string, unknown>
}

/** 分页响应 */
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ==================== 签到记录类型 ====================

/** 普通签到记录 */
export interface NormalSignInRecord {
  id: number;
  userId: number;
  userPhone: string;
  userNickname: string;
  amount: string;
  signDate: string;
  createdAt: string;
}

/** 普通签到记录查询参数 */
export interface NormalSignInParams extends PaginationParams {
  userId?: number;
  userPhone?: string;
  signDate?: string;
  startDate?: string;
  endDate?: string;
}

/** 普通签到记录响应 */
export interface NormalSignInResponse {
  list: NormalSignInRecord[];
  pagination: Pagination;
  summary?: {
    totalCount: number;
    totalAmount: string;
  };
}

/** SVIP签到记录 */
export interface SvipSignInRecord {
  id: number;
  userId: number;
  userPhone: string;
  userNickname: string;
  svipLevel: number;
  amount: string;
  signDate: string;
  createdAt: string;
}

/** SVIP签到记录查询参数 */
export interface SvipSignInParams extends PaginationParams {
  userId?: number;
  userPhone?: string;
  svipLevel?: number | number[]; // 支持多选
  signDate?: string;
  startDate?: string;
  endDate?: string;
}

/** SVIP签到记录响应 */
export interface SvipSignInResponse {
  list: SvipSignInRecord[];
  pagination: Pagination;
  summary?: {
    totalCount: number;
    totalAmount: string;
  };
}

// ==================== 有效邀请记录类型 ====================

/** 有效邀请记录 */
export interface ValidInvitationRecord {
  id: number;
  inviterId: number;
  inviterPhone: string;
  inviterNickname: string;
  inviteeId: number;
  inviteePhone: string;
  inviteeNickname: string;
  inviteeRegisteredAt: string;
  validType: 'RECHARGE_PURCHASE' | 'COMPLETE_SIGNIN';
  validAt: string;
  isRewardClaimed: boolean;
}

/** 有效邀请记录查询参数 */
export interface ValidInvitationParams extends PaginationParams {
  inviterId?: number;
  inviterPhone?: string;
  inviteeId?: number;
  inviteePhone?: string;
  validType?: ('RECHARGE_PURCHASE' | 'COMPLETE_SIGNIN') | ('RECHARGE_PURCHASE' | 'COMPLETE_SIGNIN')[]; // 支持多选
  startDate?: string;
  endDate?: string;
}

/** 有效邀请记录响应 */
export interface ValidInvitationResponse {
  list: ValidInvitationRecord[];
  pagination: Pagination;
  summary?: {
    totalCount: number;
    rechargePurchaseCount: number;
    completeSigninCount: number;
  };
}

// ==================== 拉新奖励领取记录类型 ====================

/** 拉新奖励领取记录 */
export interface InviteRewardClaimRecord {
  id: number;
  userId: number;
  userPhone: string;
  userNickname: string;
  rewardLevel: number;
  amount: string;
  validInviteCountAtClaim: number;
  createdAt: string;
}

/** 拉新奖励领取记录查询参数 */
export interface InviteRewardClaimParams extends PaginationParams {
  userId?: number;
  userPhone?: string;
  rewardLevel?: number;
  startDate?: string;
  endDate?: string;
}

/** 拉新奖励领取记录响应 */
export interface InviteRewardClaimResponse {
  list: InviteRewardClaimRecord[];
  pagination: Pagination;
  summary?: {
    totalCount: number;
    totalAmount: string;
  };
}

// ==================== 连单奖励领取记录类型 ====================

/** 连单奖励领取记录 */
export interface CollectionClaimRecord {
  id: number;
  userId: number;
  userPhone: string;
  userNickname: string;
  rewardLevel: number;
  requiredProducts: string[];
  amount: string;
  purchasedProductsAtClaim: string[];
  createdAt: string;
}

/** 连单奖励领取记录查询参数 */
export interface CollectionClaimParams extends PaginationParams {
  userId?: number;
  userPhone?: string;
  rewardLevel?: number;
  startDate?: string;
  endDate?: string;
}

/** 连单奖励领取记录响应 */
export interface CollectionClaimResponse {
  list: CollectionClaimRecord[];
  pagination: Pagination;
  summary?: {
    totalCount: number;
    totalAmount: string;
  };
}

// ==================== API 请求函数 ====================

/**
 * 获取普通签到记录
 * @description 依据：02.4-后台API接口清单.md 第8.8节
 * @endpoint GET /api/admin/activities/normal-signin/records
 */
export async function fetchNormalSignInRecords(
  params: NormalSignInParams
): Promise<NormalSignInResponse> {
  return get<NormalSignInResponse>('/activities/normal-signin/records', params);
}

/**
 * 获取SVIP签到记录
 * @description 依据：02.4-后台API接口清单.md 第8.6节
 * @endpoint GET /api/admin/activities/svip-signin/records
 */
export async function fetchSvipSignInRecords(
  params: SvipSignInParams
): Promise<SvipSignInResponse> {
  return get<SvipSignInResponse>('/activities/svip-signin/records', params);
}

/**
 * 获取有效邀请记录
 * @description 依据：02.4-后台API接口清单.md 第8.4节
 * @endpoint GET /api/admin/activities/invite/valid-invitations
 */
export async function fetchValidInvitations(
  params: ValidInvitationParams
): Promise<ValidInvitationResponse> {
  return get<ValidInvitationResponse>('/activities/invite/valid-invitations', params);
}

/**
 * 获取拉新奖励领取记录
 * @description 依据：02.4-后台API接口清单.md 第8.5节
 * @endpoint GET /api/admin/activities/invite/reward-claims
 */
export async function fetchInviteRewardClaims(
  params: InviteRewardClaimParams
): Promise<InviteRewardClaimResponse> {
  return get<InviteRewardClaimResponse>('/activities/invite/reward-claims', params);
}

/**
 * 获取连单奖励领取记录
 * @description 依据：02.4-后台API接口清单.md 第8.7节
 * @endpoint GET /api/admin/activities/collection/claims
 */
export async function fetchCollectionClaims(
  params: CollectionClaimParams
): Promise<CollectionClaimResponse> {
  return get<CollectionClaimResponse>('/activities/collection/claims', params);
}

// ==================== 导出相关 ====================

/**
 * 导出签到记录 Excel
 * @description 导出全量签到记录
 */
export async function exportSignInRecords(
  type: 'normal' | 'svip',
  params: Omit<NormalSignInParams | SvipSignInParams, 'page' | 'pageSize'>
): Promise<Blob> {
  const endpoint = type === 'normal'
    ? '/activities/normal-signin/records/export'
    : '/activities/svip-signin/records/export';
  
  const response = await fetch(`/api/admin${endpoint}?${new URLSearchParams(params as Record<string, string>)}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('导出失败');
  }
  
  return response.blob();
}

/**
 * 导出有效邀请记录 Excel
 */
export async function exportValidInvitations(
  params: Omit<ValidInvitationParams, 'page' | 'pageSize'>
): Promise<Blob> {
  const response = await fetch(
    `/api/admin/activities/invite/valid-invitations/export?${new URLSearchParams(params as Record<string, string>)}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('导出失败');
  }
  
  return response.blob();
}

/**
 * 导出拉新奖励领取记录 Excel
 */
export async function exportInviteRewardClaims(
  params: Omit<InviteRewardClaimParams, 'page' | 'pageSize'>
): Promise<Blob> {
  const response = await fetch(
    `/api/admin/activities/invite/reward-claims/export?${new URLSearchParams(params as Record<string, string>)}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('导出失败');
  }
  
  return response.blob();
}

/**
 * 导出连单奖励领取记录 Excel
 */
export async function exportCollectionClaims(
  params: Omit<CollectionClaimParams, 'page' | 'pageSize'>
): Promise<Blob> {
  const response = await fetch(
    `/api/admin/activities/collection/claims/export?${new URLSearchParams(params as Record<string, string>)}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('导出失败');
  }
  
  return response.blob();
}
