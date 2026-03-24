/**
 * @file 后台团队关系管理服务
 * @description 处理后台管理端团队关系查询、上下级追溯、团队统计等功能
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第20节 - 团队关系管理接口
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.2节 - User表（邀请关系）
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.4节 - CommissionRecord表
 *
 * 核心业务规则：
 * 1. 层级计算：
 *    - 一级下线：User.inviterId = 当前用户ID
 *    - 二级下线：User.level2InviterId = 当前用户ID
 *    - 三级下线：User.level3InviterId = 当前用户ID
 * 2. 上级追溯最多3级
 * 3. 后台查询不脱敏手机号（与前端服务不同）
 */

import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '@/lib/prisma';
import { BusinessError } from '@/lib/errors';
import { Prisma, UserStatus } from '@honeywell/database';

// ================================
// 类型定义
// ================================

/**
 * 上级用户简要信息
 * @description 依据：02.4-后台API接口清单.md 第20.1节
 */
export interface UplineUserInfo {
  id: number;
  phone: string;
  nickname: string | null;
  vipLevel: number;
  status: UserStatus;
  createdAt: string;
}

/**
 * 上级简要信息（用于 20.1 团队关系查询）
 * @description 依据：02.4-后台API接口清单.md 第20.1节
 * 注意：只返回 id、phone、nickname 三个字段
 */
export interface UplineSimpleInfo {
  id: number;
  phone: string;
  nickname: string | null;
}

/**
 * 团队关系查询结果
 * @description 依据：02.4-后台API接口清单.md 第20.1节
 */
export interface TeamQueryResult {
  user: {
    id: number;
    phone: string;
    nickname: string | null;
    vipLevel: number;
    status: UserStatus;
  };
  upline: {
    level1: UplineSimpleInfo | null;
    level2: UplineSimpleInfo | null;
    level3: UplineSimpleInfo | null;
  };
  downlineSummary: {
    level1Count: number;
    level2Count: number;
    level3Count: number;
    totalCount: number;
  };
}

/**
 * 上级链路项
 * @description 依据：02.4-后台API接口清单.md 第20.2节
 */
export interface UplineChainItem {
  level: number;
  user: UplineUserInfo | null;
}

/**
 * 下级成员信息
 * @description 依据：02.4-后台API接口清单.md 第20.3节
 */
export interface DownlineMember {
  id: number;
  phone: string;
  nickname: string | null;
  level: number;
  vipLevel: number;
  status: UserStatus;
  isValidInvite: boolean;
  contributedCommission: string;
  registeredAt: string;
  subDownlineCount: number;
}

/**
 * 团队统计数据
 * @description 依据：02.4-后台API接口清单.md 第20.4节
 */
export interface TeamStats {
  teamSummary: {
    level1Count: number;
    level2Count: number;
    level3Count: number;
    totalCount: number;
    activeCount: number;
    bannedCount: number;
    paidCount: number;
  };
  commissionSummary: {
    totalCommission: string;
    level1Commission: string;
    level2Commission: string;
    level3Commission: string;
  };
  validInviteSummary: {
    totalValidInvites: number;
    rechargePurchaseCount: number;
    completeSigninCount: number;
  };
}

// ================================
// 辅助函数
// ================================

/**
 * 格式化金额为两位小数字符串
 */
function formatAmount(value: Decimal | number | null): string {
  if (value === null || value === undefined) return '0.00';
  return Number(value).toFixed(2);
}

/**
 * 格式化用户信息为上级简要信息（用于 20.1 团队关系查询）
 * @description 依据：02.4-后台API接口清单.md 第20.1节 - 只返回 id、phone、nickname
 */
function formatUplineSimpleInfo(user: {
  id: number;
  phone: string;
  nickname: string | null;
} | null): UplineSimpleInfo | null {
  if (!user) return null;
  return {
    id: user.id,
    phone: user.phone,
    nickname: user.nickname,
  };
}

/**
 * 格式化用户信息为上级完整信息（用于 20.2 上级链路追溯）
 * @description 依据：02.4-后台API接口清单.md 第20.2节 - 返回完整用户信息
 */
