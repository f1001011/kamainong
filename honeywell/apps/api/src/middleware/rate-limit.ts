/**
 * @file 限流中间件
 * @description API 请求限流，支持按 IP 和按用户限流
 * @depends 开发文档/02-数据层/02.2-API规范.md 第6节 - 速率限制
 * @depends 开发文档/05-后端服务/05.1-服务架构.md 第4.3节 - 限流中间件
 */

import { NextRequest } from 'next/server';
import { redis, getOrSet, CACHE_TTL } from '@/lib/redis';
import { errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { DEFAULT_CONFIG } from '@honeywell/config';
import { getClientIp } from '@/lib/client-ip';

/**
 * 限流配置接口
 */
interface RateLimitConfig {
  /** 限流键标识 */
  key: string;
  /** 次数限制 */
  limit: number;
  /** 时间窗口（秒） */
  window: number;
}

/**
 * 限流类型定义
 * @description 依据：02.2-API规范.md 第6.1节
 */
export type RateLimitType =
  | 'global'
  | 'login'
  | 'register'
  | 'recharge'
  | 'withdraw'
  | 'signin';

/**
 * 从数据库获取限流配置
 * @description 配置优先从 GlobalConfig 读取，若不存在则使用默认值
 */
async function getRateLimitConfig(
  configKey: RateLimitType
): Promise<RateLimitConfig> {
  // 从缓存/数据库获取限流配置
  const configs = await getOrSet<Record<string, number>>(
    'config:rate_limits',
    async () => {
      const results: Record<string, number> = {};

      // 查询所有限流相关配置
      const globalConfigs = await prisma.globalConfig.findMany({
        where: {
          key: {
            in: [
              'rate_limit_global',
              'rate_limit_login',
              'rate_limit_register',
              'rate_limit_recharge',
              'rate_limit_withdraw',
              'rate_limit_signin',
            ],
          },
        },
      });

      for (const config of globalConfigs) {
        // GlobalConfig.value 是 JSON 类型，直接获取值
        const value = config.value as number;
        results[config.key] = value;
      }

      return results;
    },
    CACHE_TTL.CONFIG_GLOBAL
  );

  // 依据：02.2-API规范.md 第6.1节 - 限流规则
  const configMap: Record<RateLimitType, RateLimitConfig> = {
    global: {
      key: 'global',
      limit: configs['rate_limit_global'] ?? DEFAULT_CONFIG.RATE_LIMIT_GLOBAL,
      window: 60, // 1分钟
    },
    login: {
      key: 'login',
      limit: configs['rate_limit_login'] ?? DEFAULT_CONFIG.RATE_LIMIT_LOGIN,
      window: 60,
    },
    register: {
      key: 'register',
      limit:
        configs['rate_limit_register'] ?? DEFAULT_CONFIG.RATE_LIMIT_REGISTER,
      window: 60,
    },
    recharge: {
      key: 'recharge',
      limit: configs['rate_limit_recharge'] ?? 10,
      window: 60,
    },
    withdraw: {
      key: 'withdraw',
      limit: configs['rate_limit_withdraw'] ?? 5,
      window: 60,
    },
    signin: {
      key: 'signin',
      limit: configs['rate_limit_signin'] ?? 5,
      window: 60,
    },
  };

  return configMap[configKey];
}

/**
 * 限流中间件
 * @description 依据：05.1-服务架构.md 第4.3节
 *
 * @param request - Next.js 请求对象
 * @param configKey - 限流配置键（global/login/register/recharge/withdraw/signin）
 * @param handler - 业务处理函数
 * @param userId - 可选，用户ID（按用户限流时使用）
 *
 * @example
 * // 按 IP 限流（登录接口）
 * export async function POST(request: NextRequest) {
 *   return withRateLimit(request, 'login', async () => {
 *     // 业务逻辑
 *   });
 * }
 *
 * @example
 * // 按用户限流（提现接口）
 * export async function POST(request: NextRequest) {
 *   return withAuth(request, async (req, userId) => {
 *     return withRateLimit(req, 'withdraw', async () => {
 *       // 业务逻辑
 *     }, userId);
 *   });
 * }
 */
export async function withRateLimit(
  request: NextRequest,
  configKey: RateLimitType,
  handler: () => Promise<Response>,
  userId?: number
): Promise<Response> {
  const config = await getRateLimitConfig(configKey);
  const ip = getClientIp(request);

  // 构建限流键（依据：05.1-服务架构.md 第4.3节）
  // 按用户限流：rate_limit:{key}:user:{userId}
  // 按 IP 限流：rate_limit:{key}:ip:{ip}
  const rateLimitKey = userId
    ? `rate_limit:${config.key}:user:${userId}`
    : `rate_limit:${config.key}:ip:${ip}`;

  // 使用 Redis INCR + EXPIRE 实现固定窗口限流
  const current = await redis.incr(rateLimitKey);

  if (current === 1) {
    // 首次请求，设置过期时间
    await redis.expire(rateLimitKey, config.window);
  }

  if (current > config.limit) {
    // 获取剩余等待时间
    const ttl = await redis.ttl(rateLimitKey);

    // 依据：02.2-API规范.md 第6.2节 - 限流响应格式
    return errorResponse('RATE_LIMITED', 'عدد كبير من الطلبات، حاول لاحقاً', 429, {
      retryAfter: ttl > 0 ? ttl : config.window,
    });
  }

  return handler();
}

/**
 * 获取剩余请求次数
 * @description 用于在响应头中返回剩余次数（可选）
 */
export async function getRateLimitRemaining(
  configKey: RateLimitType,
  request: NextRequest,
  userId?: number
): Promise<number> {
  const config = await getRateLimitConfig(configKey);
  const ip = getClientIp(request);

  const rateLimitKey = userId
    ? `rate_limit:${config.key}:user:${userId}`
    : `rate_limit:${config.key}:ip:${ip}`;

  const count = await redis.get(rateLimitKey);
  const current = count ? parseInt(count, 10) : 0;

  return Math.max(0, config.limit - current);
}
