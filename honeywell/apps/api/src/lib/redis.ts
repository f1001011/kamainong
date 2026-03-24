/**
 * @file Redis 缓存服务
 * @description Redis 客户端连接、缓存工具函数、分布式锁、限流等功能
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第6节 Redis缓存设计
 * @depends 开发文档/05-服务架构/05.1-服务架构.md 第6节 Redis缓存策略
 */

import Redis from 'ioredis';

// ================================
// Redis 客户端连接
// ================================

/**
 * Redis 客户端单例
 * 使用 ioredis 连接 Redis 服务器
 */
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true,
});

// Redis 连接事件监听
redis.on('error', (err) => {
  console.error('[Redis] 连接错误:', err);
});

redis.on('connect', () => {
  console.log('[Redis] 已连接');
});

redis.on('ready', () => {
  console.log('[Redis] 准备就绪');
});

redis.on('close', () => {
  console.log('[Redis] 连接已关闭');
});

// ================================
// 缓存键定义（依据：02.1-数据库设计.md 第6节）
// ================================

/**
 * Redis 缓存键命名规范
 * 格式：{模块}:{子模块}:{标识}
 */
export const CACHE_KEYS = {
  // === 配置缓存（依据：第6.1节核心缓存键）===
  CONFIG: {
    /** 全局配置 - Hash，过期时间5分钟 */
    GLOBAL: 'config:global',
    /** 全局配置版本号 - String，不过期 */
    VERSION: 'config:version',
    /** 文案版本号 - String，不过期 */
    TEXT_VERSION: 'config:text_version',
    /** 时区版本号 - String，不过期 */
    TIMEZONE_VERSION: 'config:timezone_version',
  },

  // === 文案缓存 ===
  TEXT: {
    /** 西班牙语文案 - Hash，过期时间5分钟 */
    ES: 'text:es',
  },

  // === 用户缓存（依据：第6.1节核心缓存键）===
  USER: {
    /** 用户基本信息 - Hash，过期时间10分钟 */
    INFO: (userId: number) => `user:${userId}:info`,
  },

  // === 产品缓存（依据：第6.1节核心缓存键）===
  PRODUCT: {
    /** 产品列表 - String，过期时间5分钟 */
    LIST: 'product:list',
  },

  // === 银行缓存（依据：第6.1节核心缓存键）===
  BANK: {
    /** 银行列表 - String，过期时间1小时 */
    LIST: 'bank:list',
  },

  // === Banner缓存（依据：SVC-09b要求各配置独立缓存）===
  BANNER: {
    /** Banner列表 - String，过期时间1分钟（短时间缓存，因为有时效性检查） */
    LIST: 'banner:list',
  },

  // === 页面配置缓存（依据：第6.3节）===
  PAGE: {
    /** 首页配置 - String，过期时间5分钟 */
    HOME: 'page:home',
    /** 个人中心配置 - String，过期时间5分钟 */
    PROFILE: 'page:profile',
    /** 产品页配置 - String，过期时间5分钟 */
    PRODUCT: 'page:product',
  },

  // === 动画配置缓存（依据：第6.3节）===
  ANIMATION: {
    /** 动画配置 - String，过期时间10分钟 */
    CONFIG: 'animation:config',
  },

  // === 限流键（依据：第6.2节）===
  RATE_LIMIT: {
    /** API限流 - String，过期时间1分钟 */
    API: (ip: string, endpoint: string) => `rate_limit:${ip}:${endpoint}`,
  },

  // === 分布式锁（依据：第6.2节）===
  LOCK: {
    /** 提现锁 - String，过期时间30秒 */
    WITHDRAW: (userId: number) => `lock:withdraw:${userId}`,
    /** 购买锁 - String，过期时间10秒 */
    PURCHASE: (userId: number, productId: number) => `lock:purchase:${userId}:${productId}`,
    /** 签到锁 - String，过期时间5秒 */
    SIGNIN: (userId: number) => `lock:signin:${userId}`,
    /** 活动奖励领取锁 - String，过期时间10秒 */
    REWARD: (userId: number, activityCode: string) => `lock:reward:${userId}:${activityCode}`,
    /** SVIP每日奖励领取锁 - String，过期时间10秒 */
    SVIP_CLAIM: (userId: number) => `lock:svip_claim:${userId}`,
  },

  // === 支付通道缓存 ===
  PAYMENT_CHANNEL_CONFIG: 'payment:channel:config',

  // === 充值回调锁 ===
  RECHARGE_CALLBACK_LOCK: 'lock:recharge:callback',

  // === 在线状态（依据：第6.4节）===
  ONLINE: {
    /** 在线用户ID集合 - Set，不过期 */
    USERS: 'online:users',
    /** 当前在线人数 - String，过期时间1分钟 */
    COUNT: 'online:count',
    /** 当日峰值记录 - Hash，过期时间24小时 */
    PEAK: (date: string) => `online:peak:${date}`,
  },
} as const;

