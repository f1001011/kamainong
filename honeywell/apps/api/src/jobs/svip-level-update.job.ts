/**
 * @file SVIP等级更新定时任务
 * @description 每日凌晨批量更新所有用户SVIP等级
 * Cron: 5 0 * * *
 */

import { runSvipLevelUpdateJob } from '@/services/svip-reward.service';
import type { TaskResult } from '@/lib/task-lock';

export async function runSvipLevelUpdate(): Promise<TaskResult> {
  const result = await runSvipLevelUpdateJob();
  return { processedCount: result.processedCount };
}
