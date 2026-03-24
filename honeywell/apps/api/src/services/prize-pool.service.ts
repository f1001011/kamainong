/**
 * @file 奖池活动服务
 * @description 每日奖池查询与领取
 * 
 * 规则：
 * - 每日奖池10,000 COP，凌晨刷新
 * - 按个人邀请的LV1有效会员数量领取
 * - 每人每天每个档位只能领一次
 * - 奖池余额不足时无法领取
 */

import { prisma } from '@/lib/prisma';
import { getConfig, getSystemTime, formatNotificationAmount } from '@/lib/config';
import { Errors } from '@/lib/errors';
import { clearUserCache } from '@/lib/redis';

function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 懒重置奖池（如果日期不是今天则重置）
 */
async function ensurePoolReset(today: string) {
  const pool = await prisma.prizePool.findFirst({ where: { isActive: true } });
  if (!pool) return;

  if (pool.lastResetDate !== today) {
    await prisma.prizePool.update({
      where: { id: pool.id },
      data: { remainToday: pool.dailyTotal, lastResetDate: today },
    });
  }
}

/**
 * 获取奖池状态
 */
export async function getPrizePoolStatus(userId: number) {
  const systemTime = await getSystemTime();
  const today = formatDateStr(systemTime);

  await ensurePoolReset(today);

  const [pool, tiers, validInviteCount, todayClaims] = await Promise.all([
    prisma.prizePool.findFirst({ where: { isActive: true } }),
    prisma.prizePoolTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.validInvitation.count({ where: { inviterId: userId } }),
    prisma.prizePoolClaim.findMany({
      where: { userId, claimDate: today },
      select: { tierId: true },
    }),
  ]);

  const claimedTierIds = new Set(todayClaims.map(c => c.tierId));

  // 计算下次重置时间（明天凌晨）
  const tomorrow = new Date(systemTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return {
    poolTotal: Number(pool?.dailyTotal ?? 0),
    poolRemaining: Number(pool?.remainToday ?? 0),
    tiers: tiers.map(t => {
      const claimed = claimedTierIds.has(t.id);
      const qualified = validInviteCount >= t.requiredInvites;
      let status: 'LOCKED' | 'UNLOCKED' | 'CLAIMED' = 'LOCKED';
      if (claimed) status = 'CLAIMED';
      else if (qualified) status = 'UNLOCKED';
      return {
        id: t.id,
        requiredInvites: t.requiredInvites,
        reward: Number(t.rewardAmount),
        status,
      };
    }),
    validInviteCount,
    nextResetTime: tomorrow.toISOString(),
  };
}

/**
 * 领取奖池奖励
 */
export async function claimPrizePool(userId: number, tierId: number) {
  const enabled = await getConfig('prize_pool_enabled', true);
  if (!enabled) throw Errors.activityNotActive();

  const systemTime = await getSystemTime();
  const today = formatDateStr(systemTime);

  await ensurePoolReset(today);

  const tier = await prisma.prizePoolTier.findUnique({
    where: { id: tierId, isActive: true },
  });
  if (!tier) throw Errors.notFound('Nivel');

  const validInviteCount = await prisma.validInvitation.count({
    where: { inviterId: userId },
  });
  if (validInviteCount < tier.requiredInvites) throw Errors.invitesNotEnough();

  const claimed = await prisma.prizePoolClaim.findUnique({
    where: { userId_tierId_claimDate: { userId, tierId, claimDate: today } },
  });
  if (claimed) throw Errors.alreadyClaimedToday();

  // 原子扣减奖池
  const result = await prisma.prizePool.updateMany({
    where: { isActive: true, remainToday: { gte: tier.rewardAmount } },
    data: { remainToday: { decrement: tier.rewardAmount } },
  });
  if (result.count === 0) throw Errors.poolInsufficient();

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { availableBalance: { increment: tier.rewardAmount } },
      select: { availableBalance: true },
    });

    await tx.prizePoolClaim.create({
      data: { userId, tierId, amount: tier.rewardAmount, claimDate: today },
    });

    await tx.transaction.create({
      data: {
        userId,
        type: 'PRIZE_POOL',
        amount: tier.rewardAmount,
        balanceAfter: user.availableBalance,
        remark: 'Premio del fondo diario',
      },
    });

    await tx.notification.create({
      data: {
        userId,
        type: 'PRIZE_POOL_CLAIMED',
        title: 'تم استلام الجائزة',
        content: `Ha recibido ${await formatNotificationAmount(tier.rewardAmount)} del fondo de premios diario.`,
      },
    });
  });

  await clearUserCache(userId);
}
