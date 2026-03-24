/**
 * @file 仪表盘数据服务
 * @description 提供后台管理仪表盘所需的统计数据、趋势数据、实时数据、异常告警
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第2节 - 仪表盘接口
 * @depends 开发文档/04-后台管理端/04.1-仪表盘/04.1.1-仪表盘页.md
 *
 * 核心功能：
 * 1. 核心统计数据（今日/昨日/累计/待处理）
 * 2. 趋势图表数据（7天/30天）
 * 3. 实时数据（在线人数、通道余额、最近订单）
 * 4. 异常告警（收益异常、通道异常、提现积压）
 *
 * 缓存策略：
 * - 统计数据：缓存1分钟
 * - 趋势数据：缓存5分钟
 * - 实时数据：不缓存（支持30秒轮询）
 * - 异常告警：缓存1分钟
 */

import { prisma } from '@/lib/prisma';
import { getOrSet, getCache, setCache, CACHE_TTL, getOnlineUserCount, redis, CACHE_KEYS } from '@/lib/redis';
import { Prisma } from '@honeywell/database';
import { getSystemTimezone } from '@/lib/config';

// ================================
// 缓存键定义
// ================================

const DASHBOARD_CACHE_KEYS = {
  /** 核心统计数据缓存 - 过期时间1分钟 */
  STATS: 'dashboard:stats',
  /** 趋势数据缓存前缀 - 过期时间5分钟 */
  TRENDS: (range: string) => `dashboard:trends:${range}`,
  /** 异常告警缓存 - 过期时间1分钟 */
  ALERTS: 'dashboard:alerts',
  /** 今日在线峰值 */
  ONLINE_PEAK_TODAY: (date: string) => `dashboard:online_peak:${date}`,
};

// 缓存过期时间（秒）
const DASHBOARD_CACHE_TTL = {
  STATS: 60,       // 统计数据1分钟
  TRENDS: 5 * 60,  // 趋势数据5分钟
  ALERTS: 60,      // 告警数据1分钟
  ONLINE_PEAK: 24 * 60 * 60, // 在线峰值24小时
};

// ================================
// 类型定义（依据：02.4-后台API接口清单.md 第2节）
// ================================

interface TodayStats {
  newUsers: number;
  activeUsers: number;
  rechargeAmount: string;
  rechargeCount: number;
  withdrawAmount: string;
  withdrawCount: number;
  netInflow: string;
  purchaseAmount: string;
  incomeAmount: string;
  commissionAmount: string;
  signInRewardAmount: string;
  activityRewardAmount: string;
}

interface YesterdayStats {
  newUsers: number;
  activeUsers: number;
  rechargeAmount: string;
  withdrawAmount: string;
  netInflow: string;
  purchaseAmount: string;
  incomeAmount: string;
  commissionAmount: string;
  signInRewardAmount: string;
  activityRewardAmount: string;
}

interface TotalStats {
  userCount: number;
  rechargeAmount: string;
  withdrawAmount: string;
}

interface PendingStats {
  withdrawReviewCount: number;
  withdrawReviewAmount: string;
  incomeExceptionCount: number;
}

export interface DashboardStats {
  today: TodayStats;
  yesterday: YesterdayStats;
  total: TotalStats;
  pending: PendingStats;
}

export interface TrendData {
  dates: string[];
  recharge: number[];
  withdraw: number[];
  netInflow: number[];
  newUsers: number[];
  activeUsers: number[];
}

interface RecentOrder {
  userPhone: string;
  amount: string;
  time: string;
  status?: string;
}

interface ChannelBalance {
  [channelCode: string]: string;
}

export interface RealtimeData {
  onlineCount: number;
  todayPeakOnline: number;
  peakTime: string;
  channelBalance: ChannelBalance;
  recentRecharges: RecentOrder[];
  recentWithdraws: RecentOrder[];
}

interface AlertItem {
  type: 'INCOME_EXCEPTION' | 'CHANNEL_ERROR' | 'WITHDRAW_BACKLOG';
  count?: number;
  channelCode?: string;
  message: string;
}

export interface AlertData {
  alerts: AlertItem[];
}

// ================================
// 通道费率辅助函数
// ================================

