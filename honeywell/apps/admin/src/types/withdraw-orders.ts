/**
 * @file 提现订单类型定义
 * @description 提现订单列表、详情、审核相关类型
 * @depends 开发文档/04-后台管理端/04.4-订单管理/04.4.3-提现订单列表页.md
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第5节 - 提现订单接口
 */

/**
 * 提现订单状态
 * @description 依据：04.4.3-提现订单列表页.md 第3.2节
 */
export type WithdrawOrderStatus =
  | 'PENDING_REVIEW' // 待审核
  | 'APPROVED'       // 已通过（已提交代付）
  | 'PAYOUT_FAILED'  // 代付失败（余额仍冻结，待管理员处理）
  | 'COMPLETED'      // 已完成
  | 'FAILED'         // 失败（已退回余额）
  | 'REJECTED';      // 已拒绝

/**
 * 提现订单状态选项
 */
export const WITHDRAW_STATUS_OPTIONS = [
  { value: 'PENDING_REVIEW', label: '待审核', color: 'orange' },
  { value: 'APPROVED', label: '已通过', color: 'blue' },
  { value: 'PAYOUT_FAILED', label: '代付失败', color: 'volcano' },
  { value: 'COMPLETED', label: '已完成', color: 'green' },
  { value: 'FAILED', label: '已退款', color: 'red' },
  { value: 'REJECTED', label: '已拒绝', color: 'default' },
];

/**
 * 银行卡快照类型
 * @description 依据：04.4.3-提现订单列表页.md 第6.2.4节
 */
export interface BankCardSnapshot {
  /** 银行名称 */
  bankName: string;
  /** 银行编码 */
  bankCode: string;
  /** 收款人姓名 */
  accountName: string;
  /** 完整收款账号 */
  accountNo: string;
  /** 账号后4位（脱敏用） */
  accountNoMask: string;
  /** 收款手机 */
  phone?: string;
  /** 证件类型 */
  documentType?: 'CC' | 'CE' | 'NIT' | 'PP';
  /** 证件号码 */
  documentNo?: string;
  /** 快照时间 */
  snapshotAt?: string;
}

/**
 * 提现订单列表项
 * @description 依据：04.4.3-提现订单列表页.md 第3节
 */
export interface WithdrawOrderListItem {
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
  /** 申请金额 */
  amount: string;
  /** 手续费 */
  fee: string;
  /** 实际到账金额 */
  actualAmount: string;
  /** 订单状态 */
  status: WithdrawOrderStatus;
  /** 银行卡快照 */
  bankCardSnapshot: BankCardSnapshot;
  /** 是否免审核 */
  isAutoApproved: boolean;
  /** 免审核原因 */
  autoApproveReason?: string;
  /** 创建IP */
  createIp: string;
  /** 创建时间 */
  createdAt: string;
  /** 审核人ID */
  reviewedBy?: number | null;
  /** 审核人姓名 */
  reviewedByName?: string | null;
  /** 审核时间 */
  reviewedAt?: string | null;
  /** 拒绝原因 */
  rejectReason?: string | null;
  /** 通道订单号（发给支付通道的实际订单号，重试时会重新生成） */
  channelOrderNo?: string | null;
  /** 第三方订单号（支付平台返回） */
  thirdOrderNo?: string | null;
  /** 代付重试次数 */
  retryCount?: number;
  /** 最近一次代付失败原因 */
  payoutFailReason?: string | null;
  /** 当前代付通道名称 */
  channelName?: string | null;
  /** 当前代付通道代码 */
  channelCode?: string | null;
}

/**
 * 提现订单详情
 * @description 包含完整的订单信息，用于详情抽屉展示
 */
/**
 * 代付尝试记录
 */
export interface PayoutAttemptRecord {
  attemptNo: number;
  channelCode: string;
  channelName?: string;
  channelOrderNo?: string;
  thirdOrderNo?: string | null;
  status: 'PENDING' | 'SUBMITTED' | 'SUCCESS' | 'FAILED';
  failReason?: string;
  submittedAt?: string;
  callbackAt?: string;
}

export interface WithdrawOrderDetail extends WithdrawOrderListItem {
  /** 代付通道ID */
  channelId?: number | null;
  /** 第三方订单号 */
  thirdOrderNo?: string | null;
  /** 回调时间 */
  callbackAt?: string | null;
  /** 回调数据（JSON字符串） */
  callbackData?: string | null;
  /** 更新时间 */
  updatedAt: string;
  /** 代付尝试历史记录 */
  payoutAttempts?: PayoutAttemptRecord[] | null;
}

