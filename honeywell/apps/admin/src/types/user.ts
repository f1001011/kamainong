/**
 * @file 用户相关类型定义
 * @description 用户管理相关的类型
 */

/**
 * 用户状态
 */
export type UserStatus = 'ACTIVE' | 'BANNED';

/**
 * 用户基础信息
 */
export interface User {
  id: number;
  phone: string;
  nickname: string | null;
  avatarUrl: string | null;
  vipLevel: number;
  status: UserStatus;
  inviteCode: string;
  inviterId: number | null;
  
  // 余额信息
  availableBalance: string;
  frozenBalance: string;
  totalRecharge: string;
  totalWithdraw: string;
  totalIncome: string;
  totalCommission: string;
  
  // 首购状态
  firstPurchaseDone: boolean;
  
  // 注册信息
  registerIp: string | null;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  
  // 时间
  createdAt: string;
  updatedAt: string;
}

/**
 * 用户列表项（精简版）
 */
export interface UserListItem {
  id: number;
  phone: string;
  nickname: string | null;
  vipLevel: number;
  status: UserStatus;
  availableBalance: string;
  inviterPhone?: string;
  createdAt: string;
  lastLoginAt: string | null;
}

/**
 * 用户详情（包含关联数据）
 */
export interface UserDetail extends User {
  // 上级信息
  inviter?: {
    id: number;
    phone: string;
    nickname: string | null;
  };
  
  // 统计信息
  teamCount?: number;
  positionCount?: number;
}

/**
 * 用户余额调整参数
 */
export interface UserBalanceAdjustParams {
  userId: number;
  type: 'ADD' | 'DEDUCT';
  amount: string;
  remark?: string;
}

/**
 * 用户封禁参数
 */
export interface UserBanParams {
  userId: number;
  reason?: string;
}
