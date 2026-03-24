/**
 * 支付通道接口定义（策略模式）
 */

// 代收（充值）参数
export interface RechargeParams {
  orderNo: string;
  amount: number;
  userId: number;
  userPhone: string;
  callbackUrl: string;
  clientIp: string;
}

// 代收结果
export interface RechargeResult {
  success: boolean;
  payUrl?: string;
  thirdOrderNo?: string;
  errorMessage?: string;
}

// 代收回调结果
export interface RechargeCallbackResult {
  valid: boolean;
  success?: boolean;
  orderId?: string;
  thirdOrderNo?: string;
  amount?: number;
}

// 代付（提现）参数
export interface WithdrawParams {
  orderNo: string;
  amount: number;
  bankCode: string;
  bankName: string;
  accountName: string;
  accountNo: string;
  phone?: string;
  documentType?: string;
  documentNo?: string;
  callbackUrl: string;
}

// 代付结果
export interface WithdrawResult {
  success: boolean;
  thirdOrderNo?: string;
  errorMessage?: string;
}

// 代付回调结果
export interface WithdrawCallbackResult {
  valid: boolean;
  success?: boolean;
  orderId?: string;
  thirdOrderNo?: string;
  failReason?: string;
}

// 订单查询结果
export interface OrderQueryResult {
  success: boolean;
  status?: 'PENDING' | 'SUCCESS' | 'FAILED';
  amount?: number;
  thirdOrderNo?: string;
  errorMessage?: string;
}

// 余额查询结果
export interface BalanceResult {
  success: boolean;
  balance?: number;
  errorMessage?: string;
}

// 回调响应
export interface CallbackResponse {
  contentType: string;
  body: string;
}

// 通道配置
export interface ChannelConfig {
  code: string;
  merchantId: string;
  paySecretKey: string;
  transferSecretKey: string;
  gatewayUrl: string;
  bankCode?: string;
  payType?: string;
  extraConfig?: Record<string, unknown>;
}

/**
 * 支付通道接口
 */
export interface PaymentChannel {
  code: string;
  name: string;

  // 代收（充值）
  createRechargeOrder(params: RechargeParams): Promise<RechargeResult>;
  queryRechargeOrder(orderId: string): Promise<OrderQueryResult>;
  verifyRechargeCallback(payload: unknown): Promise<RechargeCallbackResult>;
  getRechargeCallbackSuccessResponse(): CallbackResponse;

  // 代付（提现）
  createWithdrawOrder(params: WithdrawParams): Promise<WithdrawResult>;
  queryWithdrawOrder(orderId: string): Promise<OrderQueryResult>;
  verifyWithdrawCallback(payload: unknown): Promise<WithdrawCallbackResult>;
  getWithdrawCallbackSuccessResponse(): CallbackResponse;

  // 余额查询
  queryBalance(): Promise<BalanceResult>;

  // 设置配置
  setConfig(config: ChannelConfig): void;
}