function formatUplineUserInfo(user: {
  id: number;
  phone: string;
  nickname: string | null;
  vipLevel: number;
  status: UserStatus;
  createdAt: Date;
} | null): UplineUserInfo | null {
  if (!user) return null;
  return {
    id: user.id,
    phone: user.phone,
    nickname: user.nickname,
    vipLevel: user.vipLevel,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  };
}

// ================================
// 团队关系管理服务类
// ================================

/**
 * 后台团队关系管理服务类
 * @description 提供团队关系查询、上下级追溯、团队统计等功能
 */
export class AdminTeamService {
  /**
   * 团队关系查询
   * @description 依据：02.4-后台API接口清单.md 第20.1节
   * 支持按 userId、phone、inviteCode 查询
   * @param params 查询参数（userId、phone、inviteCode 三选一）
   * @returns 团队关系查询结果
   */
  async queryTeamRelation(params: {
    userId?: number;
    phone?: string;
    inviteCode?: string;
  }): Promise<TeamQueryResult> {
    const { userId, phone, inviteCode } = params;

    // 构建查询条件
    let whereClause: Prisma.UserWhereInput;
    if (userId) {
      whereClause = { id: userId };
    } else if (phone) {
      whereClause = { phone };
    } else if (inviteCode) {
      whereClause = { inviteCode };
    } else {
      throw new BusinessError('VALIDATION_ERROR', '请提供 userId、phone 或 inviteCode 参数', 400);
    }

    // 查询用户
    const user = await prisma.user.findFirst({
      where: whereClause,
      select: {
        id: true,
        phone: true,
        nickname: true,
        vipLevel: true,
        status: true,
        inviterId: true,
        level2InviterId: true,
        level3InviterId: true,
      },
    });

    if (!user) {
      throw new BusinessError('USER_NOT_FOUND', '用户不存在', 404);
    }

    // 并行查询上级用户和下线数量
    // 注意：20.1 upline 只需要 id、phone、nickname 三个字段
    const [level1Inviter, level2Inviter, level3Inviter, level1Count, level2Count, level3Count] =
      await Promise.all([
        // 一级上级
        user.inviterId
          ? prisma.user.findUnique({
              where: { id: user.inviterId },
              select: {
                id: true,
                phone: true,
                nickname: true,
              },
            })
          : null,
        // 二级上级
        user.level2InviterId
          ? prisma.user.findUnique({
              where: { id: user.level2InviterId },
              select: {
                id: true,
                phone: true,
                nickname: true,
              },
            })
          : null,
        // 三级上级
        user.level3InviterId
          ? prisma.user.findUnique({
              where: { id: user.level3InviterId },
              select: {
                id: true,
                phone: true,
                nickname: true,
              },
            })
          : null,
        // 一级下线数量
        prisma.user.count({ where: { inviterId: user.id } }),
        // 二级下线数量
        prisma.user.count({ where: { level2InviterId: user.id } }),
        // 三级下线数量
        prisma.user.count({ where: { level3InviterId: user.id } }),
      ]);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        vipLevel: user.vipLevel,
        status: user.status,
      },
      upline: {
        level1: formatUplineSimpleInfo(level1Inviter),
        level2: formatUplineSimpleInfo(level2Inviter),
        level3: formatUplineSimpleInfo(level3Inviter),
      },
      downlineSummary: {
        level1Count,
        level2Count,
        level3Count,
        totalCount: level1Count + level2Count + level3Count,
      },
    };
  }

  /**
   * 向上追溯上级链路
   * @description 依据：02.4-后台API接口清单.md 第20.2节
   * 返回完整三级上级信息
   * @param userId 用户ID
   * @returns 上级链路数组（最多3级）
   */
  async getUplineChain(userId: number): Promise<{ chain: UplineChainItem[] }> {
    // 查询用户的上级ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        inviterId: true,
        level2InviterId: true,
        level3InviterId: true,
      },
    });

    if (!user) {
      throw new BusinessError('USER_NOT_FOUND', '用户不存在', 404);
    }

    // 并行查询三级上级的详细信息
    const [level1, level2, level3] = await Promise.all([
      user.inviterId
        ? prisma.user.findUnique({
            where: { id: user.inviterId },
            select: {
              id: true,
              phone: true,
              nickname: true,
              vipLevel: true,
              status: true,
              createdAt: true,
            },
          })
        : null,
      user.level2InviterId
        ? prisma.user.findUnique({
            where: { id: user.level2InviterId },
            select: {
              id: true,
              phone: true,
              nickname: true,
              vipLevel: true,
              status: true,
              createdAt: true,
            },
          })
        : null,
      user.level3InviterId
        ? prisma.user.findUnique({
            where: { id: user.level3InviterId },
            select: {
              id: true,
              phone: true,
              nickname: true,
              vipLevel: true,
              status: true,
              createdAt: true,
            },
          })
        : null,
    ]);

    return {
      chain: [
        { level: 1, user: formatUplineUserInfo(level1) },
        { level: 2, user: formatUplineUserInfo(level2) },
        { level: 3, user: formatUplineUserInfo(level3) },
      ],
    };
  }

  /**
   * 向下展开成员树
   * @description 依据：02.4-后台API接口清单.md 第20.3节
   * 支持按级别筛选和分页
   * @param userId 用户ID
   * @param level 层级筛选（1=一级 | 2=二级 | 3=三级 | 不传=全部）
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 下级成员列表和分页信息
   */
  async getDownlineMembers(
    userId: number,
    level?: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    list: DownlineMember[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }> {
    // 验证用户存在
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      throw new BusinessError('USER_NOT_FOUND', '用户不存在', 404);
    }

    // 根据层级构建查询条件
    let whereClause: Prisma.UserWhereInput;
    if (level === 1) {
      whereClause = { inviterId: userId };
    } else if (level === 2) {
      whereClause = { level2InviterId: userId };
    } else if (level === 3) {
      whereClause = { level3InviterId: userId };
    } else {
      // 查询所有层级
      whereClause = {
        OR: [
          { inviterId: userId },
          { level2InviterId: userId },
          { level3InviterId: userId },
        ],
      };
    }

    // 查询总数和成员列表
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
          vipLevel: true,
          status: true,
          inviterId: true,
          level2InviterId: true,
          level3InviterId: true,
          hasRecharged: true,
          hasPurchasedAfterRecharge: true,
          signInCompleted: true,
          createdAt: true,
        },
      }),
    ]);

    // 获取用户ID列表
    const memberIds = users.map((u) => u.id);

    // 并行查询：有效邀请、返佣金额、下级数量
    const [validInvitations, commissions, subDownlineCounts] = await Promise.all([
      // 查询有效邀请
      prisma.validInvitation.findMany({
        where: {
          inviterId: userId,
          inviteeId: { in: memberIds },
        },
        select: { inviteeId: true },
      }),
      // 查询每个成员贡献的返佣
      prisma.commissionRecord.groupBy({
        by: ['sourceUserId'],
        where: {
          receiverId: userId,
          sourceUserId: { in: memberIds.length > 0 ? memberIds : [0] },
        },
        _sum: { amount: true },
      }),
      // 查询每个成员的下级数量（他们作为上级时的一级下线数量）
      memberIds.length > 0
        ? prisma.$queryRaw<Array<{ inviterId: number; count: bigint }>>`
            SELECT inviterId, COUNT(*) as count 
            FROM User 
            WHERE inviterId IN (${Prisma.join(memberIds)})
            GROUP BY inviterId
          `
        : [],
    ]);

    // 构建查找 Map
    const validInviteSet = new Set(validInvitations.map((v) => v.inviteeId));
    const commissionMap = new Map(commissions.map((c) => [c.sourceUserId, c._sum.amount]));
    const subCountMap = new Map(
      (subDownlineCounts as Array<{ inviterId: number; count: bigint }>).map((c) => [
        c.inviterId,
        Number(c.count),
      ])
    );

    // 确定成员层级的辅助函数
    const getMemberLevel = (member: (typeof users)[0]) => {
      if (member.inviterId === userId) return 1;
      if (member.level2InviterId === userId) return 2;
      if (member.level3InviterId === userId) return 3;
      return 0;
    };

    // 格式化成员列表
    const list: DownlineMember[] = users.map((member) => {
      // 判断是否为有效邀请
      // 依据：开发文档.md 第9节活动2 - 有效邀请定义
      // 被邀请人完成：充值 + 购买产品 或 完成7天签到
      const isValidInvite =
        validInviteSet.has(member.id) ||
        (member.hasRecharged && member.hasPurchasedAfterRecharge) ||
        member.signInCompleted;

      return {
        id: member.id,
        phone: member.phone,
        nickname: member.nickname,
        level: level ?? getMemberLevel(member),
        vipLevel: member.vipLevel,
        status: member.status,
        isValidInvite,
        contributedCommission: formatAmount(commissionMap.get(member.id) ?? null),
        registeredAt: member.createdAt.toISOString(),
        subDownlineCount: subCountMap.get(member.id) || 0,
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

  /**
   * 获取团队统计数据
   * @description 依据：02.4-后台API接口清单.md 第20.4节
   * 含团队人数和返佣汇总
   * @param userId 用户ID
   * @returns 团队统计数据
   */
  async getTeamStats(userId: number): Promise<TeamStats> {
    // 验证用户存在
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      throw new BusinessError('USER_NOT_FOUND', '用户不存在', 404);
    }

    // 构建所有下级的查询条件
    const allDownlineWhere: Prisma.UserWhereInput = {
      OR: [
        { inviterId: userId },
        { level2InviterId: userId },
        { level3InviterId: userId },
      ],
    };

    // 并行查询所有统计数据
    const [
      level1Count,
      level2Count,
      level3Count,
      activeCount,
      bannedCount,
      paidCount,
      levelCommissions,
      validInvitesByType,
    ] = await Promise.all([
      // 一级下线数量
      prisma.user.count({ where: { inviterId: userId } }),
      // 二级下线数量
      prisma.user.count({ where: { level2InviterId: userId } }),
      // 三级下线数量
      prisma.user.count({ where: { level3InviterId: userId } }),
      // 活跃成员数量（状态为 ACTIVE）
      prisma.user.count({ where: { ...allDownlineWhere, status: 'ACTIVE' } }),
      // 封禁成员数量（状态为 BANNED）
      prisma.user.count({ where: { ...allDownlineWhere, status: 'BANNED' } }),
      // 已付费成员数量（购买过付费产品）
      prisma.user.count({
        where: {
          ...allDownlineWhere,
          hasPurchasedOther: true,
        },
      }),
      // 按级别汇总返佣
      prisma.commissionRecord.groupBy({
        by: ['level'],
        where: { receiverId: userId },
        _sum: { amount: true },
      }),
      // 查询有效邀请详情（按类型统计）
      Promise.all([
        // 通过充值+购买的有效邀请数量
        prisma.user.count({
          where: {
            inviterId: userId,
            hasRecharged: true,
            hasPurchasedAfterRecharge: true,
          },
        }),
        // 通过完成签到的有效邀请数量
        prisma.user.count({
          where: {
            inviterId: userId,
            signInCompleted: true,
          },
        }),
        // 有效邀请记录总数
        prisma.validInvitation.count({
          where: { inviterId: userId },
        }),
      ]),
    ]);

    // 解构有效邀请统计
    const [rechargePurchaseCount, completeSigninCount, totalValidInvites] = validInvitesByType;

    // 计算返佣汇总
    const commissionByLevel: Record<string, Decimal> = {};
    for (const stat of levelCommissions) {
      commissionByLevel[stat.level] = stat._sum.amount || new Decimal(0);
    }

    const level1Commission = commissionByLevel['LEVEL_1'] || new Decimal(0);
    const level2Commission = commissionByLevel['LEVEL_2'] || new Decimal(0);
    const level3Commission = commissionByLevel['LEVEL_3'] || new Decimal(0);
    const totalCommission = level1Commission.add(level2Commission).add(level3Commission);

    return {
      teamSummary: {
        level1Count,
        level2Count,
        level3Count,
        totalCount: level1Count + level2Count + level3Count,
        activeCount,
        bannedCount,
        paidCount,
      },
      commissionSummary: {
        totalCommission: formatAmount(totalCommission),
        level1Commission: formatAmount(level1Commission),
        level2Commission: formatAmount(level2Commission),
        level3Commission: formatAmount(level3Commission),
      },
      validInviteSummary: {
        totalValidInvites,
        rechargePurchaseCount,
        completeSigninCount,
      },
    };
  }
}

// 单例导出
export const adminTeamService = new AdminTeamService();
