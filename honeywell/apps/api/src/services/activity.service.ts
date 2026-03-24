/**
 * @file 活动服务
 * @description 处理拉新裂变和连单奖励活动的状态查询与奖励领取
 * @depends 开发文档/开发文档.md 第9.2节 - 拉新裂变活动
 * @depends 开发文档/开发文档.md 第9.3节 - 连单奖励活动
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第11节 - 活动接口
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.6节 - Activity表、ActivityReward表、ValidInvitation表
 */

import { prisma } from '@/lib/prisma';
import { withLock, CACHE_KEYS, LOCK_TTL, deleteCache } from '@/lib/redis';
import { Errors } from '@/lib/errors';
import { Decimal } from '@prisma/client/runtime/library';
import type { Activity } from '@honeywell/database';

// ================================
// 类型定义
// ================================

/**
 * 阶梯状态枚举
 * @description 依据：02.3-前端API接口清单.md 第11.2节
 * - LOCKED: 未达成条件
 * - CLAIMABLE: 已达成，可领取
 * - CLAIMED: 已领取
 */
export type TierStatus = 'LOCKED' | 'CLAIMABLE' | 'CLAIMED';

/**
 * 活动列表项
 */
export interface ActivityListItem {
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  hasClaimable: boolean;  // 是否有可领取的奖励（红点提示）
  sortOrder: number;
}

/**
 * 拉新裂变阶梯
 */
export interface InviteTier {
  tier: number;           // 阶梯序号
  requiredCount: number;  // 所需邀请数
  reward: string;         // 奖励金额（Decimal字符串）
  status: TierStatus;     // 状态
}

/**
 * 拉新裂变活动状态
 */
export interface InviteActivityStatus {
  activityName: string;
  activityDesc: string | null;
  validInviteCount: number;   // 当前有效邀请人数
  tiers: InviteTier[];
}

/**
 * 连单奖励所需产品
 */
export interface CollectionRequiredProduct {
  id: number;
  name: string;
  isPurchased: boolean;
}

/**
 * 连单奖励阶梯
 */
export interface CollectionTier {
  tier: number;                           // 阶梯序号
  name: string | null;                    // 阶梯名称
  requiredProducts: CollectionRequiredProduct[];  // 所需产品组合
  reward: string;                         // 奖励金额（Decimal字符串）
  status: TierStatus;                     // 状态
}

/**
 * 连单奖励活动状态
 */
export interface CollectionActivityStatus {
  activityName: string;
  activityDesc: string | null;
  prerequisite: {
    description: string;
    isMet: boolean;       // 是否满足前置条件（已购买体验产品）
  };
  purchasedProducts: {    // 已购买的VIP产品列表
    id: number;
    name: string;
    icon: string | null;
  }[];
  tiers: CollectionTier[];
}

/**
 * 领取奖励结果
 */
export interface ClaimRewardResult {
  tier: number;
  reward: string;
  balanceAfter: string;
}

// ================================
// 活动代码常量（禁止硬编码）
// ================================

const ACTIVITY_CODES = {
  INVITE_REWARD: 'INVITE_REWARD',
  COLLECTION_BONUS: 'COLLECTION_BONUS',
  WEEKLY_SALARY: 'WEEKLY_SALARY',
  PRIZE_POOL: 'PRIZE_POOL',
  SPIN_WHEEL: 'SPIN_WHEEL',
  COMMUNITY: 'COMMUNITY',
  SVIP: 'SVIP',
} as const;

// ================================
// 活动服务类
// ================================

