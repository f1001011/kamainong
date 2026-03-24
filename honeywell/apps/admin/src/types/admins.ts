/**
 * @file 管理员类型定义
 * @description 管理员管理相关的 TypeScript 类型
 * @depends 开发文档/04-后台管理端/04.10-安全管理/04.10.1-管理员管理页.md
 */

/**
 * 管理员对象
 * @description 依据：02.1-数据库设计.md 第2.9节 - Admin 表
 */
export interface Admin {
  /** 管理员ID */
  id: number;
  /** 用户名 */
  username: string;
  /** 昵称 */
  nickname: string | null;
  /** 是否启用 */
  isActive: boolean;
  /** 最后登录时间 */
  lastLoginAt: string | null;
  /** 最后登录IP */
  lastLoginIp: string | null;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 管理员列表查询参数
 */
export interface AdminQueryParams {
  /** 当前页码 */
  page?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 用户名（模糊搜索） */
  username?: string;
  /** 昵称（模糊搜索） */
  nickname?: string;
  /** 状态：启用/禁用 */
  isActive?: boolean;
  /** 创建时间范围-开始 */
  startDate?: string;
  /** 创建时间范围-结束 */
  endDate?: string;
  /** 排序字段 */
  sortField?: string;
  /** 排序方式 */
  sortOrder?: 'ascend' | 'descend';
}

/**
 * 管理员列表响应
 */
export interface AdminListResponse {
  /** 管理员列表 */
  list: Admin[];
  /** 分页信息 */
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 创建管理员表单数据
 */
export interface CreateAdminFormData {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 确认密码 */
  confirmPassword: string;
  /** 昵称 */
  nickname?: string;
  /** 是否启用 */
  isActive?: boolean;
}

/**
 * 更新管理员表单数据
 */
export interface UpdateAdminFormData {
  /** 昵称 */
  nickname?: string;
  /** 是否启用 */
  isActive?: boolean;
}

/**
 * 创建/更新管理员响应
 */
export interface AdminResponse {
  /** 管理员信息 */
  admin: Admin;
  /** 提示消息 */
  message?: string;
}

/**
 * 状态切换响应
 */
export interface StatusResponse {
  /** 管理员ID */
  id: number;
  /** 新状态 */
  isActive: boolean;
}

/**
 * 重置密码表单数据
 */
export interface ResetPasswordFormData {
  /** 新密码 */
  password: string;
  /** 确认密码 */
  confirmPassword: string;
}

/**
 * 重置密码模式
 */
export type ResetPasswordMode = 'auto' | 'manual';

/**
 * 密码强度等级
 */
export type PasswordStrength = 'weak' | 'medium' | 'strong';

/**
 * 通用操作响应
 */
export interface OperationResponse {
  /** 操作是否成功 */
  success: boolean;
  /** 提示消息 */
  message: string;
}