/**
 * 通道费率映射（channelId → { payFeeRate, transferFeeRate }）
 * @description 用于计算扣除通道手续费后的真实金额
 */
interface ChannelFeeRates {
  [channelId: number]: {
    payFeeRate: number;      // 代收点位（百分比）
    transferFeeRate: number; // 代付点位（百分比）
  };
}

/**
 * 获取所有通道的费率配置
 * @description 从数据库加载通道的代收/代付点位，用于计算通道手续费
 */
async function getChannelFeeRates(): Promise<ChannelFeeRates> {
  const channels = await prisma.paymentChannel.findMany({
    select: {
      id: true,
      payFeeRate: true,
      transferFeeRate: true,
    },
  });
  const rates: ChannelFeeRates = {};
  for (const ch of channels) {
    rates[ch.id] = {
      payFeeRate: Number(ch.payFeeRate || 0),
      transferFeeRate: Number(ch.transferFeeRate || 0),
    };
  }
  return rates;
}

/**
 * 按通道分组计算充值净金额（扣除代收手续费）
 * @description 净充值 = SUM(actualAmount) - SUM(actualAmount × payFeeRate / 100)
 * @returns { netAmount: 扣费后金额, rawAmount: 原始金额, channelFee: 通道手续费, count: 笔数 }
 */
function calcRechargeNetByChannel(
  groups: Array<{ channelId: number; _sum: { actualAmount: Prisma.Decimal | null }; _count: number }>,
  feeRates: ChannelFeeRates
): { netAmount: number; rawAmount: number; channelFee: number; count: number } {
  let netAmount = 0;
  let rawAmount = 0;
  let channelFee = 0;
  let count = 0;
  for (const group of groups) {
    const amount = Number(group._sum.actualAmount || 0);
    const rate = feeRates[group.channelId]?.payFeeRate || 0;
    const fee = amount * rate / 100;
    rawAmount += amount;
    channelFee += fee;
    netAmount += amount - fee;
    count += group._count;
  }
  return { netAmount, rawAmount, channelFee, count };
}

/**
 * 按通道分组计算提现总费用（含代付手续费）
 * @description 总提现费用 = SUM(actualAmount) + SUM(actualAmount × transferFeeRate / 100)
 * @returns { netAmount: 含通道费金额, rawAmount: 原始金额, channelFee: 通道手续费, count: 笔数 }
 */