export class ActivityService {
  /**
   * 获取活动列表
   * @description 依据：02.3-前端API接口清单.md 第11.1节
   * @param userId 用户ID
   * @returns 活动列表
   */
  async getActivityList(userId: number): Promise<ActivityListItem[]> {
    // 1. 获取所有启用的活动（排除签到类活动，签到在单独模块）
    const activities = await prisma.activity.findMany({
      where: {
        isActive: true,
        code: {
          in: [
            ACTIVITY_CODES.INVITE_REWARD,
            ACTIVITY_CODES.COLLECTION_BONUS,
            ACTIVITY_CODES.WEEKLY_SALARY,
            ACTIVITY_CODES.PRIZE_POOL,
            ACTIVITY_CODES.SPIN_WHEEL,
            ACTIVITY_CODES.COMMUNITY,
            ACTIVITY_CODES.SVIP,
          ],
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // 2. 并行查询各活动的可领取状态
    const results = await Promise.all(
      activities.map(async (activity) => {
        let hasClaimable = false;

        if (activity.code === ACTIVITY_CODES.INVITE_REWARD) {
          hasClaimable = await this.checkInviteHasClaimable(userId, activity);
        } else if (activity.code === ACTIVITY_CODES.COLLECTION_BONUS) {
          hasClaimable = await this.checkCollectionHasClaimable(userId, activity);
        } else if (activity.code === ACTIVITY_CODES.SVIP) {
          const { getUserSvipQualifications } = await import('./svip-reward.service');
          const quals = await getUserSvipQualifications(userId);
          hasClaimable = quals.length > 0;
        }

        return {
          code: activity.code,
          name: activity.name,
          description: activity.description,
          icon: activity.icon,
          isActive: activity.isActive,
          hasClaimable,
          sortOrder: activity.sortOrder,
        };
      })
    );

    return results;
  }

  /**
   * 获取拉新裂变活动状态
   * @description 依据：02.3-前端API接口清单.md 第11.2节
   * @param userId 用户ID
   * @returns 拉新裂变活动状态
   */
  async getInviteActivityStatus(userId: number): Promise<InviteActivityStatus> {
    // 1. 获取活动配置
    const activity = await this.getActivity(ACTIVITY_CODES.INVITE_REWARD);

    // 2. 统计用户的有效邀请人数
    const validInviteCount = await prisma.validInvitation.count({
      where: { inviterId: userId },
    });

    // 3. 获取用户已领取的奖励记录
    const claimedRewards = await prisma.activityReward.findMany({
      where: {
        userId,
        activityCode: ACTIVITY_CODES.INVITE_REWARD,
      },
      select: { rewardLevel: true },
    });
    const claimedLevels = new Set(claimedRewards.map((r) => r.rewardLevel));

    // 4. 解析阶梯配置，计算状态
    const config = activity.config as { tiers?: { count: number; reward: number }[] } | null;
    const tierConfigs = config?.tiers || [];

    const tiers: InviteTier[] = tierConfigs.map((tierConfig, index) => {
      const tierNumber = index + 1;
      let status: TierStatus;

      if (claimedLevels.has(tierNumber)) {
        status = 'CLAIMED';
      } else if (validInviteCount >= tierConfig.count) {
        status = 'CLAIMABLE';
      } else {
        status = 'LOCKED';
      }

      return {
        tier: tierNumber,
        requiredCount: tierConfig.count,
        reward: new Decimal(tierConfig.reward).toFixed(2),
        status,
      };
    });

    return {
      activityName: activity.name,
      activityDesc: activity.description,
      validInviteCount,
      tiers,
    };
  }

  /**
   * 领取邀请奖励
   * @description 依据：02.3-前端API接口清单.md 第11.3节
   * @param userId 用户ID
   * @param tier 阶梯序号
   * @returns 领取结果
   */
  async claimInviteReward(userId: number, tier: number): Promise<ClaimRewardResult> {
    // 使用分布式锁防止并发领取
    const lockKey = CACHE_KEYS.LOCK.REWARD(userId, ACTIVITY_CODES.INVITE_REWARD);

    return withLock(lockKey, LOCK_TTL.REWARD, async () => {
      // 1. 获取活动配置
      const activity = await this.getActivity(ACTIVITY_CODES.INVITE_REWARD);

      // 2. 解析阶梯配置
      const config = activity.config as { tiers?: { count: number; reward: number }[] } | null;
      const tierConfigs = config?.tiers || [];
      const tierConfig = tierConfigs[tier - 1];

      if (!tierConfig) {
        throw Errors.rewardNotAvailable();
      }

      // 3. 检查是否已领取
      const existingReward = await prisma.activityReward.findUnique({
        where: {
          userId_activityCode_rewardLevel: {
            userId,
            activityCode: ACTIVITY_CODES.INVITE_REWARD,
            rewardLevel: tier,
          },
        },
      });

      if (existingReward) {
        throw Errors.rewardAlreadyClaimed();
      }

      // 4. 检查是否达到领取条件
      const validInviteCount = await prisma.validInvitation.count({
        where: { inviterId: userId },
      });

      if (validInviteCount < tierConfig.count) {
        throw Errors.rewardNotAvailable();
      }

      // 5. 获取用户当前余额
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { availableBalance: true },
      });

      if (!user) {
        throw Errors.userNotFound();
      }

      const rewardAmount = new Decimal(tierConfig.reward);
      const newBalance = user.availableBalance.add(rewardAmount);

      // 6. 事务处理：创建领取记录、更新余额、创建流水
      await prisma.$transaction(async (tx) => {
        // 创建活动奖励领取记录
        await tx.activityReward.create({
          data: {
            userId,
            activityCode: ACTIVITY_CODES.INVITE_REWARD,
            rewardLevel: tier,
            amount: rewardAmount,
          },
        });

        // 更新用户余额
        await tx.user.update({
          where: { id: userId },
          data: { availableBalance: newBalance },
        });

        // 创建资金流水
        await tx.transaction.create({
          data: {
            userId,
            type: 'ACTIVITY_REWARD',
            amount: rewardAmount,
            balanceAfter: newBalance,
            remark: `拉新裂变奖励-阶梯${tier}`,
          },
        });
      });

      // 7. 清除用户缓存
      await deleteCache(CACHE_KEYS.USER.INFO(userId));

      return {
        tier,
        reward: rewardAmount.toFixed(2),
        balanceAfter: newBalance.toFixed(2),
      };
    });
  }

  /**
   * 获取连单奖励活动状态
   * @description 依据：02.3-前端API接口清单.md 第11.4节
   * @param userId 用户ID
   * @returns 连单奖励活动状态
   */
  async getCollectionActivityStatus(userId: number): Promise<CollectionActivityStatus> {
    // 1. 获取活动配置
    const activity = await this.getActivity(ACTIVITY_CODES.COLLECTION_BONUS);

    // 2. 获取用户信息，判断前置条件（业务逻辑使用 hasPurchasedPaid，hasPurchasedPo0 向后兼容）
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hasPurchasedPo0: true, hasPurchasedPaid: true },
    });

