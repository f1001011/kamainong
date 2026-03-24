/**
 * @file 认证工具
 * @description JWT Token 生成、验证、续期
 * @depends 开发文档/02-数据层/02.2-API规范.md 第3节 - 认证机制
 */

import jwt from 'jsonwebtoken';
import { DEFAULT_CONFIG } from '@honeywell/config';
import { getOrSet, CACHE_TTL } from './redis';
import { prisma } from './prisma';

// ================================
// 密钥配置
// ================================

const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret';
const ADMIN_JWT_SECRET =
  process.env.ADMIN_JWT_SECRET || 'default-admin-jwt-secret';

// ================================
// 类型定义
// ================================

interface TokenPayload {
  userId: number;
  iat: number;
  exp: number;
}

interface AdminTokenPayload {
  adminId: number;
  iat: number;
  exp: number;
}

export interface VerifyResult {
  userId: number;
  shouldRenew: boolean;
}

export interface AdminVerifyResult {
  adminId: number;
  shouldRenew: boolean;
}

// ================================
// Token 配置获取
// ================================

/**
 * 获取 Token 有效期（天）
 * @description 依据：02.2-API规范.md 第3.1节 - 从 GlobalConfig.token_expires_days 读取
 */
async function getTokenExpireDays(): Promise<number> {
  try {
    const config = await getOrSet<number>(
      'config:token_expires_days',
      async () => {
        const result = await prisma.globalConfig.findUnique({
          where: { key: 'token_expires_days' },
        });
        return (result?.value as number) ?? DEFAULT_CONFIG.TOKEN_EXPIRE_DAYS;
      },
      CACHE_TTL.CONFIG_GLOBAL
    );
    return config;
  } catch {
    // 数据库不可用时使用默认值
    return DEFAULT_CONFIG.TOKEN_EXPIRE_DAYS;
  }
}

// ================================
// 用户端 Token
// ================================

/**
 * 生成用户 Token
 * @description 依据：02.2-API规范.md 第3.1节
 */
export async function generateToken(userId: number): Promise<string> {
  const expireDays = await getTokenExpireDays();
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: `${expireDays}d`,
  });
}

/**
 * 生成用户 Token（同步版本，使用默认有效期）
 * @description 用于中间件续期等场景，避免异步调用
 */
export function generateTokenSync(
  userId: number,
  expireDays: number = DEFAULT_CONFIG.TOKEN_EXPIRE_DAYS
): string {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: `${expireDays}d`,
  });
}

/**
 * 验证用户 Token
 * @description 依据：02.2-API规范.md 第3.2节
 */
export function verifyToken(token: string): VerifyResult {
  const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;

  // 检查是否需要续期（剩余 ≤1天）
  const now = Math.floor(Date.now() / 1000);
  const remainingSeconds = payload.exp - now;
  const oneDaySeconds = 24 * 60 * 60;
  const shouldRenew = remainingSeconds <= oneDaySeconds;

  return {
    userId: payload.userId,
    shouldRenew,
  };
}

/**
 * 续期用户 Token
 * @description 依据：02.2-API规范.md 第3.1节 - 剩余≤1天时自动续期
 */
export function renewToken(userId: number): string {
  // 续期时使用默认有效期，避免异步操作
  return generateTokenSync(userId);
}

// ================================
// 管理员 Token
// ================================

/**
 * 生成管理员 Token
 * @description 依据：02.2-API规范.md 第3.3节
 */
export async function generateAdminToken(adminId: number): Promise<string> {
  const expireDays = await getTokenExpireDays();
  return jwt.sign({ adminId }, ADMIN_JWT_SECRET, {
    expiresIn: `${expireDays}d`,
  });
}

/**
 * 生成管理员 Token（同步版本）
 */
export function generateAdminTokenSync(
  adminId: number,
  expireDays: number = DEFAULT_CONFIG.TOKEN_EXPIRE_DAYS
): string {
  return jwt.sign({ adminId }, ADMIN_JWT_SECRET, {
    expiresIn: `${expireDays}d`,
  });
}

/**
 * 验证管理员 Token
 * @description 依据：02.2-API规范.md 第3.4节
 */
export function verifyAdminToken(token: string): AdminVerifyResult {
  const payload = jwt.verify(token, ADMIN_JWT_SECRET) as AdminTokenPayload;

  // 检查是否需要续期（剩余 ≤1天）
  const now = Math.floor(Date.now() / 1000);
  const remainingSeconds = payload.exp - now;
  const oneDaySeconds = 24 * 60 * 60;
  const shouldRenew = remainingSeconds <= oneDaySeconds;

  return {
    adminId: payload.adminId,
    shouldRenew,
  };
}

/**
 * 续期管理员 Token
 * @description 依据：02.2-API规范.md 第3.3节
 */
export function renewAdminToken(adminId: number): string {
  return generateAdminTokenSync(adminId);
}