/**
 * 提现订单列表查询参数
 * @description 依据：04.4.3-提现订单列表页.md 第2节
 */
export interface WithdrawOrderListParams {
  page?: number;
  pageSize?: number;
  /** 订单号 */
  orderNo?: string;
  /** 用户ID */
  userId?: number;
  /** 用户手机号 */
  userPhone?: string;
  /** 收款银行编码（支持多选） */
  bankCode?: string | string[];
  /** 收款账号 */
  accountNo?: string;
  /** 订单状态（支持多选） */
  status?: WithdrawOrderStatus | WithdrawOrderStatus[];
  /** 审核人ID */
  reviewedBy?: number;
  /** 是否免审核 */
  isAutoApproved?: boolean;
  /** 创建时间-开始 */
  startDate?: string;
  /** 创建时间-结束 */
  endDate?: string;
  /** 金额范围-最小 */
  amountMin?: number;
  /** 金额范围-最大 */
  amountMax?: number;
}

/**
 * 提现订单汇总统计
 * @description 依据：04.4.3-提现订单列表页.md 第1.2节
 */
export interface WithdrawOrderSummary {
  /** 待审核数量 */
  pendingCount: number;
  /** 待审核金额 */
  pendingAmount: string;
  /** 代付失败待处理数量 */
  payoutFailedCount?: number;
  /** 代付失败待处理金额 */
  payoutFailedAmount?: string;
  /** 今日完成数量 */
  todayCompletedCount?: number;
  /** 今日完成金额 */
  todayCompletedAmount?: string;
  /** 今日拒绝数量 */
  todayRejectedCount?: number;
}

/**
 * 银行选项（用于筛选）
 */
export interface BankOption {
  code: string;
  name: string;
}

/**
 * 管理员选项（用于审核人筛选）
 */
export interface AdminOption {
  id: number;
  name: string;
  username: string;
}

/**
 * 审核通过请求参数
 * @description 依据：04.4.3-提现订单列表页.md 第4.2节
 */
export interface ApproveWithdrawParams {
  /** 订单ID */
  id: number;
}

/**
 * 审核拒绝请求参数
 * @description 依据：04.4.3-提现订单列表页.md 第4.3节
 */
export interface RejectWithdrawParams {
  /** 订单ID */
  id: number;
  /** 拒绝原因（选填，用户可见） */
  reason?: string;
}

/**
 * 批量审核请求参数
 * @description 依据：04.4.3-提现订单列表页.md 第5节
 */
export interface BatchApproveParams {
  ids: number[];
}

export interface BatchRejectParams {
  ids: number[];
  reason?: string;
}

/**
 * 批量审核结果项
 */
export interface BatchReviewResultItem {
  id: number;
  orderNo: string;
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 批量审核响应
 */
export interface BatchReviewResult {
  total: number;
  succeeded: number;
  failed: number;
  results: BatchReviewResultItem[];
}

/**
 * 查询上游状态响应
 */
export interface QueryUpstreamResult {
  /** 上游状态 */
  upstreamStatus: 'COMPLETED' | 'FAILED' | 'PROCESSING' | 'UNKNOWN';
  /** 是否已更新 */
  updated: boolean;
  /** 更新后的订单状态 */
  newStatus?: WithdrawOrderStatus;
  /** 错误信息 */
  errorMessage?: string;
}

/**
 * 常用拒绝原因
 * @description 依据：04.4.3-提现订单列表页.md 第4.3节
 */
export const COMMON_REJECT_REASONS = [
  '银行卡信息有误',
  '账户异常，请联系客服',
  '疑似风险操作',
  '其他',
];

/**
 * 驳回代付失败请求参数
 */
export interface DismissPayoutFailedParams {
  id: number;
  reason?: string;
}

/**
 * 重试代付请求参数
 */
export interface RetryPayoutParams {
  id: number;
  channelId: number;
}

/**
 * 可用代付通道
 */
export interface TransferChannelOption {
  id: number;
  code: string;
  name: string;
  channelStatus: 'NORMAL' | 'WARNING' | 'ERROR';
  balance: string | null;
  balanceUpdatedAt: string | null;
  hourlySuccessRate: string | null;
  weeklySuccessRate: string | null;
  transferFeeRate: string | null;
  /** 是否为当前失败通道 */
  isCurrentFailed: boolean;
}

/**
 * 常用驳回代付失败原因
 */
export const COMMON_DISMISS_REASONS = [
  '代付通道暂不可用',
  '用户银行卡信息有误',
  '金额超出通道限制',
  '已与用户沟通确认退款',
];
