import crypto from 'crypto';
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
import { jypaySign, jypayTransferSign } from '../utils/sign';

/**
 * JYPAY 支付通道实现（packages 层备份）
 *
 * 配置参数：
 * - merchantId: 商户号 (805230000523612)
 * - gatewayUrl: 代收网关 (https://nkhbz.jytpz.com)
 * - extraConfig.transferGatewayUrl: 代付网关 (https://twerf.jytpz.com)
 * - bankCode: 代收busiCode (118001)
 * - payType: 代付busiCode (219001)
 *
 * 接口地址：
 * - 代收：POST /payin/createOrder
 * - 代收查询：POST /payin/orderQuery
 * - 代付：POST /payout/singleOrder
 * - 代付查询：POST /payout/singleQuery
 * - 余额查询：POST /payout/balanceQuery
 *
 * 签名规则：ASCII排序 → HmacSHA256(密钥) → 小写hex
 * 代付签名：HmacSHA256 + RSA私钥加密 + Base64
 * 回调成功返回：SUCCESS
 */
export class JypayChannel implements PaymentChannel {
  code = 'JYPAY';
  name = 'JYPAY';

  private config: ChannelConfig | null = null;

  setConfig(config: ChannelConfig): void {
    this.config = config;
  }

  private getConfig(): ChannelConfig {
    if (!this.config) {
      throw new Error('JYPAY config not set');
    }
    return this.config;
  }

  private getTransferGatewayUrl(): string {
    const config = this.getConfig();
    const extra = config.extraConfig as Record<string, string> | undefined;
    if (extra?.transferGatewayUrl) {
      return extra.transferGatewayUrl;
    }
    return config.gatewayUrl.replace('nkhbz', 'twerf');
  }