    if (!user) {
      throw Errors.userNotFound();
    }

    // 前置条件：用户必须已购买过付费产品（hasPurchasedPaid），或体验产品（hasPurchasedPo0 向后兼容）
    const prerequisiteIsMet = user.hasPurchasedPaid || user.hasPurchasedPo0;

    // 3. 获取所有VIP系列产品
    const vipProducts = await prisma.product.findMany({
      where: { series: 'VIP', status: 'ACTIVE' },
      orderBy: { requireVipLevel: 'asc' },
      select: { id: true, code: true, name: true, mainImage: true, requireVipLevel: true },
    });

    // 4. 获取用户已购买的VIP产品
    const userPurchases = await prisma.userProductPurchase.findMany({
      where: {
        userId,
        product: { series: 'VIP' },
      },
      select: { productId: true },
    });
    const purchasedProductIds = new Set(userPurchases.map((p) => p.productId));

    // 5. 构建已购买的VIP产品列表
    const purchasedProducts = vipProducts
      .filter((p) => purchasedProductIds.has(p.id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        icon: p.mainImage,
      }));

    // 6. 获取用户已领取的奖励记录
    const claimedRewards = await prisma.activityReward.findMany({
      where: {
        userId,
        activityCode: ACTIVITY_CODES.COLLECTION_BONUS,
      },
      select: { rewardLevel: true },
    });
    const claimedLevels = new Set(claimedRewards.map((r) => r.rewardLevel));

    // 7. 解析阶梯配置，计算状态
    const config = activity.config as { 
      tiers?: { products: string[]; reward: number; name?: string }[];
      prerequisiteDescription?: string;  // 前置条件描述（后台配置）
    } | null;
    const tierConfigs = config?.tiers || [];

    // 前置条件描述：优先从活动配置读取，否则使用默认值
    const prerequisiteDescription = config?.prerequisiteDescription || 'قم بالإيداع وشراء منتج';

    // 创建产品代码到产品信息的映射
    const productCodeMap = new Map(vipProducts.map((p) => [p.code, p]));

    const tiers: CollectionTier[] = tierConfigs.map((tierConfig, index) => {
      const tierNumber = index + 1;

      // 解析所需产品
      const requiredProducts: CollectionRequiredProduct[] = tierConfig.products.map((productCode) => {
        const product = productCodeMap.get(productCode);
        return {
          id: product?.id || 0,
          name: product?.name || productCode,
          isPurchased: product ? purchasedProductIds.has(product.id) : false,
        };
      });

      // 判断是否集齐所有所需产品
      const allProductsPurchased = requiredProducts.every((p) => p.isPurchased);

      let status: TierStatus;
      if (claimedLevels.has(tierNumber)) {
        status = 'CLAIMED';
      } else if (prerequisiteIsMet && allProductsPurchased) {
        status = 'CLAIMABLE';
      } else {
        status = 'LOCKED';
      }

      return {
        tier: tierNumber,
        name: tierConfig.name || null,
        requiredProducts,
        reward: new Decimal(tierConfig.reward).toFixed(2),
        status,
      };
    });

    return {
      activityName: activity.name,
      activityDesc: activity.description,
      prerequisite: {
        description: prerequisiteDescription,  // 从活动配置读取
        isMet: prerequisiteIsMet,
      },
      purchasedProducts,
      tiers,
    };
  }

  /**
   * 领取连单奖励
   * @description 依据：02.3-前端API接口清单.md 第11.5节
   * @param userId 用户ID
   * @param tier 阶梯序号
   * @returns 领取结果
   */
  async claimCollectionReward(userId: number, tier: number): Promise<ClaimRewardResult> {
    // 使用分布式锁防止并发领取
    const lockKey = CACHE_KEYS.LOCK.REWARD(userId, ACTIVITY_CODES.COLLECTION_BONUS);

    return withLock(lockKey, LOCK_TTL.REWARD, async () => {
      // 1. 获取活动配置
      const activity = await this.getActivity(ACTIVITY_CODES.COLLECTION_BONUS);

      // 2. 解析阶梯配置
      const config = activity.config as { 
        tiers?: { products: string[]; reward: number; name?: string }[] 
      } | null;
      const tierConfigs = config?.tiers || [];
      const tierConfig = tierConfigs[tier - 1];

      if (!tierConfig) {
        throw Errors.rewardNotAvailable();
      }

      // 3. 获取用户信息，判断前置条件（业务逻辑使用 hasPurchasedPaid，hasPurchasedPo0 向后兼容）
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { hasPurchasedPo0: true, hasPurchasedPaid: true, availableBalance: true },
      });

      if (!user) {
        throw Errors.userNotFound();
      }

      // 检查前置条件：必须已购买付费产品或体验产品
      if (!user.hasPurchasedPaid && !user.hasPurchasedPo0) {
        throw Errors.prerequisiteNotMet();
      }

      // 4. 检查是否已领取
      const existingReward = await prisma.activityReward.findUnique({
        where: {
          userId_activityCode_rewardLevel: {
            userId,
            activityCode: ACTIVITY_CODES.COLLECTION_BONUS,
            rewardLevel: tier,
          },
        },
      });

      if (existingReward) {
        throw Errors.rewardAlreadyClaimed();
      }

      // 5. 获取所需产品信息
      const vipProducts = await prisma.product.findMany({
        where: { 
          code: { in: tierConfig.products },
          series: 'VIP',
        },
        select: { id: true, code: true },
      });
      const requiredProductIds = vipProducts.map((p) => p.id);

      // 6. 检查是否已购买所有所需产品
      const userPurchases = await prisma.userProductPurchase.findMany({
        where: {
          userId,
          productId: { in: requiredProductIds },
        },
        select: { productId: true },
      });
      const purchasedProductIds = new Set(userPurchases.map((p) => p.productId));

      const allPurchased = requiredProductIds.every((id) => purchasedProductIds.has(id));
      if (!allPurchased) {
        throw Errors.rewardNotAvailable();
      }

      // 7. 计算奖励金额和新余额
      const rewardAmount = new Decimal(tierConfig.reward);
      const newBalance = user.availableBalance.add(rewardAmount);

      // 8. 事务处理：创建领取记录、更新余额、创建流水
      await prisma.$transaction(async (tx) => {
        // 创建活动奖励领取记录
        await tx.activityReward.create({
          data: {
            userId,
            activityCode: ACTIVITY_CODES.COLLECTION_BONUS,
            rewardLevel: tier,
            amount: rewardAmount,
          },
        });

        // 更新用户余额
        await tx.user.update({
          where: { id: userId },
          data: { availableBalance: newBalance },
        });

        // 创建资金流水
        await tx.transaction.create({
          data: {
            userId,
            type: 'ACTIVITY_REWARD',
            amount: rewardAmount,
            balanceAfter: newBalance,
            remark: `连单奖励-阶梯${tier}`,
          },
        });
      });

      // 9. 清除用户缓存
      await deleteCache(CACHE_KEYS.USER.INFO(userId));

      return {
        tier,
        reward: rewardAmount.toFixed(2),
        balanceAfter: newBalance.toFixed(2),
      };
    });
  }

  // ================================
  // 私有辅助方法
  // ================================

  /**
   * 获取活动配置
   * @param activityCode 活动代码
   * @throws 活动不存在或未启用时抛出错误
   */
  private async getActivity(activityCode: string) {
    const activity = await prisma.activity.findUnique({
      where: { code: activityCode },
    });

    if (!activity) {
      throw Errors.activityNotFound();
    }

    if (!activity.isActive) {
      throw Errors.activityNotActive();
    }

    return activity;
  }

  /**
   * 检查拉新裂变是否有可领取的奖励
   * @param userId 用户ID
   * @param activity 活动配置
   */
  private async checkInviteHasClaimable(
    userId: number,
    activity: Activity
  ): Promise<boolean> {
    // 统计有效邀请人数
    const validInviteCount = await prisma.validInvitation.count({
      where: { inviterId: userId },
    });

    // 获取已领取的奖励
    const claimedRewards = await prisma.activityReward.findMany({
      where: {
        userId,
        activityCode: ACTIVITY_CODES.INVITE_REWARD,
      },
      select: { rewardLevel: true },
    });
    const claimedLevels = new Set(claimedRewards.map((r) => r.rewardLevel));

    // 解析阶梯配置
    const config = activity.config as { tiers?: { count: number; reward: number }[] } | null;
    const tierConfigs = config?.tiers || [];

    // 检查是否有任意阶梯处于可领取状态
    return tierConfigs.some((tierConfig, index) => {
      const tierNumber = index + 1;
      const isNotClaimed = !claimedLevels.has(tierNumber);
      const isAchieved = validInviteCount >= tierConfig.count;
      return isNotClaimed && isAchieved;
    });
  }

  /**
   * 检查连单奖励是否有可领取的奖励
   * @param userId 用户ID
   * @param activity 活动配置
   */
  private async checkCollectionHasClaimable(
    userId: number,
    activity: Activity
  ): Promise<boolean> {
    // 获取用户信息（业务逻辑使用 hasPurchasedPaid，hasPurchasedPo0 向后兼容）
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hasPurchasedPo0: true, hasPurchasedPaid: true },
    });

    // 前置条件未满足，不可领取
    if (!user?.hasPurchasedPaid && !user?.hasPurchasedPo0) {
      return false;
    }

    // 获取所有VIP产品
    const vipProducts = await prisma.product.findMany({
      where: { series: 'VIP', status: 'ACTIVE' },
      select: { id: true, code: true },
    });

    // 获取用户已购买的VIP产品
    const userPurchases = await prisma.userProductPurchase.findMany({
      where: {
        userId,
        product: { series: 'VIP' },
      },
      select: { productId: true },
    });
    const purchasedProductIds = new Set(userPurchases.map((p) => p.productId));

    // 创建产品代码到ID的映射
    const productCodeToId = new Map(vipProducts.map((p) => [p.code, p.id]));

    // 获取已领取的奖励
    const claimedRewards = await prisma.activityReward.findMany({
      where: {
        userId,
        activityCode: ACTIVITY_CODES.COLLECTION_BONUS,
      },
      select: { rewardLevel: true },
    });
    const claimedLevels = new Set(claimedRewards.map((r) => r.rewardLevel));

    // 解析阶梯配置
    const config = activity.config as { 
      tiers?: { products: string[]; reward: number }[] 
    } | null;
    const tierConfigs = config?.tiers || [];

    // 检查是否有任意阶梯处于可领取状态
    return tierConfigs.some((tierConfig, index) => {
      const tierNumber = index + 1;
      const isNotClaimed = !claimedLevels.has(tierNumber);

      // 检查是否集齐所有所需产品
      const allProductsPurchased = tierConfig.products.every((productCode) => {
        const productId = productCodeToId.get(productCode);
        return productId ? purchasedProductIds.has(productId) : false;
      });

      return isNotClaimed && allProductsPurchased;
    });
  }
}

// 单例导出
export const activityService = new ActivityService();
