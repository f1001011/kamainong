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
import { uzpaySign } from '../utils/sign';

/**
 * UZPAY 支付通道实现
 *
 * 配置参数：
 * - merchantId: 商户号 (701999002)
 * - gatewayUrl: 网关地址 (https://payment.dzxum.com)
 * - payType: 支付类型 (1220/1221 秘鲁)
 *
 * 接口地址：
 * - 代收：POST /pay/web
 * - 代付：POST /pay/transfer
 * - 代付查询：POST /query/transfer
 * - 余额查询：POST /query/balance
 *
 * 签名规则：ASCII排序 → &key=密钥 → MD5 → 小写
 * 回调成功返回：success
 *
 * 注意：UZPAY 支付密钥和代付密钥不同
 */
export class UzpayChannel implements PaymentChannel {
  code = 'UZPAY';
  name = 'UZPAY';

  private config: ChannelConfig | null = null;

  setConfig(config: ChannelConfig): void {
    this.config = config;
  }

  private getConfig(): ChannelConfig {
    if (!this.config) {
      throw new Error('UZPAY config not set');
    }
    return this.config;
  }

  async createRechargeOrder(params: RechargeParams): Promise<RechargeResult> {
    const config = this.getConfig();

    const requestData: Record<string, unknown> = {
      mchId: config.merchantId,
      mchOrderNo: params.orderNo,
      payType: config.payType || '1220',
      amount: (params.amount * 100).toString(), // UZPAY 金额单位为分
      currency: 'COP',
      notifyUrl: params.callbackUrl,
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/recharge/result`,
      subject: 'Recharge',
      body: 'Recharge',
      clientIp: params.clientIp,
    };

    // 签名（MD5 小写）
    requestData.sign = uzpaySign(requestData, config.paySecretKey);

    try {
      const response = await fetch(`${config.gatewayUrl}/pay/web`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.code === 0 && result.data?.payUrl) {
        return {
          success: true,
          payUrl: result.data.payUrl,
          thirdOrderNo: result.data.transactionId,
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

  async queryRechargeOrder(_orderId: string): Promise<OrderQueryResult> {
    // UZPAY 暂不支持代收查询，依赖回调
    return {
      success: false,
      errorMessage: 'UZPAY does not support recharge order query',
    };
  }

  async verifyRechargeCallback(
    payload: Record<string, unknown>
  ): Promise<RechargeCallbackResult> {
    const config = this.getConfig();

    // 验证签名
    const { sign, ...params } = payload;
    const expectedSign = uzpaySign(params, config.paySecretKey);

    if (sign !== expectedSign) {
      return { valid: false };
    }

    // 判断支付结果
    // tradeResult === '1' 表示成功
    const isSuccess = payload.tradeResult === '1';

    return {
      valid: true,
      success: isSuccess,
      orderId: payload.mchOrderNo as string,
      thirdOrderNo: payload.transactionId as string,
      amount: parseInt(payload.amount as string) / 100, // 分转元
    };
  }

  getRechargeCallbackSuccessResponse(): CallbackResponse {
    return {
      contentType: 'text/plain',
      body: 'success',
    };
  }

  async createWithdrawOrder(params: WithdrawParams): Promise<WithdrawResult> {
    const config = this.getConfig();

    const requestData: Record<string, unknown> = {
      mchId: config.merchantId,
      mchTransferId: params.orderNo,
      amount: (params.amount * 100).toString(), // 金额单位为分
      currency: 'COP',
      bankCode: params.bankCode,
      accountNo: params.accountNo,
      accountName: params.accountName,
      notifyUrl: params.callbackUrl,
      // 秘鲁代付必填字段
      receiver_telephone: params.phone,
      document_id: params.documentNo,
      document_type: params.documentType,
      account_type: '1',
      remark: params.documentNo,
    };

    // 签名（MD5 小写）- 使用代付密钥
    requestData.sign = uzpaySign(requestData, config.transferSecretKey);

    try {
      const response = await fetch(`${config.gatewayUrl}/pay/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.code === 0) {
        return {
          success: true,
          thirdOrderNo: result.data?.transactionId,
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

    const requestData: Record<string, unknown> = {
      mchId: config.merchantId,
      mchTransferId: orderId,
    };

    requestData.sign = uzpaySign(requestData, config.transferSecretKey);

    try {
      const response = await fetch(`${config.gatewayUrl}/query/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.code === 0) {
        let status: 'PENDING' | 'SUCCESS' | 'FAILED' = 'PENDING';
        if (result.data?.tradeResult === '1') {
          status = 'SUCCESS';
        } else if (result.data?.tradeResult === '2') {
          status = 'FAILED';
        }

        return {
          success: true,
          status,
          thirdOrderNo: result.data?.transactionId,
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

    // 验证签名
    const { sign, ...params } = payload;
    const expectedSign = uzpaySign(params, config.transferSecretKey);

    if (sign !== expectedSign) {
      return { valid: false };
    }

    // 判断代付结果
    // tradeResult === '1' 表示成功
    // tradeResult === '2' 表示失败
    const isSuccess = payload.tradeResult === '1';

    return {
      valid: true,
      success: isSuccess,
      orderId: payload.mchTransferId as string,
      thirdOrderNo: payload.transactionId as string,
      failReason: !isSuccess ? (payload.errMsg as string) : undefined,
    };
  }

  getWithdrawCallbackSuccessResponse(): CallbackResponse {
    return {
      contentType: 'text/plain',
      body: 'success',
    };
  }

  async queryBalance(): Promise<BalanceResult> {
    const config = this.getConfig();

    const requestData: Record<string, unknown> = {
      mchId: config.merchantId,
    };

    requestData.sign = uzpaySign(requestData, config.transferSecretKey);

    try {
      const response = await fetch(`${config.gatewayUrl}/query/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.code === 0) {
        return {
          success: true,
          balance: parseInt(result.data?.balance || '0') / 100, // 分转元
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
