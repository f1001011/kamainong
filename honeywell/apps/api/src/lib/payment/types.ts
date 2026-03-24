/**
 * @file 支付通道类型定义
 * @description 支付通道接口和类型定义
 * @depends 开发文档/05-后端服务/05.2-支付通道集成.md 第2节 - 通用接口定义
 * @depends 开发文档/附录/lwpay.md - LWPAY 代付接口
 * @depends 开发文档/附录/uzpay.md - UZPAY 代付接口
 */

/**
 * 支付通道配置
 */
export interface ChannelConfig {
  code: string; // 通道代码：LWPAY / UZPAY
  name: string; // 通道名称
  merchantId: string; // 商户号
  paySecretKey: string; // 代收密钥
  transferSecretKey: string; // 代付密钥
  gatewayUrl: string; // 网关地址
  bankCode: string; // 银行编码（如 901 / 1220）
  payType?: string; // 支付类型（UZPAY: 1220/1221, JYPAY: 219001）
  payEnabled: boolean; // 代收是否启用
  transferEnabled: boolean; // 代付是否启用
  callbackIps?: string[]; // 回调IP白名单
  extraConfig?: Record<string, unknown>; // 扩展配置（JYPAY: transferGatewayUrl, rsaPublicKey）
}

/**
 * 代收（充值）请求参数
 */
export interface CollectionParams {
  orderNo: string; // 商户订单号（20位）
  amount: string; // 金额（保留2位小数，单位：元）
  productName?: string; // 商品名称
  notifyUrl: string; // 服务端回调地址
  callbackUrl: string; // 前端跳转地址
  attach?: string; // 附加数据
}

/**
 * 代收（充值）响应
 */
export interface CollectionResult {
  success: boolean; // 是否成功
  payUrl?: string; // 收银台URL
  thirdOrderNo?: string; // 第三方订单号
  errorCode?: string; // 错误码
  errorMessage?: string; // 错误信息
  rawResponse?: unknown; // 原始响应（调试用）
}

/**
 * 代收回调数据
 */
export interface CollectionCallbackData {
  valid: boolean; // 签名是否有效
  orderNo: string; // 商户订单号
  thirdOrderNo: string; // 第三方订单号
  amount: string; // 实际支付金额
  success: boolean; // 支付是否成功
  paidAt?: Date; // 支付时间
  rawData: unknown; // 原始数据
}

/**
 * 回调响应
 */
export interface CallbackResponse {
  contentType: string; // 响应Content-Type
  body: string; // 响应内容
}

/**
 * 代收订单查询结果
 * @description 主动查询代收订单状态
 * @depends 开发文档/lwpay.md 第五节 - 代收订单查询
 */
export interface CollectionQueryResult {
  success: boolean; // 查询是否成功
  status: CollectionStatus; // 订单状态
  thirdOrderNo?: string; // 第三方订单号
  amount?: string; // 实际支付金额
  paidAt?: Date; // 支付时间
  errorCode?: string; // 错误码
  errorMessage?: string; // 错误信息
  rawResponse?: unknown; // 原始响应
}

/**
 * 代收订单状态枚举
 */
export enum CollectionStatus {
  SUCCESS = 'SUCCESS', // 支付成功
  NOTPAY = 'NOTPAY', // 未支付
  PENDING = 'PENDING', // 处理中
  FAILED = 'FAILED', // 失败
  UNKNOWN = 'UNKNOWN', // 未知
}

/**
 * 订单状态枚举
 */
export enum OrderStatus {
  PENDING = 'PENDING', // 待处理
  SUCCESS = 'SUCCESS', // 成功
  FAILED = 'FAILED', // 失败
  REVERSED = 'REVERSED', // 冲正（仅代付）
  UNKNOWN = 'UNKNOWN', // 未知
}

// ================================
// 代付（提现）相关类型定义
// ================================

/**
 * 代付（提现）请求参数
 * @depends lwpay.md 第六节 - 代付接口
 * @depends uzpay.md 代付下单接口
 */
