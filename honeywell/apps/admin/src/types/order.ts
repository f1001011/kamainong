/**
 * @file 订单相关类型定义
 * @description 充值、提现、持仓订单的类型
 */

/**
 * 充值订单状态
 */
export type RechargeOrderStatus = 
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'TIMEOUT';

/**
 * 提现订单状态
 */
export type WithdrawOrderStatus =
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REJECTED';

/**
 * 持仓订单状态
 */
export type PositionOrderStatus = 'ACTIVE' | 'COMPLETED';

/**
 * 充值订单
 */
export interface RechargeOrder {
  id: number;
  orderNo: string;
  userId: number;
  amount: string;
  actualAmount: string;
  channelCode: string;
  channelOrderNo: string | null;
  status: RechargeOrderStatus;
  paymentUrl: string | null;
  paidAt: string | null;
  expiredAt: string;
  createdAt: string;
  updatedAt: string;
  
  // 关联用户
  user?: {
    id: number;
    phone: string;
    nickname: string | null;
  };
}

/**
 * 提现订单
 */
export interface WithdrawOrder {
  id: number;
  orderNo: string;
  userId: number;
  amount: string;
  fee: string;
  actualAmount: string;
  bankCardId: number;
  channelCode: string | null;
  channelOrderNo: string | null;
  status: WithdrawOrderStatus;
  reviewedBy: number | null;
  reviewedAt: string | null;
  rejectReason: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  
  // 关联数据
  user?: {
    id: number;
    phone: string;
    nickname: string | null;
  };
  bankCard?: {
    bankName: string;
    cardNo: string;
    holderName: string;
  };
  reviewer?: {
    id: number;
    username: string;
  };
}

/**
 * 持仓订单
 */
export interface PositionOrder {
  id: number;
  orderNo: string;
  userId: number;
  productId: number;
  amount: string;
  dailyIncomeRate: string;
  totalDays: number;
  completedDays: number;
  totalIncome: string;
  receivedIncome: string;
  status: PositionOrderStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  
  // 关联数据
  user?: {
    id: number;
    phone: string;
    nickname: string | null;
  };
  product?: {
    id: number;
    name: string;
    code: string;
  };
}

/**
 * 订单查询参数
 */
export interface OrderQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  userId?: number;
  orderNo?: string;
  startDate?: string;
  endDate?: string;
}