// ================================
// 缓存过期时间配置（秒）
// ================================

/**
 * 缓存过期时间常量（禁止硬编码，统一在此定义）
 */
export const CACHE_TTL = {
  /** 短时间缓存 - 1分钟 */
  SHORT: 60,
  /** 中等时间缓存 - 5分钟 */
  MEDIUM: 5 * 60,
  /** 长时间缓存 - 30分钟 */
  LONG: 30 * 60,
  /** 全局配置缓存 - 5分钟 */
  CONFIG_GLOBAL: 5 * 60,
  /** 文案缓存 - 5分钟 */
  TEXT: 5 * 60,
  /** 用户信息缓存 - 10分钟 */
  USER_INFO: 10 * 60,
  /** 产品列表缓存 - 5分钟 */
  PRODUCT_LIST: 5 * 60,
  /** 银行列表缓存 - 1小时 */
  BANK_LIST: 60 * 60,
  /** Banner列表缓存 - 1分钟（短时间缓存，因为有时效性检查） */
  BANNER_LIST: 60,
  /** 页面配置缓存 - 5分钟 */
  PAGE_CONFIG: 5 * 60,
  /** 动画配置缓存 - 10分钟 */
  ANIMATION_CONFIG: 10 * 60,
  /** API限流 - 1分钟 */
  RATE_LIMIT: 60,
  /** 在线人数统计 - 1分钟 */
  ONLINE_COUNT: 60,
  /** 在线峰值记录 - 24小时 */
  ONLINE_PEAK: 24 * 60 * 60,
} as const;

// ================================
// 分布式锁过期时间配置（秒）
// ================================

/**
 * 分布式锁过期时间常量
 */
export const LOCK_TTL = {
  /** 提现锁 - 30秒 */
  WITHDRAW: 30,
  /** 购买锁 - 10秒 */
  PURCHASE: 10,
  /** 签到锁 - 5秒 */
  SIGNIN: 5,
  /** 活动奖励领取锁 - 10秒 */
  REWARD: 10,
  /** SVIP每日奖励领取锁 - 10秒 */
  SVIP_CLAIM: 10,
} as const;

// ================================
// 缓存工具函数
// ================================

/**
 * 获取缓存或设置缓存（Cache-Aside 模式）
 * @description 先从缓存获取数据，如果不存在则调用 fetcher 获取数据并缓存
 * @param key - 缓存键
 * @param fetcher - 数据获取函数（缓存未命中时调用）
 * @param ttl - 过期时间（秒）
 * @returns 缓存数据或新获取的数据
 * 
 * @example
 * const user = await getOrSet(
 *   CACHE_KEYS.USER.INFO(userId),
 *   async () => await prisma.user.findUnique({ where: { id: userId } }),
 *   CACHE_TTL.USER_INFO
 * );
 */
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  // 尝试从缓存获取
  const cached = await redis.get(key);
  if (cached !== null) {
    try {
      return JSON.parse(cached) as T;
    } catch {
      // 解析失败，删除无效缓存
      await redis.del(key);
    }
  }

  // 缓存未命中，调用 fetcher 获取数据
  const data = await fetcher();

  // 设置缓存（仅当数据不为 null/undefined 时）
  if (data !== null && data !== undefined) {
    await redis.setex(key, ttl, JSON.stringify(data));
  }

  return data;
}

/**
 * 设置缓存
 * @param key - 缓存键
 * @param value - 缓存值
 * @param ttl - 过期时间（秒）
 */
export async function setCache<T>(key: string, value: T, ttl: number): Promise<void> {
  await redis.setex(key, ttl, JSON.stringify(value));
}

/**
 * 获取缓存
 * @param key - 缓存键
 * @returns 缓存值或 null
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const cached = await redis.get(key);
  if (cached === null) {
    return null;
  }
  try {
    return JSON.parse(cached) as T;
  } catch {
    return null;
  }
}

/**
 * 删除缓存
 * @param key - 缓存键（支持通配符模式，如 user:*）
 */
export async function deleteCache(key: string): Promise<void> {
  if (key.includes('*')) {
    // 通配符模式：使用 SCAN + DEL
    const stream = redis.scanStream({ match: key });
    const pipeline = redis.pipeline();
    let count = 0;

    for await (const keys of stream) {
      for (const k of keys as string[]) {
        pipeline.del(k);
        count++;
      }
    }

    if (count > 0) {
      await pipeline.exec();
    }
  } else {
    // 精确匹配：直接删除
    await redis.del(key);
  }
}

/**
 * 批量删除缓存
 * @param keys - 缓存键数组
 */
export async function deleteCaches(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await redis.del(...keys);
}

