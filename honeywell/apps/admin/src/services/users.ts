/**
 * @file 用户管理 API 服务
 * @description 用户列表、操作等相关 API 请求封装
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第3节 - 用户管理接口
 */

import { get, post, put, del } from '@/utils/request';
import type {
  UserListItem,
  UserListParams,
  UserListResponse,
  BalanceAdjustParams,
  BalanceAdjustResponse,
  GiftProductParams,
  GiftProductResponse,
  BanUserParams,
  BatchBanParams,
  BatchUnbanParams,
  BatchBalanceParams,
  BatchOperationResponse,
  AddBlacklistParams,
  ProductItem,
} from '@/types/users';

/**
 * 获取用户列表
 * @description 依据：02.4-后台API接口清单.md 第3.1节
 * @endpoint GET /api/admin/users
 */
export async function fetchUserList(params: UserListParams): Promise<UserListResponse> {
  // 处理数组参数（VIP等级、SVIP等级支持多选）
  const processedParams: Record<string, unknown> = { ...params };
  
  // VIP等级数组转换
  if (Array.isArray(params.vipLevel) && params.vipLevel.length > 0) {
    processedParams.vipLevel = params.vipLevel.join(',');
  }
  
  // SVIP等级数组转换
  if (Array.isArray(params.svipLevel) && params.svipLevel.length > 0) {
    processedParams.svipLevel = params.svipLevel.join(',');
  }
  
  // 布尔值转换
  if (params.hasPosition !== undefined) {
    processedParams.hasPosition = params.hasPosition;
  }
  if (params.hasPurchasedPaid !== undefined) {
    processedParams.hasPurchasedPaid = params.hasPurchasedPaid;
  }
  
  return get<UserListResponse>('/users', processedParams);
}

/**
 * 调整用户余额
 * @description 依据：02.4-后台API接口清单.md 第3.3节
 * @endpoint POST /api/admin/users/:id/balance
 */
export async function adjustUserBalance(
  userId: number,
  params: BalanceAdjustParams
): Promise<BalanceAdjustResponse> {
  return post<BalanceAdjustResponse>(`/users/${userId}/balance`, params);
}

/**
 * 赠送产品给用户
 * @description 依据：02.4-后台API接口清单.md 第3.4节
 * @endpoint POST /api/admin/users/:id/gift-product
 */
export async function giftProduct(
  userId: number,
  params: GiftProductParams
): Promise<GiftProductResponse> {
  return post<GiftProductResponse>(`/users/${userId}/gift-product`, params);
}

/**
 * 封禁用户
 * @description 依据：02.4-后台API接口清单.md 第3.7节
 * @endpoint POST /api/admin/users/:id/ban
 */
export async function banUser(userId: number, params?: BanUserParams): Promise<void> {
  return post(`/users/${userId}/ban`, params || {});
}

/**
 * 解封用户
 * @description 依据：02.4-后台API接口清单.md 第3节
 * @endpoint POST /api/admin/users/:id/unban
 */
export async function unbanUser(userId: number): Promise<void> {
  return post(`/users/${userId}/unban`);
}

/**
 * 重置用户密码
 * @description 依据：02.4-后台API接口清单.md 第3节
 * @endpoint POST /api/admin/users/:id/reset-password
 */
export async function resetUserPassword(userId: number): Promise<{ newPassword: string }> {
  return post(`/users/${userId}/reset-password`);
}

/**
 * 批量封禁用户
 * @description 依据：02.4-后台API接口清单.md 第3.15节
 * @endpoint POST /api/admin/users/batch-ban
 */
export async function batchBanUsers(params: BatchBanParams): Promise<BatchOperationResponse> {
  return post<BatchOperationResponse>('/users/batch-ban', params);
}

/**
 * 批量解封用户
 * @description 依据：02.4-后台API接口清单.md 第3.16节
 * @endpoint POST /api/admin/users/batch-unban
 */
export async function batchUnbanUsers(params: BatchUnbanParams): Promise<BatchOperationResponse> {
  return post<BatchOperationResponse>('/users/batch-unban', params);
}

