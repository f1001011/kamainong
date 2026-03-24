/**
 * @file LWPAY 支付通道实现
 * @description LWPAY 代收、代付接口实现
 * @depends 开发文档/附录/lwpay.md - LWPAY 第三方支付 API 文档
 * @depends 开发文档/05-后端服务/05.2-支付通道集成.md 第3节 - LWPAY 通道集成
 *
 * 签名规则：
 * 1. 参数按 ASCII 码从小到大排序
 * 2. 拼接成 k=v&k=v 格式
 * 3. 末尾拼接 &key=商户密钥
 * 4. MD5 加密并转大写
 *
 * 代付特别说明：
 * - 代付响应中只有 status = "success" 表示申请成功，不包含 refCode
 * - refCode 只在代付回调中使用：1=成功，2=失败，3=冲正
 * - 代付成功响应返回 OK，与代收一致
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

/**
 * LWPAY 代付接口 bankname 映射表
 * 摩洛哥961通道仅支持以下4家银行，bankname 必须使用 LWPAY 指定的短码
 */
const LWPAY_TRANSFER_BANKNAME: Record<string, string> = {
  'MAD001': 'ATT',   // Attijariwafa Bank
  'MAD002': 'BMCE',  // BMCE Bank of Africa
  'MAD004': 'CIH',   // CIH Bank
  'MAD008': 'AL',    // Al Barid Bank
};

export class LWPayChannel extends BaseChannel implements PaymentChannel {
  readonly code = 'LWPAY';
  readonly name = 'LWPAY通道';

  constructor(config: ChannelConfig) {
    super(config);
  }

  /**
   * 解析 LWPAY 返回的日期时间字段
   * @description LWPAY 回调/查询的时间字段格式不固定，已知两种：
   *  - 紧凑格式 YYYYMMDDHHmmss（如 "20260316003748"）
   *  - 标准格式 YYYY-MM-DD HH:mm:ss（如 "2026-03-16 00:37:48"）
   * JavaScript 的 Date 构造函数无法解析紧凑格式，必须手动拆分
   * @param datetime 日期时间字符串
   * @returns 有效的 Date 对象，解析失败返回 undefined（而非 Invalid Date）
   */
  private parseDatetime(datetime: string | undefined | null): Date | undefined {
    if (!datetime) return undefined;
    try {
      if (/^\d{14}$/.test(datetime)) {
        const date = new Date(
          parseInt(datetime.slice(0, 4), 10),
          parseInt(datetime.slice(4, 6), 10) - 1,
          parseInt(datetime.slice(6, 8), 10),
          parseInt(datetime.slice(8, 10), 10),
          parseInt(datetime.slice(10, 12), 10),
          parseInt(datetime.slice(12, 14), 10)
        );
        return isNaN(date.getTime()) ? undefined : date;
      }
      const date = new Date(datetime);
      return isNaN(date.getTime()) ? undefined : date;
    } catch {
      return undefined;
    }
  }

  /**
   * 生成签名
   * @depends lwpay.md 第二节 - 签名算法
   * @param params 参与签名的参数
   * @param key 签名密钥
   * @returns 大写签名
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
        // sign, pay_md5sign 不参与签名
        if (k !== 'sign' && k !== 'pay_md5sign') {
          filtered[k] = params[k];
        }
      }
    }
    const stringA = this.sortAndJoin(filtered);
    const stringSignTemp = stringA + '&key=' + key;
    // LWPAY 签名转大写
    return this.md5(stringSignTemp).toUpperCase();
  }

  /**
   * 验证签名
   * @param params 回调参数
   * @param sign 回调中的签名
   * @param key 签名密钥
   * @returns 是否有效
   */
  private verifySign(
    params: Record<string, string>,
    sign: string,
    key: string
  ): boolean {
    if (!sign) return false;
    const calculated = this.generateSign(params, key);
    return calculated === sign.toUpperCase();
  }

