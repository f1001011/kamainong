/**
 * @file 返佣记录管理服务
 * @description 后台管理端返佣记录管理相关功能
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第19节 - 返佣记录管理接口
 *
 * 核心功能：
 * 1. 返佣记录列表查询（支持按接收人、来源人、级别筛选）
 * 2. 返佣统计汇总（各级别金额汇总和 TOP 获佣用户）
 *
 * 业务规则：
 * - 列表支持按接收人、来源人、级别筛选
 * - 统计含各级别金额汇总和 TOP 获佣用户
 * - 支持日期范围和趋势数据
 */

import { prisma } from '@/lib/prisma';
import { Prisma, CommissionLevel } from '@honeywell/database';
import { DEFAULT_CONFIG } from '@honeywell/config';

// ================================
// 类型定义
// ================================

/** 返佣记录列表查询参数 */
export interface CommissionListParams {
  page?: number;
  pageSize?: number;
  receiverId?: number;
  receiverPhone?: string;
  sourceUserId?: number;
  sourceUserPhone?: string;
  level?: CommissionLevel;
  productId?: number;
  startDate?: string;
  endDate?: string;
  amountMin?: number;
  amountMax?: number;
}

/** 返佣统计查询参数 */
export interface CommissionStatsParams {
  startDate?: string;
  endDate?: string;
}

// ================================
// 辅助函数
// ================================

/**
 * 格式化金额为两位小数字符串
 */
function formatAmount(value: Prisma.Decimal | number | null): string {
  if (value === null || value === undefined) return '0.00';
  return Number(value).toFixed(2);
}

