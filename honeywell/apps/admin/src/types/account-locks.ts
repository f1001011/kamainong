/**
 * @file 账户锁定类型定义
 * @description 银行账户-手机号锁定管理相关类型
 */

/**
 * 锁定记录列表项
 */
export interface AccountLockItem {
  id: number;
  /** 银行卡号（完整，后台可见） */
  accountNo: string;
  /** 银行卡号（脱敏） */
  accountNoMask: string;
  /** 锁定手机号（用户注册手机号） */
  phone: string;
  /** 用户ID */
  userId: number;
  /** 用户注册手机号 */
  userPhone: string;
  /** 用户昵称 */
  userNickname: string | null;
  /** 是否锁定 */
  isLocked: boolean;
  /** 解锁管理员ID */
  unlockedBy: number | null;
  /** 解锁管理员名称 */
  unlockedByName: string | null;
  /** 解锁时间 */
  unlockedAt: string | null;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 锁定记录列表响应
 */
export interface AccountLockListResponse {
  list: AccountLockItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 切换锁定状态响应
 */
export interface ToggleLockResponse {
  id: number;
  isLocked: boolean;
}
