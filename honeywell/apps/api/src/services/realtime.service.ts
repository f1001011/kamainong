/**
 * @file 实时数据监控服务
 * @description 提供后台管理实时数据监控所需的在线用户统计、在线用户列表、交易监控等功能
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第22节 - 实时数据监控接口
 *
 * 核心功能：
 * 1. 实时在线用户统计（当前在线、今日峰值、按小时分布）
 * 2. 在线用户列表（支持分页）
 * 3. 实时交易监控（最近5分钟汇总、最新订单）
 *
 * 在线判断规则（依据：开发文档.md 第13.23节）：
 * - 用户心跳超时时间从 GlobalConfig.heartbeat_timeout 读取（默认120秒）
 * - isOnline = (当前时间 - lastHeartbeat) < heartbeat_timeout
 *
 * 缓存策略：
 * - 实时数据不缓存，支持10-30秒轮询
 * - 小时统计数据存储在 Redis，由心跳定时任务更新
 */

import { prisma } from '@/lib/prisma';
import {
  redis,
  CACHE_KEYS,
  getOnlineUserCount,
} from '@/lib/redis';
import { Prisma } from '@honeywell/database';
import { getSystemTimezone } from '@/lib/config';

// ================================
// Redis 缓存键定义（实时数据监控专用）
// ================================

const REALTIME_CACHE_KEYS = {
  /** 今日每小时在线人数统计 - Hash，key: 小时(00-23)，value: 人数 */
  HOURLY_ONLINE: (date: string) => `realtime:hourly_online:${date}`,
};

// ================================
// 常量定义
// ================================

/** 默认心跳超时时间（秒） - 实际应从 GlobalConfig 读取 */
const DEFAULT_HEARTBEAT_TIMEOUT = 120;

// ================================
// 类型定义（依据：02.4-后台API接口清单.md 第22节）
// ================================

/** 小时统计项 */
interface HourlyStatItem {
  hour: string;
  count: number;
}

/** 实时在线用户统计响应 */
export interface OnlineUsersStats {
  /** 当前在线人数 */
  currentOnline: number;
  /** 今日峰值 */
  todayPeak: number;
  /** 今日峰值时间 */
  todayPeakTime: string;
  /** 昨日同一时间在线人数 */
  yesterdaySameTime: number;
  /** 趋势：UP | DOWN | STABLE */
  trend: 'UP' | 'DOWN' | 'STABLE';
  /** 今日24小时在线人数分布 */
  hourlyStats: HourlyStatItem[];
}

/** 在线用户列表项 */
export interface OnlineUserItem {
  userId: number;
  phone: string;
  nickname: string | null;
  vipLevel: number;
  lastHeartbeatAt: string;
  lastActiveIp: string | null;
  deviceType: string;
  onlineDuration: number;
}

