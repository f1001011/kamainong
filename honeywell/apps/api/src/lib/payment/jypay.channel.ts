/**
 * @file JYPAY 支付通道实现
 * @description JYPAY 代收、代付接口实现
 * @depends jypay.md - JYPAY 第三方支付 API 文档
 * @depends 支付文档3.md - JYPAY 接入文档
 *
 * 签名规则：
 * 1. 参数按 ASCII 码从小到大排序
 * 2. 拼接成 k=v&k=v 格式（过滤空值和sign）
 * 3. 使用 HmacSHA256 加密（密钥为 HmacSHA256 密钥）
 * 4. 结果为小写 hex 字符串
 *
 * 代付下单特殊签名：
 * 1. 先 HmacSHA256 得到 signA
 * 2. 再对 signA 使用 RSA-1024 私钥加密 + Base64 编码得到最终 sign
 *
 * 重要差异（与 LWPAY/UZPAY 不同）：
 * - 请求格式：application/json（非 form-urlencoded）
 * - 代收和代付使用不同域名
 * - 回调成功需返回 "SUCCESS"（非 OK/success）
 * - 代收成功状态：status === 5
 * - 代付成功状态：status === 7
 * - 代付失败状态：status === 6 或 8
 */

import crypto from 'crypto';
import { BaseChannel } from './base-channel';
import {
  PaymentChannel,
  ChannelConfig,
  CollectionParams,
  CollectionResult,
  CollectionCallbackData,
  CollectionQueryResult,
  CollectionStatus,
  CallbackResponse,
  TransferParams,
  TransferResult,
  TransferCallbackData,
  TransferQueryResult,
  TransferStatus,
} from './types';

/**
 * 系统银行编码 → JYPAY 银行编码映射
 * @description 系统中bankCode来自bank表，格式各异，需统一映射到JYPAY编码
 */
const JYPAY_BANK_CODE_MAP: Record<string, string> = {
  // 系统bankCode → JYPAY bankCode
  'BCP': 'PENBDRCDODP',
  'INTERBANK': 'PENBCINTNALDEPU',
  'BBVA': 'PENBCTNTL',
  'SCOTIABANK': 'PENSOTPSAA',
  'BN': 'PENBCDLNAON',
  'PICHINCHA': 'PENPICHINCHA',
  'MIBANCO': 'PENMBACBCLAME',
  'CITIBANK': 'PENCITDPSA',
  'SANTANDER': 'PENBCSANTDERPUSA',
  // UZPAY 格式兼容映射
  'PEN1143': 'PENBDRCDODP',       // BCP
  'PEN1144': 'PENBCINTNALDEPU',   // INTERBANK
  'PEN1145': 'PENBCTNTL',         // BBVA
  'PEN1146': 'PENSOTPSAA',        // SCOTIABANK
  'PEN1147': 'PENBCDLNAON',       // BN
  'PEN1148': 'PENPICHINCHA',      // PICHINCHA
  'PEN1149': 'PENMBACBCLAME',     // MIBANCO
};

export class JYPayChannel extends BaseChannel implements PaymentChannel {
  readonly code = 'JYPAY';
  readonly name = 'JYPAY通道';

  constructor(config: ChannelConfig) {
    super(config);
  }

  // ================================
  // 签名方法
  // ================================

  /**
   * HmacSHA256 签名
   * @depends jypay.md 数字签名规范
   */
  private generateHmacSign(
    params: Record<string, string>,
    hmacKey: string
  ): string {
    const filtered: Record<string, string> = {};
    for (const k of Object.keys(params)) {
      if (
        params[k] !== '' &&
        params[k] !== null &&
        params[k] !== undefined
      ) {
        if (k !== 'sign') {
          filtered[k] = params[k];
        }
      }
    }
    const stringA = this.sortAndJoin(filtered);
    return crypto
      .createHmac('sha256', hmacKey)
      .update(stringA)
      .digest('hex');
  }

