/**
 * @file 定时任务注册与启动入口
 * @description 统一管理所有定时任务的注册、启动和初始化
 * @depends 开发文档/05-后端服务/05.3-定时任务.md 第1.3节 - 任务注册与启动
 * 
 * 任务列表：
 * 1. income_settlement - 收益发放（每分钟）
 * 2. recharge_timeout - 充值超时（每分钟）
 * 3. signin_window_expire - 签到窗口过期（每日00:00 系统时区）
 * 4. channel_health_check - 通道状态检测（每5分钟）
 * 5. daily_stats - 数据统计汇总（每日00:05 系统时区）
 * 6. stats_archive - 统计数据归档（每日00:30 系统时区）
 * 7. recharge_status_poll - 充值订单状态轮询（每2分钟）
 * 8. withdraw_status_poll - 提现订单状态轮询（每3分钟）
 */

import cron from 'node-cron';
import { prisma } from '@/lib/prisma';
import { runTaskSafely, type TaskResult } from '@/lib/task-lock';
import { getConfig } from '@/lib/config';
import { DEFAULT_CONFIG } from '@honeywell/config';

// 导入所有任务
import { runIncomeSettlementJob } from './income-settlement.job';
import { runRechargeTimeoutJob } from './recharge-timeout.job';
import { runSigninWindowExpireJob } from './signin-window-expire.job';
import { runChannelHealthCheckJob } from './channel-health-check.job';
import { runDailyStatsJob } from './daily-stats.job';
import { runStatsArchiveJob } from './stats-archive.job';
import { runRechargeStatusPollJob } from './recharge-status-poll.job';
import { runWithdrawStatusPollJob } from './withdraw-status-poll.job';
import { runSvipLevelUpdate } from './svip-level-update.job';
import { runPrizePoolReset } from './prize-pool-reset.job';

/**
 * 任务配置定义
 */
interface TaskConfig {
  code: string;
  name: string;
  cronExpression: string;
  handler: () => Promise<TaskResult | void>;
  ttlSeconds: number;
}

/**
 * 所有定时任务配置
 * @description 依据：05.3-定时任务.md 第2节 - 任务详细规范
 */
const TASK_CONFIGS: TaskConfig[] = [
  {
    code: 'income_settlement',
    name: '收益发放',
    cronExpression: '* * * * *', // 每分钟
    handler: runIncomeSettlementJob,
    ttlSeconds: 120, // 2分钟超时
  },
  {
    code: 'recharge_timeout',
    name: '充值超时',
    cronExpression: '* * * * *', // 每分钟
    handler: runRechargeTimeoutJob,
    ttlSeconds: 60, // 1分钟超时
  },
  {
    code: 'signin_window_expire',
    name: '签到窗口过期',
    cronExpression: '0 0 * * *', // 每日00:00（系统时区）
    handler: runSigninWindowExpireJob,
    ttlSeconds: 600, // 10分钟超时
  },
  {
    code: 'channel_health_check',
    name: '通道状态检测',
    cronExpression: '*/5 * * * *', // 每5分钟
    handler: runChannelHealthCheckJob,
    ttlSeconds: 120, // 2分钟超时
  },
  {
    code: 'daily_stats',
    name: '数据统计汇总',
    cronExpression: '5 0 * * *', // 每日00:05（系统时区）
    handler: runDailyStatsJob,
    ttlSeconds: 1800, // 30分钟超时
  },
  {
    code: 'stats_archive',
    name: '统计数据归档',
    cronExpression: '30 0 * * *', // 每日00:30（系统时区）
    handler: runStatsArchiveJob,
    ttlSeconds: 600, // 10分钟超时
  },
  {
    code: 'recharge_status_poll',
    name: '充值订单状态轮询',
    cronExpression: '*/2 * * * *', // 每2分钟
    handler: runRechargeStatusPollJob,
    ttlSeconds: 120, // 2分钟超时
  },
  {
    code: 'withdraw_status_poll',
    name: '提现订单状态轮询',
    cronExpression: '*/3 * * * *',
    handler: runWithdrawStatusPollJob,
    ttlSeconds: 180,
  },
  // svip_daily_reward 已移除：SVIP每日奖励改为用户手动领取（POST /api/svip/claim）
  {
    code: 'svip_level_update',
    name: 'SVIP等级更新',
    cronExpression: '5 0 * * *',
    handler: runSvipLevelUpdate,
    ttlSeconds: 600,
  },
  {
    code: 'prize_pool_reset',
    name: '奖池每日重置',
    cronExpression: '0 0 * * *',
    handler: runPrizePoolReset,
    ttlSeconds: 60,
  },
];

