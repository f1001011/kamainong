/**
 * @file SVIP奖励服务
 * @description SVIP资格判定、等级维护、每日奖励手动领取
 * 
 * 核心规则：
 * - 用户持有某产品的「活跃持仓」数量 >= product.svipRequireCount
 * - 即解锁该产品对应的SVIP等级，享受每日奖励
 * - 一个用户可以同时满足多个SVIP等级（可叠加）
 * - 持仓到期后，若活跃持仓数不足，SVIP等级自动降级
 * - 每日奖励需用户手动领取，当日不领则过期
 */

import { prisma } from '@/lib/prisma';
import { getConfig, getSystemTime, formatNotificationAmount } from '@/lib/config';
import { withLock, CACHE_KEYS, LOCK_TTL, clearUserCache } from '@/lib/redis';
import { Errors } from '@/lib/errors';
import { Decimal } from '@prisma/client/runtime/library';

export interface SvipQualification {
  productId: number;
  productCode: string;
  svipLevel: number;
  dailyReward: Decimal;
  activeCount: number;
  requiredCount: number;
  /** 今日是否已领取 */
  claimedToday: boolean;
}

export interface SvipClaimResult {
  claimedRewards: { svipLevel: number; productCode: string; amount: string }[];
  totalAmount: string;
  newBalance: string;
}

/**
 * 从产品编码中提取SVIP等级编号
 * VIC1→1, VIC2→2, ..., NWS6→6, ..., QLD12→12
 */
