/**
 * @file 黑名单类型定义
 * @description 黑名单管理相关的 TypeScript 类型定义
 * @depends 开发文档/04-后台管理端/04.10-安全管理/04.10.2-黑名单管理页.md 第十节
 */

/** 黑名单类型 */
export type BlacklistType = 'PHONE' | 'IP' | 'BANK_CARD';

/** 黑名单类型配置映射 */
export const blacklistTypeMap: Record<BlacklistType, { 
  label: string; 
  valueLabel: string; 
  placeholder: string;
}> = {
  PHONE: {
    label: '手机号黑名单',
    valueLabel: '手机号',
    placeholder: '请输入3开头的10位数字手机号',
  },
  IP: {
    label: 'IP黑名单',
    valueLabel: 'IP地址',
    placeholder: '请输入IP地址，支持通配符如 192.168.*.*',
  },
  BANK_CARD: {
    label: '银行卡黑名单',
    valueLabel: '银行卡号',
    placeholder: '请输入银行卡号',
  },
};

/** Tab 配置 */
export const blacklistTabs = [
  { key: 'phone', label: '手机号黑名单', type: 'PHONE' as BlacklistType },
  { key: 'ip', label: 'IP黑名单', type: 'IP' as BlacklistType },
  { key: 'bank_card', label: '银行卡黑名单', type: 'BANK_CARD' as BlacklistType },
];

/** 黑名单对象 */
export interface Blacklist {
  id: number;
  type: BlacklistType;
  value: string;
  reason: string | null;
  /** 仅银行卡黑名单有此字段 */
  bankName?: string | null;
  createdBy: number;
  /** 关联查询的管理员名称 */
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

/** 黑名单表单数据 */
export interface BlacklistFormData {
  type: BlacklistType;
  value: string;
  reason?: string;
}

/** 批量导入表单数据 */
export interface BatchImportFormData {
  type: BlacklistType;
  /** 文本输入，每行一条 */
  values: string;
  reason?: string;
}

/** 黑名单列表查询参数 */
export interface BlacklistQueryParams {
  page?: number;
  pageSize?: number;
  type: BlacklistType;
  keyword?: string;
  createdBy?: number;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend';
}

/** 黑名单列表响应 */
export interface BlacklistListResponse {
  list: Blacklist[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/** 批量导入结果项 */
export interface BatchImportResultItem {
  value: string;
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

/** 批量导入响应 */
export interface BatchImportResponse {
  total: number;
  succeeded: number;
  failed: number;
  results: BatchImportResultItem[];
}

/** 批量删除结果项 */
export interface BatchDeleteResultItem {
  id: number;
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

/** 批量删除响应 */
export interface BatchDeleteResponse {
  total: number;
  succeeded: number;
  failed: number;
  results: BatchDeleteResultItem[];
}

/** 预检结果 */
export interface PreCheckResult {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  invalidItems: Array<{ value: string; error: string }>;
}
