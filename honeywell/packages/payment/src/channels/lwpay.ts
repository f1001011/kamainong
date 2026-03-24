import {
  PaymentChannel,
  ChannelConfig,
  RechargeParams,
  RechargeResult,
  RechargeCallbackResult,
  WithdrawParams,
  WithdrawResult,
  WithdrawCallbackResult,
  OrderQueryResult,
  BalanceResult,
  CallbackResponse,
} from '../types';
import { lwpaySign } from '../utils/sign';

/**
 * LWPAY 支付通道实现
 *
 * 配置参数：
 * - merchantId: 商户ID (10155)
 * - gatewayUrl: 网关地址 (https://lwpay.live)
 * - bankCode: 银行编码 (901 秘鲁)
 *
 * 接口地址：
 * - 代收：POST /Pay_Index
 * - 代收查询：POST /Pay_Trade_query.html
 * - 代付：POST /Payment_Dfpay_add
 * - 代付查询：POST /Payment_Dfpay_query
 * - 余额查询：POST /Payment_Dfpay_checkbalance
 *
 * 签名规则：ASCII排序 → &key=密钥 → MD5 → 大写
 * 回调成功返回：OK
 */
export class LwpayChannel implements PaymentChannel {
  code = 'LWPAY';
  name = 'LWPAY';

  private config: ChannelConfig | null = null;

  setConfig(config: ChannelConfig): void {
    this.config = config;
  }

  private getConfig(): ChannelConfig {
    if (!this.config) {
      throw new Error('LWPAY config not set');
    }
    return this.config;
  }

  async createRechargeOrder(params: RechargeParams): Promise<RechargeResult> {
    const config = this.getConfig();

    const requestData: Record<string, unknown> = {
      mer_no: config.merchantId,
      mer_order_no: params.orderNo,
      pname: params.userPhone,
      pemail: `${params.userPhone}@user.com`,
      phone: params.userPhone,
      order_amount: params.amount.toFixed(2),
      countryCode: 'COL',
      ccy_no: 'COP',
      busi_code: config.bankCode || '901',
      notifyUrl: params.callbackUrl,
      pageUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/recharge/result`,
      goods: 'Recharge',
    };

    // 签名（MD5 大写）
    requestData.sign = lwpaySign(requestData, config.paySecretKey);

    try {
      const response = await fetch(`${config.gatewayUrl}/Pay_Index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(requestData as Record<string, string>).toString(),
      });

      const result = await response.json();