function extractSvipLevel(code: string): number {
  const match = code.match(/\d+$/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * 获取用户所有SVIP资格（每个达标的产品独立计算，含今日领取状态）
 */
export async function getUserSvipQualifications(userId: number): Promise<SvipQualification[]> {
  const svipProducts = await prisma.product.findMany({
    where: {
      svipDailyReward: { not: null },
      svipRequireCount: { not: null },
      status: 'ACTIVE',
    },
    select: {
      id: true,
      code: true,
      svipDailyReward: true,
      svipRequireCount: true,
    },
  });

  if (svipProducts.length === 0) return [];

  const systemTime = await getSystemTime();
  const today = formatDateStr(systemTime);

  // 并行查询：活跃持仓 + 今日已领取记录
  const [activePositions, todayRecords] = await Promise.all([
    prisma.positionOrder.groupBy({
      by: ['productId'],
      where: { userId, status: 'ACTIVE' },
      _count: { id: true },
    }),
    prisma.svipRewardRecord.findMany({
      where: { userId, rewardDate: today },
      select: { productId: true },
    }),
  ]);

  const positionCountMap = new Map(
    activePositions.map(p => [p.productId, p._count.id])
  );
  const claimedProductIds = new Set(todayRecords.map(r => r.productId));

  return svipProducts
    .filter(p => (positionCountMap.get(p.id) ?? 0) >= p.svipRequireCount!)
    .map(p => ({
      productId: p.id,
      productCode: p.code,
      svipLevel: extractSvipLevel(p.code),
      dailyReward: p.svipDailyReward!,
      activeCount: positionCountMap.get(p.id) ?? 0,
      requiredCount: p.svipRequireCount!,
      claimedToday: claimedProductIds.has(p.id),
    }));
}

/**
 * 获取用户最高SVIP等级
 */
export async function getUserMaxSvipLevel(userId: number): Promise<number> {
  const qualifications = await getUserSvipQualifications(userId);
  if (qualifications.length === 0) return 0;
  return Math.max(...qualifications.map(q => q.svipLevel));
}

/**
 * 重新计算并更新用户SVIP等级（写入user.svipLevel冗余字段）
 */
export async function recalculateUserSvip(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: number
): Promise<number> {
  const svipProducts = await tx.product.findMany({
    where: {
      svipDailyReward: { not: null },
      svipRequireCount: { not: null },
      status: 'ACTIVE',
    },
    select: { id: true, code: true, svipRequireCount: true },
  });

  const activePositions = await tx.positionOrder.groupBy({
    by: ['productId'],
    where: { userId, status: 'ACTIVE' },
    _count: { id: true },
  });

  const positionCountMap = new Map(
    activePositions.map(p => [p.productId, p._count.id])
  );

  let maxLevel = 0;
  for (const p of svipProducts) {
    if ((positionCountMap.get(p.id) ?? 0) >= p.svipRequireCount!) {
      const level = extractSvipLevel(p.code);
      if (level > maxLevel) maxLevel = level;
    }
  }

  await tx.user.update({
    where: { id: userId },
    data: { svipLevel: maxLevel },
  });

  return maxLevel;
}

/**
 * 格式化系统日期为 YYYY-MM-DD
 */
function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 用户手动领取SVIP每日奖励
 * 核心逻辑：实时检查资格 → 过滤已领 → 事务发放 → 返回结果
 * 并发安全：Redis分布式锁 + 数据库唯一索引双重保障
 */
export async function claimSvipDailyReward(userId: number): Promise<SvipClaimResult> {
  const svipEnabled = await getConfig('svip_reward_enabled', true);
  if (!svipEnabled) {
    throw Errors.svipDisabled();
  }

  return withLock(
    CACHE_KEYS.LOCK.SVIP_CLAIM(userId),
    LOCK_TTL.SVIP_CLAIM,
    async () => {
      // 实时获取用户所有达标资格（含今日领取状态）
      const qualifications = await getUserSvipQualifications(userId);

      if (qualifications.length === 0) {
        throw Errors.svipNotQualified();
      }

      // 过滤出今日尚未领取的资格
      const unclaimed = qualifications.filter(q => !q.claimedToday);

      if (unclaimed.length === 0) {
        throw Errors.svipAlreadyClaimed();
      }

      const systemTime = await getSystemTime();
      const today = formatDateStr(systemTime);

      // 计算总金额
      const totalAmount = unclaimed.reduce(
        (sum, q) => sum.add(q.dailyReward),
        new Decimal(0)
      );

      // 事务：批量创建记录 + 更新余额 + 写流水 + 发通知
      const result = await prisma.$transaction(async (tx) => {
        // 1. 批量创建 SvipRewardRecord
        for (const q of unclaimed) {
          await tx.svipRewardRecord.create({
            data: {
              userId,
              productId: q.productId,
              svipLevel: q.svipLevel,
              amount: q.dailyReward,
              rewardDate: today,
              status: 'CLAIMED',
            },
          });
        }

        // 2. 更新用户余额（一次性加总金额）
        const user = await tx.user.update({
          where: { id: userId },
          data: { availableBalance: { increment: totalAmount } },
          select: { availableBalance: true },
        });

        // 3. 创建流水记录（合并为一条）
        const levelsSummary = unclaimed
          .map(q => `SVIP${q.svipLevel}`)
          .join('+');

        await tx.transaction.create({
          data: {
            userId,
            type: 'SVIP_DAILY_REWARD',
            amount: totalAmount,
            balanceAfter: user.availableBalance,
            remark: `${levelsSummary} مكافأة يومية`,
          },
        });

        // 4. 发送通知
        const amountStr = await formatNotificationAmount(totalAmount);
        await tx.notification.create({
          data: {
            userId,
            type: 'SVIP_DAILY_REWARD',
            title: 'مكافأة SVIP اليومية',
            content: `تم إضافة مكافأة ${levelsSummary} بقيمة ${amountStr} إلى رصيدك.`,
          },
        });

        return { newBalance: user.availableBalance };
      });

      await clearUserCache(userId);

      return {
        claimedRewards: unclaimed.map(q => ({
          svipLevel: q.svipLevel,
          productCode: q.productCode,
          amount: q.dailyReward.toString(),
        })),
        totalAmount: totalAmount.toString(),
        newBalance: result.newBalance.toString(),
      };
    }
  );
}

/**
 * SVIP等级批量更新任务
 * Cron: 5 0 * * *（每日凌晨00:05）
 */
export async function runSvipLevelUpdateJob(): Promise<{ processedCount: number }> {
  const svipEnabled = await getConfig('svip_reward_enabled', true);
  if (!svipEnabled) return { processedCount: 0 };

  // 查询所有有活跃持仓的用户
  const usersWithPositions = await prisma.positionOrder.findMany({
    where: { status: 'ACTIVE' },
    select: { userId: true },
    distinct: ['userId'],
  });

  const userIds = usersWithPositions.map(u => u.userId);

  // 同时重置没有活跃持仓但svipLevel > 0的用户
  await prisma.user.updateMany({
    where: {
      svipLevel: { gt: 0 },
      id: { notIn: userIds },
    },
    data: { svipLevel: 0 },
  });

  // 逐个用户重新计算SVIP
  let processedCount = 0;
  for (const uid of userIds) {
    try {
      await prisma.$transaction(async (tx) => {
        await recalculateUserSvip(tx, uid);
      });
      processedCount++;
    } catch (error) {
      console.error(`[SvipLevelUpdate] 更新失败 userId=${uid}:`, error);
    }
  }

  console.log(`[SvipLevelUpdate] 等级更新完成: ${processedCount}/${userIds.length}`);
  return { processedCount };
}
