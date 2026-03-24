/**
 * @file 支付回调接口
 * @description POST /api/recharge/callback/:channel - 处理第三方支付平台的回调通知
 * @depends 开发文档/05-后端服务/05.2-支付通道集成.md 第4节 - 回调处理
 */

import { NextRequest, NextResponse } from 'next/server';
import { rechargeService } from '@/services/recharge.service';

interface RouteParams {
  params: Promise<{ channel: string }>;
}

/**
 * 支付回调处理
 * @description 
 * - 接收第三方支付平台的异步回调通知
 * - 验证签名、处理订单状态更新
 * - 返回平台要求的响应格式
 * 
 * 注意：
 * - 此接口不需要用户认证
 * - 幂等性处理：重复回调不会重复增加余额
 * - 延迟回调处理：即使订单已过期/取消，收到付款回调仍会到账
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { channel } = await params;
  const channelCode = channel.toUpperCase();

  console.log(`[PaymentCallback] 收到 ${channelCode} 回调请求`);

  try {
    // 1. 获取回调数据
    // 支持 form-urlencoded 和 JSON 两种格式
    const contentType = request.headers.get('content-type') || '';
    let payload: Record<string, unknown>;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      payload = Object.fromEntries(formData.entries());
    } else if (contentType.includes('application/json')) {
      payload = await request.json();
    } else {
      // 尝试作为文本解析
      const text = await request.text();
      try {
        payload = JSON.parse(text);
      } catch {
        // 尝试作为 form 数据解析
        const params = new URLSearchParams(text);
        payload = Object.fromEntries(params.entries());
      }
    }

    console.log(`[PaymentCallback] ${channelCode} 回调数据:`, JSON.stringify(payload));

    // 2. 处理回调
    const result = await rechargeService.handleCallback(channelCode, payload);

    console.log(
      `[PaymentCallback] ${channelCode} 处理结果:`,
      result.success ? 'Exitoso' : 'Fallido'
    );

    // 3. 返回支付平台要求的响应格式
    return new NextResponse(result.response.body, {
      status: 200,
      headers: {
        'Content-Type': result.response.contentType,
      },
    });
  } catch (error) {
    console.error(`[PaymentCallback] ${channelCode} 处理异常:`, error);

    // 返回通用失败响应
    return new NextResponse('FAIL', {
      status: 200, // 注意：支付回调通常需要返回200，否则平台会重试
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}

/**
 * 处理 GET 请求（部分支付平台可能使用 GET）
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { channel } = await params;
  const channelCode = channel.toUpperCase();

  console.log(`[PaymentCallback] 收到 ${channelCode} GET 回调请求`);

  try {
    // 从 URL 参数获取回调数据
    const { searchParams } = new URL(request.url);
    const payload = Object.fromEntries(searchParams.entries());

    console.log(`[PaymentCallback] ${channelCode} GET 回调数据:`, JSON.stringify(payload));

    // 处理回调
    const result = await rechargeService.handleCallback(channelCode, payload);

    return new NextResponse(result.response.body, {
      status: 200,
      headers: {
        'Content-Type': result.response.contentType,
      },
    });
  } catch (error) {
    console.error(`[PaymentCallback] ${channelCode} GET 处理异常:`, error);

    return new NextResponse('FAIL', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
