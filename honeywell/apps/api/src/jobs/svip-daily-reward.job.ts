/**
 * @file SVIP每日奖励定时任务（已废弃）
 * @description SVIP每日奖励已改为用户手动领取（POST /api/svip/claim）
 * @deprecated 此定时任务不再使用，保留仅供参考
 */

import type { TaskResult } from '@/lib/task-lock';

export async function runSvipDailyReward(): Promise<TaskResult> {
  console.log('[SvipDailyReward] 此定时任务已废弃，SVIP奖励改为手动领取');
  return { processedCount: 0, successCount: 0, failedCount: 0 };
}