  /**
   * 创建代收订单
   * @depends lwpay.md 第三节 - 代收接口
   */
  async createCollectionOrder(
    params: CollectionParams
  ): Promise<CollectionResult> {
    try {
      // 依据：lwpay.md 3.2 请求参数
      // 注意：pay_productname 和 pay_attach 不参与签名，必须在签名之后添加
      const requestParams: Record<string, string> = {
        pay_memberid: this.config.merchantId,
        pay_orderid: params.orderNo,
        pay_applydate: this.formatDateTime(),
        pay_bankcode: this.config.bankCode,
        pay_notifyurl: params.notifyUrl,
        pay_callbackurl: params.callbackUrl,
        pay_amount: this.formatAmount(params.amount),
      };

      // 生成签名（仅包含参与签名的字段）
      requestParams.pay_md5sign = this.generateSign(
        requestParams,
        this.config.paySecretKey
      );

      // 签名之后添加不参与签名的字段
      requestParams.pay_productname = params.productName || 'إيداع';
      if (params.attach) {
        requestParams.pay_attach = params.attach;
      }

      // 发起请求
      const url = `${this.config.gatewayUrl}/Pay_Index`;
      const data = await this.httpPost(url, this.toFormUrlEncoded(requestParams));

      // 依据：lwpay.md 3.3 响应参数
      // status: "1" 成功，"0" 失败
      if (data.status === '1') {
        return {
          success: true,
          payUrl: data.payurl as string,
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          errorCode: 'LWPAY_ERROR',
          errorMessage: (data.msg as string) || 'خطأ في إنشاء الطلب',
          rawResponse: data,
        };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطأ غير معروف';
      console.error(`[LWPAY] 代收下单失败: ${message}`);
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: message,
      };
    }
  }

  /**
   * 验证代收回调
   * @depends lwpay.md 第四节 - 代收回调通知
   */
  verifyCollectionCallback(payload: unknown): CollectionCallbackData {
    const data = payload as Record<string, string>;

    // 依据：lwpay.md 4.2 回调参数
    // memberid, orderid, amount, transaction_id, datetime, returncode, refCode, attach, sign
    const signParams: Record<string, string> = {
      memberid: data.memberid,
      orderid: data.orderid,
      amount: data.amount,
      transaction_id: data.transaction_id,
      datetime: data.datetime,
      returncode: data.returncode,
      refCode: data.refCode,
    };

    // 验签（attach 不参与签名）
    const valid = this.verifySign(
      signParams,
      data.sign,
      this.config.paySecretKey
    );

    // 依据：lwpay.md 4.5 支付结果判断
    // 支付成功条件：returncode === '00' && refCode === '1'
    const success = data.returncode === '00' && data.refCode === '1';

    return {
      valid,
      orderNo: data.orderid,
      thirdOrderNo: data.transaction_id,
      amount: data.amount,
      success,
      paidAt: this.parseDatetime(data.datetime),
      rawData: payload,
    };
  }

  /**
   * 代收回调成功响应
   * @depends lwpay.md 4.4 回调响应
   */
  getCollectionCallbackSuccessResponse(): CallbackResponse {
    return { contentType: 'text/plain', body: 'OK' };
  }

  getCollectionCallbackFailResponse(): CallbackResponse {
    return { contentType: 'text/plain', body: 'FAIL' };
  }