/**
 * 批量调整余额
 * @description 依据：02.4-后台API接口清单.md 第3.17节
 * @endpoint POST /api/admin/users/batch-balance
 */
export async function batchAdjustBalance(
  params: BatchBalanceParams
): Promise<BatchOperationResponse> {
  return post<BatchOperationResponse>('/users/batch-balance', params);
}

/**
 * 添加黑名单
 * @description 依据：02.4-后台API接口清单.md 第14.2节
 * @endpoint POST /api/admin/blacklist
 */
export async function addToBlacklist(params: AddBlacklistParams): Promise<void> {
  return post('/blacklist', params);
}

/**
 * 清空用户银行卡信息
 * @description 软删除用户所有银行卡 + 清除关联的账户手机号锁定记录
 * @endpoint DELETE /api/admin/users/:id/bank-cards
 */
export async function clearUserBankCards(
  userId: number
): Promise<{ cardsCleared: number; locksCleared: number }> {
  return del<{ cardsCleared: number; locksCleared: number }>(`/users/${userId}/bank-cards`);
}

/**
 * 获取产品列表（用于赠送产品选择）
 * @description 依据：02.4-后台API接口清单.md 第7.1节
 * @endpoint GET /api/admin/products
 */
export async function fetchProducts(): Promise<{ list: ProductItem[] }> {
  return get<{ list: ProductItem[] }>('/products', { status: 'ACTIVE' });
}

/**
 * 获取用户已购买的产品列表
 * @description 用于判断产品是否已购买
 * @endpoint GET /api/admin/users/:id/positions
 */
export async function fetchUserPositions(
  userId: number
): Promise<{ list: Array<{ productId: number; productName: string }> }> {
  return get(`/users/${userId}/positions`, { status: 'ACTIVE', pageSize: 100 });
}

// ==================== 用户详情页 API ====================

import type {
  UserDetail,
  BankCard,
  PositionOrderItem,
  PositionOrderParams,
  RechargeOrderItem,
  RechargeOrderParams,
  WithdrawOrderItem,
  WithdrawOrderParams,
  TransactionItem,
  TransactionParams,
  TeamMemberItem,
  TeamMemberParams,
  TeamSummary,
  UplineResponse,
  UpdateLevelParams,
  RestorePurchaseParams,
  UserProductPurchase,
} from '@/types/users';
import type { PaginatedResponse } from '@/utils/request';

/**
 * API 返回的用户原始数据结构
 * @description 依据：02.4-后台API接口清单.md 第3.2节
 */
interface UserApiData {
  id: number;
  phone: string;
  password: string;
  nickname: string | null;
  avatar: string | null;           // API 使用 avatar，前端使用 avatarUrl
  inviteCode: string;
  vipLevel: number;
  svipLevel: number;
  status: 'ACTIVE' | 'BANNED';
  availableBalance: string;
  frozenBalance: string;
  hasPurchasedTrial: boolean;
  hasPurchasedPaid: boolean;
  firstPurchaseDone: boolean;
  hasRecharged: boolean;
  hasPurchasedAfterRecharge: boolean;
  signInCompleted: boolean;
  registerIp: string | null;
  lastLoginIp: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  inviterId?: number | null;
  inviter?: { id: number; phone: string; nickname: string | null } | null;
  level2Inviter?: { id: number; phone: string; nickname: string | null } | null;
  level3Inviter?: { id: number; phone: string; nickname: string | null } | null;
  // API 将统计数据放在 stats 对象中
  stats: {
    totalRecharge: string;
    totalWithdraw: string;
    totalIncome: string;
    totalCommission: string;
    teamCount: number;
    level1Count: number;
    level2Count: number;
    level3Count: number;
  };
}

/**
 * 用户详情API响应结构
 * @description 依据：02.4-后台API接口清单.md 第3.2节
 */
interface UserDetailResponse {
  user: UserApiData;
  bankCards?: BankCard[];
  recentPositions?: PositionOrderItem[];
}

/**
 * 将 API 用户数据映射为前端 UserDetail 类型
 */