/**
 * 初始化定时任务数据库记录
 * @description 确保 ScheduledTask 表中有所有任务的记录
 */
async function initTaskRecords(): Promise<void> {
  console.log('[Jobs] 初始化任务数据库记录...');

  for (const config of TASK_CONFIGS) {
    try {
      await prisma.scheduledTask.upsert({
        where: { taskCode: config.code },
        create: {
          taskCode: config.code,
          taskName: config.name,
          cronExpression: config.cronExpression,
          isEnabled: true,
        },
        update: {
          taskName: config.name,
          cronExpression: config.cronExpression,
        },
      });
      console.log(`[Jobs] 任务 ${config.code} 已注册`);
    } catch (error) {
      console.error(`[Jobs] 注册任务 ${config.code} 失败:`, error);
    }
  }
}

/**
 * 启动所有定时任务
 * @description 依据：05.3-定时任务.md 第1.3节
 * 
 * 核心功能：
 * 1. 初始化任务数据库记录
 * 2. 使用 node-cron 注册所有定时任务
 * 3. 使用系统时区作为 cron 执行时区
 */
export async function startAllJobs(): Promise<void> {
  console.log('[Jobs] 启动定时任务服务...');

  // 1. 初始化任务数据库记录
  await initTaskRecords();

  // 2. 获取系统时区
  const systemTimezone = await getConfig<string>('system_timezone', DEFAULT_CONFIG.SYSTEM_TIMEZONE);
  console.log(`[Jobs] 系统时区: ${systemTimezone}`);

  // 3. 注册所有定时任务
  for (const config of TASK_CONFIGS) {
    cron.schedule(
      config.cronExpression,
      async () => {
        try {
          await runTaskSafely(
            config.code,
            config.name,
            config.handler,
            config.ttlSeconds
          );
        } catch (error) {
          // 错误已在 runTaskSafely 中记录，这里仅做兜底
          console.error(`[Jobs] 任务 ${config.code} 执行异常:`, error);
        }
      },
      {
        timezone: systemTimezone,
      }
    );

    console.log(`[Jobs] 任务 ${config.code} 已启动, cron: ${config.cronExpression}`);
  }

  console.log(`[Jobs] 定时任务服务启动完成, 共 ${TASK_CONFIGS.length} 个任务`);
}

/**
 * 停止所有定时任务
 * @description 用于优雅关闭服务
 */
export function stopAllJobs(): void {
  console.log('[Jobs] 停止定时任务服务...');
  // node-cron 没有全局停止方法，需要在 schedule 时保存引用
  // 实际生产中可以将 cron.schedule 返回的 task 对象保存起来，统一调用 task.stop()
  // 这里简化处理，进程退出时自动停止
}

/**
 * 手动触发指定任务（用于测试或管理后台手动执行）
 * @param taskCode 任务代码
 * @returns 执行结果
 */
export async function triggerTask(taskCode: string): Promise<TaskResult | void | null> {
  const config = TASK_CONFIGS.find(c => c.code === taskCode);
  if (!config) {
    throw new Error(`任务 ${taskCode} 不存在`);
  }

  console.log(`[Jobs] 手动触发任务: ${taskCode}`);
  
  return runTaskSafely(
    config.code,
    config.name,
    config.handler,
    config.ttlSeconds
  );
}

/**
 * 获取所有任务配置（用于管理后台展示）
 */
export function getTaskConfigs(): TaskConfig[] {
  return TASK_CONFIGS;
}

// 导出所有任务函数（用于直接调用或测试）
export {
  runIncomeSettlementJob,
  runRechargeTimeoutJob,
  runSigninWindowExpireJob,
  runChannelHealthCheckJob,
  runDailyStatsJob,
  runStatsArchiveJob,
  runRechargeStatusPollJob,
  runWithdrawStatusPollJob,
  runSvipLevelUpdate,
  runPrizePoolReset,
};
