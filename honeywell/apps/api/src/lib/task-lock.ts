/**
 * @file 定时任务分布式锁机制
 * @description 使用 Redis 实现分布式锁，防止多实例重复执行定时任务
 * @depends 开发文档/05-后端服务/05.3-定时任务.md 第1.1-1.2节 - 任务锁机制
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.10节 - ScheduledTask表、TaskRunLog表
 */

import { redis } from './redis';
import { prisma } from './prisma';
import { TaskRunStatus } from '@honeywell/database';
import cronParser from 'cron-parser';

/**
 * 任务执行结果类型
 */
export interface TaskResult {
  /** 处理数量 */
  processedCount?: number;
  /** 成功数量 */
  successCount?: number;
  /** 失败数量 */
  failedCount?: number;
  /** 其他自定义数据 */
  [key: string]: unknown;
}

/**
 * 获取任务执行锁
 * @description 使用 Redis SETNX 实现分布式锁，防止多实例重复执行
 * @param taskCode 任务代码
 * @param ttlSeconds 锁过期时间（秒），默认300秒
 * @returns 是否获取成功
 */
export async function acquireTaskLock(
  taskCode: string,
  ttlSeconds: number = 300
): Promise<boolean> {
  const lockKey = `task_lock:${taskCode}`;
  // 使用 SET NX EX 原子操作获取锁
  const result = await redis.set(lockKey, Date.now().toString(), 'EX', ttlSeconds, 'NX');
  return result === 'OK';
}

/**
 * 释放任务执行锁
 * @param taskCode 任务代码
 */
export async function releaseTaskLock(taskCode: string): Promise<void> {
  const lockKey = `task_lock:${taskCode}`;
  await redis.del(lockKey);
}

/**
 * 计算下次执行时间
 * @param cronExpression Cron表达式
 * @returns 下次执行时间或null
 */
export function calculateNextRunAt(cronExpression: string): Date | null {
  try {
    const interval = cronParser.parseExpression(cronExpression);
    return interval.next().toDate();
  } catch (error) {
    console.error(`[TaskLock] 解析Cron表达式失败: ${cronExpression}`, error);
    return null;
  }
}

/**
 * 任务执行包装器（自动加锁/解锁/记录日志）
 * @description 依据：05.3-定时任务.md 第1.2节 - 任务执行包装器
 * 
 * 核心功能：
 * 1. 自动获取/释放分布式锁，防止多实例重复执行
 * 2. 自动更新 ScheduledTask 表状态（lastRunAt, lastRunStatus, lastRunDuration）
 * 3. 自动创建 TaskRunLog 执行日志
 * 4. 异常处理与日志记录
 * 
 * @param taskCode 任务代码（唯一标识）
 * @param taskName 任务名称（用于日志）
 * @param fn 任务执行函数
 * @param ttlSeconds 锁过期时间（秒）
 * @returns 任务执行结果或null（获取锁失败时）
 */
export async function runTaskWithLock<T extends TaskResult | void>(
  taskCode: string,
  taskName: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T | null> {
  // 1. 尝试获取分布式锁
  const acquired = await acquireTaskLock(taskCode, ttlSeconds);
  if (!acquired) {
    console.log(`[Task:${taskCode}] 任务正在执行中，跳过本次执行`);
    return null;
  }

  const startAt = new Date();
  let status: TaskRunStatus = 'SUCCESS';
  let errorMessage: string | null = null;
  let processedCount: number | null = null;
  let result: T | null = null;

  try {
    console.log(`[Task:${taskCode}] 开始执行 ${taskName}`);

    // 2. 更新任务状态为运行中（依据：02.1-数据库设计.md 第2.10节）
    await prisma.scheduledTask.upsert({
      where: { taskCode },
      create: {
        taskCode,
        taskName,
        cronExpression: '', // 将在初始化时设置
        isEnabled: true,
        lastRunAt: startAt,
        lastRunStatus: 'RUNNING',
      },
      update: {
        lastRunAt: startAt,
        lastRunStatus: 'RUNNING',
      },
    });

    // 3. 执行任务
    result = await fn();

    // 4. 提取处理数量
    if (result && typeof result === 'object' && 'processedCount' in result) {
      processedCount = result.processedCount as number;
    }

    console.log(`[Task:${taskCode}] 执行成功${processedCount !== null ? `, 处理数量: ${processedCount}` : ''}`);

  } catch (error) {
    status = 'FAILED';
    errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Task:${taskCode}] 执行失败:`, error);
    throw error;

  } finally {
    const endAt = new Date();
    const duration = endAt.getTime() - startAt.getTime();

    try {
      // 5. 获取任务的cron表达式用于计算下次执行时间
      const task = await prisma.scheduledTask.findUnique({
        where: { taskCode },
        select: { cronExpression: true },
      });

      const nextRunAt = task?.cronExpression 
        ? calculateNextRunAt(task.cronExpression) 
        : null;

      // 6. 更新任务状态（依据：02.1-数据库设计.md 第2.10节）
      await prisma.scheduledTask.update({
        where: { taskCode },
        data: {
          lastRunStatus: status,
          lastRunDuration: duration,
          nextRunAt,
        },
      });

      // 7. 记录执行日志（依据：02.1-数据库设计.md 第2.10节 - TaskRunLog表）
      await prisma.taskRunLog.create({
        data: {
          taskCode,
          startAt,
          endAt,
          duration,
          status,
          processedCount,
          errorMessage,
        },
      });

    } catch (logError) {
      // 日志记录失败不应影响任务执行结果
      console.error(`[Task:${taskCode}] 记录执行日志失败:`, logError);
    }

    // 8. 释放锁
    await releaseTaskLock(taskCode);
  }

  return result;
}

/**
 * 检查任务是否启用
 * @param taskCode 任务代码
 * @returns 是否启用
 */
export async function isTaskEnabled(taskCode: string): Promise<boolean> {
  try {
    const task = await prisma.scheduledTask.findUnique({
      where: { taskCode },
      select: { isEnabled: true },
    });
    return task?.isEnabled ?? true;
  } catch {
    // 查询失败默认允许执行
    return true;
  }
}

/**
 * 安全执行任务（检查启用状态后执行）
 * @param taskCode 任务代码
 * @param taskName 任务名称
 * @param fn 任务执行函数
 * @param ttlSeconds 锁过期时间
 * @returns 任务执行结果或null
 */
export async function runTaskSafely<T extends TaskResult | void>(
  taskCode: string,
  taskName: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T | null> {
  // 检查任务是否启用
  const enabled = await isTaskEnabled(taskCode);
  if (!enabled) {
    console.log(`[Task:${taskCode}] 任务已禁用，跳过执行`);
    return null;
  }

  return runTaskWithLock(taskCode, taskName, fn, ttlSeconds);
}