function mapApiUserToDetail(apiUser: UserApiData): UserDetail {
  return {
    id: apiUser.id,
    phone: apiUser.phone,
    password: apiUser.password,
    nickname: apiUser.nickname,
    avatarUrl: apiUser.avatar,                    // avatar → avatarUrl
    inviteCode: apiUser.inviteCode,
    vipLevel: apiUser.vipLevel,
    svipLevel: apiUser.svipLevel,
    status: apiUser.status,
    availableBalance: apiUser.availableBalance,
    frozenBalance: apiUser.frozenBalance,
    hasPurchasedTrial: apiUser.hasPurchasedTrial,
    hasPurchasedPaid: apiUser.hasPurchasedPaid,
    firstPurchaseDone: apiUser.firstPurchaseDone,
    hasRecharged: apiUser.hasRecharged,
    hasPurchasedAfterRecharge: apiUser.hasPurchasedAfterRecharge,
    signInCompleted: apiUser.signInCompleted,
    registerIp: apiUser.registerIp,
    lastLoginIp: apiUser.lastLoginIp,
    lastLoginAt: apiUser.lastLoginAt,
    createdAt: apiUser.createdAt,
    inviterId: apiUser.inviterId ?? null,
    inviter: apiUser.inviter ? {
      id: apiUser.inviter.id,
      phone: apiUser.inviter.phone,
      nickname: apiUser.inviter.nickname,
      vipLevel: 0,
      status: 'ACTIVE' as const,
    } : null,
    level2Inviter: apiUser.level2Inviter ? {
      id: apiUser.level2Inviter.id,
      phone: apiUser.level2Inviter.phone,
      nickname: apiUser.level2Inviter.nickname,
      vipLevel: 0,
      status: 'ACTIVE' as const,
    } : null,
    level3Inviter: apiUser.level3Inviter ? {
      id: apiUser.level3Inviter.id,
      phone: apiUser.level3Inviter.phone,
      nickname: apiUser.level3Inviter.nickname,
      vipLevel: 0,
      status: 'ACTIVE' as const,
    } : null,
    // 从 stats 对象展开统计字段
    totalRecharge: apiUser.stats?.totalRecharge ?? '0.00',
    totalWithdraw: apiUser.stats?.totalWithdraw ?? '0.00',
    totalIncome: apiUser.stats?.totalIncome ?? '0.00',
    totalCommission: apiUser.stats?.totalCommission ?? '0.00',
    teamCount: apiUser.stats?.teamCount ?? 0,
    level1Count: apiUser.stats?.level1Count ?? 0,
    level2Count: apiUser.stats?.level2Count ?? 0,
    level3Count: apiUser.stats?.level3Count ?? 0,
  };
}

/**
 * 获取用户详情
 * @description 依据：02.4-后台API接口清单.md 第3.2节
 * @endpoint GET /api/admin/users/:id
 */
export async function fetchUserDetail(userId: number): Promise<UserDetail> {
  const response = await get<UserDetailResponse>(`/users/${userId}`);
  
  // 调试日志（生产环境可移除）
  console.log('[fetchUserDetail] API Response:', JSON.stringify(response, null, 2));
  
  // API 返回 { user: {...}, ... }，提取并映射 user 对象
  if ('user' in response && response.user) {
    return mapApiUserToDetail(response.user);
  }
  
  // 兼容处理：如果后端直接返回用户对象（无 user 包装）
  // 检查是否是用户对象（有 id 和 phone 字段）
  const directUser = response as unknown as UserApiData;
  if (directUser.id && directUser.phone) {
    console.log('[fetchUserDetail] Direct user object detected');
    return mapApiUserToDetail(directUser);
  }
  
  console.error('[fetchUserDetail] Invalid response structure:', response);
  throw new Error('无效的用户详情响应格式');
}

/**
 * 获取用户银行卡列表
 * @description 依据：02.4-后台API接口清单.md 第3.8节
 * @endpoint GET /api/admin/users/:id/bank-cards
 */
export async function fetchUserBankCards(userId: number): Promise<{ list: BankCard[] }> {
  return get<{ list: BankCard[] }>(`/users/${userId}/bank-cards`);
}

/**
 * 获取用户持仓订单列表
 * @description 依据：02.4-后台API接口清单.md 第3.9节
 * @endpoint GET /api/admin/users/:id/positions
 */
