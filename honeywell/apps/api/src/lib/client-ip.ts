/**
 * @file 客户端真实 IP 获取工具
 * @description 统一的 IP 获取逻辑，兼容 Cloudflare CDN / Nginx 反代 / 直连 三种场景
 *
 * 请求链路：用户(真实IP) → Cloudflare → Nginx → Next.js
 *
 * 头部优先级：
 * 1. CF-Connecting-IP（Cloudflare 保证是终端用户真实 IP，无法伪造）
 * 2. X-Real-IP（Nginx 设置）
 * 3. X-Forwarded-For 第一段（可能被伪造，作为最终兜底）
 */

import { NextRequest } from 'next/server';

/**
 * 获取客户端真实 IP
 * @description 兼容 Cloudflare CDN 代理场景
 */
export function getClientIp(request: NextRequest): string {
  // Cloudflare 设置的真实用户 IP（最可靠，Cloudflare 会覆盖客户端伪造值）
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // Cloudflare 在企业版 / 特殊配置下可能用 True-Client-IP
  const trueClientIp = request.headers.get('true-client-ip');
  if (trueClientIp) {
    return trueClientIp.trim();
  }

  // Nginx proxy_set_header X-Real-IP $remote_addr 设置的值
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // X-Forwarded-For 取第一个（最左边 = 最原始客户端 IP）
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return 'unknown';
}
