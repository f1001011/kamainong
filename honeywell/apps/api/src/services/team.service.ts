/**
 * @file 团队服务
 * @description 处理团队统计、成员查询、返佣记录等功能
 * @depends 开发文档/开发文档.md 第4.5节 - 团队返佣
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第12节 - 团队接口
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.2节 - User表（邀请关系）
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.4节 - CommissionRecord表
 *
 * 核心业务规则：
 * 1. 层级计算：
 *    - 一级下线：User.inviterId = 当前用户ID
 *    - 二级下线：User.level2InviterId = 当前用户ID
 *    - 三级下线：User.level3InviterId = 当前用户ID
 * 2. 手机号脱敏规则：前3后4，中间****（如 "138****1234"）
 * 3. 今日/本月判断：基于系统时区（从 GlobalConfig 获取）
 */

import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '@/lib/prisma';
import { getSystemTimezone, getSystemTime } from '@/lib/config';

// ================================
// 类型定义
// ================================

/**
 * 团队统计数据
 */
export interface TeamStats {
  /** 总成员数量 */
  totalMembers: number;
  /** 一级下线数量 */
  level1Count: number;
  /** 二级下线数量 */
  level2Count: number;
  /** 三级下线数量 */
  level3Count: number;
  /** 累计返佣总额 */
  totalCommission: string;
  /** 今日返佣 */
  todayCommission: string;
  /** 本月返佣 */
  thisMonthCommission: string;
}

/**
 * 团队成员信息
 * @description 依据：02.3-前端API接口清单.md 第12.2节
 */
export interface TeamMember {
  /** 用户ID */
  id: number;
  /** 昵称 */
  nickname: string | null;
  /** 头像 */
  avatar: string | null;
  /** 手机号（脱敏，前3后4，中间****） */
  phone: string;
  /** 层级（1=一级 | 2=二级 | 3=三级） */
  level: number;
  /** VIP等级 */
  vipLevel: number;
  /** 是否为有效邀请 */
  isValidInvite: boolean;
  /** 贡献的返佣总额 */
  contributedCommission: string;
  /** 注册时间 */
  registeredAt: Date;
}

/**
 * 返佣记录
 * @description 依据：02.3-前端API接口清单.md 第12.3节
 */
export interface CommissionRecordItem {
  /** 记录ID */
  id: number;
  /** 贡献者昵称 */
  sourceUserNickname: string | null;
  /** 贡献者头像 */
  sourceUserAvatar: string | null;
  /** 贡献者手机号（脱敏，前3后4，中间****） */
  sourceUserPhone: string;
  /** 返佣级别 */
  level: string;
  /** 返佣级别名称 */
  levelName: string;
  /** 返佣比例（%） */
  rate: string;
  /** 产品价格 */
  baseAmount: string;
  /** 返佣金额 */
  amount: string;
  /** 产品名称 */
  productName: string;
  /** 创建时间 */
  createdAt: Date;
}

/**
 * 返佣汇总
 */
export interface CommissionSummary {
  /** 总返佣金额 */
  totalCommission: string;
  /** 一级返佣总额 */
  level1Total: string;
  /** 二级返佣总额 */
  level2Total: string;
  /** 三级返佣总额 */
  level3Total: string;
}

// ================================
// 工具函数
// ================================

/**
 * 手机号脱敏
 * @description 依据：前3后4，中间****
 * @param phone 原始手机号
 * @returns 脱敏后的手机号（如 "138****1234"）
 */
function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) {
    return '****';
  }
  const prefix = phone.slice(0, 3);
  const suffix = phone.slice(-4);
  return `${prefix}****${suffix}`;
}

/**
 * 获取返佣级别名称
 * @param level 级别枚举值
 * @returns 级别名称（中文）
 */
function getLevelName(level: string): string {
  const levelNames: Record<string, string> = {
    LEVEL_1: 'عمولة المستوى 1',
    LEVEL_2: 'عمولة المستوى 2',
    LEVEL_3: 'عمولة المستوى 3',
  };
  return levelNames[level] || level;
}

// ================================
// 团队服务类
// ================================

/**
 * 团队服务类
 * @description 提供团队统计、成员查询、返佣记录等功能
 */