      if (result.order_data) {
        return {
          success: true,
          payUrl: result.order_data,
          thirdOrderNo: result.order_no,
        };
      } else {
        return {
          success: false,
          errorMessage: result.order_msg || 'Unknown error',
        };
      }
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async queryRechargeOrder(orderId: string): Promise<OrderQueryResult> {
    const config = this.getConfig();

    const requestData: Record<string, unknown> = {
      mer_no: config.merchantId,
      mer_order_no: orderId,
    };

    requestData.sign = lwpaySign(requestData, config.paySecretKey);

    try {
      const response = await fetch(
        `${config.gatewayUrl}/Pay_Trade_query.html`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(requestData as Record<string, string>).toString(),
        }
      );

      const result = await response.json();

      if (result.returncode === '00') {
        return {
          success: true,
          status: result.refCode === '1' ? 'SUCCESS' : 'PENDING',
          amount: parseFloat(result.amount),
          thirdOrderNo: result.order_no,
        };
      } else {
        return {
          success: false,
          errorMessage: result.returnmsg || 'Query failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async verifyRechargeCallback(
    payload: Record<string, unknown>
  ): Promise<RechargeCallbackResult> {
    const config = this.getConfig();

    // 验证签名
    const { sign, ...params } = payload;
    const expectedSign = lwpaySign(params, config.paySecretKey);

    if (sign !== expectedSign) {
      return { valid: false };
    }

    // 判断支付结果
    // returncode === '00' && refCode === '1' 表示成功
    const isSuccess =
      payload.returncode === '00' && payload.refCode === '1';

    return {
      valid: true,
      success: isSuccess,
      orderId: payload.mer_order_no as string,
      thirdOrderNo: payload.order_no as string,
      amount: parseFloat(payload.amount as string),
    };
  }

  getRechargeCallbackSuccessResponse(): CallbackResponse {
    return {
      contentType: 'text/plain',
      body: 'OK',
    };
  }

  async createWithdrawOrder(params: WithdrawParams): Promise<WithdrawResult> {
    const config = this.getConfig();

    const requestData: Record<string, unknown> = {
      mer_no: config.merchantId,
      mer_order_no: params.orderNo,
      acc_no: params.accountNo,
      acc_name: params.accountName,
      ccy_no: 'COP',
      order_amount: params.amount.toFixed(2),
      bank_code: config.bankCode || '901',
      // 哥伦比亚通道需要证件信息
      extends: `docType:${params.documentType || 'CC'}|docNumber:${params.documentNo || ''}`,
      notifyUrl: params.callbackUrl,
      summary: 'Withdraw',
    };

    requestData.sign = lwpaySign(requestData, config.transferSecretKey);

    try {
      const response = await fetch(
        `${config.gatewayUrl}/Payment_Dfpay_add`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(requestData as Record<string, string>).toString(),
        }
      );

      const result = await response.json();

      if (result.returncode === '00') {
        return {
          success: true,
          thirdOrderNo: result.order_no,
        };
      } else {
        return {
          success: false,
          errorMessage: result.returnmsg || 'Unknown error',
        };
      }
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async queryWithdrawOrder(orderId: string): Promise<OrderQueryResult> {
    const config = this.getConfig();

    const requestData: Record<string, unknown> = {
      mer_no: config.merchantId,
      mer_order_no: orderId,
    };

    requestData.sign = lwpaySign(requestData, config.transferSecretKey);

    try {
      const response = await fetch(
        `${config.gatewayUrl}/Payment_Dfpay_query`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(requestData as Record<string, string>).toString(),
        }
      );

      const result = await response.json();

      if (result.returncode === '00') {
        let status: 'PENDING' | 'SUCCESS' | 'FAILED' = 'PENDING';
        if (result.refCode === '1') {
          status = 'SUCCESS';
        } else if (result.refCode === '2' || result.refCode === '3') {
          status = 'FAILED';
        }

        return {
          success: true,
          status,
          thirdOrderNo: result.order_no,
        };
      } else {
        return {
          success: false,
          errorMessage: result.returnmsg || 'Query failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async verifyWithdrawCallback(
    payload: Record<string, unknown>
  ): Promise<WithdrawCallbackResult> {
    const config = this.getConfig();

    // 验证签名
    const { sign, ...params } = payload;
    const expectedSign = lwpaySign(params, config.transferSecretKey);

    if (sign !== expectedSign) {
      return { valid: false };
    }

    // 判断代付结果
    // returncode === '00' && refCode === '1' 表示成功
    // refCode === '2' 表示失败
    // refCode === '3' 表示冲正
    const isSuccess =
      payload.returncode === '00' && payload.refCode === '1';

    return {
      valid: true,
      success: isSuccess,
      orderId: payload.mer_order_no as string,
      thirdOrderNo: payload.order_no as string,
      failReason: !isSuccess ? (payload.returnmsg as string) : undefined,
    };
  }

  getWithdrawCallbackSuccessResponse(): CallbackResponse {
    return {
      contentType: 'text/plain',
      body: 'OK',
    };
  }

  async queryBalance(): Promise<BalanceResult> {
    const config = this.getConfig();

    const requestData: Record<string, unknown> = {
      mer_no: config.merchantId,
      ccy_no: 'COP',
    };

    requestData.sign = lwpaySign(requestData, config.transferSecretKey);

    try {
      const response = await fetch(
        `${config.gatewayUrl}/Payment_Dfpay_checkbalance`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(requestData as Record<string, string>).toString(),
        }
      );

      const result = await response.json();

      if (result.returncode === '00') {
        return {
          success: true,
          balance: parseFloat(result.balance),
        };
      } else {
        return {
          success: false,
          errorMessage: result.returnmsg || 'Query failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
}