function calcWithdrawNetByChannel(
  groups: Array<{ channelId: number | null; _sum: { actualAmount: Prisma.Decimal | null }; _count: number }>,
  feeRates: ChannelFeeRates
): { netAmount: number; rawAmount: number; channelFee: number; count: number } {
  let netAmount = 0;
  let rawAmount = 0;
  let channelFee = 0;
  let count = 0;
  for (const group of groups) {
    const amount = Number(group._sum.actualAmount || 0);
    const rate = group.channelId ? (feeRates[group.channelId]?.transferFeeRate || 0) : 0;
    const fee = amount * rate / 100;
    rawAmount += amount;
    channelFee += fee;
    netAmount += amount + fee;
    count += group._count;
  }
  return { netAmount, rawAmount, channelFee, count };
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
  
  // 返回本地时间的日期起始点
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
 * @description 避免 toISOString 的时区转换问题
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取N天前的日期数组
 * @param days 天数
 */
async function getDateRange(days: number): Promise<string[]> {
  const dates: string[] = [];
  const today = await getTodayStart();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(formatLocalDate(date));
  }

  return dates;
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

// ================================
// 核心统计数据查询
// ================================

/**
 * 获取核心统计数据
 * @description 依据：02.4-后台API接口清单.md 第2.1节
 * 包含今日/昨日/累计/待处理四部分数据
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  return getOrSet(DASHBOARD_CACHE_KEYS.STATS, async () => {
    const todayStart = await getTodayStart();
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const yesterdayStart = await getYesterdayStart();
    const yesterdayEnd = todayStart;

    // 预加载通道费率配置
    const feeRates = await getChannelFeeRates();

    // 并行查询所有统计数据
    const [
      // === 今日数据 ===
      todayNewUsers,
      todayActiveUsers,
      todayRechargeByChannel,
      todayWithdrawByChannel,
      todayPurchase,
      todayIncome,
      todayCommission,
      todaySignIn,
      todayActivity,
      // === 昨日数据 ===
      yesterdayNewUsers,
      yesterdayActiveUsers,
      yesterdayRechargeByChannel,
      yesterdayWithdrawByChannel,
      yesterdayPurchase,
      yesterdayIncome,
      yesterdayCommission,
      yesterdaySignIn,
      yesterdayActivity,
      // === 累计数据 ===
      totalUsers,
      totalRechargeByChannel,
      totalWithdrawByChannel,
      // === 待处理数据 ===
      pendingWithdraw,
      incomeException,
    ] = await Promise.all([
      // === 今日数据查询 ===
      // 今日新增用户
      prisma.user.count({
        where: {
          createdAt: { gte: todayStart, lt: todayEnd },
        },
      }),
      // 今日活跃用户（最后登录时间在今日）
      prisma.user.count({
        where: {
          lastLoginAt: { gte: todayStart, lt: todayEnd },
        },
      }),
      // 今日充值汇总 - 按通道分组（用于扣除代收手续费）
      // 使用 createdAt 而非 callbackAt，因为回调可能延迟导致跨天统计不一致
      prisma.rechargeOrder.groupBy({
        by: ['channelId'],
        where: {
          status: 'PAID',
          createdAt: { gte: todayStart, lt: todayEnd },
        },
        _sum: { actualAmount: true },
        _count: { _all: true },
      }),
      // 今日提现汇总 - 按通道分组（使用 createdAt，与提现管理页保持一致）
      prisma.withdrawOrder.groupBy({
        by: ['channelId'],
        where: {
          status: 'COMPLETED',
          createdAt: { gte: todayStart, lt: todayEnd },
        },
        _sum: { actualAmount: true },
        _count: { _all: true },
      }),
      // 今日购买汇总
      prisma.positionOrder.aggregate({
        where: {
          createdAt: { gte: todayStart, lt: todayEnd },
        },
        _sum: { purchaseAmount: true },
      }),
      // 今日收益发放
      prisma.incomeRecord.aggregate({
        where: {
          status: 'SETTLED',
          settledAt: { gte: todayStart, lt: todayEnd },
        },
        _sum: { amount: true },
      }),
      // 今日返佣发放
      prisma.commissionRecord.aggregate({
        where: {
          createdAt: { gte: todayStart, lt: todayEnd },
        },
        _sum: { amount: true },
      }),
      // 今日签到奖励（流水类型：SIGN_IN）
      prisma.transaction.aggregate({
        where: {
          type: 'SIGN_IN',
          createdAt: { gte: todayStart, lt: todayEnd },
        },
        _sum: { amount: true },
      }),
      // 今日活动奖励（流水类型：ACTIVITY_REWARD）
      prisma.transaction.aggregate({
        where: {
          type: 'ACTIVITY_REWARD',
          createdAt: { gte: todayStart, lt: todayEnd },
        },
        _sum: { amount: true },
      }),

      // === 昨日数据查询 ===
      prisma.user.count({
        where: {
          createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
        },
      }),
      prisma.user.count({
        where: {
          lastLoginAt: { gte: yesterdayStart, lt: yesterdayEnd },
        },
      }),
      // 昨日充值 - 按通道分组
      // 使用 createdAt 而非 callbackAt，与充值管理页保持一致
      prisma.rechargeOrder.groupBy({
        by: ['channelId'],
        where: {
          status: 'PAID',
          createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
        },
        _sum: { actualAmount: true },
        _count: { _all: true },
      }),
      // 昨日提现 - 按通道分组（使用 createdAt，与提现管理页保持一致）
      prisma.withdrawOrder.groupBy({
        by: ['channelId'],
        where: {
          status: 'COMPLETED',
          createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
        },
        _sum: { actualAmount: true },
        _count: { _all: true },
      }),
      prisma.positionOrder.aggregate({
        where: {
          createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
        },
        _sum: { purchaseAmount: true },
      }),
      prisma.incomeRecord.aggregate({
        where: {
          status: 'SETTLED',
          settledAt: { gte: yesterdayStart, lt: yesterdayEnd },
        },
        _sum: { amount: true },
      }),
      prisma.commissionRecord.aggregate({
        where: {
          createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          type: 'SIGN_IN',
          createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          type: 'ACTIVITY_REWARD',
          createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
        },
        _sum: { amount: true },
      }),

      // === 累计数据查询 ===
      prisma.user.count(),
      // 累计充值 - 按通道分组
      prisma.rechargeOrder.groupBy({
        by: ['channelId'],
        where: { status: 'PAID' },
        _sum: { actualAmount: true },
        _count: { _all: true },
      }),
      // 累计提现 - 按通道分组
      prisma.withdrawOrder.groupBy({
        by: ['channelId'],
        where: { status: 'COMPLETED' },
        _sum: { actualAmount: true },
        _count: { _all: true },
      }),

      // === 待处理数据查询 ===
      prisma.withdrawOrder.aggregate({
        where: { status: 'PENDING_REVIEW' },
        _sum: { actualAmount: true },
        _count: true,
      }),
      prisma.incomeRecord.count({
        where: {
          status: 'FAILED',
          isHandled: false,
        },
      }),
    ]);

    // 使用通道费率计算扣费后的真实金额
    // 充值：扣除代收手续费后的净收入
    // 提现：包含代付手续费的实际支出
    const todayRecharge = calcRechargeNetByChannel(
      todayRechargeByChannel.map(g => ({ channelId: g.channelId, _sum: g._sum, _count: g._count._all })),
      feeRates
    );
    const todayWithdraw = calcWithdrawNetByChannel(
      todayWithdrawByChannel.map(g => ({ channelId: g.channelId, _sum: g._sum, _count: g._count._all })),
      feeRates
    );
    const todayNetInflow = todayRecharge.netAmount - todayWithdraw.netAmount;

    const yesterdayRecharge = calcRechargeNetByChannel(
      yesterdayRechargeByChannel.map(g => ({ channelId: g.channelId, _sum: g._sum, _count: g._count._all })),
      feeRates
    );
    const yesterdayWithdraw = calcWithdrawNetByChannel(
      yesterdayWithdrawByChannel.map(g => ({ channelId: g.channelId, _sum: g._sum, _count: g._count._all })),
      feeRates
    );
    const yesterdayNetInflow = yesterdayRecharge.netAmount - yesterdayWithdraw.netAmount;

    const totalRecharge = calcRechargeNetByChannel(
      totalRechargeByChannel.map(g => ({ channelId: g.channelId, _sum: g._sum, _count: g._count._all })),
      feeRates
    );
    const totalWithdraw = calcWithdrawNetByChannel(
      totalWithdrawByChannel.map(g => ({ channelId: g.channelId, _sum: g._sum, _count: g._count._all })),
      feeRates
    );

    return {
      today: {
        newUsers: todayNewUsers,
        activeUsers: todayActiveUsers,
        rechargeAmount: todayRecharge.rawAmount.toFixed(2),
        rechargeCount: todayRecharge.count,
        withdrawAmount: todayWithdraw.rawAmount.toFixed(2),
        withdrawCount: todayWithdraw.count,
        netInflow: todayNetInflow.toFixed(2),
        purchaseAmount: decimalToString(todayPurchase._sum.purchaseAmount),
        incomeAmount: decimalToString(todayIncome._sum.amount),
        commissionAmount: decimalToString(todayCommission._sum.amount),
        signInRewardAmount: decimalToString(todaySignIn._sum.amount),
        activityRewardAmount: decimalToString(todayActivity._sum.amount),
      },
      yesterday: {
        newUsers: yesterdayNewUsers,
        activeUsers: yesterdayActiveUsers,
        rechargeAmount: yesterdayRecharge.rawAmount.toFixed(2),
        withdrawAmount: yesterdayWithdraw.rawAmount.toFixed(2),
        netInflow: yesterdayNetInflow.toFixed(2),
        purchaseAmount: decimalToString(yesterdayPurchase._sum.purchaseAmount),
        incomeAmount: decimalToString(yesterdayIncome._sum.amount),
        commissionAmount: decimalToString(yesterdayCommission._sum.amount),
        signInRewardAmount: decimalToString(yesterdaySignIn._sum.amount),
        activityRewardAmount: decimalToString(yesterdayActivity._sum.amount),
      },
      total: {
        userCount: totalUsers,
        rechargeAmount: totalRecharge.rawAmount.toFixed(2),
        withdrawAmount: totalWithdraw.rawAmount.toFixed(2),
      },
      pending: {
        withdrawReviewCount: pendingWithdraw._count,
        withdrawReviewAmount: decimalToString(pendingWithdraw._sum.actualAmount),
        incomeExceptionCount: incomeException,
      },
    };
  }, DASHBOARD_CACHE_TTL.STATS);
}

// ================================
// 趋势图表数据查询
// ================================

/**
 * 获取趋势图表数据
 * @description 依据：02.4-后台API接口清单.md 第2.2节
 * @param range 时间范围：7d=近7天 | 30d=近30天
 */
export async function getDashboardTrends(range: '7d' | '30d'): Promise<TrendData> {
  return getOrSet(DASHBOARD_CACHE_KEYS.TRENDS(range), async () => {
    const days = range === '7d' ? 7 : 30;
    const dates = await getDateRange(days);

    // 预加载通道费率配置
    const feeRates = await getChannelFeeRates();

    // 查询 DailyStats 表获取历史数据
    const dailyStats = await prisma.dailyStats.findMany({
      where: {
        date: {
          gte: new Date(dates[0]),
          lte: new Date(dates[dates.length - 1]),
        },
      },
      orderBy: { date: 'asc' },
    });

    // 创建日期映射
    const statsMap = new Map<string, typeof dailyStats[0]>();
    dailyStats.forEach(stat => {
      const dateStr = formatLocalDate(stat.date);
      statsMap.set(dateStr, stat);
    });

    // 为了在趋势图中也体现通道手续费扣除，按日期+通道分组查询充值提现
    // 这样可以按各通道费率精确计算每天的净金额
    const rangeStart = new Date(dates[0]);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(dates[dates.length - 1]);
    rangeEnd.setHours(23, 59, 59, 999);

    const [dailyRechargeByChannel, dailyWithdrawByChannel] = await Promise.all([
      // 按日期和通道分组的充值数据（使用 createdAt，与充值管理页保持一致）
      prisma.$queryRaw<Array<{ date: Date; channelId: number; totalAmount: Prisma.Decimal }>>`
        SELECT DATE(createdAt) as date, channelId, SUM(actualAmount) as totalAmount
        FROM recharge_orders
        WHERE status = 'PAID' AND createdAt >= ${rangeStart} AND createdAt <= ${rangeEnd}
        GROUP BY DATE(createdAt), channelId
        ORDER BY date ASC
      `,
      // 按日期和通道分组的提现数据（使用 createdAt，与提现管理页保持一致）
      prisma.$queryRaw<Array<{ date: Date; channelId: number | null; totalAmount: Prisma.Decimal }>>`
        SELECT DATE(createdAt) as date, channelId, SUM(actualAmount) as totalAmount
        FROM withdraw_orders
        WHERE status = 'COMPLETED' AND createdAt >= ${rangeStart} AND createdAt <= ${rangeEnd}
        GROUP BY DATE(createdAt), channelId
        ORDER BY date ASC
      `,
    ]);

    // 按日期构建充值和提现的原始金额（与充值/提现管理页保持一致）
    const dailyRechargeMap = new Map<string, number>();
    const dailyWithdrawMap = new Map<string, number>();

    for (const row of dailyRechargeByChannel) {
      const dateStr = formatLocalDate(new Date(row.date));
      const amount = Number(row.totalAmount || 0);
      dailyRechargeMap.set(dateStr, (dailyRechargeMap.get(dateStr) || 0) + amount);
    }

    for (const row of dailyWithdrawByChannel) {
      const dateStr = formatLocalDate(new Date(row.date));
      const amount = Number(row.totalAmount || 0);
      dailyWithdrawMap.set(dateStr, (dailyWithdrawMap.get(dateStr) || 0) + amount);
    }

    // 构建结果数组
    const recharge: number[] = [];
    const withdraw: number[] = [];
    const netInflow: number[] = [];
    const newUsers: number[] = [];
    const activeUsers: number[] = [];

    for (const date of dates) {
      const stat = statsMap.get(date);
      // 优先使用按通道费率计算后的金额
      const rechargeAmt = dailyRechargeMap.get(date) || 0;
      const withdrawAmt = dailyWithdrawMap.get(date) || 0;

      recharge.push(Number(rechargeAmt.toFixed(2)));
      withdraw.push(Number(withdrawAmt.toFixed(2)));
      netInflow.push(Number((rechargeAmt - withdrawAmt).toFixed(2)));

      if (stat) {
        newUsers.push(stat.newUsers);
        activeUsers.push(stat.activeUsers);
      } else {
        newUsers.push(0);
        activeUsers.push(0);
      }
    }

    // 如果今日没有 DailyStats 数据，补充今日的用户数据
    const todayStart = await getTodayStart();
    const today = formatLocalDate(todayStart);
    if (dates[dates.length - 1] === today && !statsMap.has(today)) {
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const [todayNewUsers, todayActiveUsers] = await Promise.all([
        prisma.user.count({
          where: { createdAt: { gte: todayStart, lt: todayEnd } },
        }),
        prisma.user.count({
          where: { lastLoginAt: { gte: todayStart, lt: todayEnd } },
        }),
      ]);

      newUsers[newUsers.length - 1] = todayNewUsers;
      activeUsers[activeUsers.length - 1] = todayActiveUsers;
    }

    return {
      dates,
      recharge,
      withdraw,
      netInflow,
      newUsers,
      activeUsers,
    };
  }, DASHBOARD_CACHE_TTL.TRENDS);
}

// ================================
// 实时数据查询
// ================================

/**
 * 获取实时数据
 * @description 依据：02.4-后台API接口清单.md 第2.3节
 * 不使用缓存，支持30秒轮询
 */
export async function getDashboardRealtime(): Promise<RealtimeData> {
  const todayStr = formatLocalDate(await getTodayStart());

  // 并行查询所有实时数据
  const [
    onlineCount,
    todayPeakData,
    channels,
    recentRecharges,
    recentWithdraws,
  ] = await Promise.all([
    // 获取当前在线人数（从 Redis）
    getOnlineUserCount(120), // 120秒超时

    // 获取今日在线峰值（从 Redis）
    (async () => {
      const peakKey = DASHBOARD_CACHE_KEYS.ONLINE_PEAK_TODAY(todayStr);
      const peak = await redis.hget(peakKey, 'peak');
      const peakTime = await redis.hget(peakKey, 'peakTime');
      return {
        peak: peak ? parseInt(peak, 10) : 0,
        peakTime: peakTime || new Date().toISOString(),
      };
    })(),

    // 获取支付通道信息（包含余额）
    prisma.paymentChannel.findMany({
      where: {
        OR: [
          { payEnabled: true },
          { transferEnabled: true },
        ],
      },
      select: {
        code: true,
        todayRecharge: true,
        todayWithdraw: true,
      },
    }),

    // 最近10笔充值订单
    prisma.rechargeOrder.findMany({
      where: { status: 'PAID' },
      orderBy: { callbackAt: 'desc' },
      take: 10,
      select: {
        user: {
          select: { phone: true },
        },
        actualAmount: true,
        callbackAt: true,
      },
    }),

    // 最近10笔提现订单
    prisma.withdrawOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        user: {
          select: { phone: true },
        },
        actualAmount: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  // 更新今日峰值（如果当前人数超过峰值）
  if (onlineCount > todayPeakData.peak) {
    const peakKey = DASHBOARD_CACHE_KEYS.ONLINE_PEAK_TODAY(todayStr);
    await redis.multi()
      .hset(peakKey, 'peak', onlineCount.toString())
      .hset(peakKey, 'peakTime', new Date().toISOString())
      .expire(peakKey, DASHBOARD_CACHE_TTL.ONLINE_PEAK)
      .exec();
  }

  // 构建通道余额对象
  // 注意：通道余额需要通过单独的 API 调用第三方支付接口查询
  // 参见：GET /api/admin/channels/:id/balance
  // 仪表盘这里只返回已启用通道的占位数据，具体余额需单独查询
  const channelBalance: ChannelBalance = {};
  channels.forEach(channel => {
    // 通道余额需通过 /api/admin/channels/:id/balance 接口查询外部支付 API
    // 此处仅标记通道存在，实际余额显示 "需查询"
    channelBalance[channel.code] = '0.00';
  });

  return {
    onlineCount,
    todayPeakOnline: Math.max(onlineCount, todayPeakData.peak),
    peakTime: onlineCount > todayPeakData.peak ? new Date().toISOString() : todayPeakData.peakTime,
    channelBalance,
    recentRecharges: recentRecharges.map(order => ({
      userPhone: maskPhone(order.user.phone),
      amount: decimalToString(order.actualAmount),
      time: order.callbackAt ? getRelativeTime(order.callbackAt) : '',
    })),
    recentWithdraws: recentWithdraws.map(order => ({
      userPhone: maskPhone(order.user.phone),
      amount: decimalToString(order.actualAmount),
      status: order.status,
      time: getRelativeTime(order.createdAt),
    })),
  };
}

// ================================
// 异常告警查询
// ================================

/**
 * 获取异常告警
 * @description 依据：02.4-后台API接口清单.md 第2.4节
 * 检查收益异常、通道异常、提现积压等情况
 */
export async function getDashboardAlerts(): Promise<AlertData> {
  return getOrSet(DASHBOARD_CACHE_KEYS.ALERTS, async () => {
    const alerts: AlertItem[] = [];

    // 并行查询所有告警条件
    const [
      incomeExceptionCount,
      channels,
      pendingWithdrawCount,
    ] = await Promise.all([
      // 1. 收益发放异常数量
      prisma.incomeRecord.count({
        where: {
          status: 'FAILED',
          isHandled: false,
        },
      }),

      // 2. 支付通道状态
      prisma.paymentChannel.findMany({
        where: {
          OR: [
            { payEnabled: true },
            { transferEnabled: true },
          ],
        },
        select: {
          code: true,
          channelStatus: true,
          hourlySuccessRate: true,
        },
      }),

      // 3. 待审核提现数量
      prisma.withdrawOrder.count({
        where: { status: 'PENDING_REVIEW' },
      }),
    ]);

    // 1. 检查收益发放异常
    if (incomeExceptionCount > 0) {
      alerts.push({
        type: 'INCOME_EXCEPTION',
        count: incomeExceptionCount,
        message: `${incomeExceptionCount}笔收益发放异常待处理`,
      });
    }

    // 2. 检查通道状态异常
    for (const channel of channels) {
      if (channel.channelStatus === 'ERROR') {
        alerts.push({
          type: 'CHANNEL_ERROR',
          channelCode: channel.code,
          message: `${channel.code}通道状态异常`,
        });
      } else if (channel.channelStatus === 'WARNING') {
        // 只在成功率低于85%时才告警
        const successRate = Number(channel.hourlySuccessRate || 100);
        if (successRate < 85) {
          alerts.push({
            type: 'CHANNEL_ERROR',
            channelCode: channel.code,
            message: `${channel.code}通道成功率下降至${successRate.toFixed(1)}%`,
          });
        }
      }
    }

    // 3. 检查提现积压（阈值设为20单）
    const withdrawBacklogThreshold = 20;
    if (pendingWithdrawCount > withdrawBacklogThreshold) {
      alerts.push({
        type: 'WITHDRAW_BACKLOG',
        count: pendingWithdrawCount,
        message: `待审核提现积压超过阈值（${pendingWithdrawCount}笔）`,
      });
    }

    return { alerts };
  }, DASHBOARD_CACHE_TTL.ALERTS);
}

// ================================
// 缓存清除
// ================================

/**
 * 清除仪表盘缓存
 * @description 当数据发生变化时调用（如充值、提现、购买等操作后）
 */
export async function clearDashboardCache(): Promise<void> {
  await Promise.all([
    redis.del(DASHBOARD_CACHE_KEYS.STATS),
    redis.del(DASHBOARD_CACHE_KEYS.TRENDS('7d')),
    redis.del(DASHBOARD_CACHE_KEYS.TRENDS('30d')),
    redis.del(DASHBOARD_CACHE_KEYS.ALERTS),
  ]);
}
