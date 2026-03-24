/**
 * @file 返佣记录管理类型定义
 * @description 返佣记录管理模块的类型定义
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第19节 - 返佣记录管理接口
 */

import type { PaginationInfo } from './api';

// ================= 枚举和常量 =================

/**
 * 返佣级别枚举
 */
export type CommissionLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';

/**
 * 返佣级别选项（用于筛选和显示）
 */
export const COMMISSION_LEVEL_OPTIONS = [
  { value: 'LEVEL_1', label: '一级返佣', color: 'blue' },
  { value: 'LEVEL_2', label: '二级返佣', color: 'green' },
  { value: 'LEVEL_3', label: '三级返佣', color: 'orange' },
];

/**
 * 返佣级别映射
 */
export const COMMISSION_LEVEL_MAP: Record<CommissionLevel, { label: string; color: string }> = {
  LEVEL_1: { label: '一级', color: 'blue' },
  LEVEL_2: { label: '二级', color: 'green' },
  LEVEL_3: { label: '三级', color: 'orange' },
};

/**
 * 快捷筛选配置
 */
export const COMMISSION_QUICK_FILTERS = [
  { value: 'LEVEL_1', label: '一级返佣' },
  { value: 'LEVEL_2', label: '二级返佣' },
  { value: 'LEVEL_3', label: '三级返佣' },
];

// ================= 查询参数 =================

/**
 * 返佣记录列表查询参数
 * @description 依据：开发文档.md 第13.14节
 */
export interface CommissionListParams {
  /** 当前页码 */
  page?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 获佣用户ID */
  receiverId?: number;
  /** 获佣用户手机号 */
  receiverPhone?: string;
  /** 来源用户ID */
  sourceUserId?: number;
  /** 来源用户手机号 */
  sourceUserPhone?: string;
  /** 返佣级别（多选） */
  level?: CommissionLevel | CommissionLevel[];
  /** 产品ID（多选） */
  productId?: number | number[];
  /** 开始时间 */
  startDate?: string;
  /** 结束时间 */
  endDate?: string;
  /** 最小金额 */
  amountMin?: number;
  /** 最大金额 */
  amountMax?: number;
  /** 排序字段 */
  sortField?: string;
  /** 排序方向 */
  sortOrder?: 'ascend' | 'descend';
}

/**
 * 返佣统计查询参数
 */
export interface CommissionStatsParams {
  /** 开始时间 */
  startDate?: string;
  /** 结束时间 */
  endDate?: string;
}

// ================= 数据结构 =================

/**
 * 返佣记录列表项
 * @description 依据：02.4-后台API接口清单.md 第19.1节
 */
export interface CommissionListItem {
  /** 记录ID */
  id: number;
  /** 获佣用户ID */
  receiverId: number;
  /** 获佣用户手机号 */
  receiverPhone: string;
  /** 获佣用户昵称 */
  receiverNickname: string | null;
  /** 获佣用户头像 */
  receiverAvatarUrl?: string | null;
  /** 获佣用户VIP等级 */
  receiverVipLevel?: number;
  /** 来源用户ID */
  sourceUserId: number;
  /** 来源用户手机号 */
  sourceUserPhone: string;
  /** 来源用户昵称 */
  sourceUserNickname: string | null;
  /** 来源用户头像 */
  sourceUserAvatarUrl?: string | null;
  /** 来源用户VIP等级 */
  sourceUserVipLevel?: number;
  /** 返佣级别 */
  level: CommissionLevel;
  /** 返佣比例（百分比） */
  rate: string;
  /** 基础金额（产品价格） */
  baseAmount: string;
  /** 返佣金额 */
  amount: string;
  /** 产品ID */
  productId: number;
  /** 产品名称 */
  productName: string;
  /** 持仓订单号 */
  positionOrderNo: string;
  /** 创建时间 */
  createdAt: string;
}

/**
 * 返佣统计汇总
 * @description 依据：02.4-后台API接口清单.md 第19.2节
 */
export interface CommissionStatsSummary {
  /** 总返佣金额 */
  totalAmount: string;
  /** 总记录数 */
  totalCount: number;
  /** 一级返佣金额 */
  level1Amount: string;
  /** 一级返佣笔数 */
  level1Count: number;
  /** 二级返佣金额 */
  level2Amount: string;
  /** 二级返佣笔数 */
  level2Count: number;
  /** 三级返佣金额 */
  level3Amount: string;
  /** 三级返佣笔数 */
  level3Count: number;
}

/**
 * 获佣用户排行项
 */
export interface TopReceiverItem {
  /** 用户ID */
  userId: number;
  /** 用户手机号 */
  userPhone: string;
  /** 用户昵称 */
  nickname: string | null;
  /** 总获佣金额 */
  totalAmount: string;
}

/**
 * 每日趋势数据点
 */
export interface DailyTrendItem {
  /** 日期 YYYY-MM-DD */
  date: string;
  /** 金额 */
  amount: string;
  /** 笔数 */
  count: number;
}

// ================= 响应结构 =================

/**
 * 返佣记录列表响应
 */
export interface CommissionListResponse {
  /** 列表数据 */
  list: CommissionListItem[];
  /** 分页信息 */
  pagination: PaginationInfo;
  /** 统计汇总（列表请求时附带） */
  summary?: CommissionStatsSummary;
}

/**
 * 返佣统计响应
 */
export interface CommissionStatsResponse {
  /** 统计汇总 */
  summary: CommissionStatsSummary;
  /** 获佣排行榜 */
  topReceivers: TopReceiverItem[];
  /** 每日趋势 */
  dailyTrend: DailyTrendItem[];
}

// ================= 导出相关 =================

/**
 * 导出参数
 */
export interface CommissionExportParams extends CommissionListParams {
  /** 导出格式 */
  format?: 'xlsx' | 'csv';
}

/**
 * 导出列配置
 */
export const COMMISSION_EXPORT_COLUMNS = [
  { header: '记录ID', key: 'id', width: 10 },
  { header: '获佣用户ID', key: 'receiverId', width: 12 },
  { header: '获佣用户手机号', key: 'receiverPhone', width: 15 },
  { header: '获佣用户昵称', key: 'receiverNickname', width: 15 },
  { header: '来源用户ID', key: 'sourceUserId', width: 12 },
  { header: '来源用户手机号', key: 'sourceUserPhone', width: 15 },
  { header: '来源用户昵称', key: 'sourceUserNickname', width: 15 },
  { header: '返佣级别', key: 'levelText', width: 10 },
  { header: '返佣比例', key: 'rate', width: 10 },
  { header: '基础金额', key: 'baseAmount', width: 12 },
  { header: '返佣金额', key: 'amount', width: 12 },
  { header: '产品名称', key: 'productName', width: 12 },
  { header: '持仓订单号', key: 'positionOrderNo', width: 22 },
  { header: '创建时间', key: 'createdAt', width: 20 },
];