export class TeamService {
  /**
   * 获取团队统计数据
   * @description 依据：02.3-前端API接口清单.md 第12.1节
   * @param userId 用户ID
   * @returns 团队统计数据
   */
  async getTeamStats(userId: number): Promise<TeamStats> {
    // 并行查询各级下线数量
    const [level1Count, level2Count, level3Count] = await Promise.all([
      // 一级下线：inviterId = 当前用户
      prisma.user.count({ where: { inviterId: userId } }),
      // 二级下线：level2InviterId = 当前用户
      prisma.user.count({ where: { level2InviterId: userId } }),
      // 三级下线：level3InviterId = 当前用户
      prisma.user.count({ where: { level3InviterId: userId } }),
    ]);

    // 获取系统时区和当前系统时间
    const timezone = await getSystemTimezone();
    const systemNow = await getSystemTime();

    // 计算今日起始时间（系统时区00:00:00）
    const todayStart = new Date(systemNow);
    todayStart.setHours(0, 0, 0, 0);

    // 计算本月起始时间（系统时区本月1日00:00:00）
    const monthStart = new Date(systemNow);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // 将系统时区时间转换回UTC进行数据库查询
    const todayStartUtc = this.systemTimeToUtc(todayStart, timezone);
    const monthStartUtc = this.systemTimeToUtc(monthStart, timezone);

    // 并行查询返佣统计
    const [totalCommissionResult, todayCommissionResult, monthCommissionResult] =
      await Promise.all([
        // 累计返佣总额
        prisma.commissionRecord.aggregate({
          where: { receiverId: userId },
          _sum: { amount: true },
        }),
        // 今日返佣
        prisma.commissionRecord.aggregate({
          where: {
            receiverId: userId,
            createdAt: { gte: todayStartUtc },
          },
          _sum: { amount: true },
        }),
        // 本月返佣
        prisma.commissionRecord.aggregate({
          where: {
            receiverId: userId,
            createdAt: { gte: monthStartUtc },
          },
          _sum: { amount: true },
        }),
      ]);

    return {
      totalMembers: level1Count + level2Count + level3Count,
      level1Count,
      level2Count,
      level3Count,
      totalCommission: (totalCommissionResult._sum.amount || new Decimal(0)).toFixed(2),
      todayCommission: (todayCommissionResult._sum.amount || new Decimal(0)).toFixed(2),
      thisMonthCommission: (monthCommissionResult._sum.amount || new Decimal(0)).toFixed(2),
    };
  }

