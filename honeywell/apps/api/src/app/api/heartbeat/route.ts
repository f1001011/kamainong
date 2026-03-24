/**
 * @file 心跳检测接口
 * @description 客户端定时上报心跳，用于维护在线状态
 * @depends 开发文档/02-数据层/02.2-API规范.md 第11节 - 心跳接口
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.18节 - UserOnlineStatus表
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第3.4节 - 心跳上报
 *
 * 核心业务规则：
 * 1. GET：获取服务器时间，用于时间同步和健康检查
 * 2. POST：用户心跳上报，更新数据库 UserOnlineStatus 表 + Redis 缓存
 * 3. 心跳超时时间从 GlobalConfig.heartbeat_timeout 读取（默认120秒）
 * 4. 心跳间隔从 GlobalConfig.heartbeat_interval 读取（默认60秒）
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/response';
import { withErrorHandler } from '@/middleware/error-handler';
import { withRateLimit } from '@/middleware/rate-limit';
import { withAuth } from '@/middleware/auth';
import { updateUserHeartbeat } from '@/lib/redis';
import { getConfig } from '@/lib/config';

// ================================
// 默认配置值（当数据库无配置时使用）
// ================================

/** 默认心跳超时时间（秒） */
const DEFAULT_HEARTBEAT_TIMEOUT = 120;

// ================================
// 辅助函数
// ================================

/**
 * 获取心跳配置
 * @description 依据：开发文档.md 第13.23节 + 02.1-数据库设计.md 第2.18节
 * 心跳间隔和超时时间从 GlobalConfig 读取，禁止硬编码
 */
async function getHeartbeatConfig(): Promise<{ timeout: number }> {
  const timeout = await getConfig<number>('heartbeat_timeout', DEFAULT_HEARTBEAT_TIMEOUT);
  return { timeout };
}

/**
 * 更新用户在线状态（数据库 + Redis）
 * @description 依据：02.1-数据库设计.md 第2.18节 - UserOnlineStatus表
 * - 使用 upsert 确保记录存在
 * - 同时更新 Redis 用于快速统计
 * @param userId 用户ID
 * @param timeout 心跳超时时间（秒）
 */
async function updateOnlineStatus(userId: number, timeout: number): Promise<void> {
  const now = new Date();

  // 1. 更新数据库 UserOnlineStatus 表
  await prisma.userOnlineStatus.upsert({
    where: { userId },
    create: {
      userId,
      lastHeartbeat: now,
      isOnline: true,
    },
    update: {
      lastHeartbeat: now,
      isOnline: true,
    },
  });

  // 2. 同时更新 Redis（用于快速统计在线人数）
  await updateUserHeartbeat(userId, timeout);
}

// ================================
// 路由处理
// ================================

/**
 * 获取服务器时间（无需认证）
 * GET /api/heartbeat
 *
 * @description 可用于客户端时间同步和服务健康检查
 */
export async function GET(request: NextRequest) {
  return withErrorHandler(request, async () => {
    return withRateLimit(request, 'global', async () => {
      return successResponse({
        status: 'ok',
        serverTime: new Date().toISOString(),
      });
    });
  });
}

/**
 * 用户心跳上报（需要认证）
 * POST /api/heartbeat
 *
 * @description 依据：02.3-前端API接口清单.md 第3.4节 - 心跳上报
 * - 需要 Bearer Token 认证
 * - 更新 UserOnlineStatus 表（lastHeartbeat、isOnline）
 * - 同时更新 Redis 缓存（用于快速统计在线人数）
 * - 返回服务器时间
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(request, async () => {
    return withAuth(request, async (_req, userId) => {
      // 1. 获取心跳配置（从 GlobalConfig 读取，禁止硬编码）
      const { timeout } = await getHeartbeatConfig();

      // 2. 更新用户在线状态（数据库 + Redis）
      await updateOnlineStatus(userId, timeout);

      // 3. 返回服务器时间
      return successResponse({
        serverTime: new Date().toISOString(),
      });
    });
  });
}