// ================================
// 分布式锁（依据：第6.2节）
// ================================

/**
 * 获取分布式锁
 * @description 使用 Redis SETNX 实现分布式锁，防止并发问题
 * @param key - 锁键
 * @param ttl - 锁过期时间（秒），防止死锁
 * @returns 是否获取成功
 * 
 * @example
 * // 获取提现锁
 * const locked = await acquireLock(CACHE_KEYS.LOCK.WITHDRAW(userId), LOCK_TTL.WITHDRAW);
 * if (!locked) {
 *   throw new Error('العملية قيد التنفيذ، حاول لاحقاً');
 * }
 * try {
 *   // 执行提现逻辑
 * } finally {
 *   await releaseLock(CACHE_KEYS.LOCK.WITHDRAW(userId));
 * }
 */
export async function acquireLock(key: string, ttl: number): Promise<boolean> {
  // SET key value NX EX ttl
  // NX: 只在键不存在时设置
  // EX: 设置过期时间（秒）
  const result = await redis.set(key, '1', 'EX', ttl, 'NX');
  return result === 'OK';
}

/**
 * 释放分布式锁
 * @param key - 锁键
 */
export async function releaseLock(key: string): Promise<void> {
  await redis.del(key);
}

/**
 * 使用分布式锁执行操作
 * @description 封装获取锁、执行操作、释放锁的完整流程
 * @param key - 锁键
 * @param ttl - 锁过期时间（秒）
 * @param operation - 要执行的操作
 * @returns 操作结果
 * @throws 获取锁失败时抛出错误
 * 
 * @example
 * await withLock(
 *   CACHE_KEYS.LOCK.WITHDRAW(userId),
 *   LOCK_TTL.WITHDRAW,
 *   async () => {
 *     // 执行提现逻辑
 *   }
 * );
 */
export async function withLock<T>(
  key: string,
  ttl: number,
  operation: () => Promise<T>
): Promise<T> {
  const locked = await acquireLock(key, ttl);
  if (!locked) {
    throw new Error('OPERATION_IN_PROGRESS');
  }

  try {
    return await operation();
  } finally {
    await releaseLock(key);
  }
}

// ================================
// API 限流（依据：第6.2节）
// ================================

/**
 * 检查并记录请求频率（固定窗口算法）
 * @description 使用 Redis INCR + EXPIRE 实现固定窗口限流，每次调用都会递增计数器
 * @param ip - 客户端IP
 * @param endpoint - API端点
 * @param limit - 限制次数
 * @param windowSeconds - 时间窗口（秒）
 * @returns 是否允许请求（true=允许，false=超限）
 */
export async function checkRateLimit(
  ip: string,
  endpoint: string,
  limit: number,
  windowSeconds: number = 60
): Promise<boolean> {
  const key = CACHE_KEYS.RATE_LIMIT.API(ip, endpoint);

  const result = await redis.multi()
    .incr(key)
    .expire(key, windowSeconds)
    .exec();

  if (!result || !result[0] || result[0][1] === null) {
    return true;
  }

  const count = result[0][1] as number;
  return count <= limit;
}

/**
 * 只读检查频率限制（不递增计数器）
 * @description 用于需要先判断是否超限、再决定是否执行的场景（如注册：只在成功后才计数）
 * @param ip - 客户端IP
 * @param endpoint - API端点
 * @param limit - 限制次数
 * @returns 是否允许请求（true=允许，false=超限）
 */
export async function checkRateLimitReadonly(
  ip: string,
  endpoint: string,
  limit: number
): Promise<boolean> {
  const key = CACHE_KEYS.RATE_LIMIT.API(ip, endpoint);
  const count = await redis.get(key);
  const current = count ? parseInt(count, 10) : 0;
  return current < limit;
}

/**
 * 递增频率计数器（不做限制判断）
 * @description 配合 checkRateLimitReadonly 使用，在操作成功后调用
 * @param ip - 客户端IP
 * @param endpoint - API端点
 * @param windowSeconds - 时间窗口（秒）
 */
export async function incrementRateLimit(
  ip: string,
  endpoint: string,
  windowSeconds: number = 60
): Promise<void> {
  const key = CACHE_KEYS.RATE_LIMIT.API(ip, endpoint);
  await redis.multi()
    .incr(key)
    .expire(key, windowSeconds)
    .exec();
}

/**
 * 获取剩余请求次数
 * @param ip - 客户端IP
 * @param endpoint - API端点
 * @param limit - 限制次数
 * @returns 剩余请求次数
 */
export async function getRateLimitRemaining(
  ip: string,
  endpoint: string,
  limit: number
): Promise<number> {
  const key = CACHE_KEYS.RATE_LIMIT.API(ip, endpoint);
  const count = await redis.get(key);
  const current = count ? parseInt(count, 10) : 0;
  return Math.max(0, limit - current);
}

