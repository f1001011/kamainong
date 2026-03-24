/**
 * @file 管理员活动服务
 * @description 后台管理端 - 活动管理服务，包含活动配置、统计、明细查询
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第8节 - 活动管理接口
 */

import { prisma, Prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import type { SignInType, ValidInviteType } from '@honeywell/database';

// ================================
// 类型定义
// ================================

/**
 * 活动列表项（后台管理）
 */
export interface AdminActivityListItem {
  code: string;
  name: string;
  isActive: boolean;
  participantCount: number;
  totalReward: string;
}

/**
 * 活动详情（后台管理）
 */
export interface AdminActivityDetail {
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  config: Record<string, unknown>;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 活动统计数据
 */
export interface ActivityStats {
  participantCount: number;
  totalReward: string;
  dailyStats: {
    date: string;
    participants: number;
    reward: string;
  }[];
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * 分页结果
 */
export interface PaginatedResult<T> {
  list: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 有效邀请明细筛选参数
 */
export interface ValidInvitationFilterParams extends PaginationParams {
  inviterId?: number;
  inviterPhone?: string;
  inviteeId?: number;
  inviteePhone?: string;
  validType?: ValidInviteType;
  startDate?: string;
  endDate?: string;
}

/**
 * 有效邀请明细项
 */
export interface ValidInvitationItem {
  id: number;
  inviterId: number;
  inviterPhone: string;
  inviterNickname: string | null;
  inviteeId: number;
  inviteePhone: string;
  inviteeNickname: string | null;
  inviteeRegisteredAt: Date;
  validType: ValidInviteType;
  validAt: Date;
  isRewardClaimed: boolean;
}

/**
 * 拉新奖励领取明细筛选参数
 */
export interface InviteRewardClaimFilterParams extends PaginationParams {
  userId?: number;
  userPhone?: string;
  rewardLevel?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * 拉新奖励领取明细项
 * @description 依据文档8.5节，rewardLevel表示档位的count值（如10人档）
 */
export interface InviteRewardClaimItem {
  id: number;
  userId: number;
  userPhone: string;
  userNickname: string | null;
  rewardLevel: number;
  amount: string;
  validInviteCountAtClaim: number;
  createdAt: Date;
}

/**
 * SVIP签到明细筛选参数
 */
export interface SvipSignInFilterParams extends PaginationParams {
  userId?: number;
  userPhone?: string;
  svipLevel?: number;
  signDate?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * SVIP签到明细项
 */
export interface SvipSignInItem {
  id: number;
  userId: number;
  userPhone: string;
  userNickname: string | null;
  svipLevel: number;
  amount: string;
  signDate: string;
  createdAt: Date;
}

/**
 * 连单奖励明细筛选参数
 */
export interface CollectionClaimFilterParams extends PaginationParams {
  userId?: number;
  userPhone?: string;
  rewardLevel?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * 连单奖励明细项
 */
export interface CollectionClaimItem {
  id: number;
  userId: number;
  userPhone: string;
  userNickname: string | null;
  rewardLevel: number;
  requiredProducts: string[];
  amount: string;
  purchasedProductsAtClaim: string[];
  createdAt: Date;
}

/**
 * 普通签到明细筛选参数
 */
export interface NormalSignInFilterParams extends PaginationParams {
  userId?: number;
  userPhone?: string;
  signDate?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * 普通签到明细项
 */
export interface NormalSignInItem {
  id: number;
  userId: number;
  userPhone: string;
  userNickname: string | null;
  amount: string;
  signDate: string;
  createdAt: Date;
}

// ================================
// 活动代码常量
// ================================

const ACTIVITY_CODES = {
  NORMAL_SIGNIN: 'NORMAL_SIGNIN',
  SVIP_SIGNIN: 'SVIP_SIGNIN',
  INVITE_REWARD: 'INVITE_REWARD',
  COLLECTION_BONUS: 'COLLECTION_BONUS',
} as const;

// ================================
// 管理员活动服务类
// ================================

export class AdminActivityService {
  /**
   * 获取活动列表
   * @description 依据：02.4-后台API接口清单.md 第8.1节
   */
  async getActivityList(): Promise<AdminActivityListItem[]> {
    // 获取所有活动
    const activities = await prisma.activity.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    // 并行查询各活动的统计数据
    const results = await Promise.all(
      activities.map(async (activity) => {
        const stats = await this.getActivityQuickStats(activity.code);
        return {
          code: activity.code,
          name: activity.name,
          isActive: activity.isActive,
          participantCount: stats.participantCount,
          totalReward: stats.totalReward,
        };
      })
    );

    return results;
  }

  /**
   * 获取活动详情
   * @description 依据：02.4-后台API接口清单.md 第8.2节
   */
  async getActivityDetail(code: string): Promise<AdminActivityDetail | null> {
    const activity = await prisma.activity.findUnique({
      where: { code },
    });

    if (!activity) {
      return null;
    }

    return {
      code: activity.code,
      name: activity.name,
      description: activity.description,
      icon: activity.icon,
      isActive: activity.isActive,
      config: activity.config as Record<string, unknown>,
      sortOrder: activity.sortOrder,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    };
  }

  /**
   * 更新活动配置
   * @description 依据：02.4-后台API接口清单.md 第8.2节
   */
  async updateActivity(
    code: string,
    data: {
      isActive?: boolean;
      config?: Record<string, unknown>;
    }
  ): Promise<AdminActivityDetail | null> {
    const activity = await prisma.activity.findUnique({
      where: { code },
    });

    if (!activity) {
      return null;
    }

    // 合并配置
    const newConfig = data.config
      ? { ...(activity.config as Record<string, unknown>), ...data.config }
      : activity.config;

    const updated = await prisma.activity.update({
      where: { code },
      data: {
        isActive: data.isActive ?? activity.isActive,
        config: newConfig ? (newConfig as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });

    return {
      code: updated.code,
      name: updated.name,
      description: updated.description,
      icon: updated.icon,
      isActive: updated.isActive,
      config: updated.config as Record<string, unknown>,
      sortOrder: updated.sortOrder,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * 获取活动统计数据
   * @description 依据：02.4-后台API接口清单.md 第8.3节
   */
  async getActivityStats(
    code: string,
    startDate?: string,
    endDate?: string
  ): Promise<ActivityStats> {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    let participantCount = 0;
    let totalReward = new Decimal(0);
    const dailyStatsMap = new Map<string, { participants: Set<number>; reward: Decimal }>();

    // 根据活动类型查询不同的表
    switch (code) {
      case ACTIVITY_CODES.NORMAL_SIGNIN:
      case ACTIVITY_CODES.SVIP_SIGNIN: {
        const signType = code === ACTIVITY_CODES.NORMAL_SIGNIN ? 'NORMAL' : 'SVIP';
        const records = await prisma.signInRecord.findMany({
          where: {
            signType: signType as SignInType,
            createdAt: { gte: start, lte: end },
          },
          select: {
            userId: true,
            amount: true,
            signDate: true,
          },
        });

        const userIds = new Set<number>();
        records.forEach((record) => {
          userIds.add(record.userId);
          totalReward = totalReward.add(record.amount);

          // 按日期统计
          const dateKey = record.signDate.toISOString().split('T')[0];
          if (!dailyStatsMap.has(dateKey)) {
            dailyStatsMap.set(dateKey, { participants: new Set(), reward: new Decimal(0) });
          }
          const dayStats = dailyStatsMap.get(dateKey)!;
          dayStats.participants.add(record.userId);
          dayStats.reward = dayStats.reward.add(record.amount);
        });
        participantCount = userIds.size;
        break;
      }

      case ACTIVITY_CODES.INVITE_REWARD:
      case ACTIVITY_CODES.COLLECTION_BONUS: {
        const rewards = await prisma.activityReward.findMany({
          where: {
            activityCode: code,
            createdAt: { gte: start, lte: end },
          },
          select: {
            userId: true,
            amount: true,
            createdAt: true,
          },
        });

        const userIds = new Set<number>();
        rewards.forEach((reward) => {
          userIds.add(reward.userId);
          totalReward = totalReward.add(reward.amount);

          // 按日期统计
          const dateKey = reward.createdAt.toISOString().split('T')[0];
          if (!dailyStatsMap.has(dateKey)) {
            dailyStatsMap.set(dateKey, { participants: new Set(), reward: new Decimal(0) });
          }
          const dayStats = dailyStatsMap.get(dateKey)!;
          dayStats.participants.add(reward.userId);
          dayStats.reward = dayStats.reward.add(reward.amount);
        });
        participantCount = userIds.size;
        break;
      }
    }

    // 转换日期统计数据
    const dailyStats = Array.from(dailyStatsMap.entries())
      .map(([date, stats]) => ({
        date,
        participants: stats.participants.size,
        reward: stats.reward.toFixed(2),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      participantCount,
      totalReward: totalReward.toFixed(2),
      dailyStats,
    };
  }

  /**
   * 获取有效邀请明细
   * @description 依据：02.4-后台API接口清单.md 第8.4节
   */
  async getValidInvitations(
    params: ValidInvitationFilterParams
  ): Promise<PaginatedResult<ValidInvitationItem> & { summary: { totalCount: number; rechargePurchaseCount: number; completeSigninCount: number } }> {
    const { page, pageSize, inviterId, inviterPhone, inviteeId, inviteePhone, validType, startDate, endDate } = params;

    // 构建查询条件
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (inviterId) {
      where.inviterId = inviterId;
    }

    if (inviterPhone) {
      where.inviter = { phone: { contains: inviterPhone } };
    }

    if (inviteeId) {
      where.inviteeId = inviteeId;
    }

    if (inviteePhone) {
      where.invitee = { ...(where.invitee || {}), phone: { contains: inviteePhone } };
    }

    if (validType) {
      where.validType = validType;
    }

    if (startDate || endDate) {
      where.validAt = {};
      if (startDate) {
        where.validAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.validAt.lte = end;
      }
    }

    // 查询总数
    const total = await prisma.validInvitation.count({ where });

    // 查询列表
    const records = await prisma.validInvitation.findMany({
      where,
      include: {
        inviter: { select: { phone: true, nickname: true } },
        invitee: { select: { phone: true, nickname: true, createdAt: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { validAt: 'desc' },
    });

    // 统计汇总（在当前筛选条件下的统计）
    const baseWhere = { ...where };
    delete baseWhere.validType;

    const [rechargePurchaseCount, completeSigninCount] = await Promise.all([
      prisma.validInvitation.count({ where: { ...baseWhere, validType: 'RECHARGE_PURCHASE' } }),
      prisma.validInvitation.count({ where: { ...baseWhere, validType: 'COMPLETE_SIGNIN' } }),
    ]);

    const list: ValidInvitationItem[] = records.map((record) => ({
      id: record.id,
      inviterId: record.inviterId,
      inviterPhone: record.inviter.phone,
      inviterNickname: record.inviter.nickname,
      inviteeId: record.inviteeId,
      inviteePhone: record.invitee.phone,
      inviteeNickname: record.invitee.nickname,
      inviteeRegisteredAt: record.invitee.createdAt,
      validType: record.validType,
      validAt: record.validAt,
      isRewardClaimed: record.isRewardClaimed,
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
        totalCount: rechargePurchaseCount + completeSigninCount,
        rechargePurchaseCount,
        completeSigninCount,
      },
    };
  }

  /**
   * 获取拉新奖励领取明细
   * @description 依据：02.4-后台API接口清单.md 第8.5节
   * @note rewardLevel存储的是档位的count值（如10人档），而非档位索引
   */
  async getInviteRewardClaims(
    params: InviteRewardClaimFilterParams
  ): Promise<PaginatedResult<InviteRewardClaimItem>> {
    const { page, pageSize, userId, userPhone, rewardLevel, startDate, endDate } = params;

    // 构建查询条件
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      activityCode: ACTIVITY_CODES.INVITE_REWARD,
    };

    if (userId) {
      where.userId = userId;
    }

    if (userPhone) {
      where.user = { phone: { contains: userPhone } };
    }

    if (rewardLevel !== undefined) {
      where.rewardLevel = rewardLevel;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // 查询总数
    const total = await prisma.activityReward.count({ where });

    // 查询列表
    const records = await prisma.activityReward.findMany({
      where,
      include: {
        user: { select: { phone: true, nickname: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    });

    // 获取每个用户领取时的有效邀请数量
    const userIds = [...new Set(records.map((r) => r.userId))];
    const validInviteCounts = await Promise.all(
      userIds.map(async (uid) => {
        const count = await prisma.validInvitation.count({
          where: { inviterId: uid },
        });
        return { userId: uid, count };
      })
    );
    const validInviteCountMap = new Map(validInviteCounts.map((v) => [v.userId, v.count]));

    const list: InviteRewardClaimItem[] = records.map((record) => ({
      id: record.id,
      userId: record.userId,
      userPhone: record.user.phone,
      userNickname: record.user.nickname,
      rewardLevel: record.rewardLevel,
      amount: record.amount.toFixed(2),
      validInviteCountAtClaim: validInviteCountMap.get(record.userId) || 0,
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
    };
  }

  /**
   * 获取SVIP签到明细
   * @description 依据：02.4-后台API接口清单.md 第8.6节
   */
  async getSvipSignInRecords(
    params: SvipSignInFilterParams
  ): Promise<PaginatedResult<SvipSignInItem>> {
    const { page, pageSize, userId, userPhone, svipLevel, signDate, startDate, endDate } = params;

    // 构建查询条件
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      signType: 'SVIP' as SignInType,
    };

    if (userId) {
      where.userId = userId;
    }

    if (userPhone) {
      where.user = { phone: { contains: userPhone } };
    }

    // 如果指定了SVIP等级，需要筛选用户
    if (svipLevel !== undefined) {
      where.user = { ...(where.user || {}), svipLevel };
    }

    if (signDate) {
      where.signDate = new Date(signDate);
    } else if (startDate || endDate) {
      where.signDate = {};
      if (startDate) {
        where.signDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.signDate.lte = new Date(endDate);
      }
    }

    // 查询总数
    const total = await prisma.signInRecord.count({ where });

    // 查询列表
    const records = await prisma.signInRecord.findMany({
      where,
      include: {
        user: { select: { phone: true, nickname: true, svipLevel: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    });

    const list: SvipSignInItem[] = records.map((record) => ({
      id: record.id,
      userId: record.userId,
      userPhone: record.user.phone,
      userNickname: record.user.nickname,
      svipLevel: record.user.svipLevel,
      amount: record.amount.toFixed(2),
      signDate: record.signDate.toISOString().split('T')[0],
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
    };
  }

  /**
   * 获取连单奖励明细
   * @description 依据：02.4-后台API接口清单.md 第8.7节
   */
  async getCollectionClaims(
    params: CollectionClaimFilterParams
  ): Promise<PaginatedResult<CollectionClaimItem>> {
    const { page, pageSize, userId, userPhone, rewardLevel, startDate, endDate } = params;

    // 构建查询条件
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      activityCode: ACTIVITY_CODES.COLLECTION_BONUS,
    };

    if (userId) {
      where.userId = userId;
    }

    if (userPhone) {
      where.user = { phone: { contains: userPhone } };
    }

    if (rewardLevel !== undefined) {
      where.rewardLevel = rewardLevel;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // 查询总数
    const total = await prisma.activityReward.count({ where });

    // 查询列表
    const records = await prisma.activityReward.findMany({
      where,
      include: {
        user: { select: { phone: true, nickname: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    });

    // 获取活动配置（获取档位所需产品）
    const activity = await prisma.activity.findUnique({
      where: { code: ACTIVITY_CODES.COLLECTION_BONUS },
    });
    const config = activity?.config as { tiers?: { products: string[]; reward: number }[] } | null;
    const tierConfigs = config?.tiers || [];

    // 获取用户已购买的VIP产品
    const userIds = [...new Set(records.map((r) => r.userId))];
    const userPurchasesMap = new Map<number, string[]>();

    if (userIds.length > 0) {
      const purchases = await prisma.userProductPurchase.findMany({
        where: {
          userId: { in: userIds },
          product: { series: 'VIP' },
        },
        include: {
          product: { select: { code: true } },
        },
      });

      purchases.forEach((purchase) => {
        if (!userPurchasesMap.has(purchase.userId)) {
          userPurchasesMap.set(purchase.userId, []);
        }
        userPurchasesMap.get(purchase.userId)!.push(purchase.product.code);
      });
    }

    const list: CollectionClaimItem[] = records.map((record) => {
      // rewardLevel是档位索引（从1开始），需要获取对应配置
      const tierConfig = tierConfigs[record.rewardLevel - 1];
      return {
        id: record.id,
        userId: record.userId,
        userPhone: record.user.phone,
        userNickname: record.user.nickname,
        rewardLevel: record.rewardLevel,
        requiredProducts: tierConfig?.products || [],
        amount: record.amount.toFixed(2),
        purchasedProductsAtClaim: userPurchasesMap.get(record.userId) || [],
        createdAt: record.createdAt,
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
   * 获取普通签到明细
   * @description 依据：02.4-后台API接口清单.md 第8.8节
   */
  async getNormalSignInRecords(
    params: NormalSignInFilterParams
  ): Promise<PaginatedResult<NormalSignInItem>> {
    const { page, pageSize, userId, userPhone, signDate, startDate, endDate } = params;

    // 构建查询条件
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      signType: 'NORMAL' as SignInType,
    };

    if (userId) {
      where.userId = userId;
    }

    if (userPhone) {
      where.user = { phone: { contains: userPhone } };
    }

    if (signDate) {
      where.signDate = new Date(signDate);
    } else if (startDate || endDate) {
      where.signDate = {};
      if (startDate) {
        where.signDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.signDate.lte = new Date(endDate);
      }
    }

    // 查询总数
    const total = await prisma.signInRecord.count({ where });

    // 查询列表
    const records = await prisma.signInRecord.findMany({
      where,
      include: {
        user: { select: { phone: true, nickname: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    });

    const list: NormalSignInItem[] = records.map((record) => ({
      id: record.id,
      userId: record.userId,
      userPhone: record.user.phone,
      userNickname: record.user.nickname,
      amount: record.amount.toFixed(2),
      signDate: record.signDate.toISOString().split('T')[0],
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
    };
  }

  // ================================
  // 私有辅助方法
  // ================================

  /**
   * 获取活动快速统计（用于列表展示）
   */
  private async getActivityQuickStats(code: string): Promise<{ participantCount: number; totalReward: string }> {
    let participantCount = 0;
    let totalReward = new Decimal(0);

    switch (code) {
      case ACTIVITY_CODES.NORMAL_SIGNIN:
      case ACTIVITY_CODES.SVIP_SIGNIN: {
        const signType = code === ACTIVITY_CODES.NORMAL_SIGNIN ? 'NORMAL' : 'SVIP';

        // 获取参与人数（去重）
        const distinctUsers = await prisma.signInRecord.groupBy({
          by: ['userId'],
          where: { signType: signType as SignInType },
        });
        participantCount = distinctUsers.length;

        // 获取总发放奖励
        const result = await prisma.signInRecord.aggregate({
          where: { signType: signType as SignInType },
          _sum: { amount: true },
        });
        totalReward = result._sum.amount || new Decimal(0);
        break;
      }

      case ACTIVITY_CODES.INVITE_REWARD:
      case ACTIVITY_CODES.COLLECTION_BONUS: {
        // 获取参与人数（去重）
        const distinctUsers = await prisma.activityReward.groupBy({
          by: ['userId'],
          where: { activityCode: code },
        });
        participantCount = distinctUsers.length;

        // 获取总发放奖励
        const result = await prisma.activityReward.aggregate({
          where: { activityCode: code },
          _sum: { amount: true },
        });
        totalReward = result._sum.amount || new Decimal(0);
        break;
      }
    }

    return {
      participantCount,
      totalReward: totalReward.toFixed(2),
    };
  }
}

// 单例导出
export const adminActivityService = new AdminActivityService();
