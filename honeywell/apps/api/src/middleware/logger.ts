/**
 * @file 日志中间件
 * @description 请求日志记录与响应时间统计
 * @depends 开发文档/05-后端服务/05.1-服务架构.md 第4.5节 - 日志中间件
 */

import { NextRequest } from 'next/server';
import { getClientIp } from '@/lib/client-ip';

/**
 * 请求日志中间件
 * @description 依据：05.1-服务架构.md 第4.5节
 *
 * 功能：
 * 1. 记录请求开始时间、方法、URL、IP
 * 2. 记录响应状态码和耗时
 *
 * @example
 * export async function POST(request: NextRequest) {
 *   return withLogger(request, async () => {
 *     return withErrorHandler(request, async () => {
 *       // 业务逻辑
 *     });
 *   });
 * }
 */
export async function withLogger(
  request: NextRequest,
  handler: () => Promise<Response>
): Promise<Response> {
  const startTime = Date.now();
  const method = request.method;
  const url = request.url;
  const ip = getClientIp(request);
  const timestamp = new Date().toISOString();

  // 请求开始日志
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);

  // 执行业务处理
  const response = await handler();

  // 响应完成日志
  const duration = Date.now() - startTime;
  const endTimestamp = new Date().toISOString();
  console.log(
    `[${endTimestamp}] ${method} ${url} - ${response.status} - ${duration}ms`
  );

  return response;
}