// ================================
// 在线状态管理（依据：第6.4节）
// ================================

/**
 * 更新用户心跳（设置用户在线状态）
 * @param userId - 用户ID
 * @param timeout - 心跳超时时间（秒），从 GlobalConfig.heartbeat_timeout 读取
 */
export async function updateUserHeartbeat(userId: number, timeout: number): Promise<void> {
  const key = CACHE_KEYS.ONLINE.USERS;
  const now = Date.now();

  // 使用 ZADD 将用户ID添加到有序集合，score 为当前时间戳
  await redis.zadd(key, now, userId.toString());
}

/**
 * 获取在线用户数量
 * @param timeout - 心跳超时时间（秒）
 * @returns 在线用户数量
 */
export async function getOnlineUserCount(timeout: number): Promise<number> {
  const key = CACHE_KEYS.ONLINE.USERS;
  const now = Date.now();
  const minScore = now - timeout * 1000;

  // 统计 score 大于 minScore 的成员数量（最近活跃的用户）
  return await redis.zcount(key, minScore, '+inf');
}

/**
 * 清理过期的在线用户记录
 * @param timeout - 心跳超时时间（秒）
 */
export async function cleanupOfflineUsers(timeout: number): Promise<void> {
  const key = CACHE_KEYS.ONLINE.USERS;
  const now = Date.now();
  const maxScore = now - timeout * 1000;

  // 删除 score 小于 maxScore 的成员（超时的用户）
  await redis.zremrangebyscore(key, '-inf', maxScore);
}

/**
 * 检查用户是否在线
 * @param userId - 用户ID
 * @param timeout - 心跳超时时间（秒）
 * @returns 是否在线
 */
export async function isUserOnline(userId: number, timeout: number): Promise<boolean> {
  const key = CACHE_KEYS.ONLINE.USERS;
  const score = await redis.zscore(key, userId.toString());

  if (score === null) {
    return false;
  }

  const now = Date.now();
  const lastHeartbeat = parseFloat(score);
  return now - lastHeartbeat < timeout * 1000;
}

/**
 * 获取在线用户ID列表
 * @param timeout - 心跳超时时间（秒）
 * @param limit - 返回数量限制
 * @returns 在线用户ID列表
 */
export async function getOnlineUserIds(timeout: number, limit: number = 100): Promise<number[]> {
  const key = CACHE_KEYS.ONLINE.USERS;
  const now = Date.now();
  const minScore = now - timeout * 1000;

  // 获取最近活跃的用户ID
  const userIds = await redis.zrangebyscore(key, minScore, '+inf', 'LIMIT', 0, limit);
  return userIds.map(id => parseInt(id, 10));
}

/**
 * 记录在线峰值
 * @param date - 日期字符串（YYYY-MM-DD）
 * @param count - 当前在线人数
 */
export async function recordOnlinePeak(date: string, count: number): Promise<void> {
  const key = CACHE_KEYS.ONLINE.PEAK(date);

  // 获取当前峰值
  const currentPeak = await redis.hget(key, 'peak');
  const peak = currentPeak ? parseInt(currentPeak, 10) : 0;

  // 如果当前人数大于峰值，更新峰值
  if (count > peak) {
    await redis.multi()
      .hset(key, 'peak', count.toString())
      .hset(key, 'peakTime', new Date().toISOString())
      .expire(key, CACHE_TTL.ONLINE_PEAK)
      .exec();
  }
}

// ================================
// 配置缓存辅助函数
// ================================

/**
 * 清除所有配置缓存
 * @description 当后台修改配置时调用，确保前端获取最新配置
 */
export async function clearConfigCache(): Promise<void> {
  await deleteCaches([
    CACHE_KEYS.CONFIG.GLOBAL,
    CACHE_KEYS.TEXT.ES,
    CACHE_KEYS.PAGE.HOME,
    CACHE_KEYS.PAGE.PROFILE,
    CACHE_KEYS.PAGE.PRODUCT,
    CACHE_KEYS.ANIMATION.CONFIG,
    CACHE_KEYS.BANNER.LIST,
  ]);
}

/**
 * 清除用户相关缓存
 * @param userId - 用户ID
 */
export async function clearUserCache(userId: number): Promise<void> {
  await deleteCache(CACHE_KEYS.USER.INFO(userId));
}

/**
 * 清除产品缓存
 */
export async function clearProductCache(): Promise<void> {
  await deleteCache(CACHE_KEYS.PRODUCT.LIST);
}

/**
 * 清除银行缓存
 */
export async function clearBankCache(): Promise<void> {
  await deleteCache(CACHE_KEYS.BANK.LIST);
}

// ================================
// 健康检查
// ================================

/**
 * Redis 连接健康检查
 * @returns 是否健康
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}

export default redis;
