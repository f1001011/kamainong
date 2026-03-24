/**
 * @file 银行类型定义
 * @description 银行列表、创建、更新相关类型
 * @depends 开发文档/04-后台管理端/04.9-系统设置/04.9.3-银行列表管理页.md 第十节
 */

/**
 * 银行实体
 * @description 依据：04.9.3-银行列表管理页.md 第十节
 */
export interface Bank {
  /** 银行ID */
  id: number;
  /** 银行编码（唯一，用于支付对接） */
  code: string;
  /** 银行名称 */
  name: string;
  /** 是否启用 */
  isActive: boolean;
  /** 排序权重（数字越大越靠前） */
  sortOrder: number;
  /** 关联银行卡数量（列表查询时返回） */
  bankCardCount?: number;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 创建银行请求
 * @description 依据：04.9.3-银行列表管理页.md 第九节
 */
export interface CreateBankRequest {
  /** 银行编码（2-20位字母数字） */
  code: string;
  /** 银行名称（1-100字符） */
  name: string;
  /** 排序权重（0-9999，默认0） */
  sortOrder?: number;
  /** 是否启用（默认true） */
  isActive?: boolean;
}

/**
 * 更新银行请求
 * @description 依据：04.9.3-银行列表管理页.md 第九节
 * @note 编码不可修改
 */
export interface UpdateBankRequest {
  /** 银行名称 */
  name?: string;
  /** 排序权重 */
  sortOrder?: number;
  /** 是否启用 */
  isActive?: boolean;
}

/**
 * 银行列表查询参数
 */
export interface BankListQuery {
  /** 当前页码 */
  page?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 搜索关键词（银行编码或名称） */
  keyword?: string;
  /** 状态筛选 */
  isActive?: boolean;
}

/**
 * 批量状态变更请求
 */
export interface BatchStatusRequest {
  /** 银行ID列表 */
  ids: number[];
  /** 目标状态 */
  isActive: boolean;
}

/**
 * 批量状态变更结果
 */
export interface BatchStatusResult {
  /** 总数 */
  total: number;
  /** 成功数 */
  succeeded: number;
  /** 失败数 */
  failed: number;
  /** 详细结果 */
  results: Array<{
    id: number;
    success: boolean;
    message?: string;
  }>;
}

/**
 * 排序更新项
 */
export interface SortUpdateItem {
  /** 银行ID */
  id: number;
  /** 新的排序值 */
  sortOrder: number;
}

/**
 * 排序更新请求
 */
export interface SortUpdateRequest {
  items: SortUpdateItem[];
}

/**
 * 编码唯一性检查结果
 */
export interface CodeCheckResult {
  /** 是否已存在 */
  exists: boolean;
}

/**
 * 银行状态选项
 */
export const BANK_STATUS_OPTIONS = [
  { value: undefined, label: '全部状态' },
  { value: true, label: '已启用' },
  { value: false, label: '已禁用' },
];