  /**
   * 查询代收订单状态
   * @depends lwpay.md 第五节 - 代收订单查询
   * @description 主动查询充值订单在上游 LWPAY 的状态
   * @param orderNo 商户订单号
   * @param _callbackData 可选的回调数据（LWPAY 不使用，直接调用查询接口）
   */
  async queryCollectionOrder(orderNo: string, _callbackData?: unknown): Promise<CollectionQueryResult> {
    try {
      // 依据：lwpay.md 5.2 请求参数
      const requestParams: Record<string, string> = {
        pay_memberid: this.config.merchantId,
        pay_orderid: orderNo,
      };

      // 生成签名（使用代收密钥）
      requestParams.pay_md5sign = this.generateSign(
        requestParams,
        this.config.paySecretKey
      );

      // 发起请求
      // 依据：lwpay.md 5.1 接口地址是 /Pay_Trade_query.html
      const url = `${this.config.gatewayUrl}/Pay_Trade_query.html`;
      const data = await this.httpPost(url, this.toFormUrlEncoded(requestParams));

      // 依据：lwpay.md 5.3 响应参数
      // returncode: "00" 查询成功
      // trade_state: "NOTPAY" 未支付, "SUCCESS" 已支付
      if (data.returncode === '00') {
        let status: CollectionStatus;
        // 依据：lwpay.md 5.3 使用 trade_state 字段判断交易状态
        switch (data.trade_state) {
          case 'SUCCESS':
            status = CollectionStatus.SUCCESS;
            break;
          case 'NOTPAY':
            status = CollectionStatus.NOTPAY;
            break;
          default:
            status = CollectionStatus.UNKNOWN;
        }

        return {
          success: true,
          status,
          thirdOrderNo: data.transaction_id as string,
          amount: data.amount as string,
          // 依据：lwpay.md 5.3 支付时间字段是 time_end
          paidAt: this.parseDatetime(data.time_end as string),
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          status: CollectionStatus.UNKNOWN,
          errorCode: 'LWPAY_QUERY_ERROR',
          errorMessage: (data.msg as string) || 'خطأ في استعلام الطلب',
          rawResponse: data,
        };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطأ غير معروف';
      console.error(`[LWPAY] 代收查询失败: ${message}`);
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
   * @depends lwpay.md 第六节 - 代付接口
   */
  async createTransferOrder(params: TransferParams): Promise<TransferResult> {
    try {
      // 摩洛哥961通道代付：bankname 必须使用 LWPAY 指定的短码（AL/ATT/CIH/BMCE）
      const lwpayBankname = LWPAY_TRANSFER_BANKNAME[params.bankCode];
      if (!lwpayBankname) {
        console.error(`[LWPAY] 不支持的银行编码: ${params.bankCode}（bankName: ${params.bankName}），仅支持: ${Object.keys(LWPAY_TRANSFER_BANKNAME).join(', ')}`);
        return {
          success: false,
          errorCode: 'UNSUPPORTED_BANK',
          errorMessage: `البنك غير مدعوم: ${params.bankName}`,
        };
      }

      const requestParams: Record<string, string> = {
        mchid: this.config.merchantId,
        out_trade_no: params.orderNo,
        money: this.formatAmount(params.amount),
        bankname: lwpayBankname,
        subbranch: 'Casablanca',
        accountname: params.accountName,
        cardnumber: params.accountNo,
        pay_bankcode: this.config.bankCode || '961',
        pay_notifyurl: params.notifyUrl,
        province: 'Casablanca',
        city: 'Casablanca',
      };

      // 依据 lwpay.md: "若需要填写extends字段，请将extends字段及参数加入签名"
      // extends 必须在签名之前添加，使其参与签名计算
      if (params.documentType && params.documentNo) {
        requestParams.extends = `docType:${params.documentType}|docNumber:${params.documentNo}`;
      }

      // 生成签名（使用代付密钥）
      requestParams.pay_md5sign = this.generateSign(
        requestParams,
        this.config.transferSecretKey
      );

      // 发起请求
      const url = `${this.config.gatewayUrl}/Payment_Dfpay_add`;
      const data = await this.httpPost(url, this.toFormUrlEncoded(requestParams));

      // 依据：lwpay.md 6.3 响应参数
      // status: "success" 申请成功，其他失败
      // 注意：代付响应中不包含 refCode，refCode 只在回调中
      if (data.status === 'success') {
        return {
          success: true,
          thirdOrderNo: data.transaction_id as string,
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          errorCode: 'LWPAY_TRANSFER_ERROR',
          errorMessage: (data.msg as string) || 'خطأ في طلب الدفع',
          rawResponse: data,
        };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطأ غير معروف';
      console.error(`[LWPAY] 代付申请失败: ${message}`);
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorMessage: message,
      };
    }
  }

  /**
   * 验证代付回调
   * @depends lwpay.md 第七节 - 代付回调通知
   */
  verifyTransferCallback(payload: unknown): TransferCallbackData {
    const data = payload as Record<string, string>;

    // 依据：lwpay.md 7.2 回调参数
    // memberid, orderid, amount, transaction_id, datetime, returncode, refCode, refMsg
    const signParams: Record<string, string> = {
      memberid: data.memberid,
      orderid: data.orderid,
      amount: data.amount,
      transaction_id: data.transaction_id,
      datetime: data.datetime,
      returncode: data.returncode,
      refCode: data.refCode,
      refMsg: data.refMsg,
    };

    // 验签（attach 不参与签名）
    const valid = this.verifySign(
      signParams,
      data.sign,
      this.config.transferSecretKey
    );

    // 依据：lwpay.md 7.5 代付结果判断
    // 代付成功条件：returncode === '00' && refCode === '1'
    // refCode: '1' 成功，'2' 失败，'3' 冲正
    let status: TransferStatus;
    if (data.returncode === '00' && data.refCode === '1') {
      status = TransferStatus.SUCCESS;
    } else if (data.refCode === '3') {
      status = TransferStatus.REVERSED;
    } else {
      status = TransferStatus.FAILED;
    }

    return {
      valid,
      orderNo: data.orderid,
      thirdOrderNo: data.transaction_id,
      amount: data.amount,
      status,
      failReason: data.refMsg || undefined,
      completedAt: this.parseDatetime(data.datetime),
      rawData: payload,
    };
  }

  /**
   * 查询代付订单状态
   * @depends lwpay.md 第八节 - 代付订单查询
   */
  async queryTransferOrder(orderNo: string): Promise<TransferQueryResult> {
    try {
      const requestParams: Record<string, string> = {
        mchid: this.config.merchantId,
        out_trade_no: orderNo,
      };

      requestParams.pay_md5sign = this.generateSign(
        requestParams,
        this.config.transferSecretKey
      );

      const url = `${this.config.gatewayUrl}/Payment_Dfpay_query`;
      const data = await this.httpPost(url, this.toFormUrlEncoded(requestParams));

      // 依据：lwpay.md 8.3 响应参数
      // status: "success" 查询成功
      // refCode: "1" 打款成功，"2" 失败，"3" 冲正
      if (data.status === 'success') {
        let status: TransferStatus;
        switch (data.refCode) {
          case '1':
            status = TransferStatus.SUCCESS;
            break;
          case '2':
            status = TransferStatus.FAILED;
            break;
          case '3':
            status = TransferStatus.REVERSED;
            break;
          default:
            status = TransferStatus.PENDING;
        }

        return {
          success: true,
          status,
          thirdOrderNo: data.transaction_id as string,
          failReason: data.refMsg as string,
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          status: TransferStatus.PENDING,
          errorCode: 'LWPAY_QUERY_ERROR',
          errorMessage: (data.msg as string) || 'خطأ في الاستعلام',
          rawResponse: data,
        };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'خطأ غير معروف';
      console.error(`[LWPAY] 代付查询失败: ${message}`);
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
   * @depends lwpay.md 7.4 回调响应
   */
  getTransferCallbackSuccessResponse(): CallbackResponse {
    return { contentType: 'text/plain', body: 'OK' };
  }

  getTransferCallbackFailResponse(): CallbackResponse {
    return { contentType: 'text/plain', body: 'FAIL' };
  }
}