/**
 * 格式化日期为 YYYY-MM-DD 字符串
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DEFAULT_CONFIG.SYSTEM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// ================================
// 返佣记录管理服务类
// ================================

class AdminCommissionService {
  /**
   * 获取返佣记录列表
   * @description 依据：02.4-后台API接口清单.md 第19.1节
   * 筛选条件：receiverId、receiverPhone、sourceUserId、sourceUserPhone、level、
   *          productId、startDate、endDate、amountMin、amountMax
   */
  async getRecordList(params: CommissionListParams) {
    const {
      page = 1,
      pageSize = 20,
      receiverId,
      receiverPhone,
      sourceUserId,
      sourceUserPhone,
      level,
      productId,
      startDate,
      endDate,
      amountMin,
      amountMax,
    } = params;

    // 构建查询条件
    const where: Prisma.CommissionRecordWhereInput = {};

    // 接收人ID筛选
    if (receiverId) {
      where.receiverId = receiverId;
    }

    // 接收人手机号筛选
    if (receiverPhone) {
      const user = await prisma.user.findFirst({
        where: { phone: { contains: receiverPhone } },
        select: { id: true },
      });
      if (user) {
        where.receiverId = user.id;
      } else {
        return {
          list: [],
          pagination: { page, pageSize, total: 0, totalPages: 0 },
        };
      }
    }

    // 来源人ID筛选
    if (sourceUserId) {
      where.sourceUserId = sourceUserId;
    }

    // 来源人手机号筛选
    if (sourceUserPhone) {
      const user = await prisma.user.findFirst({
        where: { phone: { contains: sourceUserPhone } },
        select: { id: true },
      });
      if (user) {
        where.sourceUserId = user.id;
      } else {
        return {
          list: [],
          pagination: { page, pageSize, total: 0, totalPages: 0 },
        };
      }
    }

    // 级别筛选
    if (level) {
      where.level = level;
    }

    // 产品ID筛选
    if (productId) {
      where.positionOrder = {
        productId,
      };
    }

    // 时间范围筛选
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        where.createdAt.lt = end;
      }
    }

    // 金额范围筛选
    if (amountMin !== undefined || amountMax !== undefined) {
      where.amount = {};
      if (amountMin !== undefined) {
        where.amount.gte = amountMin;
      }
      if (amountMax !== undefined) {
        where.amount.lte = amountMax;
      }
    }

    // 并行查询列表和总数
    const [records, total] = await Promise.all([
      prisma.commissionRecord.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          receiver: {
            select: { id: true, phone: true, nickname: true },
          },
          sourceUser: {
            select: { id: true, phone: true, nickname: true },
          },
          positionOrder: {
            select: {
              id: true,
              orderNo: true,
              product: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      prisma.commissionRecord.count({ where }),
    ]);

    // 格式化返回数据
    const list = records.map((record) => ({
      id: record.id,
      receiverId: record.receiverId,
      receiverPhone: record.receiver.phone,
      receiverNickname: record.receiver.nickname,
      sourceUserId: record.sourceUserId,
      sourceUserPhone: record.sourceUser.phone,
      sourceUserNickname: record.sourceUser.nickname,
      level: record.level,
      rate: formatAmount(record.rate),
      baseAmount: formatAmount(record.baseAmount),
      amount: formatAmount(record.amount),
      productId: record.positionOrder.product.id,
      productName: record.positionOrder.product.name,
      positionOrderNo: record.positionOrder.orderNo,
      createdAt: record.createdAt.toISOString(),
    }));

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

  /**
   * 获取返佣统计汇总
   * @description 依据：02.4-后台API接口清单.md 第19.2节
   * 统计含各级别金额汇总、TOP 获佣用户和趋势数据
   */
  async getStats(params: CommissionStatsParams) {
    const { startDate, endDate } = params;

    // 构建时间范围条件
    const dateWhere: Prisma.CommissionRecordWhereInput = {};
    if (startDate || endDate) {
      dateWhere.createdAt = {};
      if (startDate) {
        dateWhere.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        dateWhere.createdAt.lt = end;
      }
    }

    // 并行查询各种统计
    const [
      totalStats,
      levelStats,
      topReceivers,
      dailyTrend,
    ] = await Promise.all([
      // 总体统计
      prisma.commissionRecord.aggregate({
        where: dateWhere,
        _sum: { amount: true },
        _count: true,
      }),
      // 按级别统计
      prisma.commissionRecord.groupBy({
        by: ['level'],
        where: dateWhere,
        _sum: { amount: true },
        _count: true,
      }),
      // TOP 获佣用户（前10名）
      this.getTopReceivers(dateWhere),
      // 每日趋势（最近30天或指定范围）
      this.getDailyTrend(startDate, endDate),
    ]);

    // 构建级别统计Map
    const levelStatsMap: Record<string, { amount: number; count: number }> = {
      LEVEL_1: { amount: 0, count: 0 },
      LEVEL_2: { amount: 0, count: 0 },
      LEVEL_3: { amount: 0, count: 0 },
    };
    for (const stat of levelStats) {
      levelStatsMap[stat.level] = {
        amount: Number(stat._sum.amount || 0),
        count: stat._count,
      };
    }

    return {
      summary: {
        totalAmount: formatAmount(totalStats._sum.amount),
        totalCount: totalStats._count,
        level1Amount: formatAmount(levelStatsMap.LEVEL_1.amount),
        level1Count: levelStatsMap.LEVEL_1.count,
        level2Amount: formatAmount(levelStatsMap.LEVEL_2.amount),
        level2Count: levelStatsMap.LEVEL_2.count,
        level3Amount: formatAmount(levelStatsMap.LEVEL_3.amount),
        level3Count: levelStatsMap.LEVEL_3.count,
      },
      topReceivers,
      dailyTrend,
    };
  }

  /**
   * 获取 TOP 获佣用户
   * @private
   */
  private async getTopReceivers(
    dateWhere: Prisma.CommissionRecordWhereInput,
    limit: number = 10
  ) {
    // 按接收人分组统计返佣金额
    const groupedStats = await prisma.commissionRecord.groupBy({
      by: ['receiverId'],
      where: dateWhere,
      _sum: { amount: true },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
      take: limit,
    });

    // 获取用户信息
    const userIds = groupedStats.map((stat) => stat.receiverId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, phone: true, nickname: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // 格式化返回数据
    return groupedStats.map((stat) => {
      const user = userMap.get(stat.receiverId);
      return {
        userId: stat.receiverId,
        userPhone: user?.phone || '',
        nickname: user?.nickname || '',
        totalAmount: formatAmount(stat._sum.amount),
      };
    });
  }

  /**
   * 获取每日趋势
   * @private
   */
  private async getDailyTrend(
    startDate?: string,
    endDate?: string
  ): Promise<Array<{ date: string; amount: string; count: number }>> {
    // 计算日期范围
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // 默认最近30天

    // 使用原生SQL查询每日统计（MySQL兼容）
    // 注意：Prisma 字段名是 createdAt，数据库列名也是 createdAt（无 @map 映射）
    const dailyStats = await prisma.$queryRaw<
      Array<{ date: string; total_amount: Prisma.Decimal; count: bigint }>
    >`
      SELECT 
        DATE(createdAt) as date,
        SUM(amount) as total_amount,
        COUNT(*) as count
      FROM commission_records
      WHERE createdAt >= ${start}
        AND createdAt < DATE_ADD(${end}, INTERVAL 1 DAY)
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;

    // 格式化返回数据
    return dailyStats.map((stat) => ({
      date: formatDate(new Date(stat.date)),
      amount: formatAmount(stat.total_amount),
      count: Number(stat.count),
    }));
  }
}

// 导出服务实例
export const adminCommissionService = new AdminCommissionService();