  async createRechargeOrder(params: RechargeParams): Promise<RechargeResult> {
    const config = this.getConfig();
    const timestamp = Date.now().toString();

    const requestData: Record<string, unknown> = {
      bankCode: '',
      merNo: config.merchantId,
      merOrderNo: params.orderNo,
      name: 'User',
      email: 'pay@hype.com',
      phone: params.userPhone || '900000000',
      orderAmount: params.amount.toFixed(2),
      currency: 'COP',
      busiCode: config.bankCode || '118001',
      pageUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/recharge/result`,
      notifyUrl: params.callbackUrl,
      timestamp: timestamp,
    };

    requestData.sign = jypaySign(requestData, config.paySecretKey);

    try {
      const response = await fetch(`${config.gatewayUrl}/payin/createOrder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.code === 200 && result.data) {
        return {
          success: true,
          payUrl: result.data.orderData,
          thirdOrderNo: result.data.orderNo,
        };
      } else {
        return {
          success: false,
          errorMessage: result.msg || result.subMsg || 'Unknown error',
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
    const timestamp = Date.now().toString();

    const requestData: Record<string, unknown> = {
      merNo: config.merchantId,
      requestNo: `Q${Date.now()}`,
      merOrderNo: orderId,
      orderNo: '',
      timestamp: timestamp,
    };

    requestData.sign = jypaySign(requestData, config.paySecretKey);

    try {
      const response = await fetch(`${config.gatewayUrl}/payin/orderQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.code === 200 && result.data) {
        const status = Number(result.data.status);
        let orderStatus: 'PENDING' | 'SUCCESS' | 'FAILED' = 'PENDING';
        if (status === 5) orderStatus = 'SUCCESS';
        else if (status === 3) orderStatus = 'FAILED';

        return {
          success: true,
          status: orderStatus,
          amount: parseFloat(result.data.payAmount || result.data.orderAmount),
          thirdOrderNo: result.data.orderNo,
        };
      } else {
        return {
          success: false,
          errorMessage: result.msg || 'Query failed',
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

    // 遍历所有回调字段，排除 sign 和空值，确保新增字段也能正确验签
    const signParams: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (key === 'sign') continue;
      if (value !== null && value !== undefined && String(value) !== '') {
        signParams[key] = String(value);
      }
    }
    const expectedSign = jypaySign(signParams, config.paySecretKey);

    if (payload.sign !== expectedSign) {
      return { valid: false };
    }

    // status === 5 表示成功
    const isSuccess = Number(payload.status) === 5;

    return {
      valid: true,
      success: isSuccess,
      orderId: payload.merOrderNo as string,
      thirdOrderNo: payload.orderNo as string,
      amount: parseFloat(
        (payload.payAmount as string) || (payload.orderAmount as string)
      ),
    };
  }

  getRechargeCallbackSuccessResponse(): CallbackResponse {
    return {
      contentType: 'text/plain',
      body: 'SUCCESS',
    };
  }

  async createWithdrawOrder(params: WithdrawParams): Promise<WithdrawResult> {
    const config = this.getConfig();
    const timestamp = Date.now().toString();

    const requestData: Record<string, unknown> = {
      identityNo: params.documentNo || '',
      identityType: params.documentType || 'CC',
      province: '',
      accName: params.accountName,
      accNo: params.accountNo,
      bankCode: params.bankCode,
      busiCode: config.payType || '219001',
      currency: 'COP',
      email: 'pay@hype.com',
      merNo: config.merchantId,
      merOrderNo: params.orderNo,
      notifyUrl: params.callbackUrl,
      orderAmount: params.amount.toFixed(2),
      phone: params.phone || '900000000',
      timestamp,
    };

    requestData.sign = jypayTransferSign(
      requestData,
      config.paySecretKey,
      config.transferSecretKey
    );

    const transferGatewayUrl = this.getTransferGatewayUrl();

    try {
      const response = await fetch(
        `${transferGatewayUrl}/payout/singleOrder`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        }
      );

      const result = await response.json();

      if (result.code === 200 || result.code === 500) {
        const respStatus = Number(result.data?.status);
        // status=6 或 8 表示立即失败
        if (respStatus === 6 || respStatus === 8) {
          return {
            success: false,
            errorMessage: result.msg || 'Payment rejected immediately',
          };
        }
        return {
          success: true,
          thirdOrderNo: result.data?.orderNo,
        };
      } else {
        return {
          success: false,
          errorMessage: result.msg || 'Unknown error',
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
    const timestamp = Date.now().toString();
    const transferGatewayUrl = this.getTransferGatewayUrl();

    const requestData: Record<string, unknown> = {
      merNo: config.merchantId,
      requestNo: `Q${Date.now()}`,
      merOrderNo: orderId,
      orderNo: '',
      timestamp: timestamp,
    };

    requestData.sign = jypaySign(requestData, config.paySecretKey);

    try {
      const response = await fetch(
        `${transferGatewayUrl}/payout/singleQuery`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        }
      );

      const result = await response.json();

      if (result.code === 200 && result.data) {
        const statusNum = Number(result.data.status);
        let status: 'PENDING' | 'SUCCESS' | 'FAILED' = 'PENDING';
        if (statusNum === 7) status = 'SUCCESS';
        else if (statusNum === 6 || statusNum === 8) status = 'FAILED';

        return {
          success: true,
          status,
          thirdOrderNo: result.data.orderNo,
        };
      } else {
        return {
          success: false,
          errorMessage: result.msg || 'Query failed',
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

    // 遍历所有回调字段，排除 sign 和空值
    const signParams: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (key === 'sign') continue;
      if (value !== null && value !== undefined && String(value) !== '') {
        signParams[key] = String(value);
      }
    }
    const expectedSign = jypaySign(signParams, config.paySecretKey);

    if (payload.sign !== expectedSign) {
      return { valid: false };
    }

    // status === 7 表示成功, 6/8 表示失败
    const statusNum = Number(payload.status);
    const isSuccess = statusNum === 7;

    return {
      valid: true,
      success: isSuccess,
      orderId: payload.merOrderNo as string,
      thirdOrderNo: payload.orderNo as string,
      failReason: !isSuccess
        ? (payload.resultMsg as string) || 'Payment failed'
        : undefined,
    };
  }

  getWithdrawCallbackSuccessResponse(): CallbackResponse {
    return {
      contentType: 'text/plain',
      body: 'SUCCESS',
    };
  }

  async queryBalance(): Promise<BalanceResult> {
    const config = this.getConfig();
    const timestamp = Date.now().toString();
    const transferGatewayUrl = this.getTransferGatewayUrl();

    const requestData: Record<string, unknown> = {
      merNo: config.merchantId,
      requestNo: `BAL_${Date.now()}`,
      timestamp: timestamp,
    };

    requestData.sign = jypaySign(requestData, config.paySecretKey);

    try {
      const response = await fetch(
        `${transferGatewayUrl}/payout/balanceQuery`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        }
      );

      const result = await response.json();

      if (result.code === 200 && result.data) {
        return {
          success: true,
          balance: parseFloat(
            String(result.data.balance || result.data.availableBalance || '0')
          ),
        };
      } else {
        return {
          success: false,
          errorMessage: result.msg || 'Query failed',
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
