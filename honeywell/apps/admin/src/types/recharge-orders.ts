/**
 * @file 充值订单类型定义
 * @description 充值订单列表、详情、手动充值相关类型
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第4节 - 充值订单接口
 */

/**
 * 充值订单状态
 * @description 依据：04.4.2-充值订单列表页.md 第4.2节
 */
export type RechargeOrderStatus = 
  | 'PENDING_PAYMENT'  // 待支付
  | 'PAID'             // 已支付
  | 'FAILED'           // 已失败
  | 'CANCELLED';       // 已取消

/**
 * 充值订单状态选项
 */
export const RECHARGE_STATUS_OPTIONS = [
  { value: 'PENDING_PAYMENT', label: '待支付' },
  { value: 'PAID', label: '已支付' },
  { value: 'FAILED', label: '已失败' },
  { value: 'CANCELLED', label: '已取消' },
];

/**
 * 支付通道选项类型
 */
export interface ChannelOption {
  id: number;
  code: string;
  name: string;
}

/**
 * 充值订单列表项
 * @description 依据：02.4-后台API接口清单.md 第4.1节
 */
export interface RechargeOrderListItem {
  id: number;
  /** 本地订单号 */
  orderNo: string;
  /** 第三方订单号 */
  thirdOrderNo: string | null;
  /** 用户ID */
  userId: number;
  /** 用户手机号 */
  userPhone: string;
  /** 用户昵称 */
  userNickname?: string | null;
  /** 支付通道ID */
  channelId?: number;
  /** 支付通道名称 */
  channelName: string;
  /** 请求金额 */
  amount: string;
  /** 实付金额（回调后的实际支付金额） */
  actualAmount: string | null;
  /** 订单状态 */
  status: RechargeOrderStatus;
  /** 支付链接 */
  payUrl?: string | null;
  /** 创建IP */
  createIp: string;
  /** 创建时间 */
  createdAt: string;
  /** 支付完成时间（回调时间） */
  callbackAt: string | null;
}

/**
 * 充值订单详情
 */
export interface RechargeOrderDetail extends RechargeOrderListItem {
  /** 支付链接过期时间 */
  expireAt?: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 充值订单列表查询参数
 */
export interface RechargeOrderListParams {
  page?: number;
  pageSize?: number;
  /** 本地订单号 */
  orderNo?: string;
  /** 第三方订单号 */
  thirdOrderNo?: string;
  /** 用户ID */
  userId?: number;
  /** 用户手机号 */
  userPhone?: string;
  /** 支付通道ID（支持多选） */
  channelId?: number | number[];
  /** 订单状态（支持多选） */
  status?: RechargeOrderStatus | RechargeOrderStatus[];
  /** 创建时间-开始 */
  startDate?: string;
  /** 创建时间-结束 */
  endDate?: string;
  /** 金额范围-最小 */
  amountMin?: number;
  /** 金额范围-最大 */
  amountMax?: number;
  /** 创建IP */
  createIp?: string;
}

/**
 * 充值订单汇总统计
 */
export interface RechargeOrderSummary {
  /** 充值总额 */
  totalAmount: string;
  /** 充值笔数 */
  totalCount: number;
}

/**
 * 手动充值请求参数
 * @description 依据：02.4-后台API接口清单.md 第4.2节
 */
export interface ManualRechargeParams {
  /** 用户ID */
  userId: number;
  /** 支付通道ID */
  channelId: number;
  /** 充值金额 */
  amount: string;
}

/**
 * 手动充值响应
 */
export interface ManualRechargeResult {
  /** 订单ID */
  orderId: number;
  /** 订单号 */
  orderNo: string;
  /** 支付链接 */
  payUrl: string;
  /** 过期时间 */
  expireAt: string;
}

/**
 * 查询上游状态响应
 */
export interface QueryUpstreamResult {
  /** 上游状态 */
  upstreamStatus: 'PAID' | 'PENDING' | 'UNKNOWN';
  /** 是否已补单 */
  compensated: boolean;
  /** 实际支付金额（补单时） */
  actualAmount?: string;
}

/**
 * 批量查询上游结果项
 */
export interface BatchQueryUpstreamResultItem {
  id: number;
  success: boolean;
  upstreamStatus?: 'PAID' | 'PENDING' | 'UNKNOWN';
  compensated?: boolean;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 批量查询上游响应
 */
export interface BatchQueryUpstreamResult {
  total: number;
  succeeded: number;
  failed: number;
  results: BatchQueryUpstreamResultItem[];
}

/**
 * 用户搜索结果（用于手动充值）
 */
export interface UserSearchResult {
  id: number;
  phone: string;
  nickname: string | null;
  avatarUrl?: string | null;
  vipLevel: number;
  status: 'ACTIVE' | 'BANNED';
  availableBalance: string;
}