export async function fetchUserPositionOrders(
  userId: number,
  params?: PositionOrderParams
): Promise<PaginatedResponse<PositionOrderItem>> {
  return get<PaginatedResponse<PositionOrderItem>>(`/users/${userId}/positions`, params as Record<string, unknown>);
}

/**
 * 获取用户充值订单列表
 * @description 依据：02.4-后台API接口清单.md 第3.10节
 * @endpoint GET /api/admin/users/:id/recharge-orders
 */
export async function fetchUserRechargeOrders(
  userId: number,
  params?: RechargeOrderParams
): Promise<PaginatedResponse<RechargeOrderItem>> {
  return get<PaginatedResponse<RechargeOrderItem>>(`/users/${userId}/recharge-orders`, params as Record<string, unknown>);
}

/**
 * 获取用户提现订单列表
 * @description 依据：02.4-后台API接口清单.md 第3.11节
 * @endpoint GET /api/admin/users/:id/withdraw-orders
 */
export async function fetchUserWithdrawOrders(
  userId: number,
  params?: WithdrawOrderParams
): Promise<PaginatedResponse<WithdrawOrderItem>> {
  return get<PaginatedResponse<WithdrawOrderItem>>(`/users/${userId}/withdraw-orders`, params as Record<string, unknown>);
}

/**
 * 获取用户资金流水
 * @description 依据：02.4-后台API接口清单.md 第3.12节
 * @endpoint GET /api/admin/users/:id/transactions
 */
export async function fetchUserTransactions(
  userId: number,
  params?: TransactionParams
): Promise<PaginatedResponse<TransactionItem>> {
  return get<PaginatedResponse<TransactionItem>>(`/users/${userId}/transactions`, params as Record<string, unknown>);
}

/**
 * 获取用户团队成员
 * @description 依据：02.4-后台API接口清单.md 第3.13节
 * @endpoint GET /api/admin/users/:id/team
 */
export async function fetchUserTeam(
  userId: number,
  params?: TeamMemberParams
): Promise<PaginatedResponse<TeamMemberItem> & { summary: TeamSummary }> {
  return get<PaginatedResponse<TeamMemberItem> & { summary: TeamSummary }>(`/users/${userId}/team`, params as Record<string, unknown>);
}

/**
 * 获取用户邀请链路
 * @description 依据：02.4-后台API接口清单.md 第3.14节
 * @endpoint GET /api/admin/users/:id/upline
 */
export async function fetchUserUpline(userId: number): Promise<UplineResponse> {
  return get<UplineResponse>(`/users/${userId}/upline`);
}

/**
 * 修改用户等级
 * @description 依据：02.4-后台API接口清单.md 第3.6节
 * @endpoint PUT /api/admin/users/:id/vip-level
 */
export async function updateUserLevel(
  userId: number,
  params: UpdateLevelParams
): Promise<void> {
  return put<void>(`/users/${userId}/vip-level`, params);
}

/**
 * 恢复用户产品购买资格
 * @description 依据：02.4-后台API接口清单.md 第3.5节
 * @endpoint POST /api/admin/users/:id/restore-purchase/:productId
 */
export async function restoreUserPurchase(
  userId: number,
  productId: number
): Promise<void> {
  return post<void>(`/users/${userId}/restore-purchase/${productId}`);
}

/**
 * 获取用户已购买产品列表（含购买次数）
 * @description 用于恢复限购弹窗
 * @endpoint GET /api/admin/users/:id/purchased-products
 */
export async function fetchUserPurchasedProducts(
  userId: number
): Promise<{ list: UserProductPurchase[] }> {
  return get<{ list: UserProductPurchase[] }>(`/users/${userId}/purchased-products`);
}

/**
 * 拉黑银行卡
 * @description 将银行卡号加入黑名单
 * @endpoint POST /api/admin/blacklist
 */
export async function blacklistBankCard(cardNo: string, reason?: string): Promise<void> {
  return post<void>('/blacklist', {
    type: 'BANK_CARD',
    value: cardNo,
    reason,
  });
}
