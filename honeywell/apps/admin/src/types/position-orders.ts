/**
 * @file 持仓订单类型定义
 * @description 持仓订单列表、详情、收益记录的类型定义
 * @depends 开发文档/04-后台管理端/04.4-订单管理/04.4.1-持仓订单列表页.md
 */

/**
 * 持仓订单状态
 */
export type PositionOrderStatus = 'ACTIVE' | 'COMPLETED' | 'TERMINATED';

/**
 * 收益发放状态
 * @description 依据：02.4-后台API接口清单 第6.3节
 * - PENDING = 待发放（蓝色 processing）
 * - SETTLED = 已发放（绿色 success）
 * - FAILED = 失败（红色 error）
 */
export type IncomeStatus = 'PENDING' | 'SETTLED' | 'FAILED' | 'CANCELLED';

/**
 * 产品系列
 */
export type ProductSeries = 'PO' | 'VIP';

/**
 * 订单类型
 */
export type OrderType = 'purchase' | 'gift';

/**
 * 持仓订单列表项
 * @description 依据：04.4.1-持仓订单列表页.md 第3节
 */
export interface PositionOrderListItem {
  /** 订单ID */
  id: number;
  /** 订单号 */
  orderNo: string;
  /** 用户ID */
  userId: number;
  /** 用户手机号 */
  userPhone: string;
  /** 用户昵称 */
  userNickname?: string | null;
  /** 产品ID */
  productId: number;
  /** 产品名称 */
  productName: string;
  /** 产品系列 */
  productSeries: ProductSeries;
  /** 是否赠送订单 */
  isGift: boolean;
  /** 赠送人（管理员用户名） */
  giftedBy?: string | null;
  /** 购买金额 */
  purchaseAmount: string;
  /** 日收益 */
  dailyIncome: string;
  /** 周期天数 */
  cycleDays: number;
  /** 已发放天数 */
  paidDays: number;
  /** 已获收益 */
  earnedIncome: string;
  /** 订单状态 */
  status: PositionOrderStatus;
  /** 开始时间 */
  startAt: string;
  /** 下次发放时间 */
  nextSettleAt: string | null;
  /** 结束时间 */
  endAt: string | null;
  /** 终止时间 */
  terminatedAt?: string | null;
  /** 终止原因 */
  terminateReason?: string | null;
}

/**
 * 持仓订单详情
 * @description 依据：04.4.1-持仓订单列表页.md 第5节
 */
export interface PositionOrderDetail extends PositionOrderListItem {
  /** 总收益 */
  totalIncome: string;
  /** 待发收益 */
  pendingIncome: string;
  /** 创建时间 */
  createdAt: string;
  /** 终止操作人ID */
  terminatedBy?: number | null;
}

/**
 * 收益发放记录
 * @description 依据：04.4.1-持仓订单列表页.md 第6节
 */
export interface IncomeRecord {
  /** 记录ID */
  id: number;
  /** 发放序号 */
  settleSequence: number;
  /** 金额 */
  amount: string;
  /** 状态 */
  status: IncomeStatus;
  /** 计划发放时间 */
  scheduleAt: string;
  /** 实际发放时间 */
  settledAt: string | null;
  /** 重试次数 */
  retryCount: number;
}

/**
 * 收益记录汇总
 */
export interface IncomeSummary {
  /** 已发放金额 */
  totalSettled: string;
  /** 待发放笔数 */
  pendingCount: number;
  /** 失败笔数 */
  failedCount: number;
}

/**
 * 持仓订单列表查询参数
 * @description 依据：04.4.1-持仓订单列表页.md 第2节
 */
export interface PositionOrderListParams {
  /** 页码 */
  page?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 订单号 */
  orderNo?: string;
  /** 用户ID */
  userId?: number;
  /** 用户手机号 */
  userPhone?: string;
  /** 产品ID（多选） */
  productId?: number[];
  /** 产品系列 */
  productSeries?: ProductSeries;
  /** 订单类型 */
  orderType?: OrderType;
  /** 订单状态（多选） */
  status?: PositionOrderStatus[];
  /** 开始时间 - 起 */
  startDate?: string;
  /** 开始时间 - 止 */
  endDate?: string;
  /** 金额最小值 */
  amountMin?: number;
  /** 金额最大值 */
  amountMax?: number;
}

/**
 * 收益记录查询参数
 */
export interface IncomeRecordParams {
  /** 页码 */
  page?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 状态筛选 */
  status?: IncomeStatus;
}

/**
 * 产品选项（用于下拉筛选）
 */
export interface ProductOption {
  /** 产品ID */
  id: number;
  /** 产品名称 */
  name: string;
  /** 产品系列 */
  series: ProductSeries;
}

/**
 * 快捷筛选项
 */
export const QUICK_FILTER_OPTIONS = [
  { value: 'active', label: '进行中', params: { status: ['ACTIVE'] } },
  { value: 'completed', label: '已完成', params: { status: ['COMPLETED'] } },
  { value: 'terminated', label: '已终止', params: { status: ['TERMINATED'] } },
  { value: 'gift', label: '赠送订单', params: { orderType: 'gift' } },
  { value: 'po', label: 'Po系列', params: { productSeries: 'PO' } },
  { value: 'vip', label: 'VIP系列', params: { productSeries: 'VIP' } },
] as const;

/**
 * 订单状态选项
 */
export const POSITION_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '进行中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'TERMINATED', label: '已终止' },
];

/**
 * 产品系列选项
 */
export const PRODUCT_SERIES_OPTIONS = [
  { value: 'PO', label: 'Po系列', color: 'blue' },
  { value: 'VIP', label: 'VIP系列', color: 'gold' },
  { value: 'VIC', label: 'VIC系列', color: 'cyan' },
  { value: 'NWS', label: 'NWS系列', color: 'green' },
  { value: 'QLD', label: 'QLD系列', color: 'purple' },
  { value: 'FINANCIAL', label: '理财系列', color: 'magenta' },
];

/**
 * 订单类型选项
 */
export const ORDER_TYPE_OPTIONS = [
  { value: 'purchase', label: '购买' },
  { value: 'gift', label: '赠送' },
];

/**
 * 收益状态选项
 * @description 依据：02.4-后台API接口清单 第6.3节
 */
export const INCOME_STATUS_OPTIONS = [
  { value: 'PENDING', label: '待发放' },
  { value: 'SETTLED', label: '已发放' },
  { value: 'FAILED', label: '失败' },
  { value: 'CANCELLED', label: '已取消' },
];

/**
 * 终止持仓订单结果
 */
export interface TerminateResult {
  id: number;
  orderNo: string;
  status: 'TERMINATED';
  cancelledIncomeCount: number;
  vipLevelBefore: number;
  vipLevelAfter: number;
  svipLevelBefore: number;
  svipLevelAfter: number;
}

/**
 * 批量终止结果
 */
export interface BatchTerminateResult {
  totalRequested: number;
  totalTerminated: number;
  totalSkipped: number;
  results: Array<{
    id: number;
    orderNo: string;
    status: 'TERMINATED' | 'SKIPPED';
    skipReason?: string;
  }>;
}
