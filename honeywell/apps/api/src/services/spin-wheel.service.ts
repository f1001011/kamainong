/**
 * @file 转盘抽奖服务
 * @description 转盘机会计算、抽奖执行、奖品概率引擎
 * 
 * 机会获取规则：
 * - 个人充值一次 → 1次机会
 * - 当日邀请5人 → 1次机会（基于当日新邀请人数 / 5）
 * - 每日最多5次（从配置读取）
 * - 按当天转的次数计算，凌晨刷新
 */

import { prisma } from '@/lib/prisma';
import { getConfig, getSystemTime, formatNotificationAmount } from '@/lib/config';
import { Errors } from '@/lib/errors';
import { clearUserCache } from '@/lib/redis';
import { Decimal } from '@prisma/client/runtime/library';

function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface SpinChanceInfo {
  totalChances: number;
  usedChances: number;
  remainingChances: number;
  maxDaily: number;
  maxChances: number;
  todayRechargeCount: number;
  todayNewInvites: number;
  inviteChances: number;
  todayHistory: Array<{
    id: number;
    prizeLabel: string;
    amount: number;
    createdAt: string;
  }>;
}

/**
 * 实时计算用户今日转盘机会
 */
export async function getSpinChances(userId: number): Promise<SpinChanceInfo> {
  const systemTime = await getSystemTime();
  const today = formatDateStr(systemTime);
  const maxDaily = await getConfig('spin_max_daily', 5);

  const startOfDay = new Date(systemTime);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(systemTime);
  endOfDay.setHours(23, 59, 59, 999);

  const [todayRechargeCount, todayNewInvites, todayUsed, todayRecords, manualRecord] = await Promise.all([
    prisma.rechargeOrder.count({
      where: {
        userId,
        status: 'PAID',
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    }),
    prisma.user.count({
      where: {
        inviterId: userId,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    }),
    prisma.spinRecord.count({
      where: { userId, spinDate: today },
    }),
    prisma.spinRecord.findMany({
      where: { userId, spinDate: today },
      include: { prize: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    // 读取 spin_chances 表，支持手动赠送/补偿的机会（取 MAX 防止重复计算）
    prisma.spinChance.findUnique({
      where: { userId_chanceDate: { userId, chanceDate: today } },
    }),
  ]);

  const inviteChances = Math.floor(todayNewInvites / 5);
  // 取实时统计与 spin_chances 记录的较大值，以支持手动赠送场景
  const effectiveRechargeChances = Math.max(todayRechargeCount, manualRecord?.rechargeChances ?? 0);
  const effectiveInviteChances = Math.max(inviteChances, manualRecord?.inviteChances ?? 0);
  const totalChances = Math.min(effectiveRechargeChances + effectiveInviteChances, maxDaily);

  const todayHistory = todayRecords.map((r) => ({
    id: r.id,
    prizeLabel: r.prize.name,
    amount: Number(r.amount),
    createdAt: r.createdAt.toISOString(),
  }));

  return {
    totalChances,
    usedChances: todayUsed,
    remainingChances: Math.max(0, totalChances - todayUsed),
    maxDaily,
    maxChances: maxDaily,
    todayRechargeCount,
    todayNewInvites,
    inviteChances,
    todayHistory,
  };
}

/**
 * 加权随机选择奖品
 */
function selectPrize(prizes: { id: number; name: string; amount: Decimal; probability: Decimal }[]) {
  const totalWeight = prizes.reduce((sum, p) => sum + Number(p.probability), 0);
  let random = Math.random() * totalWeight;

  for (const prize of prizes) {
    random -= Number(prize.probability);
    if (random <= 0) return prize;
  }

  return prizes[prizes.length - 1];
}

/**
 * 执行抽奖
 */
export async function executeSpin(userId: number) {
  const enabled = await getConfig('spin_wheel_enabled', true);
  if (!enabled) throw Errors.spinDisabled();

  const chances = await getSpinChances(userId);
  if (chances.remainingChances <= 0) throw Errors.noChances();

  const systemTime = await getSystemTime();
  const today = formatDateStr(systemTime);

  const prizes = await prisma.spinWheelPrize.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  if (prizes.length === 0) throw Errors.activityNotActive();

  const prize = selectPrize(prizes);
  const isWin = Number(prize.amount) > 0;

  await prisma.$transaction(async (tx) => {
    await tx.spinRecord.create({
      data: {
        userId,
        prizeId: prize.id,
        amount: prize.amount,
        spinDate: today,
        sourceType: 'SPIN',
      },
    });

    if (isWin) {
      const user = await tx.user.update({
        where: { id: userId },
        data: { availableBalance: { increment: prize.amount } },
        select: { availableBalance: true },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'SPIN_WHEEL',
          amount: prize.amount,
          balanceAfter: user.availableBalance,
          remark: `Premio de la ruleta: ${prize.name}`,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          type: 'SPIN_WHEEL_WIN',
          title: 'Premio de la ruleta',
          content: `Felicidades, ha ganado ${await formatNotificationAmount(prize.amount)} en la ruleta.`,
        },
      });
    }
  });

  if (isWin) await clearUserCache(userId);

  const updatedChances = await getSpinChances(userId);
  const prizeIndex = prizes.findIndex(p => p.id === prize.id);

  return {
    prizeIndex: prizeIndex >= 0 ? prizeIndex : 0,
    prize: { id: prize.id, name: prize.name, amount: prize.amount.toFixed(0) },
    isWin,
    remainingChances: updatedChances.remainingChances,
  };
}

/**
 * 获取奖品列表（前端渲染转盘用）
 */
export async function getSpinPrizes() {
  return prisma.spinWheelPrize.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, amount: true, probability: true, sortOrder: true },
  });
}

/**
 * 获取抽奖历史
 */
export async function getSpinHistory(userId: number, page: number, pageSize: number) {
  const [list, total] = await Promise.all([
    prisma.spinRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { prize: { select: { name: true } } },
    }),
    prisma.spinRecord.count({ where: { userId } }),
  ]);

  return {
    list: list.map(r => ({
      id: r.id,
      prizeName: r.prize.name,
      amount: r.amount.toFixed(0),
      spinDate: r.spinDate,
      createdAt: r.createdAt.toISOString(),
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}
