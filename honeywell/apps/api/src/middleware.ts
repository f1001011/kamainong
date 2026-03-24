/**
 * @file API 中间件
 * @description 处理 CORS 跨域请求和预检请求
 * @depends 开发文档/05-服务架构/05.1-系统架构.md - CORS 配置
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * 允许的源列表
 * 统一小写，浏览器发送的 Origin 头始终是小写域名
 */
const allowedOrigins = [
  // 开发环境
  'http://localhost:3000',
  'http://localhost:3001',
  'http://192.168.50.71:3000',
  'http://192.168.50.71:3001',
  // 生产环境（Lendlease摩洛哥）
  'https://lles-ma.com',
  'https://www.lles-ma.com',
  'https://ipa.lles-ma.com',
  'https://jiuge.lles-ma.com',
];

/**
 * CORS 预检请求头
 * Access-Control-Expose-Headers 必须包含 X-New-Token，否则浏览器跨域时无法读取该响应头
 */
const corsHeaders = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Requested-With, Accept, Origin',
  'Access-Control-Expose-Headers': 'X-New-Token',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

/**
 * 中间件函数
 * 处理所有 /api/* 路由的 CORS
 */
export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') ?? '';
  const isAllowedOrigin = allowedOrigins.includes(origin.toLowerCase());

  // 处理预检请求 (OPTIONS)
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });

    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  // 处理实际请求：必须在所有响应上设置完整 CORS 头
  const response = NextResponse.next();

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Expose-Headers', 'X-New-Token');

  return response;
}

/**
 * 中间件配置
 * 只匹配 /api/* 路由
 */
export const config = {
  matcher: [
    /*
     * 匹配所有 API 路由：
     * - /api/:path*
     * 排除：
     * - /_next (Next.js 内部)
     * - /favicon.ico
     */
    '/api/:path*',
    '/:path*',
  ],
};
