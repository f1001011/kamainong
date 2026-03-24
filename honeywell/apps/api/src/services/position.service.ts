/**
 * @file 持仓与收益服务
 * @description 处理持仓订单查询、收益记录查询等核心业务逻辑
 * @depends 开发文档/02.3-前端API接口清单.md 第8节 - 持仓接口
 * @depends 开发文档/02.1-数据库设计.md 第2.3节 - PositionOrder表、IncomeRecord表
 */

import { prisma } from '@/lib/prisma';
import { getSystemTimezone } from '@/lib/config';
import { Errors } from '@/lib/errors';
import { Decimal } from '@prisma/client/runtime/library';
import { PositionStatus } from '@honeywell/database';

/**
 * 格式化金额为两位小数字符串
 * @description 依据：开发文档.md 第16.5节 - 金额使用 DECIMAL(15,2) 存储
 * @param value Decimal 值
 * @returns 格式化后的字符串，如 "50.00"
 */
function formatAmount(value: Decimal | null | undefined): string {
  if (!value) {
    return '0.00';
  }
  return value.toFixed(2);
}

/**
 * 持仓汇总信息
 * @description 依据：02.3-前端API接口清单.md 第8.1节
 */
export interface PositionSummary {
  activeCount: number;         // 进行中订单数
  completedCount: number;      // 已完成订单数
  totalPurchaseAmount: string; // 总持仓金额
  totalEarned: string;         // 累计收益
  todayIncome: string;         // 今日收益
}

/**
 * 收益记录汇总信息
 * @description 依据：02.3-前端API接口清单.md 第8.3节
 */
export interface IncomeSummary {
  totalSettled: string;   // 已发放总额
  pendingCount: number;   // 待发放次数
}

/**
 * 持仓服务类
 */
