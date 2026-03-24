/**
 * @file 周薪奖励服务
 * @description LV1周薪奖励查询与领取
 * 
 * 规则：
 * - 统计本周新邀请的LV1用户在本周内的充值总额
 * - 每周只能领取一次，只能领取满足条件的最高档位
 * - 一周结束后重置，下周重新累计
 */

import { prisma } from '@/lib/prisma';
import { getSystemTime, formatNotificationAmount } from '@/lib/config';
import { clearUserCache } from '@/lib/redis';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * 获取当前自然周范围（系统时区，周一00:00 ~ 周日23:59:59）
 */
async function getCurrentWeekRange(): Promise<{ weekStart: Date; weekEnd: Date }> {
  const now = await getSystemTime();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  
  return { weekStart, weekEnd };
}

/**
 * 查询本周新邀请LV1用户的本周充值总额
 * 仅统计本周新邀请的用户（createdAt在本周内）在本周内的充值
 */
async function getWeeklyL1Recharge(
  userId: number,
  weekStart: Date,
  weekEnd: Date
): Promise<Decimal> {
  const thisWeekInvitees = await prisma.user.findMany({
    where: {
      inviterId: userId,
      createdAt: { gte: weekStart, lt: weekEnd },
    },
    select: { id: true },
  });

  if (thisWeekInvitees.length === 0) return new Decimal(0);

  const inviteeIds = thisWeekInvitees.map(u => u.id);

  const result = await prisma.rechargeOrder.aggregate({
    where: {
      userId: { in: inviteeIds },
      status: 'PAID',
      createdAt: { gte: weekStart, lt: weekEnd },
    },
    _sum: { actualAmount: true },
  });

  return result._sum.actualAmount ?? new Decimal(0);
}

/**
 * 获取本周周薪状态
 */
export async function getWeeklySalaryStatus(userId: number) {
  const { weekStart, weekEnd } = await getCurrentWeekRange();

  const [totalRecharge, tiers, existingClaim] = await Promise.all([
    getWeeklyL1Recharge(userId, weekStart, weekEnd),
    prisma.weeklySalary.findMany({
      where: { isActive: true },
      orderBy: { minRecharge: 'asc' },
    }),
    prisma.weeklySalaryClaim.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
    }),
  ]);

  // 匹配最高档位
  let currentTier = null;
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (totalRecharge.gte(tiers[i].minRecharge)) {
      currentTier = tiers[i];
      break;
    }
  }

  // 构建前端所需的阶梯状态
  const tiersWithStatus = tiers.map(t => {
    const reached = totalRecharge.gte(t.minRecharge);
    let status: 'LOCKED' | 'UNLOCKED' | 'CLAIMED' = 'LOCKED';
    if (existingClaim && existingClaim.salaryId === t.id) {
      status = 'CLAIMED';
    } else if (reached && !existingClaim) {
      status = 'UNLOCKED';
    } else if (reached && existingClaim) {
      status = 'CLAIMED';
    }
    return {
      id: t.id,
      threshold: Number(t.minRecharge),
      reward: Number(t.rewardAmount),
      status,
    };
  });

  // 查询历史领取记录
  const historyRecords = await prisma.weeklySalaryClaim.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { salary: true },
  });

  const history = historyRecords.map(r => ({
    id: r.id,
    weekLabel: `${r.weekStart.toISOString().slice(0, 10)} ~ ${r.weekEnd.toISOString().slice(0, 10)}`,
    amount: Number(r.amount),
    claimedAt: r.createdAt.toISOString(),
  }));

  return {
    currentWeekRecharge: Number(totalRecharge),
    tiers: tiersWithStatus,
    weekEndTime: weekEnd.toISOString(),
    history,
  };
}

/**
 * 领取周薪
 */
export async function claimWeeklySalary(userId: number) {
  const { weekStart, weekEnd } = await getCurrentWeekRange();

  const existing = await prisma.weeklySalaryClaim.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
  });
  if (existing) {
    const { Errors } = await import('@/lib/errors');
    throw Errors.alreadyClaimedThisWeek();
  }

  const totalRecharge = await getWeeklyL1Recharge(userId, weekStart, weekEnd);

  const tiers = await prisma.weeklySalary.findMany({
    where: { isActive: true, minRecharge: { lte: totalRecharge } },
    orderBy: { minRecharge: 'desc' },
    take: 1,
  });

  if (tiers.length === 0) {
    const { Errors } = await import('@/lib/errors');
    throw Errors.noTierMatched();
  }

  const tier = tiers[0];

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { availableBalance: { increment: tier.rewardAmount } },
      select: { availableBalance: true },
    });

    await tx.weeklySalaryClaim.create({
      data: {
        userId,
        weekStart,
        weekEnd,
        teamRecharge: totalRecharge,
        salaryId: tier.id,
        amount: tier.rewardAmount,
      },
    });

    await tx.transaction.create({
      data: {
        userId,
        type: 'WEEKLY_SALARY',
        amount: tier.rewardAmount,
        balanceAfter: user.availableBalance,
        remark: 'Salario semanal LV1',
      },
    });

    await tx.notification.create({
      data: {
        userId,
        type: 'WEEKLY_SALARY_CLAIMED',
        title: 'Salario semanal recibido',
        content: `Ha recibido su salario semanal de ${await formatNotificationAmount(tier.rewardAmount)}.`,
      },
    });
  });

  await clearUserCache(userId);
}
