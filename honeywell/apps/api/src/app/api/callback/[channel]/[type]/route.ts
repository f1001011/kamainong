/**
 * @file 统一支付回调接口
 * @description POST /api/callback/:channel/:type - 处理第三方支付平台的回调通知
 * @depends 开发文档/附录/lwpay.md - LWPAY 接口文档
 * @depends 开发文档/附录/uzpay.md - UZPAY 接口文档
 * @depends 开发文档/02-数据层/02.1-数据库设计.md - 数据库设计
 *
 * 支持的回调路由：
 * - POST /api/callback/lwpay/recharge - LWPAY 充值回调
 * - POST /api/callback/lwpay/withdraw - LWPAY 提现回调
 * - POST /api/callback/uzpay/recharge - UZPAY 充值回调
 * - POST /api/callback/uzpay/withdraw - UZPAY 提现回调
 *
 * 核心处理逻辑：
 * 1. 验证签名（失败返回错误）
 * 2. 查询订单（不存在返回错误）
 * 3. 幂等检查：订单状态已处理直接返回成功
 * 4. 更新订单状态
 * 5. 处理余额（充值入账/提现扣款或退回）
 * 6. 创建资金流水
 * 7. 发送站内通知
 * 8. 返回成功响应：LWPAY 返回 OK，UZPAY 返回 success
 *
 * 签名规则：
 * - LWPAY: MD5 后转大写
 * - UZPAY: MD5 后转小写
 */

import { NextRequest, NextResponse } from 'next/server';
import { rechargeService } from '@/services/recharge.service';
import { withdrawService } from '@/services/withdraw.service';

interface RouteParams {
  params: Promise<{ channel: string; type: string }>;
}

/**
 * 解析回调请求体
 * @description 支持 form-urlencoded 和 JSON 两种格式
 */
async function parsePayload(request: NextRequest): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries());
  } else if (contentType.includes('application/json')) {
    return await request.json();
  } else {
    // 尝试作为文本解析
    const text = await request.text();
    try {
      return JSON.parse(text);
    } catch {
      // 尝试作为 form 数据解析
      const params = new URLSearchParams(text);
      return Object.fromEntries(params.entries());
    }
  }
}

/**
 * 获取失败响应
 * @param channelCode 通道代码
 */
function getFailResponse(channelCode: string): NextResponse {
  // UZPAY 返回小写 fail，其他通道（LWPAY/JYPAY）返回大写 FAIL
  const body = channelCode === 'UZPAY' ? 'fail' : 'FAIL';
  return new NextResponse(body, {
    status: 200, // 支付回调需要返回 200，否则平台会重试
    headers: { 'Content-Type': 'text/plain' },
  });
}

/**
 * 处理支付回调（POST）
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { channel, type } = await params;
  const channelCode = channel.toUpperCase();
  const callbackType = type.toLowerCase();

  console.log(`[PaymentCallback] 收到 ${channelCode} ${callbackType} 回调请求`);

  // 验证通道代码
  if (!['LWPAY', 'UZPAY', 'JYPAY', 'HTPAY'].includes(channelCode)) {
    console.error(`[PaymentCallback] 未知支付通道: ${channelCode}`);
    return getFailResponse(channelCode);
  }

  // 验证回调类型
  if (!['recharge', 'withdraw'].includes(callbackType)) {
    console.error(`[PaymentCallback] 未知回调类型: ${callbackType}`);
    return getFailResponse(channelCode);
  }

  try {
    // 1. 解析回调数据
    // HTPAY 签名在请求头中，需先读取 raw body 再解析，并注入验签元数据
    let payload: Record<string, unknown>;
    if (channelCode === 'HTPAY') {
      const rawBody = await request.text();
      payload = JSON.parse(rawBody);
      payload.__raw_body = rawBody;
      payload.__reqsign = request.headers.get('reqsign') || '';
      payload.__reqtime = request.headers.get('reqtime') || '';
    } else {
      payload = await parsePayload(request);
    }
    console.log(`[PaymentCallback] ${channelCode} ${callbackType} 回调数据:`, JSON.stringify(payload));

    // 2. 根据回调类型分发处理
    let result: { success: boolean; response: { contentType: string; body: string } };

    if (callbackType === 'recharge') {
      // 充值回调处理
      result = await rechargeService.handleCallback(channelCode, payload);
    } else {
      // 提现代付回调处理
      result = await withdrawService.handleTransferCallback(channelCode, payload);
    }

    console.log(
      `[PaymentCallback] ${channelCode} ${callbackType} 处理结果:`,
      result.success ? 'Exitoso' : 'Fallido'
    );

    // 3. 返回支付平台要求的响应格式
    return new NextResponse(result.response.body, {
      status: 200,
      headers: { 'Content-Type': result.response.contentType },
    });
  } catch (error) {
    console.error(`[PaymentCallback] ${channelCode} ${callbackType} 处理异常:`, error);
    return getFailResponse(channelCode);
  }
}

/**
 * 处理 GET 请求（部分支付平台可能使用 GET）
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { channel, type } = await params;
  const channelCode = channel.toUpperCase();
  const callbackType = type.toLowerCase();

  console.log(`[PaymentCallback] 收到 ${channelCode} ${callbackType} GET 回调请求`);

  try {
    // 从 URL 参数获取回调数据
    const { searchParams } = new URL(request.url);
    const payload = Object.fromEntries(searchParams.entries());

    console.log(`[PaymentCallback] ${channelCode} ${callbackType} GET 回调数据:`, JSON.stringify(payload));

    // 根据回调类型分发处理
    let result: { success: boolean; response: { contentType: string; body: string } };

    if (callbackType === 'recharge') {
      result = await rechargeService.handleCallback(channelCode, payload);
    } else if (callbackType === 'withdraw') {
      result = await withdrawService.handleTransferCallback(channelCode, payload);
    } else {
      return getFailResponse(channelCode);
    }

    return new NextResponse(result.response.body, {
      status: 200,
      headers: { 'Content-Type': result.response.contentType },
    });
  } catch (error) {
    console.error(`[PaymentCallback] ${channelCode} ${callbackType} GET 处理异常:`, error);
    return getFailResponse(channelCode);
  }
}
