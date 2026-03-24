/**
 * @file UZPAY 支付通道实现
 * @description UZPAY 代收、代付接口实现
 * @depends 开发文档/附录/uzpay.md - UZPAY 支付 API 文档
 * @depends 开发文档/05-后端服务/05.2-支付通道集成.md 第4节 - UZPAY 通道集成
 *
 * 签名规则：
 * 1. 参数按 ASCII 码从小到大排序
 * 2. 拼接成 k=v&k=v 格式
 * 3. 末尾拼接 &key=商户私钥
 * 4. MD5 加密转小写（与 LWPAY 不同！）
 *
 * 注意：
 * - UZPAY 支付密钥和代付密钥不同！
 * - 代付成功响应返回 success（小写），与代收一致
 * - tradeResult: '1' 成功，'2' 失败
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

export class UZPayChannel extends BaseChannel implements PaymentChannel {
  readonly code = 'UZPAY';
  readonly name = 'UZPAY通道';

  constructor(config: ChannelConfig) {
    super(config);
  }

  /**
   * 生成签名
   * @depends uzpay.md 加密规则
   * @param params 参与签名的参数
   * @param key 签名密钥
   * @returns 小写签名（与LWPAY不同！）
   */
  private generateSign(
    params: Record<string, string>,
    key: string
  ): string {
    const filtered: Record<string, string> = {};
    for (const k of Object.keys(params)) {
      if (
        params[k] !== '' &&
        params[k] !== null &&
        params[k] !== undefined
      ) {
        // sign, sign_type, signType 不参与签名
        if (k !== 'sign' && k !== 'sign_type' && k !== 'signType') {
          filtered[k] = params[k];
        }
      }
    }
    const stringA = this.sortAndJoin(filtered);
    const stringSignTemp = stringA + '&key=' + key;
    // UZPAY 签名转小写！
    return this.md5(stringSignTemp).toLowerCase();
  }

  /**
   * 验证签名
   */
  private verifySign(
    params: Record<string, string>,
    sign: string,
    key: string
  ): boolean {
    if (!sign) return false;
    const calculated = this.generateSign(params, key);
    return calculated === sign.toLowerCase();
  }

  /**
   * 创建代收订单
   * @depends uzpay.md 交易下单接口
   */
  async createCollectionOrder(
    params: CollectionParams
  ): Promise<CollectionResult> {
    try {
      // 依据：uzpay.md 参数定义
      const requestParams: Record<string, string> = {
        version: '1.0', // 需同步返回JSON必填
        mch_id: this.config.merchantId,
        notify_url: params.notifyUrl,
        page_url: params.callbackUrl,
        mch_order_no: params.orderNo,
        pay_type: this.config.bankCode, // 支付类型：1220 或 1221
        trade_amount: this.formatAmount(params.amount),
        order_date: this.formatDateTime(),
        goods_name: params.productName || 'إيداع',
      };

      if (params.attach) {
        requestParams.mch_return_msg = params.attach;
      }

      // 生成签名
      requestParams.sign = this.generateSign(
        requestParams,
        this.config.paySecretKey
      );
      requestParams.sign_type = 'MD5'; // 签名方式，不参与签名

      // 发起请求
      const url = `${this.config.gatewayUrl}/pay/web`;
      const data = await this.httpPost(url, this.toFormUrlEncoded(requestParams));

      // 依据：uzpay.md 同步返回
      // respCode: "SUCCESS" 响应成功
      // tradeResult: "1" 下单成功
      if (data.respCode === 'SUCCESS' && data.tradeResult === '1') {
        return {
          success: true,
          payUrl: data.payInfo as string,
          thirdOrderNo: data.orderNo as string,
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          errorCode: 'UZPAY_ERROR',
          errorMessage: (data.tradeMsg as string) || 'خطأ في إنشاء الطلب',
          rawResponse: data,
        };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطأ غير معروف';
      console.error(`[UZPAY] 代收下单失败: ${message}`);
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: message,
      };
    }
  }

  /**
   * 验证代收回调
   * @depends uzpay.md 交易异步通知
   */
  verifyCollectionCallback(payload: unknown): CollectionCallbackData {
    const data = payload as Record<string, string>;

    // 依据：uzpay.md 异步通知参数
    // tradeResult, mchId, mchOrderNo, oriAmount, amount, orderDate, orderNo, merRetMsg, signType, sign
    const signParams: Record<string, string> = {
      tradeResult: data.tradeResult,
      mchId: data.mchId,
      mchOrderNo: data.mchOrderNo,
      oriAmount: data.oriAmount,
      amount: data.amount,
      orderDate: data.orderDate,
      orderNo: data.orderNo,
    };

    // merRetMsg 如果存在也参与签名
    if (data.merRetMsg) {
      signParams.merRetMsg = data.merRetMsg;
    }

    const valid = this.verifySign(
      signParams,
      data.sign,
      this.config.paySecretKey
    );

    // tradeResult === "1" 为支付成功
    const success = data.tradeResult === '1';

    return {
      valid,
      orderNo: data.mchOrderNo,
      thirdOrderNo: data.orderNo,
      amount: data.amount, // 实际支付金额
      success,
      paidAt: data.orderDate ? new Date(data.orderDate) : undefined,
      rawData: payload,
    };
  }

  /**
   * 代收回调成功响应
   * @depends uzpay.md - 异步通知在处理成功之后需要向平台返回"success"
   */
  getCollectionCallbackSuccessResponse(): CallbackResponse {
    return { contentType: 'text/plain', body: 'success' };
  }

  getCollectionCallbackFailResponse(): CallbackResponse {
    return { contentType: 'text/plain', body: 'fail' };
  }

  /**
   * 查询代收订单状态
   * @description UZPAY 没有独立的代收查询接口，通过解析订单回调数据判断状态
   * @depends uzpay.md 交易异步通知部分
   * @param _orderNo 商户订单号（UZPAY 不使用，因为没有查询接口）
   * @param callbackData 订单的回调数据（从数据库 callbackData 字段获取）
   */
  async queryCollectionOrder(_orderNo: string, callbackData?: unknown): Promise<CollectionQueryResult> {
    // UZPAY 没有独立的代收查询接口
    // 需要通过解析订单回调数据来判断状态
    
    if (!callbackData) {
      // 没有回调数据，说明还未收到回调，状态未知（可能未支付或处理中）
      console.log(`[UZPAY] 代收查询：未收到回调数据，状态未知`);
      return {
        success: true,
        status: CollectionStatus.NOTPAY,
        errorMessage: 'لا توجد بيانات رد الاتصال، قد يكون الدفع معلقاً',
      };
    }

    try {
      // 依据：uzpay.md 交易异步通知参数
      // tradeResult: "1" 支付成功
      // mchOrderNo: 商家订单号
      // amount: 实际支付金额
      // orderNo: 平台订单号
      // orderDate: 订单时间
      const data = callbackData as Record<string, string>;
      
      // 判断支付结果
      if (data.tradeResult === '1') {
        // 支付成功
        return {
          success: true,
          status: CollectionStatus.SUCCESS,
          thirdOrderNo: data.orderNo,
          amount: data.amount,
          paidAt: data.orderDate ? new Date(data.orderDate) : undefined,
          rawResponse: callbackData,
        };
      } else {
        // 支付失败或其他状态
        return {
          success: true,
          status: CollectionStatus.FAILED,
          thirdOrderNo: data.orderNo,
          rawResponse: callbackData,
        };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطأ غير معروف';
      console.error(`[UZPAY] 解析回调数据失败: ${message}`);
      return {
        success: false,
        status: CollectionStatus.UNKNOWN,
        errorCode: 'PARSE_ERROR',
        errorMessage: message,
      };
    }
  }

  // ================================
  // 代付（提现）接口实现
  // ================================

  /**
   * 发起代付请求
   * @depends uzpay.md 代付下单接口
   */
  async createTransferOrder(params: TransferParams): Promise<TransferResult> {
    try {
      // 依据：uzpay.md 代付下单接口 - 请求参数
      const requestParams: Record<string, string> = {
        mch_id: this.config.merchantId,
        mch_transferId: params.orderNo,
        transfer_amount: this.formatAmount(params.amount),
        apply_date: this.formatDateTime(),
        bank_code: params.bankCode, // 银行编码（如 PEN1143）
        receive_name: params.accountName,
        receive_account: params.accountNo,
        remark: params.documentNo,
        back_url: params.notifyUrl,
        receiver_telephone: params.phone,
        document_id: params.documentNo,
        document_type: params.documentType,
        account_type: '1',
      };

      // 生成签名（使用代付密钥！）
      requestParams.sign = this.generateSign(
        requestParams,
        this.config.transferSecretKey
      );
      requestParams.sign_type = 'MD5';

      // 发起请求
      const url = `${this.config.gatewayUrl}/pay/transfer`;
      const data = await this.httpPost(url, this.toFormUrlEncoded(requestParams));

      // 依据：uzpay.md 代付请求同步响应
      // respCode: "SUCCESS" 响应成功
      // tradeResult: "0" 申请成功
      if (data.respCode === 'SUCCESS') {
        return {
          success: true,
          thirdOrderNo: data.tradeNo as string,
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          errorCode: 'UZPAY_TRANSFER_ERROR',
          errorMessage: (data.errorMsg as string) || 'خطأ في طلب الدفع',
          rawResponse: data,
        };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطأ غير معروف';
      console.error(`[UZPAY] 代付申请失败: ${message}`);
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: message,
      };
    }
  }

  /**
   * 验证代付回调
   * @depends uzpay.md 代付异步通知
   */
  verifyTransferCallback(payload: unknown): TransferCallbackData {
    const data = payload as Record<string, string>;

    // 依据：uzpay.md 代付异步通知参数
    // tradeResult, merTransferId, merNo, tradeNo, transferAmount, applyDate, version, respCode
    const signParams: Record<string, string> = {
      tradeResult: data.tradeResult,
      merTransferId: data.merTransferId,
      merNo: data.merNo,
      tradeNo: data.tradeNo,
      transferAmount: data.transferAmount,
      applyDate: data.applyDate,
      version: data.version,
      respCode: data.respCode,
    };

    // 验签（使用代付密钥）
    const valid = this.verifySign(
      signParams,
      data.sign,
      this.config.transferSecretKey
    );

    // 依据：uzpay.md 代付异步通知参数
    // tradeResult: '1' 代付成功，'2' 代付失败
    let status: TransferStatus;
    if (data.tradeResult === '1') {
      status = TransferStatus.SUCCESS;
    } else {
      status = TransferStatus.FAILED;
    }

    return {
      valid,
      orderNo: data.merTransferId,
      thirdOrderNo: data.tradeNo,
      amount: data.transferAmount,
      status,
      failReason: status === TransferStatus.FAILED ? 'فشل الدفع' : undefined,
      completedAt: data.applyDate ? new Date(data.applyDate) : undefined,
      rawData: payload,
    };
  }

  /**
   * 查询代付订单状态
   * @depends uzpay.md 代付查询接口
   */
  async queryTransferOrder(orderNo: string): Promise<TransferQueryResult> {
    try {
      const requestParams: Record<string, string> = {
        mch_id: this.config.merchantId,
        mch_transferId: orderNo,
      };

      requestParams.sign = this.generateSign(
        requestParams,
        this.config.transferSecretKey
      );
      requestParams.sign_type = 'MD5';

      const url = `${this.config.gatewayUrl}/query/transfer`;
      const data = await this.httpPost(url, this.toFormUrlEncoded(requestParams));

      // 依据：uzpay.md 代付查询同步响应
      // respCode: "SUCCESS" 查询成功
      // tradeResult: 0 申请成功，1 转账成功，2 转账失败，3 转账拒绝，4 处理中
      if (data.respCode === 'SUCCESS') {
        let status: TransferStatus;
        switch (String(data.tradeResult)) {
          case '1':
            status = TransferStatus.SUCCESS;
            break;
          case '2':
          case '3':
            status = TransferStatus.FAILED;
            break;
          case '0':
          case '4':
            status = TransferStatus.PENDING;
            break;
          default:
            status = TransferStatus.PENDING;
        }

        return {
          success: true,
          status,
          thirdOrderNo: data.tradeNo as string,
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          status: TransferStatus.PENDING,
          errorCode: 'UZPAY_QUERY_ERROR',
          errorMessage: (data.errorMsg as string) || 'خطأ في الاستعلام',
          rawResponse: data,
        };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطأ غير معروف';
      console.error(`[UZPAY] 代付查询失败: ${message}`);
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
   * @depends uzpay.md - 异步通知在处理成功之后需要向平台返回"success"
   */
  getTransferCallbackSuccessResponse(): CallbackResponse {
    return { contentType: 'text/plain', body: 'success' };
  }

  getTransferCallbackFailResponse(): CallbackResponse {
    return { contentType: 'text/plain', body: 'fail' };
  }
}