  /**
   * 获取团队成员列表
   * @description 依据：02.3-前端API接口清单.md 第12.2节
   * @param userId 用户ID
   * @param page 页码
   * @param pageSize 每页数量
   * @param level 层级筛选（1 | 2 | 3，不传则返回全部）
   * @returns 团队成员列表和分页信息
   */
  async getTeamMembers(
    userId: number,
    page: number,
    pageSize: number,
    level?: number
  ): Promise<{
    list: TeamMember[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }> {
    // 构建查询条件
    type WhereClause = { inviterId?: number; level2InviterId?: number; level3InviterId?: number };
    let whereClause: WhereClause;

    if (level === 1) {
      whereClause = { inviterId: userId };
    } else if (level === 2) {
      whereClause = { level2InviterId: userId };
    } else if (level === 3) {
      whereClause = { level3InviterId: userId };
    } else {
      // 查询所有层级需要分别处理
      // 使用 OR 条件合并三个层级
      const allLevelWhere = {
        OR: [
          { inviterId: userId },
          { level2InviterId: userId },
          { level3InviterId: userId },
        ],
      };

      // 查询总数
      const total = await prisma.user.count({ where: allLevelWhere });

      // 查询成员列表
      const users = await prisma.user.findMany({
        where: allLevelWhere,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          phone: true,
          nickname: true,
          avatar: true,
          vipLevel: true,
          inviterId: true,
          level2InviterId: true,
          level3InviterId: true,
          createdAt: true,
          hasRecharged: true,
          hasPurchasedAfterRecharge: true,
          signInCompleted: true,
        },
      });

      // 获取每个成员的统计数据
      const list = await Promise.all(
        users.map(async (user) => {
          // 判断层级
          let memberLevel = 1;
          if (user.inviterId === userId) {
            memberLevel = 1;
          } else if (user.level2InviterId === userId) {
            memberLevel = 2;
          } else if (user.level3InviterId === userId) {
            memberLevel = 3;
          }

          // 获取成员贡献的返佣
          const commission = await prisma.commissionRecord.aggregate({
            where: { receiverId: userId, sourceUserId: user.id },
            _sum: { amount: true },
          });

          // 判断是否为有效邀请
          // 依据：开发文档.md 第9节活动2 - 有效邀请定义
          const isValidInvite =
            (user.hasRecharged && user.hasPurchasedAfterRecharge) || user.signInCompleted;

          return {
            id: user.id,
            nickname: user.nickname,
            avatar: user.avatar,
            phone: maskPhone(user.phone),
            level: memberLevel,
            vipLevel: user.vipLevel,
            isValidInvite,
            contributedCommission: (commission._sum.amount || new Decimal(0)).toFixed(2),
            registeredAt: user.createdAt,
          };
        })
      );

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

    // 单层级查询
    const [total, users] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          phone: true,
          nickname: true,
          avatar: true,
          vipLevel: true,
          createdAt: true,
          hasRecharged: true,
          hasPurchasedAfterRecharge: true,
          signInCompleted: true,
        },
      }),
    ]);

    // 获取每个成员的统计数据
    const list = await Promise.all(
      users.map(async (user) => {
        // 获取成员贡献的返佣
        const commission = await prisma.commissionRecord.aggregate({
          where: { receiverId: userId, sourceUserId: user.id },
          _sum: { amount: true },
        });

        // 判断是否为有效邀请
        // 依据：开发文档.md 第9节活动2 - 有效邀请定义
        const isValidInvite =
          (user.hasRecharged && user.hasPurchasedAfterRecharge) || user.signInCompleted;

        return {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          phone: maskPhone(user.phone),
          level: level!,
          vipLevel: user.vipLevel,
          isValidInvite,
          contributedCommission: (commission._sum.amount || new Decimal(0)).toFixed(2),
          registeredAt: user.createdAt,
        };
      })
    );

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
   * 获取返佣记录列表
   * @description 依据：02.3-前端API接口清单.md 第12.3节
   * @param userId 用户ID
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 返佣记录列表、分页信息和汇总数据
   */
  async getCommissionRecords(
    userId: number,
    page: number,
    pageSize: number
  ): Promise<{
    list: CommissionRecordItem[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
    summary: CommissionSummary;
  }> {
    const where = { receiverId: userId };

    // 并行查询列表和统计
    const [records, total, levelSummary] = await Promise.all([
      // 返佣记录列表
      prisma.commissionRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          sourceUser: {
            select: {
              id: true,
              phone: true,
              nickname: true,
              avatar: true,
            },
          },
          positionOrder: {
            select: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      // 总数
      prisma.commissionRecord.count({ where }),
      // 按级别汇总
      prisma.commissionRecord.groupBy({
        by: ['level'],
        where: { receiverId: userId },
        _sum: { amount: true },
      }),
    ]);

    // 构建级别汇总 Map
    const levelTotals: Record<string, Decimal> = {};
    for (const stat of levelSummary) {
      levelTotals[stat.level] = stat._sum.amount || new Decimal(0);
    }

    // 计算总返佣
    const totalCommission = Object.values(levelTotals).reduce(
      (sum, amount) => sum.add(amount),
      new Decimal(0)
    );

    // 转换返佣记录格式
    const list: CommissionRecordItem[] = records.map((record) => ({
      id: record.id,
      sourceUserNickname: record.sourceUser.nickname,
      sourceUserAvatar: record.sourceUser.avatar,
      sourceUserPhone: maskPhone(record.sourceUser.phone),
      level: record.level,
      levelName: getLevelName(record.level),
      rate: record.rate.toFixed(2),
      baseAmount: record.baseAmount.toFixed(2),
      amount: record.amount.toFixed(2),
      productName: record.positionOrder.product.name,
      createdAt: record.createdAt,
    }));

    return {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      summary: {
        totalCommission: totalCommission.toFixed(2),
        level1Total: (levelTotals['LEVEL_1'] || new Decimal(0)).toFixed(2),
        level2Total: (levelTotals['LEVEL_2'] || new Decimal(0)).toFixed(2),
        level3Total: (levelTotals['LEVEL_3'] || new Decimal(0)).toFixed(2),
      },
    };
  }

  /**
   * 将系统时区时间转换为UTC时间
   * @description 用于将系统时区的边界时间（如今日00:00）转换为UTC进行数据库查询
   * @param systemTime 系统时区时间
   * @param timezone 时区标识符
   * @returns UTC时间
   */
  private systemTimeToUtc(systemTime: Date, timezone: string): Date {
    // 获取系统时区相对于UTC的偏移量（分钟）
    const utcDate = new Date(systemTime.toISOString().slice(0, 19) + 'Z');

    // 使用 Intl.DateTimeFormat 计算时区偏移
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const utcFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // 通过比较同一时刻在两个时区的表示来计算偏移
    const now = new Date();
    const tzParts = formatter.formatToParts(now);
    const utcParts = utcFormatter.formatToParts(now);

    const getValue = (parts: Intl.DateTimeFormatPart[], type: string) =>
      parseInt(parts.find((p) => p.type === type)?.value || '0');

    const tzHour = getValue(tzParts, 'hour');
    const utcHour = getValue(utcParts, 'hour');

    // 计算小时差（简化处理）
    let hourOffset = utcHour - tzHour;
    if (hourOffset > 12) hourOffset -= 24;
    if (hourOffset < -12) hourOffset += 24;

    // 将系统时间加上偏移量得到UTC时间
    const result = new Date(systemTime);
    result.setHours(result.getHours() + hourOffset);

    return result;
  }
}

// 单例导出
export const teamService = new TeamService();