/** 在线用户列表响应 */
export interface OnlineUserListResponse {
  list: OnlineUserItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/** 交易监控汇总 */
interface TransactionSummary {
  last5MinRecharge: string;
  last5MinWithdraw: string;
  last5MinPurchase: string;
}

/** 最近充值记录 */
interface RecentRecharge {
  id: number;
  orderNo: string;
  userId: number;
  userPhone: string;
  amount: string;
  channelName: string;
  status: string;
  createdAt: string;
  timeAgo: string;
}

/** 最近提现记录 */
interface RecentWithdraw {
  id: number;
  orderNo: string;
  userId: number;
  userPhone: string;
  amount: string;
  status: string;
  createdAt: string;
  timeAgo: string;
}

/** 最近购买记录 */
interface RecentPurchase {
  id: number;
  orderNo: string;
  userId: number;
  userPhone: string;
  productName: string;
  amount: string;
  createdAt: string;
  timeAgo: string;
}

/** 实时交易监控响应 */
export interface TransactionsMonitorResponse {
  summary: TransactionSummary;
  recentRecharges: RecentRecharge[];
  recentWithdraws: RecentWithdraw[];
  recentPurchases: RecentPurchase[];
}

// ================================
// 辅助函数
// ================================

/**
 * 获取今日开始时间（系统时区）
 * @description 依据：开发文档.md 第2节 - 时区从数据库配置获取，禁止硬编码
 */
async function getTodayStart(): Promise<Date> {
  // 从数据库配置获取系统时区
  const systemTimezone = await getSystemTimezone();
  const now = new Date();
  
  // 使用 Intl.DateTimeFormat 获取指定时区的日期部分
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: systemTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateStr = formatter.format(now); // 格式: YYYY-MM-DD
  const [year, month, day] = dateStr.split('-').map(Number);
  
  return new Date(year, month - 1, day);
}

/**
 * 获取昨日开始时间
 */
async function getYesterdayStart(): Promise<Date> {
  const today = await getTodayStart();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

/**
 * 格式化日期为 YYYY-MM-DD 格式（本地时区）
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 脱敏手机号
 * @description 显示为 ****1234 格式
 */
function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return '****';
  return '****' + phone.slice(-4);
}

/**
 * 计算相对时间
 * @description 返回如 "3分钟前" 格式
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  // 处理未来时间（数据异常情况）
  if (diff < 0) return '刚刚';

  if (diff < 60) return `${diff}秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
}

/**
 * Decimal 转字符串
 */
function decimalToString(value: Prisma.Decimal | number | null): string {
  if (value === null || value === undefined) return '0.00';
  return Number(value).toFixed(2);
}

/**
 * 获取心跳超时时间（从配置读取）
 */
async function getHeartbeatTimeout(): Promise<number> {
  try {
    const config = await prisma.globalConfig.findFirst({
      where: { key: 'heartbeat_timeout' },
      select: { value: true },
    });
    if (config?.value !== null && config?.value !== undefined) {
      // GlobalConfig.value 是 JSON 类型，需要提取值
      const value = typeof config.value === 'number'
        ? config.value
        : typeof config.value === 'string'
          ? parseInt(config.value, 10)
          : DEFAULT_HEARTBEAT_TIMEOUT;
      if (!isNaN(value)) {
        return value;
      }
    }
  } catch (error) {
    console.error('[Realtime] 获取心跳超时配置失败:', error);
  }
  return DEFAULT_HEARTBEAT_TIMEOUT;
}

// ================================
// 在线用户统计
// ================================

/**
 * 获取实时在线用户统计
 * @description 依据：02.4-后台API接口清单.md 第22.1节
 */
export async function getOnlineUsersStats(): Promise<OnlineUsersStats> {
  const todayStr = formatLocalDate(await getTodayStart());
  const yesterdayStr = formatLocalDate(await getYesterdayStart());
  const timeout = await getHeartbeatTimeout();
  const now = new Date();
  const currentHour = String(now.getHours()).padStart(2, '0');

  // 并行查询所有数据
  const [
    currentOnline,
    todayPeakData,
    yesterdaySameHourOnline,
    todayHourlyData,
  ] = await Promise.all([
    // 1. 当前在线人数（从 Redis）
    getOnlineUserCount(timeout),

    // 2. 今日在线峰值（从 Redis）
    (async () => {
      const peakKey = CACHE_KEYS.ONLINE.PEAK(todayStr);
      const peak = await redis.hget(peakKey, 'peak');
      const peakTime = await redis.hget(peakKey, 'peakTime');
      return {
        peak: peak ? parseInt(peak, 10) : 0,
        peakTime: peakTime || now.toISOString(),
      };
    })(),

    // 3. 昨日同一时间在线人数（从 Redis）
    (async () => {
      const hourlyKey = REALTIME_CACHE_KEYS.HOURLY_ONLINE(yesterdayStr);
      const count = await redis.hget(hourlyKey, currentHour);
      return count ? parseInt(count, 10) : 0;
    })(),

    // 4. 今日每小时在线人数分布（从 Redis）
    (async () => {
      const hourlyKey = REALTIME_CACHE_KEYS.HOURLY_ONLINE(todayStr);
      const hourlyData = await redis.hgetall(hourlyKey);
      return hourlyData;
    })(),
  ]);

  // 构建24小时统计数据
  const hourlyStats: HourlyStatItem[] = [];
  for (let h = 0; h < 24; h++) {
    const hourStr = String(h).padStart(2, '0');
    const count = todayHourlyData[hourStr] ? parseInt(todayHourlyData[hourStr], 10) : 0;
    hourlyStats.push({
      hour: hourStr,
      count,
    });
  }

  // 更新当前小时的在线人数
  const hourlyKey = REALTIME_CACHE_KEYS.HOURLY_ONLINE(todayStr);
  await redis.multi()
    .hset(hourlyKey, currentHour, currentOnline.toString())
    .expire(hourlyKey, 48 * 60 * 60) // 保留48小时
    .exec();

  // 更新返回数据中的当前小时
  const currentHourIndex = now.getHours();
  hourlyStats[currentHourIndex].count = currentOnline;

  // 更新今日峰值（如果当前人数超过峰值）
  const finalPeak = Math.max(currentOnline, todayPeakData.peak);
  let finalPeakTime = todayPeakData.peakTime;

  if (currentOnline > todayPeakData.peak) {
    const peakKey = CACHE_KEYS.ONLINE.PEAK(todayStr);
    const nowIso = now.toISOString();
    await redis.multi()
      .hset(peakKey, 'peak', currentOnline.toString())
      .hset(peakKey, 'peakTime', nowIso)
      .expire(peakKey, 24 * 60 * 60)
      .exec();
    finalPeakTime = nowIso;
  }

  // 计算趋势
  let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
  const diff = currentOnline - yesterdaySameHourOnline;
  const threshold = Math.max(1, Math.floor(yesterdaySameHourOnline * 0.1)); // 10% 波动阈值
  if (diff > threshold) {
    trend = 'UP';
  } else if (diff < -threshold) {
    trend = 'DOWN';
  }

  return {
    currentOnline,
    todayPeak: finalPeak,
    todayPeakTime: finalPeakTime,
    yesterdaySameTime: yesterdaySameHourOnline,
    trend,
    hourlyStats,
  };
}

// ================================
// 在线用户列表
// ================================

/**
 * 获取在线用户列表
 * @description 依据：02.4-后台API接口清单.md 第22.2节
 * @param page 页码
 * @param pageSize 每页数量
 */
export async function getOnlineUsersList(
  page: number = 1,
  pageSize: number = 50
): Promise<OnlineUserListResponse> {
  const timeout = await getHeartbeatTimeout();
  const now = new Date();
  const timeoutMs = timeout * 1000;
  const minHeartbeat = new Date(now.getTime() - timeoutMs);

  // 查询在线用户（从数据库 UserOnlineStatus 表）
  const [users, total] = await Promise.all([
    prisma.userOnlineStatus.findMany({
      where: {
        lastHeartbeat: { gte: minHeartbeat },
      },
      orderBy: { lastHeartbeat: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            nickname: true,
            vipLevel: true,
            lastLoginIp: true,
          },
        },
      },
    }),
    prisma.userOnlineStatus.count({
      where: {
        lastHeartbeat: { gte: minHeartbeat },
      },
    }),
  ]);

  // 转换数据格式
  const list: OnlineUserItem[] = users.map(status => {
    // 计算本次在线时长（从会话开始时间到现在）
    // 使用 createdAt 作为会话开始时间的近似值
    // 注意：如果用户离线后重新上线，createdAt 不会更新，所以这是近似值
    // 更精确的方案需要在 UserOnlineStatus 表中添加 sessionStartAt 字段
    const onlineDuration = Math.max(0, Math.floor(
      (now.getTime() - status.createdAt.getTime()) / 1000
    ));

    return {
      userId: status.user.id,
      phone: status.user.phone,
      nickname: status.user.nickname,
      vipLevel: status.user.vipLevel,
      lastHeartbeatAt: status.lastHeartbeat.toISOString(),
      lastActiveIp: status.user.lastLoginIp,
      deviceType: 'mobile', // 默认为移动端，后续可从心跳数据中获取
      onlineDuration,
    };
  });

  return {
    list,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// ================================
// 实时交易监控
// ================================

/**
 * 获取实时交易监控数据
 * @description 依据：02.4-后台API接口清单.md 第22.3节
 * @param limit 返回最近N条交易记录（默认50）
 */
export async function getTransactionsMonitor(
  limit: number = 50
): Promise<TransactionsMonitorResponse> {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  // 并行查询所有数据
  const [
    recharge5MinSum,
    withdraw5MinSum,
    purchase5MinSum,
    recentRecharges,
    recentWithdraws,
    recentPurchases,
  ] = await Promise.all([
    // 1. 最近5分钟充值金额汇总（使用 createdAt，回调时间可能延迟）
    prisma.rechargeOrder.aggregate({
      where: {
        status: 'PAID',
        createdAt: { gte: fiveMinutesAgo },
      },
      _sum: { actualAmount: true },
    }),

    // 2. 最近5分钟提现金额汇总（已完成的）
    prisma.withdrawOrder.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: fiveMinutesAgo },
      },
      _sum: { actualAmount: true },
    }),

    // 3. 最近5分钟购买金额汇总
    prisma.positionOrder.aggregate({
      where: {
        createdAt: { gte: fiveMinutesAgo },
      },
      _sum: { purchaseAmount: true },
    }),

    // 4. 最近充值订单（按 limit 数量）
    prisma.rechargeOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { phone: true },
        },
        channel: {
          select: { name: true },
        },
      },
    }),

    // 5. 最近提现订单（按 limit 数量）
    prisma.withdrawOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { phone: true },
        },
      },
    }),

    // 6. 最近购买订单（按 limit 数量）
    prisma.positionOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { phone: true },
        },
        product: {
          select: { name: true },
        },
      },
    }),
  ]);

  // 构建汇总数据
  const summary: TransactionSummary = {
    last5MinRecharge: decimalToString(recharge5MinSum._sum.actualAmount),
    last5MinWithdraw: decimalToString(withdraw5MinSum._sum.actualAmount),
    last5MinPurchase: decimalToString(purchase5MinSum._sum.purchaseAmount),
  };

  // 转换充值订单格式
  const formattedRecharges: RecentRecharge[] = recentRecharges.map(order => ({
    id: order.id,
    orderNo: order.orderNo,
    userId: order.userId,
    userPhone: maskPhone(order.user.phone),
    amount: decimalToString(order.actualAmount || order.amount),
    channelName: order.channel.name,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    timeAgo: getRelativeTime(order.createdAt),
  }));

  // 转换提现订单格式
  const formattedWithdraws: RecentWithdraw[] = recentWithdraws.map(order => ({
    id: order.id,
    orderNo: order.orderNo,
    userId: order.userId,
    userPhone: maskPhone(order.user.phone),
    amount: decimalToString(order.amount),
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    timeAgo: getRelativeTime(order.createdAt),
  }));

  // 转换购买订单格式
  const formattedPurchases: RecentPurchase[] = recentPurchases.map(order => ({
    id: order.id,
    orderNo: order.orderNo,
    userId: order.userId,
    userPhone: maskPhone(order.user.phone),
    productName: order.product.name,
    amount: decimalToString(order.purchaseAmount),
    createdAt: order.createdAt.toISOString(),
    timeAgo: getRelativeTime(order.createdAt),
  }));

  return {
    summary,
    recentRecharges: formattedRecharges,
    recentWithdraws: formattedWithdraws,
    recentPurchases: formattedPurchases,
  };
}
