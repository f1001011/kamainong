/**
 * @file HTPAY 支付通道实现
 * @description HTPAY 代收、代付接口实现
 * @depends HTPAY/HTPAY文档.md - HTPAY 第三方支付 API 文档
 *
 * 签名规则（与其他通道完全不同）：
 * 1. 签名放在 HTTP 请求头中（reqsign + reqtime），body 中不含签名字段
 * 2. 签名公式：MD5(JSON字符串 + 时间戳秒 + 密钥)，32位小写hex
 * 3. 回调验签：从请求头取 reqsign/reqtime，MD5(rawBody + reqtime + secret) === reqsign
 *
 * 重要差异（与 LWPAY/UZPAY/JYPAY 不同）：
 * - 签名在 Headers 中，不在 Body 中
 * - 代收代付使用同一网关地址
 * - 回调成功只看 HTTP 200 状态码，不需要特定响应字符串
 * - 代收成功状态：status === 3
 * - 代付成功状态：status === 3
 * - 代付失败状态：status === 4
 * - 代付参数更简单：无需证件类型/号码，只需姓名+卡号+银行名
 * - 无余额查询接口
 */

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

export class HTPayChannel extends BaseChannel implements PaymentChannel {
  readonly code = 'HTPAY';
  readonly name = 'HTPAY通道';

  constructor(config: ChannelConfig) {
    super(config);
  }

  // ================================
  // HTTP 请求方法（HTPAY 特有：签名放在 Headers 中）
  // ================================

