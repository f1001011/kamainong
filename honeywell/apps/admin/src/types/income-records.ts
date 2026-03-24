/**
 * @file 收益发放管理类型定义
 * @description 收益发放记录、异常处理相关类型定义
 * @depends 开发文档/开发文档.md 第13.13节 - 收益发放管理
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第18节 - 收益发放管理接口
 */

/**
 * 收益发放状态
 * @description 依据：02.4-后台API接口清单 第18.1节
 * - PENDING = 待发放（蓝色 processing）
 * - SETTLED = 已发放（绿色 success）
 * - FAILED = 失败（红色 error）
 */
export type IncomeRecordStatus = 'PENDING' | 'SETTLED' | 'FAILED';

/**
 * 收益发放记录列表项
 * @description 依据：开发文档.md 第13.13.2节
 */
export interface IncomeRecordListItem {
  /** 记录ID */
  id: number;
  /** 用户ID */
  userId: number;
  /** 用户手机号 */
  userPhone: string;
  /** 用户昵称 */
  userNickname?: string | null;
  /** 用户头像 */
  userAvatarUrl?: string | null;
  /** 用户VIP等级 */
  userVipLevel?: number;
  /** 用户状态 */
  userStatus?: 'ACTIVE' | 'BANNED';
  /** 持仓订单ID */
  positionOrderId: number;
  /** 持仓订单号 */
  positionOrderNo: string;
  /** 产品名称 */
  productName: string;
  /** 产品ID */
  productId: number;
  /** 发放序号（第N次发放） */
  settleSequence: number;
  /** 发放金额 */
  amount: string;
  /** 发放状态 */
  status: IncomeRecordStatus;
  /** 计划发放时间 */
  scheduleAt: string;
  /** 实际发放时间 */
  settledAt: string | null;
  /** 重试次数 */
  retryCount: number;
  /** 最后错误信息 */
  lastError: string | null;
}

/**
 * 收益发放异常记录
 * @description 依据：开发文档.md 第13.13.1节
 * 异常记录额外包含处理状态信息
 */
export interface IncomeExceptionListItem extends IncomeRecordListItem {
  /** 是否已处理 */
  isHandled: boolean;
  /** 处理人ID */
  handledBy: number | null;
  /** 处理人姓名 */
  handledByName: string | null;
  /** 处理时间 */
  handledAt: string | null;
  /** 处理备注 */
  handledRemark: string | null;
}

/**
 * 收益记录查询参数
 * @description 依据：开发文档.md 第13.13.2节
 */
export interface IncomeRecordListParams {
  /** 页码 */
  page?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 用户ID */
  userId?: number;
  /** 用户手机号 */
  userPhone?: string;
  /** 持仓订单号 */
  positionOrderNo?: string;
  /** 发放状态（多选） */
  status?: IncomeRecordStatus[];
  /** 计划发放时间 - 起 */
  scheduleStartDate?: string;
  /** 计划发放时间 - 止 */
  scheduleEndDate?: string;
  /** 实际发放时间 - 起 */
  settledStartDate?: string;
  /** 实际发放时间 - 止 */
  settledEndDate?: string;
}

/**
 * 收益异常查询参数
 * @description 依据：开发文档.md 第13.13.1节
 */
export interface IncomeExceptionListParams {
  /** 页码 */
  page?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 用户ID */
  userId?: number;
  /** 用户手机号 */
  userPhone?: string;
  /** 持仓订单号 */
  positionOrderNo?: string;
  /** 产品ID（多选） */
  productId?: number[];
  /** 失败时间 - 起 */
  startDate?: string;
  /** 失败时间 - 止 */
  endDate?: string;
  /** 是否已处理 */
  isHandled?: boolean;
}

/**
 * 收益记录汇总统计
 * @description 依据：02.4-后台API接口清单 第18.1节
 */
export interface IncomeRecordSummary {
  /** 已发放总额 */
  totalSettled: string;
  /** 待发放笔数 */
  pendingCount: number;
  /** 失败笔数 */
  failedCount: number;
}

/**
 * 收益异常汇总统计
 * @description 依据：02.4-后台API接口清单 第18.2节
 */
export interface IncomeExceptionSummary {
  /** 未处理数量 */
  unhandledCount: number;
  /** 失败总金额 */
  totalFailedAmount: string;
}

/**
 * 手动补发响应
 * @description 依据：02.4-后台API接口清单 第18.3节
 */
export interface RetryIncomeResponse {
  /** 新状态 */
  newStatus: IncomeRecordStatus;
  /** 发放时间 */
  settledAt: string;
}

/**
 * 批量操作结果
 * @description 依据：02.4-后台API接口清单 第18.5/18.6节
 */
export interface BatchOperationResult {
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
    error?: {
      code: string;
      message: string;
    };
  }>;
}

/**
 * 标记已处理请求参数
 */
export interface MarkHandledParams {
  /** 备注（可选） */
  remark?: string;
}

/**
 * 批量标记已处理请求参数
 */
export interface BatchMarkHandledParams {
  /** 记录ID列表 */
  ids: number[];
  /** 备注（可选） */
  remark?: string;
}

/**
 * 批量补发请求参数
 */
export interface BatchRetryParams {
  /** 记录ID列表 */
  ids: number[];
}

/**
 * 处理状态选项
 */
export const HANDLED_STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'false', label: '未处理' },
  { value: 'true', label: '已处理' },
];

/**
 * 收益发放状态选项
 */
export const INCOME_RECORD_STATUS_OPTIONS = [
  { value: 'PENDING', label: '待发放' },
  { value: 'SETTLED', label: '已发放' },
  { value: 'FAILED', label: '失败' },
];

/**
 * 快捷筛选配置（异常列表）
 */
export const EXCEPTION_QUICK_FILTERS = [
  { value: 'unhandled', label: '未处理', badgeColor: '#ff4d4f' },
  { value: 'handled', label: '已处理' },
] as const;

/**
 * 快捷筛选到参数的映射（异常列表）
 */
export const EXCEPTION_QUICK_FILTER_PARAMS: Record<string, Partial<IncomeExceptionListParams>> = {
  unhandled: { isHandled: false },
  handled: { isHandled: true },
};

/**
 * 快捷筛选配置（记录列表）
 */
export const RECORD_QUICK_FILTERS = [
  { value: 'pending', label: '待发放', badgeColor: '#1677ff' },
  { value: 'settled', label: '已发放', badgeColor: '#52c41a' },
  { value: 'failed', label: '失败', badgeColor: '#ff4d4f' },
] as const;

/**
 * 快捷筛选到参数的映射（记录列表）
 */
export const RECORD_QUICK_FILTER_PARAMS: Record<string, Partial<IncomeRecordListParams>> = {
  pending: { status: ['PENDING'] },
  settled: { status: ['SETTLED'] },
  failed: { status: ['FAILED'] },
};