  /**
   * 代付下单专用签名（HmacSHA256 + RSA私钥加密 + Base64）
   * @depends jypay.md 代付下单 RSA 加密示例
   */
  private generateTransferSign(
    params: Record<string, string>,
    hmacKey: string,
    rsaPrivateKey: string
  ): string {
    // Step1: HmacSHA256
    const signA = this.generateHmacSign(params, hmacKey);

    // Step2: RSA私钥加密 + Base64
    const privateKeyPem = rsaPrivateKey.includes('BEGIN')
      ? rsaPrivateKey
      : `-----BEGIN PRIVATE KEY-----\n${rsaPrivateKey}\n-----END PRIVATE KEY-----`;

    const buffer = Buffer.from(signA, 'utf8');
    const encrypted = crypto.privateEncrypt(
      {
        key: privateKeyPem,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      buffer
    );

    return encrypted.toString('base64');
  }

  /**
   * 验证 HmacSHA256 签名
   */
  private verifyHmacSign(
    params: Record<string, string>,
    sign: string,
    hmacKey: string
  ): boolean {
    const calculated = this.generateHmacSign(params, hmacKey);
    return calculated === sign;
  }

  // ================================
  // HTTP 请求方法
  // ================================

  /**
   * 发送 JSON POST 请求（JYPAY 使用 JSON 而非 form-urlencoded）
   * @depends jypay.md 请求头 Content-Type: application/json
   */
  private async httpPostJson(
    url: string,
    data: Record<string, string>
  ): Promise<Record<string, unknown>> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error('[JYPAY] 响应解析失败:', text);
      throw new Error(`响应解析失败: ${text}`);
    }
  }

  // ================================
  // 辅助方法
  // ================================

  /**
   * 获取代付网关URL
   * @description JYPAY 代收和代付使用不同域名
   * 代付网关存储在 extraConfig.transferGatewayUrl
   */
  private getTransferGatewayUrl(): string {
    const extra = this.config.extraConfig as Record<string, string> | undefined;
    if (extra?.transferGatewayUrl) {
      return extra.transferGatewayUrl;
    }
    // 回退：将代收域名替换为代付域名
    return this.config.gatewayUrl.replace('nkhbz', 'twerf');
  }

  /**
   * 系统银行编码 → JYPAY 银行编码映射
   */
  private mapBankCode(systemBankCode: string): string {
    return JYPAY_BANK_CODE_MAP[systemBankCode] || systemBankCode;
  }

  // ================================
  // 代收（充值）接口实现
  // ================================

  /**
   * 创建代收订单
   * @depends jypay.md 代收下单接口
   */
  async createCollectionOrder(
    params: CollectionParams
  ): Promise<CollectionResult> {
    try {
      const timestamp = Date.now().toString();

      // 依据：jypay.md 代收下单请求参数
      const requestParams: Record<string, string> = {
        bankCode: '',           // 身份证号（代收可为空）
        merNo: this.config.merchantId,
        merOrderNo: params.orderNo,
        name: 'User',           // 姓名
        email: 'pay@hype.com',  // 邮箱
        phone: '900000000',     // 手机号
        orderAmount: this.formatAmount(params.amount),
        currency: 'COP',
        busiCode: this.config.bankCode || '118001',
        pageUrl: params.callbackUrl,
        notifyUrl: params.notifyUrl,
        timestamp: timestamp,
      };

      // HmacSHA256 签名
      requestParams.sign = this.generateHmacSign(
        requestParams,
        this.config.paySecretKey
      );

      // 发起 JSON POST 请求
      const url = `${this.config.gatewayUrl}/payin/createOrder`;
      const data = await this.httpPostJson(url, requestParams);

      // 依据：jypay.md 代收下单返回参数
      // code=200 表示请求成功，status=2 表示待支付
      if (data.code === 200 && data.data) {
        const respData = data.data as Record<string, unknown>;
        return {
          success: true,
          payUrl: respData.orderData as string,  // 支付链接
          thirdOrderNo: respData.orderNo as string, // 平台订单号
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          errorCode: 'JYPAY_ERROR',
          errorMessage: (data.msg as string) || (data.subMsg as string) || 'خطأ في إنشاء الطلب',
          rawResponse: data,
        };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطأ غير معروف';
      console.error(`[JYPAY] 代收下单失败: ${message}`);
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: message,
      };
    }
  }

  /**
   * 验证代收回调
   * @depends jypay.md 代收回调接口
   */
  verifyCollectionCallback(payload: unknown): CollectionCallbackData {
    const data = payload as Record<string, unknown>;

    // 依据：jypay.md 签名规范 - 将所有参数按 ASCII 排序，空参数和 sign 不参与签名
    // 遍历所有回调字段（而非硬编码字段名），确保如果 JYPAY 新增回调字段也能正确验签
    // status 是 integer 类型 (C.3)，需显式 String() 转换
    const signParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === 'sign') continue;
      if (value !== null && value !== undefined && String(value) !== '') {
        signParams[key] = String(value);
      }
    }

    const valid = this.verifyHmacSign(
      signParams,
      String(data.sign),
      this.config.paySecretKey
    );

    // 依据：jypay.md 代收回调 status=5 表示成功
    const success = Number(data.status) === 5;

    return {
      valid,
      orderNo: String(data.merOrderNo),
      thirdOrderNo: String(data.orderNo),
      amount: String(data.payAmount || data.orderAmount),
      success,
      paidAt: data.payTime ? new Date(String(data.payTime)) : undefined,
      rawData: payload,
    };
  }

  /**
   * 代收回调成功响应
   * @depends jypay.md - 商户收到回调请返回 SUCCESS
   */
  getCollectionCallbackSuccessResponse(): CallbackResponse {
    return { contentType: 'text/plain', body: 'SUCCESS' };
  }

  getCollectionCallbackFailResponse(): CallbackResponse {
    return { contentType: 'text/plain', body: 'FAIL' };
  }

  /**
   * 查询代收订单状态
   * @depends jypay.md 代收查询接口
   */
  async queryCollectionOrder(
    orderNo: string,
    _callbackData?: unknown,
    thirdOrderNo?: string
  ): Promise<CollectionQueryResult> {
    try {
      const timestamp = Date.now().toString();
      const requestNo = `Q${Date.now()}`;

      const requestParams: Record<string, string> = {
        merNo: this.config.merchantId,
        requestNo: requestNo,
        merOrderNo: orderNo,
        orderNo: thirdOrderNo || '',  // JYPAY平台订单号（必填，从thirdOrderNo获取）
        timestamp: timestamp,
      };

      requestParams.sign = this.generateHmacSign(
        requestParams,
        this.config.paySecretKey
      );

      const url = `${this.config.gatewayUrl}/payin/orderQuery`;
      const data = await this.httpPostJson(url, requestParams);

      if (data.code === 200 && data.data) {
        const respData = data.data as Record<string, unknown>;
        const status = Number(respData.status);

        let collectionStatus: CollectionStatus;
        if (status === 5) {
          collectionStatus = CollectionStatus.SUCCESS;
        } else if (status === 3) {
          collectionStatus = CollectionStatus.FAILED;
        } else if (status === 2) {
          collectionStatus = CollectionStatus.NOTPAY;
        } else {
          collectionStatus = CollectionStatus.UNKNOWN;
        }

        return {
          success: true,
          status: collectionStatus,
          thirdOrderNo: respData.orderNo as string,
          amount: respData.payAmount as string,
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          status: CollectionStatus.UNKNOWN,
          errorCode: 'JYPAY_QUERY_ERROR',
          errorMessage: (data.msg as string) || 'خطأ في استعلام الطلب',
          rawResponse: data,
        };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطأ غير معروف';
      console.error(`[JYPAY] 代收查询失败: ${message}`);
      return {
        success: false,
        status: CollectionStatus.UNKNOWN,
        errorCode: 'NETWORK_ERROR',
        errorMessage: message,
      };
    }
  }

  // ================================
  // 代付（提现）接口实现
  // ================================

  /**
   * 发起代付请求
   * @depends jypay.md 代付下单接口
   * @description 代付签名使用 HmacSHA256 + RSA 双重加密
   */
  async createTransferOrder(params: TransferParams): Promise<TransferResult> {
    try {
      const timestamp = Date.now().toString();

      // 依据：jypay.md 代付下单请求参数
      const requestParams: Record<string, string> = {
        identityNo: params.documentNo,         // 身份证号
        identityType: params.documentType,      // 出款类型（CC/CE等）
        province: '',
        accName: params.accountName,            // 姓名
        accNo: params.accountNo,               // 银行卡号
        bankCode: this.mapBankCode(params.bankCode), // 银行编码（映射到JYPAY专用编码）
        busiCode: this.config.payType || '219001',
        currency: 'COP',
        email: 'pay@hype.com',                 // 邮箱
        merNo: this.config.merchantId,
        merOrderNo: params.orderNo,
        notifyUrl: params.notifyUrl,
        orderAmount: this.formatAmount(params.amount),
        phone: params.phone || '900000000',
        timestamp: timestamp,
      };

      // 代付签名：HmacSHA256 + RSA 双重加密
      requestParams.sign = this.generateTransferSign(
        requestParams,
        this.config.paySecretKey,    // HmacSHA256密钥
        this.config.transferSecretKey // RSA私钥
      );

      // 代付使用不同的网关地址
      const transferGatewayUrl = this.getTransferGatewayUrl();
      const url = `${transferGatewayUrl}/payout/singleOrder`;
      const data = await this.httpPostJson(url, requestParams);

      // 依据：jypay.md 代付响应
      // code=200或500时订单状态以status参数为准
      // code为其他值做失败处理
      if (data.code === 200 || data.code === 500) {
        const respData = data.data as Record<string, unknown> | undefined;
        const respStatus = Number(respData?.status);

        // C.2: status=6 或 8 表示立即失败，且不会有回调
        if (respStatus === 6 || respStatus === 8) {
          return {
            success: false,
            errorCode: 'JYPAY_TRANSFER_IMMEDIATE_FAIL',
            errorMessage: (data.msg as string) || 'Pago rechazado inmediatamente',
            rawResponse: data,
          };
        }

        return {
          success: true,
          thirdOrderNo: respData?.orderNo as string,
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          errorCode: 'JYPAY_TRANSFER_ERROR',
          errorMessage: (data.msg as string) || 'خطأ في طلب الدفع',
          rawResponse: data,
        };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطأ غير معروف';
      console.error(`[JYPAY] 代付申请失败: ${message}`);
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: message,
      };
    }
  }

  /**
   * 验证代付回调
   * @depends jypay.md 代付回调说明
   */
  verifyTransferCallback(payload: unknown): TransferCallbackData {
    const data = payload as Record<string, unknown>;

    // 依据：jypay.md 签名规范 - 将所有参数按 ASCII 排序，空参数和 sign 不参与签名
    // 遍历所有回调字段（含 resultCode/resultMsg 等文档未列出但实际返回的字段）
    const signParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === 'sign') continue;
      if (value !== null && value !== undefined && String(value) !== '') {
        signParams[key] = String(value);
      }
    }

    // 代付回调也是 HmacSHA256 验签（非RSA）
    const valid = this.verifyHmacSign(
      signParams,
      String(data.sign),
      this.config.paySecretKey  // 使用HmacSHA256密钥验签
    );

    // 依据：jypay.md 代付回调 status=7 表示成功
    // status=6 或 8 表示失败
    const statusNum = Number(data.status);
    let status: TransferStatus;
    if (statusNum === 7) {
      status = TransferStatus.SUCCESS;
    } else if (statusNum === 6 || statusNum === 8) {
      status = TransferStatus.FAILED;
    } else {
      status = TransferStatus.PENDING;
    }

    return {
      valid,
      orderNo: String(data.merOrderNo),
      thirdOrderNo: String(data.orderNo),
      amount: String(data.orderAmount),
      status,
      failReason: status === TransferStatus.FAILED
        ? (String(data.resultMsg || '') || 'فشل الدفع')
        : undefined,
      completedAt: data.payTime ? new Date(String(data.payTime)) : undefined,
      rawData: payload,
    };
  }

  /**
   * 查询代付订单状态
   * @depends jypay.md 单笔代付查询
   * @description 查询接口只供查询最近10天内数据
   */
  async queryTransferOrder(orderNo: string): Promise<TransferQueryResult> {
    try {
      const timestamp = Date.now().toString();
      const requestNo = `Q${Date.now()}`;

      const requestParams: Record<string, string> = {
        merNo: this.config.merchantId,
        requestNo: requestNo,
        merOrderNo: orderNo,
        orderNo: '',
        timestamp: timestamp,
      };

      requestParams.sign = this.generateHmacSign(
        requestParams,
        this.config.paySecretKey
      );

      const transferGatewayUrl = this.getTransferGatewayUrl();
      const url = `${transferGatewayUrl}/payout/singleQuery`;
      const data = await this.httpPostJson(url, requestParams);

      if (data.code === 200 && data.data) {
        const respData = data.data as Record<string, unknown>;
        const statusNum = Number(respData.status);

        let status: TransferStatus;
        if (statusNum === 7) {
          status = TransferStatus.SUCCESS;
        } else if (statusNum === 6 || statusNum === 8) {
          status = TransferStatus.FAILED;
        } else {
          status = TransferStatus.PENDING;
        }

        return {
          success: true,
          status,
          thirdOrderNo: respData.orderNo as string,
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          status: TransferStatus.PENDING,
          errorCode: 'JYPAY_QUERY_ERROR',
          errorMessage: (data.msg as string) || 'خطأ في الاستعلام',
          rawResponse: data,
        };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطأ غير معروف';
      console.error(`[JYPAY] 代付查询失败: ${message}`);
      return {
        success: false,
        status: TransferStatus.PENDING,
        errorCode: 'NETWORK_ERROR',
        errorMessage: message,
      };
    }
  }

  /**
   * 代付回调成功响应
   */
  getTransferCallbackSuccessResponse(): CallbackResponse {
    return { contentType: 'text/plain', body: 'SUCCESS' };
  }

  getTransferCallbackFailResponse(): CallbackResponse {
    return { contentType: 'text/plain', body: 'FAIL' };
  }
}