export interface TransferParams {
  orderNo: string; // 商户订单号（20位）
  amount: string; // 金额（保留2位小数，单位：元）
  bankCode: string; // 银行编码
  bankName: string; // 银行名称
  accountNo: string; // 收款账号
  accountName: string; // 收款人姓名
  phone: string; // 收款人手机号
  documentType: string; // 证件类型：CC/CE/NIT/PP
  documentNo: string; // 证件号码
  notifyUrl: string; // 服务端回调地址
  remark?: string; // 备注
}

/**
 * 代付（提现）响应
 */
export interface TransferResult {
  success: boolean; // 是否申请成功
  thirdOrderNo?: string; // 第三方订单号
  errorCode?: string; // 错误码
  errorMessage?: string; // 错误信息
  rawResponse?: unknown; // 原始响应（调试用）
}

/**
 * 代付回调数据
 */
export interface TransferCallbackData {
  valid: boolean; // 签名是否有效
  orderNo: string; // 商户订单号
  thirdOrderNo: string; // 第三方订单号
  amount: string; // 金额
  status: TransferStatus; // 代付状态
  failReason?: string; // 失败原因
  completedAt?: Date; // 完成时间
  rawData: unknown; // 原始数据
}

/**
 * 代付状态枚举
 */
export enum TransferStatus {
  SUCCESS = 'SUCCESS', // 成功（打款成功）
  FAILED = 'FAILED', // 失败
  REVERSED = 'REVERSED', // 冲正（需退回余额）
  PENDING = 'PENDING', // 处理中
}

/**
 * 代付查询响应
 */
export interface TransferQueryResult {
  success: boolean; // 查询是否成功
  status: TransferStatus; // 订单状态
  thirdOrderNo?: string; // 第三方订单号
  failReason?: string; // 失败原因
  errorCode?: string; // 错误码
  errorMessage?: string; // 错误信息
  rawResponse?: unknown; // 原始响应
}

/**
 * 支付通道接口
 */
export interface PaymentChannel {
  /** 通道代码 */
  readonly code: string;

  /** 通道名称 */
  readonly name: string;

  // ================================
  // 代收（充值）接口
  // ================================

  /**
   * 创建代收订单（充值）
   * @param params 代收参数
   * @returns 代收结果（包含收银台URL）
   */
  createCollectionOrder(params: CollectionParams): Promise<CollectionResult>;

  /**
   * 验证代收回调
   * @param payload 回调原始数据
   * @returns 解析后的回调数据
   */
  verifyCollectionCallback(payload: unknown): CollectionCallbackData;

  /**
   * 获取代收回调成功响应
   * @returns 回调响应对象
   */
  getCollectionCallbackSuccessResponse(): CallbackResponse;

  /**
   * 获取代收回调失败响应
   * @returns 回调响应对象
   */
  getCollectionCallbackFailResponse(): CallbackResponse;

  /**
   * 查询代收订单状态
   * @description 主动查询充值订单在上游支付通道的状态
   * @depends 开发文档/lwpay.md 第五节 - 代收订单查询
   * @depends 开发文档/uzpay.md - UZPAY 通过解析回调数据获取状态
   * @param orderNo 商户订单号
   * @param callbackData 可选的回调数据（UZPAY 需要通过回调数据判断状态）
   * @param thirdOrderNo 可选的第三方平台订单号（JYPAY 查询接口必填）
   * @returns 查询结果
   */
  queryCollectionOrder(orderNo: string, callbackData?: unknown, thirdOrderNo?: string): Promise<CollectionQueryResult>;

  // ================================
  // 代付（提现）接口
  // ================================

  /**
   * 发起代付请求（提现）
   * @param params 代付参数
   * @returns 代付结果
   */
  createTransferOrder(params: TransferParams): Promise<TransferResult>;

  /**
   * 验证代付回调
   * @param payload 回调原始数据
   * @returns 解析后的回调数据
   */
  verifyTransferCallback(payload: unknown): TransferCallbackData;

  /**
   * 查询代付订单状态
   * @param orderNo 商户订单号
   * @returns 查询结果
   */
  queryTransferOrder(orderNo: string): Promise<TransferQueryResult>;

  /**
   * 获取代付回调成功响应
   * @returns 回调响应对象
   */
  getTransferCallbackSuccessResponse(): CallbackResponse;

  /**
   * 获取代付回调失败响应
   * @returns 回调响应对象
   */
  getTransferCallbackFailResponse(): CallbackResponse;
}
