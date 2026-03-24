/**
 * @file 数据报表服务
 * @description 提供财务报表、用户报表、产品报表、返佣报表的数据查询
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第16节 - 报表接口
 * @depends 开发文档/04-后台管理端/04.2-数据报表/
 *
 * 核心功能：
 * 1. 财务报表：收支平衡计算、净入金、理论利润
 * 2. 用户报表：用户增长、活跃度、付费转化、VIP分布
 * 3. 产品报表：产品销售统计、系列对比
 * 4. 返佣报表：三级返佣统计、触发订单数、获佣用户数
 *
 * 所有报表支持：
 * - 日期范围筛选（startDate、endDate）
 * - 汇总数据（summary）
 * - 每日明细（daily）
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@honeywell/database';

// ================================
// 通道费率辅助函数
// ================================

/**
 * 通道费率映射
 */
interface ChannelFeeRates {
  [channelId: number]: {
    payFeeRate: number;
    transferFeeRate: number;
  };
}

/**
 * 获取所有通道的费率配置
 */
async function getChannelFeeRates(): Promise<ChannelFeeRates> {
  const channels = await prisma.paymentChannel.findMany({
    select: { id: true, payFeeRate: true, transferFeeRate: true },
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

// ================================
// 类型定义
// ================================

/**
 * 财务报表汇总数据
 * @description 依据：02.4-后台API接口清单.md 第16.1节
 */
export interface FinancialSummary {
  rechargeAmount: string;           // 充值总额（原始金额）
  rechargeCount: number;            // 充值笔数
  rechargeSuccessRate: string;      // 充值成功率
  channelPayFee: string;            // 通道代收手续费（充值金额 × 代收点位）
  withdrawAmount: string;           // 提现总额（原始金额）
  withdrawCount: number;            // 提现笔数
  withdrawFee: string;              // 提现手续费收入（向用户收取的）
  channelTransferFee: string;       // 通道代付手续费（提现金额 × 代付点位）
  netInflow: string;                // 净入金 = (充值 - 代收手续费) - (提现 + 代付手续费)
  incomeAmount: string;             // 收益发放
  commissionAmount: string;         // 返佣发放
  signInRewardAmount: string;       // 签到奖励
  activityRewardAmount: string;     // 活动奖励
  registerBonusAmount: string;      // 注册奖励
  totalExpense: string;             // 总支出（不含通道代付手续费，因已在净入金中扣除）
  theoreticalProfit: string;        // 理论利润 = 净入金 - 总支出
}

/**
 * 财务报表每日明细
 */
export interface FinancialDaily {
  date: string;
  rechargeAmount: string;
  rechargeCount: number;
  withdrawAmount: string;
  withdrawCount: number;
  netInflow: string;
}

/**
 * 财务报表响应
 */
export interface FinancialReportData {
  summary: FinancialSummary;
  daily: FinancialDaily[];
}

/**
 * 用户报表汇总数据
 * @description 依据：02.4-后台API接口清单.md 第16.2节
 */
export interface UserSummary {
  newUsers: number;                 // 新增用户
  activeUsers: number;              // 活跃用户
  paidUsers: number;                // 付费用户（有购买行为）
  newPaidUsers: number;             // 新增付费用户（首次购买）
  conversionRate: string;           // 付费转化率
  rechargeUsers: number;            // 充值用户
  withdrawUsers: number;            // 提现用户
  avgRechargePerUser: string;       // 人均充值
}

/**
 * VIP分布数据
 */
export interface VipDistribution {
  level: number;
  count: number;
}

/**
 * 用户报表每日明细
 */
export interface UserDaily {
  date: string;
  newUsers: number;
  activeUsers: number;
  paidUsers: number;
}

/**
 * 用户报表响应
 */
export interface UserReportData {
  summary: UserSummary;
  vipDistribution: VipDistribution[];
  daily: UserDaily[];
}

/**
 * 产品报表列表项
 * @description 依据：02.4-后台API接口清单.md 第16.3节
 */
export interface ProductReportItem {
  productId: number;
  productName: string;
  productSeries: string;
  salesCount: number;               // 销量
  salesAmount: string;              // 销售额
  salesPercent: string;             // 占比
  purchaseUsers: number;            // 购买用户数
  activeOrders: number;             // 进行中订单数
  pendingIncome: string;            // 待发放收益
}

/**
 * 产品报表汇总数据
 */
export interface ProductSummary {
  totalSalesCount: number;
  totalSalesAmount: string;
  poSalesAmount: string;
  vipSalesAmount: string;
}

/**
 * 产品报表响应
 */
export interface ProductReportData {
  list: ProductReportItem[];
  summary: ProductSummary;
}

/**
 * 返佣报表汇总数据
 * @description 依据：02.4-后台API接口清单.md 第16.4节
 */
export interface CommissionSummary {
  totalAmount: string;              // 返佣总额
  level1Amount: string;             // 一级返佣
  level2Amount: string;             // 二级返佣
  level3Amount: string;             // 三级返佣
  triggerOrderCount: number;        // 触发订单数
  receiverCount: number;            // 获佣用户数
}

/**
 * 返佣报表每日明细
 */
export interface CommissionDaily {
  date: string;
  totalAmount: string;
  level1Amount: string;
  level2Amount: string;
  level3Amount: string;
}

/**
 * 返佣报表响应
 */
export interface CommissionReportData {
  summary: CommissionSummary;
  daily: CommissionDaily[];
}

// ================================
// 辅助函数
// ================================

/**
 * 解析日期范围
 * @description 将字符串日期解析为 Date 对象
 */
function parseDateRange(startDate: string, endDate: string): { start: Date; end: Date } {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * 生成日期数组
 * @description 生成 startDate 到 endDate 之间的所有日期字符串数组
 */
function generateDateArray(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(formatLocalDate(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
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
 * Decimal 转字符串
 */
function decimalToString(value: Prisma.Decimal | number | null | undefined): string {
  if (value === null || value === undefined) return '0.00';
  return Number(value).toFixed(2);
}

// ================================
// 财务报表服务
// ================================

/**
 * 获取财务报表数据
 * @description 依据：02.4-后台API接口清单.md 第16.1节
 * @param startDate 开始日期 YYYY-MM-DD
 * @param endDate 结束日期 YYYY-MM-DD
 */
export async function getFinancialReport(
  startDate: string,
  endDate: string
): Promise<FinancialReportData> {
  const { start, end } = parseDateRange(startDate, endDate);

  // 预加载通道费率配置
  const feeRates = await getChannelFeeRates();

  // 并行查询所有汇总数据
  const [
    // 充值数据 - 按通道分组（用于计算代收手续费）
    rechargeByChannel,
    rechargeTotal,
    // 提现数据 - 按通道分组（用于计算代付手续费）
    withdrawByChannel,
    withdrawFeeSum,
    // 收益发放
    incomeSettled,
    // 返佣发放
    commissionSum,
    // 签到奖励
    signInReward,
    // 活动奖励
    activityReward,
    // 注册奖励
    registerBonus,
  ] = await Promise.all([
    // 充值成功订单 - 按通道分组（使用 createdAt，回调时间可能延迟跨天）
    prisma.rechargeOrder.groupBy({
      by: ['channelId'],
      where: {
        status: 'PAID',
        createdAt: { gte: start, lte: end },
      },
      _sum: { actualAmount: true },
      _count: { _all: true },
    }),
    // 充值全部订单数（用于计算成功率）
    prisma.rechargeOrder.count({
      where: {
        createdAt: { gte: start, lte: end },
      },
    }),
    // 提现完成订单 - 按通道分组（使用 createdAt，与提现管理页保持一致）
    prisma.withdrawOrder.groupBy({
      by: ['channelId'],
      where: {
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
      },
      _sum: { actualAmount: true },
      _count: { _all: true },
    }),
    // 提现手续费汇总（向用户收取的提现手续费）
    prisma.withdrawOrder.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
      },
      _sum: { fee: true },
    }),
    // 收益发放汇总
    prisma.incomeRecord.aggregate({
      where: {
        status: 'SETTLED',
        settledAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    // 返佣发放汇总
    prisma.commissionRecord.aggregate({
      where: {
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    // 签到奖励汇总
    prisma.transaction.aggregate({
      where: {
        type: 'SIGN_IN',
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    // 活动奖励汇总（包含拉新裂变、连单奖励等）
    prisma.transaction.aggregate({
      where: {
        type: 'ACTIVITY_REWARD',
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    // 注册奖励汇总
    prisma.transaction.aggregate({
      where: {
        type: 'REGISTER_BONUS',
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
  ]);

  // 计算充值汇总数据（含通道代收手续费）
  let rechargeAmount = 0;
  let rechargeCount = 0;
  let channelPayFee = 0;
  for (const group of rechargeByChannel) {
    const amount = Number(group._sum.actualAmount || 0);
    const rate = feeRates[group.channelId]?.payFeeRate || 0;
    rechargeAmount += amount;
    channelPayFee += amount * rate / 100;
    rechargeCount += group._count._all;
  }

  const rechargeSuccessRate = rechargeTotal > 0
    ? ((rechargeCount / rechargeTotal) * 100).toFixed(2)
    : '0.00';

  // 计算提现汇总数据（含通道代付手续费）
  let withdrawAmount = 0;
  let withdrawCount = 0;
  let channelTransferFee = 0;
  for (const group of withdrawByChannel) {
    const amount = Number(group._sum.actualAmount || 0);
    const rate = group.channelId ? (feeRates[group.channelId]?.transferFeeRate || 0) : 0;
    withdrawAmount += amount;
    channelTransferFee += amount * rate / 100;
    withdrawCount += group._count._all;
  }

  const withdrawFee = Number(withdrawFeeSum._sum.fee || 0);

  // 净入金 = (充值 - 代收手续费) - (提现 + 代付手续费)
  const netInflow = (rechargeAmount - channelPayFee) - (withdrawAmount + channelTransferFee);

  const incomeAmount = Number(incomeSettled._sum.amount || 0);
  const commissionAmount = Number(commissionSum._sum.amount || 0);
  const signInRewardAmount = Number(signInReward._sum.amount || 0);
  const activityRewardAmount = Number(activityReward._sum.amount || 0);
  const registerBonusAmount = Number(registerBonus._sum.amount || 0);

  // 总支出 = 收益发放 + 返佣 + 签到奖励 + 活动奖励 + 注册奖励
  // 注：通道代付手续费不计入支出小计，因为已在净入金中作为提现成本扣除，避免双重计算
  const totalExpense = incomeAmount + commissionAmount + signInRewardAmount + activityRewardAmount + registerBonusAmount;

  // 理论利润 = 净入金 - 总支出
  // 净入金已包含通道手续费扣除: (充值 - 代收手续费) - (提现 + 代付手续费)
  const theoreticalProfit = netInflow - totalExpense;

  const summary: FinancialSummary = {
    rechargeAmount: rechargeAmount.toFixed(2),
    rechargeCount,
    rechargeSuccessRate,
    channelPayFee: channelPayFee.toFixed(2),
    withdrawAmount: withdrawAmount.toFixed(2),
    withdrawCount,
    withdrawFee: withdrawFee.toFixed(2),
    channelTransferFee: channelTransferFee.toFixed(2),
    netInflow: netInflow.toFixed(2),
    incomeAmount: incomeAmount.toFixed(2),
    commissionAmount: commissionAmount.toFixed(2),
    signInRewardAmount: signInRewardAmount.toFixed(2),
    activityRewardAmount: activityRewardAmount.toFixed(2),
    registerBonusAmount: registerBonusAmount.toFixed(2),
    totalExpense: totalExpense.toFixed(2),
    theoreticalProfit: theoreticalProfit.toFixed(2),
  };

  // 查询每日明细 - 按日期和通道分组（用于精确计算每日通道手续费）
  const [dailyRechargeByChannel, dailyWithdrawByChannel, dailyStats] = await Promise.all([
    prisma.$queryRaw<Array<{ date: Date; channelId: number; totalAmount: Prisma.Decimal; cnt: bigint }>>`
      SELECT DATE(createdAt) as date, channelId, SUM(actualAmount) as totalAmount, COUNT(*) as cnt
      FROM recharge_orders
      WHERE status = 'PAID' AND createdAt >= ${start} AND createdAt <= ${end}
      GROUP BY DATE(createdAt), channelId
      ORDER BY date ASC
    `,
    prisma.$queryRaw<Array<{ date: Date; channelId: number | null; totalAmount: Prisma.Decimal; cnt: bigint }>>`
      SELECT DATE(createdAt) as date, channelId, SUM(actualAmount) as totalAmount, COUNT(*) as cnt
      FROM withdraw_orders
      WHERE status = 'COMPLETED' AND createdAt >= ${start} AND createdAt <= ${end}
      GROUP BY DATE(createdAt), channelId
      ORDER BY date ASC
    `,
    // 仍查询 DailyStats 获取用户相关数据（用于未来扩展）
    prisma.dailyStats.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    }),
  ]);

  // 按日期汇总每日充值/提现数据（扣除通道手续费后）
  interface DailyAggregated {
    rechargeAmount: number;
    rechargeCount: number;
    withdrawAmount: number;
    withdrawCount: number;
    channelPayFee: number;
    channelTransferFee: number;
  }
  const dailyAggMap = new Map<string, DailyAggregated>();

  for (const row of dailyRechargeByChannel) {
    const dateStr = formatLocalDate(new Date(row.date));
    const amount = Number(row.totalAmount || 0);
    const rate = feeRates[row.channelId]?.payFeeRate || 0;
    const fee = amount * rate / 100;

    const existing = dailyAggMap.get(dateStr) || {
      rechargeAmount: 0, rechargeCount: 0,
      withdrawAmount: 0, withdrawCount: 0,
      channelPayFee: 0, channelTransferFee: 0,
    };
    existing.rechargeAmount += amount;
    existing.rechargeCount += Number(row.cnt);
    existing.channelPayFee += fee;
    dailyAggMap.set(dateStr, existing);
  }

  for (const row of dailyWithdrawByChannel) {
    const dateStr = formatLocalDate(new Date(row.date));
    const amount = Number(row.totalAmount || 0);
    const rate = row.channelId ? (feeRates[row.channelId]?.transferFeeRate || 0) : 0;
    const fee = amount * rate / 100;

    const existing = dailyAggMap.get(dateStr) || {
      rechargeAmount: 0, rechargeCount: 0,
      withdrawAmount: 0, withdrawCount: 0,
      channelPayFee: 0, channelTransferFee: 0,
    };
    existing.withdrawAmount += amount;
    existing.withdrawCount += Number(row.cnt);
    existing.channelTransferFee += fee;
    dailyAggMap.set(dateStr, existing);
  }

  // 生成完整的每日数据
  const dates = generateDateArray(startDate, endDate);
  const daily: FinancialDaily[] = dates.map(date => {
    const agg = dailyAggMap.get(date);
    if (agg) {
      const netRecharge = agg.rechargeAmount - agg.channelPayFee;
      const netWithdraw = agg.withdrawAmount + agg.channelTransferFee;
      return {
        date,
        rechargeAmount: agg.rechargeAmount.toFixed(2),
        rechargeCount: agg.rechargeCount,
        withdrawAmount: agg.withdrawAmount.toFixed(2),
        withdrawCount: agg.withdrawCount,
        netInflow: (netRecharge - netWithdraw).toFixed(2),
      };
    }
    return {
      date,
      rechargeAmount: '0.00',
      rechargeCount: 0,
      withdrawAmount: '0.00',
      withdrawCount: 0,
      netInflow: '0.00',
    };
  });

  return { summary, daily };
}

// ================================
// 用户报表服务
// ================================

/**
 * 获取用户报表数据
 * @description 依据：02.4-后台API接口清单.md 第16.2节
 * @param startDate 开始日期 YYYY-MM-DD
 * @param endDate 结束日期 YYYY-MM-DD
 */
export async function getUserReport(
  startDate: string,
  endDate: string
): Promise<UserReportData> {
  const { start, end } = parseDateRange(startDate, endDate);

  // 并行查询所有数据
  const [
    newUsers,
    activeUsers,
    paidUsers,
    newPaidUsers,
    rechargeUsers,
    withdrawUsers,
    rechargeTotal,
    vipDistribution,
    dailyStats,
    dailyPaidUsers,
  ] = await Promise.all([
    // 新增用户数
    prisma.user.count({
      where: {
        createdAt: { gte: start, lte: end },
      },
    }),
    // 活跃用户数（有登录行为）
    prisma.user.count({
      where: {
        lastLoginAt: { gte: start, lte: end },
      },
    }),
    // 付费用户数（有购买行为）
    prisma.positionOrder.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: start, lte: end },
      },
    }).then(result => result.length),
    // 新增付费用户数（首次购买，根据 firstPurchaseDone 和创建时间判断）
    // 统计在时间范围内创建的持仓订单，且是用户首次购买（通过子查询判断）
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT po.userId) as count
      FROM position_orders po
      WHERE po.createdAt >= ${start}
        AND po.createdAt <= ${end}
        AND NOT EXISTS (
          SELECT 1 FROM position_orders po2
          WHERE po2.userId = po.userId
            AND po2.createdAt < po.createdAt
        )
    `.then(result => Number(result[0]?.count || 0)),
    // 充值用户数（去重）
    prisma.rechargeOrder.groupBy({
      by: ['userId'],
      where: {
        status: 'PAID',
        createdAt: { gte: start, lte: end },
      },
    }).then(result => result.length),
    // 提现用户数（去重）
    prisma.withdrawOrder.groupBy({
      by: ['userId'],
      where: {
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
      },
    }).then(result => result.length),
    // 充值总额（用于计算人均充值）
    prisma.rechargeOrder.aggregate({
      where: {
        status: 'PAID',
        createdAt: { gte: start, lte: end },
      },
      _sum: { actualAmount: true },
    }),
    // VIP等级分布（全量统计，不受日期限制）
    prisma.user.groupBy({
      by: ['vipLevel'],
      _count: true,
      orderBy: { vipLevel: 'asc' },
    }),
    // 每日明细（从 DailyStats 表）
    prisma.dailyStats.findMany({
      where: {
        date: { gte: start, lte: end },
      },
      orderBy: { date: 'asc' },
    }),
    // 每日付费用户数（DailyStats 表没有此字段，需单独查询）
    prisma.$queryRaw<Array<{ date: Date; paidUsers: bigint }>>`
      SELECT DATE(createdAt) as date, COUNT(DISTINCT userId) as paidUsers
      FROM position_orders
      WHERE createdAt >= ${start} AND createdAt <= ${end}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `,
  ]);

  // 计算付费转化率（付费用户 / 新增用户 * 100%）
  const conversionRate = newUsers > 0
    ? ((paidUsers / newUsers) * 100).toFixed(2)
    : '0.00';

  // 计算人均充值
  const totalRecharge = Number(rechargeTotal._sum.actualAmount || 0);
  const avgRechargePerUser = rechargeUsers > 0
    ? (totalRecharge / rechargeUsers).toFixed(2)
    : '0.00';

  const summary: UserSummary = {
    newUsers,
    activeUsers,
    paidUsers,
    newPaidUsers,
    conversionRate,
    rechargeUsers,
    withdrawUsers,
    avgRechargePerUser,
  };

  // 转换VIP分布数据
  const vipDist: VipDistribution[] = vipDistribution.map(item => ({
    level: item.vipLevel,
    count: item._count,
  }));

  // 创建日期映射（基础数据）
  const dailyMap = new Map<string, typeof dailyStats[0]>();
  dailyStats.forEach(stat => {
    dailyMap.set(formatLocalDate(stat.date), stat);
  });

  // 创建每日付费用户数映射
  const paidUsersMap = new Map<string, number>();
  dailyPaidUsers.forEach(item => {
    paidUsersMap.set(formatLocalDate(new Date(item.date)), Number(item.paidUsers));
  });

  // 生成完整的每日数据
  const dates = generateDateArray(startDate, endDate);
  const daily: UserDaily[] = dates.map(date => {
    const stat = dailyMap.get(date);
    const paidUsersCount = paidUsersMap.get(date) || 0;
    
    if (stat) {
      return {
        date,
        newUsers: stat.newUsers,
        activeUsers: stat.activeUsers,
        paidUsers: paidUsersCount,
      };
    }
    return {
      date,
      newUsers: 0,
      activeUsers: 0,
      paidUsers: paidUsersCount,
    };
  });

  return { summary, vipDistribution: vipDist, daily };
}

// ================================
// 产品报表服务
// ================================

/**
 * 获取产品报表数据
 * @description 依据：02.4-后台API接口清单.md 第16.3节
 * @param startDate 开始日期 YYYY-MM-DD
 * @param endDate 结束日期 YYYY-MM-DD
 * @param series 产品系列筛选（可选）
 */
export async function getProductReport(
  startDate: string,
  endDate: string,
  series?: string
): Promise<ProductReportData> {
  const { start, end } = parseDateRange(startDate, endDate);

  // 构建产品筛选条件
  const productWhere = series ? { series: series as 'PO' | 'VIP' } : {};

  // 获取所有产品
  const products = await prisma.product.findMany({
    where: {
      ...productWhere,
      status: { not: 'DELETED' },
    },
    select: {
      id: true,
      name: true,
      series: true,
    },
  });

  // 获取每个产品的销售数据
  const productSalesPromises = products.map(async (product) => {
    const [salesData, purchaseUsers, activeOrders, pendingIncome] = await Promise.all([
      // 销售数据（时间范围内）
      prisma.positionOrder.aggregate({
        where: {
          productId: product.id,
          createdAt: { gte: start, lte: end },
        },
        _sum: { purchaseAmount: true },
        _count: true,
      }),
      // 购买用户数（去重）
      prisma.positionOrder.groupBy({
        by: ['userId'],
        where: {
          productId: product.id,
          createdAt: { gte: start, lte: end },
        },
      }).then(result => result.length),
      // 进行中订单数
      prisma.positionOrder.count({
        where: {
          productId: product.id,
          status: 'ACTIVE',
        },
      }),
      // 待发放收益（进行中订单的剩余收益）
      prisma.positionOrder.aggregate({
        where: {
          productId: product.id,
          status: 'ACTIVE',
        },
        _sum: { totalIncome: true, earnedIncome: true },
      }),
    ]);

    const salesCount = salesData._count;
    const salesAmount = Number(salesData._sum.purchaseAmount || 0);
    const totalPending = Number(pendingIncome._sum.totalIncome || 0) - Number(pendingIncome._sum.earnedIncome || 0);

    return {
      productId: product.id,
      productName: product.name,
      productSeries: product.series,
      salesCount,
      salesAmount,
      purchaseUsers,
      activeOrders,
      pendingIncome: totalPending,
    };
  });

  const productSales = await Promise.all(productSalesPromises);

  // 计算总销售额（用于计算占比）
  const totalSalesAmount = productSales.reduce((sum, p) => sum + p.salesAmount, 0);
  const totalSalesCount = productSales.reduce((sum, p) => sum + p.salesCount, 0);

  // 计算系列销售额
  const poSalesAmount = productSales
    .filter(p => p.productSeries === 'PO')
    .reduce((sum, p) => sum + p.salesAmount, 0);
  const vipSalesAmount = productSales
    .filter(p => p.productSeries === 'VIP')
    .reduce((sum, p) => sum + p.salesAmount, 0);

  // 构建列表数据（按销售额降序排列）
  const list: ProductReportItem[] = productSales
    .sort((a, b) => b.salesAmount - a.salesAmount)
    .map(p => ({
      productId: p.productId,
      productName: p.productName,
      productSeries: p.productSeries,
      salesCount: p.salesCount,
      salesAmount: p.salesAmount.toFixed(2),
      salesPercent: totalSalesAmount > 0
        ? ((p.salesAmount / totalSalesAmount) * 100).toFixed(2)
        : '0.00',
      purchaseUsers: p.purchaseUsers,
      activeOrders: p.activeOrders,
      pendingIncome: p.pendingIncome.toFixed(2),
    }));

  const summary: ProductSummary = {
    totalSalesCount,
    totalSalesAmount: totalSalesAmount.toFixed(2),
    poSalesAmount: poSalesAmount.toFixed(2),
    vipSalesAmount: vipSalesAmount.toFixed(2),
  };

  return { list, summary };
}

// ================================
// 返佣报表服务
// ================================

/**
 * 获取返佣报表数据
 * @description 依据：02.4-后台API接口清单.md 第16.4节
 * @param startDate 开始日期 YYYY-MM-DD
 * @param endDate 结束日期 YYYY-MM-DD
 */
export async function getCommissionReport(
  startDate: string,
  endDate: string
): Promise<CommissionReportData> {
  const { start, end } = parseDateRange(startDate, endDate);

  // 并行查询所有数据
  const [
    totalCommission,
    level1Commission,
    level2Commission,
    level3Commission,
    triggerOrders,
    receivers,
    dailyCommissions,
  ] = await Promise.all([
    // 返佣总额
    prisma.commissionRecord.aggregate({
      where: {
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    // 一级返佣
    prisma.commissionRecord.aggregate({
      where: {
        level: 'LEVEL_1',
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    // 二级返佣
    prisma.commissionRecord.aggregate({
      where: {
        level: 'LEVEL_2',
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    // 三级返佣
    prisma.commissionRecord.aggregate({
      where: {
        level: 'LEVEL_3',
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    // 触发订单数（去重 positionOrderId）
    prisma.commissionRecord.groupBy({
      by: ['positionOrderId'],
      where: {
        createdAt: { gte: start, lte: end },
      },
    }).then(result => result.length),
    // 获佣用户数（去重 receiverId）
    prisma.commissionRecord.groupBy({
      by: ['receiverId'],
      where: {
        createdAt: { gte: start, lte: end },
      },
    }).then(result => result.length),
    // 每日返佣数据
    prisma.$queryRaw<Array<{
      date: Date;
      totalAmount: Prisma.Decimal;
      level1Amount: Prisma.Decimal;
      level2Amount: Prisma.Decimal;
      level3Amount: Prisma.Decimal;
    }>>`
      SELECT 
        DATE(createdAt) as date,
        SUM(amount) as totalAmount,
        SUM(CASE WHEN level = 'LEVEL_1' THEN amount ELSE 0 END) as level1Amount,
        SUM(CASE WHEN level = 'LEVEL_2' THEN amount ELSE 0 END) as level2Amount,
        SUM(CASE WHEN level = 'LEVEL_3' THEN amount ELSE 0 END) as level3Amount
      FROM commission_records
      WHERE createdAt >= ${start} AND createdAt <= ${end}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `,
  ]);

  const summary: CommissionSummary = {
    totalAmount: decimalToString(totalCommission._sum.amount),
    level1Amount: decimalToString(level1Commission._sum.amount),
    level2Amount: decimalToString(level2Commission._sum.amount),
    level3Amount: decimalToString(level3Commission._sum.amount),
    triggerOrderCount: triggerOrders,
    receiverCount: receivers,
  };

  // 创建日期映射
  const dailyMap = new Map<string, typeof dailyCommissions[0]>();
  dailyCommissions.forEach(item => {
    dailyMap.set(formatLocalDate(new Date(item.date)), item);
  });

  // 生成完整的每日数据
  const dates = generateDateArray(startDate, endDate);
  const daily: CommissionDaily[] = dates.map(date => {
    const item = dailyMap.get(date);
    if (item) {
      return {
        date,
        totalAmount: decimalToString(item.totalAmount),
        level1Amount: decimalToString(item.level1Amount),
        level2Amount: decimalToString(item.level2Amount),
        level3Amount: decimalToString(item.level3Amount),
      };
    }
    return {
      date,
      totalAmount: '0.00',
      level1Amount: '0.00',
      level2Amount: '0.00',
      level3Amount: '0.00',
    };
  });

  return { summary, daily };
}