  /**
   * 发送 HTPAY 签名请求
   * @depends HTPAY文档.md 签名算法公共参数
   * @description 签名公式: MD5(json + reqtime + secret)，放在请求头 reqsign/reqtime 中
   */
  private async htpayPost(
    path: string,
    body: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const json = JSON.stringify(body);
    const reqtime = Math.floor(Date.now() / 1000).toString();
    const reqsign = this.md5(json + reqtime + this.config.paySecretKey);

    const url = `${this.config.gatewayUrl}${path}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'reqsign': reqsign,
        'reqtime': reqtime,
      },
      body: json,
    });

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error('[HTPAY] 响应解析失败:', text);
      throw new Error(`响应解析失败: ${text}`);
    }
  }

  // ================================
  // 代收（充值）接口实现
  // ================================

  /**
   * 创建代收订单
   * @depends HTPAY文档.md 创建代收订单 /index/Api/create
   */
  async createCollectionOrder(
    params: CollectionParams
  ): Promise<CollectionResult> {
    try {
      const requestBody: Record<string, unknown> = {
        merchant_id: this.config.merchantId,
        amount: parseFloat(this.formatAmount(params.amount)),
        order_id: params.orderNo,
        return_url: params.callbackUrl || '',
        notify_url: params.notifyUrl,
      };

      const data = await this.htpayPost('/index/Api/create', requestBody);

      // code=0 表示成功
      if (data.code === 0 && data.data) {
        const respData = data.data as Record<string, unknown>;
        return {
          success: true,
          payUrl: respData.url as string,
          thirdOrderNo: respData.order_sn as string,
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          errorCode: 'HTPAY_ERROR',
          errorMessage: (data.msg as string) || 'خطأ في إنشاء الطلب',
          rawResponse: data,
        };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطأ غير معروف';
      console.error(`[HTPAY] 代收下单失败: ${message}`);
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: message,
      };
    }
  }

  /**
   * 验证代收回调
   * @depends HTPAY文档.md 异步回调参数 + 签名算法公共参数
   * @description 回调签名在请求头中，通过路由层注入 __raw_body/__reqsign/__reqtime 传递
   */
  verifyCollectionCallback(payload: unknown): CollectionCallbackData {
    const data = payload as Record<string, unknown>;

    // 从路由层注入的元数据中获取验签信息
    const rawBody = String(data.__raw_body || '');
    const reqsign = String(data.__reqsign || '');
    const reqtime = String(data.__reqtime || '');

    // MD5(rawBody + reqtime + secret) === reqsign
    let valid = false;
    if (rawBody && reqsign && reqtime) {
      const expectedSign = this.md5(rawBody + reqtime + this.config.paySecretKey);
      valid = expectedSign === reqsign;
    }

    // 代收回调 status=3 表示成功
    const status = Number(data.status);
    const success = status === 3;

    return {
      valid,
      orderNo: String(data.order_id || ''),
      thirdOrderNo: String(data.order_sn || ''),
      amount: String(data.amount || ''),
      success,
      paidAt: data.success_time ? new Date(String(data.success_time)) : undefined,
      rawData: payload,
    };
  }

  /**
   * 代收回调成功响应
   * @depends HTPAY文档.md - 返回http状态码200表示回调成功
   */
  getCollectionCallbackSuccessResponse(): CallbackResponse {
    return { contentType: 'text/plain', body: 'ok' };
  }

  getCollectionCallbackFailResponse(): CallbackResponse {
    return { contentType: 'text/plain', body: 'fail' };
  }

  /**
   * 查询代收订单状态
   * @depends HTPAY文档.md 订单查询 /index/Api/query action=pay
   */
  async queryCollectionOrder(
    orderNo: string,
    _callbackData?: unknown,
    thirdOrderNo?: string
  ): Promise<CollectionQueryResult> {
    try {
      const requestBody: Record<string, unknown> = {
        merchant_id: this.config.merchantId,
        order_id: orderNo,
        order_sn: thirdOrderNo || '',
        action: 'pay',
      };

      const data = await this.htpayPost('/index/Api/query', requestBody);

      if (data.code === 0 && data.data) {
        const respData = data.data as Record<string, unknown>;
        const status = Number(respData.status);

        let collectionStatus: CollectionStatus;
        if (status === 3) {
          collectionStatus = CollectionStatus.SUCCESS;
        } else if (status === 4) {
          collectionStatus = CollectionStatus.FAILED;
        } else if (status === 1) {
          collectionStatus = CollectionStatus.NOTPAY;
        } else if (status === 2) {
          collectionStatus = CollectionStatus.PENDING;
        } else {
          collectionStatus = CollectionStatus.UNKNOWN;
        }

        return {
          success: true,
          status: collectionStatus,
          thirdOrderNo: respData.order_sn as string,
          amount: respData.amount as string,
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          status: CollectionStatus.UNKNOWN,
          errorCode: 'HTPAY_QUERY_ERROR',
          errorMessage: (data.msg as string) || 'خطأ في استعلام الطلب',
          rawResponse: data,
        };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطأ غير معروف';
      console.error(`[HTPAY] 代收查询失败: ${message}`);
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
   * @depends HTPAY文档.md 创建代付订单 /index/Api/transfer
   * @description 代付参数比其他通道更简单：无需证件类型/号码，只需姓名+卡号+银行名
   */
  async createTransferOrder(params: TransferParams): Promise<TransferResult> {
    try {
      const requestBody: Record<string, unknown> = {
        merchant_id: this.config.merchantId,
        amount: this.formatAmount(params.amount),
        real_name: params.accountName,
        account: params.accountNo,
        bank: params.bankName,
        order_id: params.orderNo,
        notify_url: params.notifyUrl,
      };

      const data = await this.htpayPost('/index/Api/transfer', requestBody);

      // code=0 表示成功
      if (data.code === 0 && data.data) {
        const respData = data.data as Record<string, unknown>;
        return {
          success: true,
          thirdOrderNo: respData.order_sn as string,
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          errorCode: 'HTPAY_TRANSFER_ERROR',
          errorMessage: (data.msg as string) || 'خطأ في طلب الدفع',
          rawResponse: data,
        };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطأ غير معروف';
      console.error(`[HTPAY] 代付申请失败: ${message}`);
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: message,
      };
    }
  }

  /**
   * 验证代付回调
   * @depends HTPAY文档.md 异步回调参数 + 状态说明
   * @description 代付回调 status=3 成功, status=4 驳回
   */
  verifyTransferCallback(payload: unknown): TransferCallbackData {
    const data = payload as Record<string, unknown>;

    // 从路由层注入的元数据中获取验签信息
    const rawBody = String(data.__raw_body || '');
    const reqsign = String(data.__reqsign || '');
    const reqtime = String(data.__reqtime || '');

    // MD5(rawBody + reqtime + secret) === reqsign
    let valid = false;
    if (rawBody && reqsign && reqtime) {
      const expectedSign = this.md5(rawBody + reqtime + this.config.paySecretKey);
      valid = expectedSign === reqsign;
    }

    // 代付状态：3=代付完成，4=代付驳回
    const statusNum = Number(data.status);
    let status: TransferStatus;
    if (statusNum === 3) {
      status = TransferStatus.SUCCESS;
    } else if (statusNum === 4) {
      status = TransferStatus.FAILED;
    } else {
      status = TransferStatus.PENDING;
    }

    return {
      valid,
      orderNo: String(data.order_id || ''),
      thirdOrderNo: String(data.order_sn || ''),
      amount: String(data.amount || ''),
      status,
      failReason: status === TransferStatus.FAILED
        ? 'Pago rechazado por la plataforma'
        : undefined,
      completedAt: data.success_time ? new Date(String(data.success_time)) : undefined,
      rawData: payload,
    };
  }

  /**
   * 查询代付订单状态
   * @depends HTPAY文档.md 订单查询 /index/Api/query action=transfer
   */
  async queryTransferOrder(orderNo: string): Promise<TransferQueryResult> {
    try {
      const requestBody: Record<string, unknown> = {
        merchant_id: this.config.merchantId,
        order_id: orderNo,
        action: 'transfer',
      };

      const data = await this.htpayPost('/index/Api/query', requestBody);

      if (data.code === 0 && data.data) {
        const respData = data.data as Record<string, unknown>;
        const statusNum = Number(respData.status);

        let status: TransferStatus;
        if (statusNum === 3) {
          status = TransferStatus.SUCCESS;
        } else if (statusNum === 4) {
          status = TransferStatus.FAILED;
        } else {
          status = TransferStatus.PENDING;
        }

        return {
          success: true,
          status,
          thirdOrderNo: respData.order_sn as string,
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          status: TransferStatus.PENDING,
          errorCode: 'HTPAY_QUERY_ERROR',
          errorMessage: (data.msg as string) || 'خطأ في الاستعلام',
          rawResponse: data,
        };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطأ غير معروف';
      console.error(`[HTPAY] 代付查询失败: ${message}`);
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
   * @depends HTPAY文档.md - 返回http状态码200表示回调成功
   */
  getTransferCallbackSuccessResponse(): CallbackResponse {
    return { contentType: 'text/plain', body: 'ok' };
  }

  getTransferCallbackFailResponse(): CallbackResponse {
    return { contentType: 'text/plain', body: 'fail' };
  }
}
