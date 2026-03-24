/**
 * @file 奖池每日重置定时任务
 * @description 每日凌晨重置奖池余额（也可采用懒重置，此为备用方案）
 * Cron: 0 0 * * *
 */

import { prisma } from '@/lib/prisma';
import { getSystemTime } from '@/lib/config';
import type { TaskResult } from '@/lib/task-lock';

function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function runPrizePoolReset(): Promise<TaskResult> {
  const systemTime = await getSystemTime();
  const today = formatDateStr(systemTime);

  const pools = await prisma.prizePool.findMany({ where: { isActive: true } });
  let processedCount = 0;

  for (const pool of pools) {
    if (pool.lastResetDate !== today) {
      await prisma.prizePool.update({
        where: { id: pool.id },
        data: { remainToday: pool.dailyTotal, lastResetDate: today },
      });
      processedCount++;
    }
  }

  console.log(`[PrizePoolReset] 重置完成: ${processedCount} 个奖池`);
  return { processedCount };
}
