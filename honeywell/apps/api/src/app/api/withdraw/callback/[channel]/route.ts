/**
 * @file 提现代付回调接口
 * @description POST /api/withdraw/callback/:channel - 接收支付通道代付结果回调
 * @depends 开发文档/附录/lwpay.md - LWPAY代付回调
 * @depends 开发文档/附录/uzpay.md - UZPAY代付回调
 */

import { NextRequest, NextResponse } from 'next/server';
import { withdrawService } from '@/services/withdraw.service';

interface RouteParams {
  params: Promise<{ channel: string }>;
}

/**
 * 处理代付结果回调
 * @description 接收第三方支付通道的代付结果通知
 * 
 * LWPAY 回调参数（form-urlencoded）:
 * - mchid: 商户号
 * - out_trade_no: 商户订单号
 * - trade_no: 三方订单号
 * - money: 金额
 * - returncode: 状态码，00=成功
 * - refCode: 1=成功，2=失败，3=回冲
 * - sign: 签名
 * 
 * UZPAY 回调参数（JSON）:
 * - mch_id: 商户号
 * - mch_transferId: 商户订单号
 * - transaction_id: 三方订单号
 * - tradeResult: 1=成功，2=失败
 * - transfer_amount: 金额
 * - sign: 签名
 */
export async function POST(request: NextRequest, context: RouteParams) {
  const { channel } = await context.params;
  const channelCode = channel.toUpperCase();

  console.log(`[WithdrawCallback] 收到 ${channelCode} 代付回调`);

  try {
    // 1. 解析回调数据
    // LWPAY 使用 form-urlencoded，UZPAY 使用 JSON
    let payload: unknown;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else {
      // form-urlencoded
      const formData = await request.formData();
      payload = Object.fromEntries(formData.entries());
    }

    console.log(`[WithdrawCallback] ${channelCode} 回调数据:`, JSON.stringify(payload));

    // 2. 处理回调
    const result = await withdrawService.handleTransferCallback(channelCode, payload);

    console.log(`[WithdrawCallback] ${channelCode} 处理结果:`, result);

    // 3. 返回响应
    // LWPAY 需要返回 "OK"
    // UZPAY 需要返回 "success"
    return new NextResponse(result.response.body, {
      status: 200,
      headers: { 'Content-Type': result.response.contentType },
    });
  } catch (error) {
    console.error(`[WithdrawCallback] ${channelCode} 处理失败:`, error);

    // 返回失败响应
    // UZPAY 返回小写 fail，其他通道（LWPAY/JYPAY）返回大写 FAIL
    const failResponse = channelCode === 'UZPAY' ? 'fail' : 'FAIL';
    return new NextResponse(failResponse, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/**
 * 支持 GET 请求（部分通道可能使用 GET）
 */
export async function GET(request: NextRequest, context: RouteParams) {
  return POST(request, context);
}