export class PositionService {
  /**
   * 获取用户持仓列表
   * @description 依据：02.3-前端API接口清单.md 第8.1节 - 持仓订单列表
   * @param userId 用户ID
   * @param page 页码
   * @param pageSize 每页数量
   * @param status 状态过滤（ACTIVE | COMPLETED）
   * @returns 持仓列表及汇总信息
   * 
   * 核心要求：
   * 1. 汇总计算使用聚合查询，避免 N+1
   * 2. 今日收益判断基于系统时区的今日 00:00 ~ 23:59:59
   */
  async getPositions(
    userId: number,
    page: number,
    pageSize: number,
    status?: 'ACTIVE' | 'COMPLETED'
  ) {
    // 构建查询条件（始终排除 TERMINATED，用户端不可见）
    const where = {
      userId,
      status: status || { not: PositionStatus.TERMINATED },
    };

    // 并行查询：列表、总数、汇总统计
    const [list, total, summary] = await Promise.all([
      // 1. 查询持仓列表（包含产品信息）
      prisma.positionOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          product: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              series: true,
              mainImage: true,
              returnPrincipal: true,
            },
          },
        },
      }),
      // 2. 查询总数
      prisma.positionOrder.count({ where }),
      // 3. 计算汇总统计（使用聚合查询提升效率）
      this.calculateSummary(userId),
    ]);

    // 格式化返回数据
    // 依据：02.3-前端API接口清单.md - 所有金额字段保留两位小数
    const formattedList = list.map((item: (typeof list)[number]) => ({
      id: item.id,
      orderNo: item.orderNo,
      productName: item.product.name,
      productImage: item.product.mainImage,
      productType: item.product.type,
      productSeries: item.product.series,
      returnPrincipal: item.product.returnPrincipal,
      purchaseAmount: formatAmount(item.purchaseAmount),
      dailyIncome: formatAmount(item.dailyIncome),
      cycleDays: item.cycleDays,
      paidDays: item.paidDays,
      earnedIncome: formatAmount(item.earnedIncome),
      status: item.status,
      isGift: item.isGift,
      startAt: item.startAt.toISOString(),
      nextSettleAt: item.nextSettleAt?.toISOString() || null,
    }));

    return {
      list: formattedList,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      summary,
    };
  }

  /**
   * 计算持仓汇总统计
   * @description 使用聚合查询，避免 N+1 问题
   * @param userId 用户ID
   * @returns 汇总统计信息
   */
  private async calculateSummary(userId: number): Promise<PositionSummary> {
    // 获取系统时区今日的开始和结束时间
    const { todayStart, todayEnd } = await this.getTodayRange();

    // 并行执行多个聚合查询
    const [
      activeCount,
      completedCount,
      purchaseAggregate,
      earnedAggregate,
      todayIncomeAggregate,
    ] = await Promise.all([
      // 1. 进行中订单数
      prisma.positionOrder.count({
        where: { userId, status: 'ACTIVE' },
      }),
      // 2. 已完成订单数
      prisma.positionOrder.count({
        where: { userId, status: 'COMPLETED' },
      }),
      // 3. 总持仓金额（聚合所有订单的购买金额，排除 TERMINATED）
      prisma.positionOrder.aggregate({
        where: { userId, status: { not: PositionStatus.TERMINATED } },
        _sum: { purchaseAmount: true },
      }),
      // 4. 累计已获收益（聚合所有订单的已发放收益，排除 TERMINATED）
      prisma.positionOrder.aggregate({
        where: { userId, status: { not: PositionStatus.TERMINATED } },
        _sum: { earnedIncome: true },
      }),
      // 5. 今日收益（聚合今日已发放的收益记录）
      // 依据：收益发放使用 IncomeRecord 表，settledAt 为实际发放时间
      prisma.incomeRecord.aggregate({
        where: {
          userId,
          status: 'SETTLED',
          settledAt: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
        _sum: { amount: true },
      }),
    ]);

    // 依据：02.3-前端API接口清单.md - 所有金额字段保留两位小数
    return {
      activeCount,
      completedCount,
      totalPurchaseAmount: formatAmount(purchaseAggregate._sum.purchaseAmount),
      totalEarned: formatAmount(earnedAggregate._sum.earnedIncome),
      todayIncome: formatAmount(todayIncomeAggregate._sum.amount),
    };
  }

  /**
   * 获取系统时区的今日开始和结束时间
   * @description 依据：开发文档.md 第3节 - 时区处理
   * @returns 今日开始和结束时间（UTC）
   * 
   * 计算逻辑：
   * 1. 获取系统时区配置（如 Africa/Casablanca）
   * 2. 获取该时区当前的日期（YYYY-MM-DD）
   * 3. 计算该日期 00:00:00 和 23:59:59.999 对应的 UTC 时间
   */
  private async getTodayRange(): Promise<{ todayStart: Date; todayEnd: Date }> {
    const timezone = await getSystemTimezone();
    const now = new Date();

    // 步骤1：获取系统时区的当前日期字符串（YYYY-MM-DD 格式）
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const dateStr = formatter.format(now); // 例如 "2026-02-05"

    // 步骤2：计算时区偏移
    // 通过比较 UTC 时间和目标时区时间来获取偏移量
    const utcDate = new Date(now.toISOString());
    const tzDateStr = now.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const tzDate = new Date(tzDateStr);
    const offsetMs = utcDate.getTime() - tzDate.getTime();

    // 步骤3：构造目标时区的 00:00:00 和 23:59:59.999（本地解析）
    // 然后加上时区偏移得到 UTC 时间
    const localStart = new Date(`${dateStr}T00:00:00.000`);
    const localEnd = new Date(`${dateStr}T23:59:59.999`);

    // 转换为 UTC：目标时区时间 + 偏移量 = UTC 时间
    const todayStart = new Date(localStart.getTime() + offsetMs);
    const todayEnd = new Date(localEnd.getTime() + offsetMs);

    return { todayStart, todayEnd };
  }

  /**
   * 获取持仓订单详情
   * @description 依据：02.3-前端API接口清单.md 第8.2节 - 持仓订单详情
   * @param userId 用户ID
   * @param positionId 持仓订单ID
   * @returns 持仓详情
   * 
   * 返回内容：
   * - 订单基本信息
   * - product 信息（name、dailyRate、cycleDays）
   * - remainingDays 计算：cycleDays - paidDays
   * - nextSettleAt 下次结算时间
   */
  async getPositionDetail(userId: number, positionId: number) {
    const position = await prisma.positionOrder.findUnique({
      where: { id: positionId },
      include: {
        product: {
          select: {
            id: true,
            code: true,
            name: true,
            mainImage: true,
            dailyIncome: true,
            cycleDays: true,
            series: true,
            type: true,
            returnPrincipal: true,
          },
        },
      },
    });

    if (!position) {
      throw Errors.orderNotFound();
    }

    // 只能查看自己的订单
    if (position.userId !== userId) {
      throw Errors.orderNotFound();
    }

    // 已终止订单对用户不可见
    if (position.status === 'TERMINATED') {
      throw Errors.orderNotFound();
    }

    // 计算剩余天数：cycleDays - paidDays
    // 依据：02.3-前端API接口清单.md 第8.2节
    const remainingDays = position.cycleDays - position.paidDays;

    // 计算总收益（快照值，购买时已计算）
    const totalIncome = position.dailyIncome.mul(position.cycleDays);

    // 计算日收益率：dailyIncome / purchaseAmount * 100
    const dailyRate = position.purchaseAmount.gt(0)
      ? position.dailyIncome.div(position.purchaseAmount).mul(100)
      : new Decimal(0);

    // 并行查询新增字段
    const { todayStart, todayEnd } = await this.getTodayRange();
    const [todayRecord, streakRecords] = await Promise.all([
      // 今日收益记录
      prisma.incomeRecord.findFirst({
        where: {
          positionId,
          scheduleAt: { gte: todayStart, lt: todayEnd },
        },
        select: { amount: true, status: true },
      }),
      // 最近已发放记录（用于计算连续发放天数）
      prisma.incomeRecord.findMany({
        where: { positionId, status: 'SETTLED' },
        orderBy: { settleSequence: 'desc' },
        take: position.paidDays || 1,
        select: { settleSequence: true },
      }),
    ]);

    // 计算连续成功发放天数
    let settledStreak = 0;
    for (let i = 0; i < streakRecords.length; i++) {
      if (streakRecords[i].settleSequence === position.paidDays - i) {
        settledStreak++;
      } else {
        break;
      }
    }

    // 计算预计结束日期
    const estimatedEndAt = position.status === 'ACTIVE'
      ? new Date(position.startAt.getTime() + position.cycleDays * 24 * 60 * 60 * 1000)
      : position.endAt;

    // 计算里程碑达成情况
    const progressPercent = position.cycleDays > 0
      ? (position.paidDays / position.cycleDays) * 100
      : 0;

    // 依据：02.3-前端API接口清单.md - 所有金额字段保留两位小数
    return {
      id: position.id,
      orderNo: position.orderNo,
      productId: position.product.id,
      productName: position.product.name,
      productImage: position.product.mainImage,
      purchaseAmount: formatAmount(position.purchaseAmount),
      dailyIncome: formatAmount(position.dailyIncome),
      cycleDays: position.cycleDays,
      totalIncome: formatAmount(totalIncome),
      paidDays: position.paidDays,
      remainingDays,
      earnedIncome: formatAmount(position.earnedIncome),
      status: position.status,
      isGift: position.isGift,
      startAt: position.startAt.toISOString(),
      nextSettleAt: position.nextSettleAt?.toISOString() || null,
      endAt: position.endAt?.toISOString() || null,
      productSeries: position.product.series,
      productType: position.product.type,
      returnPrincipal: position.product.returnPrincipal,
      dailyRate: dailyRate.toFixed(2),
      todayIncome: {
        amount: todayRecord?.status === 'SETTLED' ? formatAmount(todayRecord.amount) : '0.00',
        settled: todayRecord?.status === 'SETTLED' || false,
      },
      settledStreak,
      estimatedEndAt: estimatedEndAt?.toISOString() || null,
      milestones: {
        quarter: progressPercent >= 25,
        half: progressPercent >= 50,
        threeQuarter: progressPercent >= 75,
        complete: progressPercent >= 100,
      },
    };
  }

  /**
   * 获取持仓订单的收益发放记录
   * @description 依据：02.3-前端API接口清单.md 第8.3节 - 收益发放记录
   * @param userId 用户ID
   * @param positionId 持仓订单ID
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 收益记录列表及汇总
   * 
   * 返回内容：
   * - 分页返回
   * - 按 settleSequence 降序排列
   * - 含每笔收益的 settleDate、amount、status
   * - summary: totalSettled（已发放总额）、pendingCount（待发放次数）
   */
  async getIncomeRecords(
    userId: number,
    positionId: number,
    page: number,
    pageSize: number
  ) {
    // 1. 验证持仓订单存在且属于当前用户
    const position = await prisma.positionOrder.findUnique({
      where: { id: positionId },
      select: { id: true, userId: true, status: true, cycleDays: true, paidDays: true },
    });

    if (!position) {
      throw Errors.orderNotFound();
    }

    if (position.userId !== userId) {
      throw Errors.orderNotFound();
    }

    // 已终止订单对用户不可见
    if (position.status === 'TERMINATED') {
      throw Errors.orderNotFound();
    }

    // 2. 并行查询收益记录和汇总
    const [list, total, settledAggregate, pendingCount] = await Promise.all([
      // 收益记录列表（按 settleSequence 降序）
      prisma.incomeRecord.findMany({
        where: { positionId },
        orderBy: { settleSequence: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          settleSequence: true,
          amount: true,
          status: true,
          scheduleAt: true,
          settledAt: true,
        },
      }),
      // 总记录数
      prisma.incomeRecord.count({
        where: { positionId },
      }),
      // 已发放总额
      prisma.incomeRecord.aggregate({
        where: {
          positionId,
          status: 'SETTLED',
        },
        _sum: { amount: true },
      }),
      // 待发放次数（PENDING 状态）
      prisma.incomeRecord.count({
        where: {
          positionId,
          status: 'PENDING',
        },
      }),
    ]);

    // 3. 格式化返回数据
    // 依据：02.3-前端API接口清单.md - 所有金额字段保留两位小数
    const formattedList = list.map((item: (typeof list)[number]) => ({
      id: item.id,
      settleSequence: item.settleSequence,
      amount: formatAmount(item.amount),
      status: item.status,
      scheduleAt: item.scheduleAt.toISOString(),
      settledAt: item.settledAt?.toISOString() || null,
    }));

    const summary: IncomeSummary = {
      totalSettled: formatAmount(settledAggregate._sum.amount),
      pendingCount,
    };

    return {
      list: formattedList,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      summary,
    };
  }
  /**
   * 获取持仓收益图表数据
   * @description 返回轻量级的每日累计收益数据，用于前端图表绘制
   */
  async getChartData(userId: number, positionId: number) {
    // 验证持仓
    const position = await prisma.positionOrder.findUnique({
      where: { id: positionId },
      select: { id: true, userId: true, status: true, cycleDays: true, paidDays: true, dailyIncome: true, startAt: true },
    });

    if (!position) throw Errors.orderNotFound();
    if (position.userId !== userId) throw Errors.orderNotFound();
    if (position.status === 'TERMINATED') throw Errors.orderNotFound();

    // 获取所有收益记录（按 settleSequence 升序）
    const records = await prisma.incomeRecord.findMany({
      where: { positionId },
      orderBy: { settleSequence: 'asc' },
      select: {
        settleSequence: true,
        amount: true,
        status: true,
        scheduleAt: true,
        settledAt: true,
      },
    });

    // 构建图表数据：每天的累计收益
    let cumulative = new Decimal(0);
    const chartData = records.map((record) => {
      if (record.status === 'SETTLED') {
        cumulative = cumulative.add(record.amount);
      }
      return {
        day: record.settleSequence,
        cumulative: cumulative.toFixed(2),
        status: record.status as string,
        date: record.scheduleAt.toISOString(),
      };
    });

    return {
      chartData,
      totalDays: position.cycleDays,
      paidDays: position.paidDays,
      dailyIncome: formatAmount(position.dailyIncome),
      startAt: position.startAt.toISOString(),
    };
  }
}

// 单例导出
export const positionService = new PositionService();
