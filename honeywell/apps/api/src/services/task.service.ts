/**
 * @file 定时任务管理服务
 * @description 后台管理端 - 定时任务管理服务（任务列表、启用/禁用、手动执行、执行日志、告警配置）
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第17节 - 定时任务接口
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.10节 - ScheduledTask表、TaskRunLog表
 */

import { prisma, Prisma } from '@/lib/prisma';
import { TaskRunStatus } from '@honeywell/database';
import { BusinessError } from '@/lib/errors';
import { acquireLock, releaseLock, clearUserCache, CACHE_KEYS } from '@/lib/redis';
import parser from 'cron-parser';
import { getSystemTimezone } from '@/lib/config';

// ================================
// 类型定义
// ================================

/**
 * 任务列表项类型
 * @description 依据：02.4-后台API接口清单.md 第17.1节
 */
interface TaskListItem {
  taskCode: string;
  taskName: string;
  description: string | null;
  cronExpression: string;
  isEnabled: boolean;
  lastRunAt: Date | null;
  lastRunStatus: TaskRunStatus | null;
  lastRunDuration: number | null;
  nextRunAt: Date | null;
}

/**
 * 任务执行日志项类型
 * @description 依据：02.4-后台API接口清单.md 第17.2节
 */
interface TaskLogItem {
  id: number;
  taskCode: string;
  startAt: Date;
  endAt: Date | null;
  duration: number | null;
  status: TaskRunStatus;
  processedCount: number | null;
  errorMessage: string | null;
}

/**
 * 任务执行日志查询参数
 */
interface TaskLogQueryParams {
  page: number;
  pageSize: number;
  status?: TaskRunStatus;
}

/**
 * 告警配置类型
 * @description 依据：02.4-后台API接口清单.md 第17.3节
 */
interface TaskAlertConfig {
  taskFailureAlertEnabled: boolean;
  consecutiveFailureThreshold: number;
  executionTimeoutThreshold: number;
  alertMethod: string[];
}

/**
 * 分布式锁 - 任务执行锁
 */
const TASK_LOCK = {
  /** 手动执行任务锁键生成 */
  MANUAL_RUN: (taskCode: string) => `lock:task:manual_run:${taskCode}`,
  /** 手动执行锁过期时间（秒）- 允许较长时间执行 */
  MANUAL_RUN_TTL: 300,
};

// ================================
// 服务类
// ================================

/**
 * 定时任务管理服务类
 */
class TaskService {
  /**
   * 获取任务列表
   * @description 依据：02.4-后台API接口清单.md 第17.1节 - 任务列表
   * @returns 任务列表（含最后执行状态）
   */
  async getTaskList(): Promise<{ list: TaskListItem[] }> {
    const tasks = await prisma.scheduledTask.findMany({
      orderBy: [{ taskCode: 'asc' }],
    });

    const list: TaskListItem[] = tasks.map((task) => ({
      taskCode: task.taskCode,
      taskName: task.taskName,
      description: task.description,
      cronExpression: task.cronExpression,
      isEnabled: task.isEnabled,
      lastRunAt: task.lastRunAt,
      lastRunStatus: task.lastRunStatus,
      lastRunDuration: task.lastRunDuration,
      nextRunAt: task.nextRunAt,
    }));

    return { list };
  }

  /**
   * 启用/禁用任务
   * @description 依据：02.4-后台API接口清单.md 第17节 - 启用/禁用任务
   * @param taskCode 任务标识
   * @returns 更新后的任务状态
   */
  async toggleTask(taskCode: string): Promise<{ isEnabled: boolean }> {
    // 检查任务是否存在
    const task = await prisma.scheduledTask.findUnique({
      where: { taskCode },
    });

    if (!task) {
      throw new BusinessError('TASK_NOT_FOUND', '任务不存在', 404);
    }

    // 切换启用状态
    const newStatus = !task.isEnabled;

    // 更新 nextRunAt（启用时计算下次执行时间，禁用时清空）
    let nextRunAt: Date | null = null;
    if (newStatus) {
      nextRunAt = this.calculateNextRunTime(task.cronExpression);
    }

    await prisma.scheduledTask.update({
      where: { taskCode },
      data: {
        isEnabled: newStatus,
        nextRunAt,
      },
    });

    return { isEnabled: newStatus };
  }

  /**
   * 手动执行任务
   * @description 依据：02.4-后台API接口清单.md 第17节 - 手动执行任务
   * 核心要求：需要分布式锁防止并发执行
   * @param taskCode 任务标识
   * @returns 执行结果
   */
  async runTask(taskCode: string): Promise<{
    taskCode: string;
    status: TaskRunStatus;
    duration: number;
    processedCount: number | null;
    errorMessage: string | null;
  }> {
    // 检查任务是否存在
    const task = await prisma.scheduledTask.findUnique({
      where: { taskCode },
    });

    if (!task) {
      throw new BusinessError('TASK_NOT_FOUND', '任务不存在', 404);
    }

    // 获取分布式锁，防止并发执行（依据：核心要求1）
    const lockKey = TASK_LOCK.MANUAL_RUN(taskCode);
    const locked = await acquireLock(lockKey, TASK_LOCK.MANUAL_RUN_TTL);

    if (!locked) {
      throw new BusinessError('TASK_ALREADY_RUNNING', '任务正在执行中，请稍后重试', 400);
    }

    const startAt = new Date();
    let status: TaskRunStatus = TaskRunStatus.RUNNING;
    let processedCount: number | null = null;
    let errorMessage: string | null = null;
    let duration = 0;

    try {
      // 更新任务状态为运行中
      await prisma.scheduledTask.update({
        where: { taskCode },
        data: {
          lastRunStatus: TaskRunStatus.RUNNING,
        },
      });

      // 创建执行日志
      const logRecord = await prisma.taskRunLog.create({
        data: {
          taskCode,
          startAt,
          status: TaskRunStatus.RUNNING,
        },
      });

      // 执行具体任务逻辑
      const result = await this.executeTaskLogic(taskCode);
      processedCount = result.processedCount;

      // 执行成功
      status = TaskRunStatus.SUCCESS;
      duration = Date.now() - startAt.getTime();

      // 更新执行日志
      await prisma.taskRunLog.update({
        where: { id: logRecord.id },
        data: {
          endAt: new Date(),
          duration,
          status: TaskRunStatus.SUCCESS,
          processedCount,
        },
      });

      // 更新任务状态
      await prisma.scheduledTask.update({
        where: { taskCode },
        data: {
          lastRunAt: startAt,
          lastRunStatus: TaskRunStatus.SUCCESS,
          lastRunDuration: duration,
          // 如果任务启用，计算下次执行时间
          nextRunAt: task.isEnabled ? this.calculateNextRunTime(task.cronExpression) : null,
        },
      });
    } catch (error) {
      // 执行失败
      status = TaskRunStatus.FAILED;
      duration = Date.now() - startAt.getTime();
      errorMessage = error instanceof Error ? error.message : '未知错误';

      // 更新执行日志
      await prisma.taskRunLog.updateMany({
        where: {
          taskCode,
          startAt,
          status: TaskRunStatus.RUNNING,
        },
        data: {
          endAt: new Date(),
          duration,
          status: TaskRunStatus.FAILED,
          errorMessage,
        },
      });

      // 更新任务状态
      await prisma.scheduledTask.update({
        where: { taskCode },
        data: {
          lastRunAt: startAt,
          lastRunStatus: TaskRunStatus.FAILED,
          lastRunDuration: duration,
        },
      });
    } finally {
      // 释放分布式锁
      await releaseLock(lockKey);
    }

    return {
      taskCode,
      status,
      duration,
      processedCount,
      errorMessage,
    };
  }

  /**
   * 获取任务执行日志
   * @description 依据：02.4-后台API接口清单.md 第17.2节 - 任务执行日志
   * @param taskCode 任务标识
   * @param params 查询参数
   * @returns 执行日志列表
   */
  async getTaskLogs(
    taskCode: string,
    params: TaskLogQueryParams
  ): Promise<{
    list: TaskLogItem[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }> {
    const { page, pageSize, status } = params;

    // 检查任务是否存在
    const task = await prisma.scheduledTask.findUnique({
      where: { taskCode },
    });

    if (!task) {
      throw new BusinessError('TASK_NOT_FOUND', '任务不存在', 404);
    }

    // 构建查询条件
    const where: { taskCode: string; status?: TaskRunStatus } = { taskCode };
    if (status) {
      where.status = status;
    }

    // 查询总数
    const total = await prisma.taskRunLog.count({ where });

    // 查询日志列表
    const logs = await prisma.taskRunLog.findMany({
      where,
      orderBy: { startAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const list: TaskLogItem[] = logs.map((log) => ({
      id: log.id,
      taskCode: log.taskCode,
      startAt: log.startAt,
      endAt: log.endAt,
      duration: log.duration,
      status: log.status,
      processedCount: log.processedCount,
      errorMessage: log.errorMessage,
    }));

    return {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取告警配置
   * @description 依据：02.4-后台API接口清单.md 第17.3节 - 获取告警配置
   * @returns 告警配置
   */
  async getAlertConfig(): Promise<TaskAlertConfig> {
    // 从 GlobalConfig 表获取告警配置
    const config = await prisma.globalConfig.findUnique({
      where: { key: 'task_alert_config' },
    });

    if (!config) {
      // 返回默认配置
      return {
        taskFailureAlertEnabled: true,
        consecutiveFailureThreshold: 3,
        executionTimeoutThreshold: 300,
        alertMethod: ['admin_notification'],
      };
    }

    // 解析 JSON 值
    const value = config.value as unknown as TaskAlertConfig;
    return {
      taskFailureAlertEnabled: value.taskFailureAlertEnabled ?? true,
      consecutiveFailureThreshold: value.consecutiveFailureThreshold ?? 3,
      executionTimeoutThreshold: value.executionTimeoutThreshold ?? 300,
      alertMethod: value.alertMethod ?? ['admin_notification'],
    };
  }

  /**
   * 更新告警配置
   * @description 依据：02.4-后台API接口清单.md 第17.3节 - 更新告警配置
   * @param config 新的告警配置
   */
  async updateAlertConfig(config: Partial<TaskAlertConfig>): Promise<void> {
    // 获取当前配置
    const currentConfig = await this.getAlertConfig();

    // 合并配置
    const newConfig: TaskAlertConfig = {
      taskFailureAlertEnabled:
        config.taskFailureAlertEnabled ?? currentConfig.taskFailureAlertEnabled,
      consecutiveFailureThreshold:
        config.consecutiveFailureThreshold ?? currentConfig.consecutiveFailureThreshold,
      executionTimeoutThreshold:
        config.executionTimeoutThreshold ?? currentConfig.executionTimeoutThreshold,
      alertMethod: config.alertMethod ?? currentConfig.alertMethod,
    };

    // 更新或创建配置
    await prisma.globalConfig.upsert({
      where: { key: 'task_alert_config' },
      create: {
        key: 'task_alert_config',
        value: newConfig as unknown as Prisma.InputJsonValue,
        description: '定时任务告警配置',
      },
      update: {
        value: newConfig as unknown as Prisma.InputJsonValue,
      },
    });
  }

  // ================================
  // 私有方法
  // ================================

  /**
   * 计算下次执行时间
   * @param cronExpression Cron 表达式
   * @returns 下次执行时间
   */
  private calculateNextRunTime(cronExpression: string): Date | null {
    try {
      const interval = parser.parseExpression(cronExpression);
      return interval.next().toDate();
    } catch (error) {
      console.error('[TaskService] 解析Cron表达式失败:', cronExpression, error);
      return null;
    }
  }

  /**
   * 执行具体任务逻辑
   * @description 根据任务代码执行相应的业务逻辑
   * @param taskCode 任务标识
   * @returns 处理结果
   */
  private async executeTaskLogic(taskCode: string): Promise<{ processedCount: number }> {
    // 根据任务代码执行不同的任务逻辑
    // 依据：02.1-数据库设计.md 第2.10节 - 定时任务清单
    switch (taskCode) {
      case 'income_settlement':
        return await this.executeIncomeSettlement();

      case 'recharge_timeout':
        return await this.executeRechargeTimeout();

      case 'signin_window_expire':
        return await this.executeSigninWindowExpire();

      case 'channel_health_check':
        return await this.executeChannelHealthCheck();

      case 'daily_stats':
        return await this.executeDailyStats();

      case 'stats_archive':
        return await this.executeStatsArchive();

      case 'recharge_status_poll':
        return await this.executeRechargeStatusPoll();

      case 'withdraw_status_poll':
        return await this.executeWithdrawStatusPoll();

      default:
        // 未知任务，返回空处理
        console.warn(`[TaskService] 未知任务代码: ${taskCode}`);
        return { processedCount: 0 };
    }
  }

  /**
   * 执行收益发放任务
   * @description 依据：开发文档.md 第8.4-8.6节 - 收益发放规则
   */
  private async executeIncomeSettlement(): Promise<{ processedCount: number }> {
    const now = new Date();
    let processedCount = 0;

    // 查找所有待发放且已到期的收益记录
    const pendingRecords = await prisma.incomeRecord.findMany({
      where: {
        status: 'PENDING',
        scheduleAt: { lte: now },
      },
      include: {
        position: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
        user: true,
      },
      take: 100, // 每次处理100条
    });

    for (const record of pendingRecords) {
      try {
        // 检查用户是否被封禁
        if (record.user.status === 'BANNED') {
          continue;
        }

        // 使用事务处理收益发放
        await prisma.$transaction(async (tx) => {
          // 1. 更新用户余额
          await tx.user.update({
            where: { id: record.userId },
            data: {
              availableBalance: { increment: record.amount },
            },
          });

          // 2. 记录资金流水
          const userAfter = await tx.user.findUnique({
            where: { id: record.userId },
            select: { availableBalance: true },
          });

          await tx.transaction.create({
            data: {
              userId: record.userId,
              type: 'INCOME',
              amount: record.amount,
              balanceAfter: userAfter!.availableBalance,
              relatedOrderNo: record.position.orderNo,
              remark: `${record.position.product?.name || '产品'}每日收益`,
            },
          });

          // 3. 更新收益记录状态
          await tx.incomeRecord.update({
            where: { id: record.id },
            data: {
              status: 'SETTLED',
              settledAt: now,
            },
          });

          // 4. 更新持仓订单进度
          await tx.positionOrder.update({
            where: { id: record.positionId },
            data: {
              paidDays: { increment: 1 },
              earnedIncome: { increment: record.amount },
              // 如果是最后一笔收益，完结订单
              ...(record.settleSequence === record.position.cycleDays
                ? {
                    status: 'COMPLETED',
                    endAt: now,
                    nextSettleAt: null,
                  }
                : {
                    nextSettleAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
                  }),
            },
          });
        });

        // 清除用户缓存（余额已变化）
        await clearUserCache(record.userId);

        processedCount++;
      } catch (error) {
        console.error(`[TaskService] 收益发放失败 recordId=${record.id}:`, error);
        // 更新重试次数
        await prisma.incomeRecord.update({
          where: { id: record.id },
          data: {
            retryCount: { increment: 1 },
            lastError: error instanceof Error ? error.message : '未知错误',
            // 超过3次重试标记为失败
            status: record.retryCount >= 2 ? 'FAILED' : 'PENDING',
          },
        });
      }
    }

    return { processedCount };
  }

  /**
   * 执行充值订单超时取消任务
   * @description 依据：开发文档.md 第5节 - 充值订单超时
   */
  private async executeRechargeTimeout(): Promise<{ processedCount: number }> {
    const now = new Date();

    // 更新所有超时的待支付订单
    const result = await prisma.rechargeOrder.updateMany({
      where: {
        status: 'PENDING_PAYMENT',
        expireAt: { lte: now },
      },
      data: {
        status: 'CANCELLED',
      },
    });

    return { processedCount: result.count };
  }

  /**
   * 执行签到窗口期过期检查
   * @description 依据：开发文档.md 第9节 - 普通用户签到规则
   */
  private async executeSigninWindowExpire(): Promise<{ processedCount: number }> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 更新所有超过7天窗口期且未完成签到的用户
    const result = await prisma.user.updateMany({
      where: {
        signInWindowStart: { lte: sevenDaysAgo },
        signInWindowExpired: false,
        signInCompleted: false,
      },
      data: {
        signInWindowExpired: true,
      },
    });

    return { processedCount: result.count };
  }

  /**
   * 执行支付通道健康检查
   * @description 依据：02.1-数据库设计.md 第2.4节 - 通道状态监控
   */
  private async executeChannelHealthCheck(): Promise<{ processedCount: number }> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    let processedCount = 0;

    // 获取所有启用的支付通道
    const channels = await prisma.paymentChannel.findMany({
      where: {
        OR: [{ payEnabled: true }, { transferEnabled: true }],
      },
    });

    for (const channel of channels) {
      // 统计近1小时的充值订单成功率
      // 仅统计真正尝试过支付的终态订单（PAID / FAILED）
      // 排除 PENDING_PAYMENT（未支付）和 CANCELLED（用户主动取消或超时），
      // 因为用户未支付不应算作通道失败
      const totalOrders = await prisma.rechargeOrder.count({
        where: {
          channelId: channel.id,
          createdAt: { gte: oneHourAgo },
          status: { in: ['PAID', 'FAILED'] },
        },
      });

      const successOrders = await prisma.rechargeOrder.count({
        where: {
          channelId: channel.id,
          createdAt: { gte: oneHourAgo },
          status: 'PAID',
        },
      });

      // 计算成功率（无有效终态订单时默认100%，避免新通道或低流量通道误判）
      const successRate = totalOrders > 0 ? (successOrders / totalOrders) * 100 : 100;

      // 根据成功率更新通道状态
      let channelStatus: 'NORMAL' | 'WARNING' | 'ERROR' = 'NORMAL';
      if (successRate < 80) {
        channelStatus = 'ERROR';
      } else if (successRate < 95) {
        channelStatus = 'WARNING';
      }

      // 更新通道状态
      await prisma.paymentChannel.update({
        where: { id: channel.id },
        data: {
          channelStatus,
          hourlySuccessRate: successRate,
          lastCheckAt: now,
        },
      });

      processedCount++;
    }

    return { processedCount };
  }

  /**
   * 执行每日统计汇总
   * @description 依据：02.1-数据库设计.md - DailyStats表
   * 使用系统配置时区计算昨日日期范围
   */
  private async executeDailyStats(): Promise<{ processedCount: number }> {
    // 从数据库配置获取系统时区
    const systemTimezone = await getSystemTimezone();
    const now = new Date();
    
    // 使用 Intl.DateTimeFormat 获取系统时区的今日日期
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: systemTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const dateStr = formatter.format(now);
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // 统计昨日数据
    const todayStart = new Date(year, month - 1, day);
    const yesterday = new Date(todayStart);
    yesterday.setDate(yesterday.getDate() - 1);

    // 查询昨日各项数据
    const [
      newUsers,
      rechargeData,
      withdrawData,
      purchaseData,
      incomeData,
      commissionData,
    ] = await Promise.all([
      // 新增用户
      prisma.user.count({
        where: {
          createdAt: { gte: yesterday, lt: todayStart },
        },
      }),
      // 充值数据
      prisma.rechargeOrder.aggregate({
        where: {
          status: 'PAID',
          createdAt: { gte: yesterday, lt: todayStart },
        },
        _count: true,
        _sum: { actualAmount: true },
      }),
      // 提现数据 - 使用 actualAmount（扣除手续费后的实际到账金额）
      prisma.withdrawOrder.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: yesterday, lt: todayStart },
        },
        _count: true,
        _sum: { actualAmount: true },
      }),
      // 购买数据
      prisma.positionOrder.aggregate({
        where: {
          createdAt: { gte: yesterday, lt: todayStart },
        },
        _count: true,
        _sum: { purchaseAmount: true },
      }),
      // 收益发放
      prisma.incomeRecord.aggregate({
        where: {
          status: 'SETTLED',
          settledAt: { gte: yesterday, lt: todayStart },
        },
        _sum: { amount: true },
      }),
      // 返佣发放
      prisma.commissionRecord.aggregate({
        where: {
          createdAt: { gte: yesterday, lt: todayStart },
        },
        _sum: { amount: true },
      }),
    ]);

    // 计算活跃用户数（有登录记录的用户）
    const activeUsers = await prisma.userLoginLog.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: yesterday, lt: todayStart },
        success: true,
      },
    });

    // 创建或更新每日统计记录
    await prisma.dailyStats.upsert({
      where: { date: yesterday },
      create: {
        date: yesterday,
        newUsers,
        activeUsers: activeUsers.length,
        rechargeCount: rechargeData._count,
        rechargeAmount: rechargeData._sum.actualAmount || 0,
        withdrawCount: withdrawData._count,
        withdrawAmount: withdrawData._sum.actualAmount || 0,
        purchaseCount: purchaseData._count,
        purchaseAmount: purchaseData._sum.purchaseAmount || 0,
        incomeAmount: incomeData._sum.amount || 0,
        commissionAmount: commissionData._sum.amount || 0,
      },
      update: {
        newUsers,
        activeUsers: activeUsers.length,
        rechargeCount: rechargeData._count,
        rechargeAmount: rechargeData._sum.actualAmount || 0,
        withdrawCount: withdrawData._count,
        withdrawAmount: withdrawData._sum.actualAmount || 0,
        purchaseCount: purchaseData._count,
        purchaseAmount: purchaseData._sum.purchaseAmount || 0,
        incomeAmount: incomeData._sum.amount || 0,
        commissionAmount: commissionData._sum.amount || 0,
      },
    });

    return { processedCount: 1 };
  }

  /**
   * 执行统计数据归档
   */
  private async executeStatsArchive(): Promise<{ processedCount: number }> {
    // 归档30天前的任务执行日志（可选：删除或移动到归档表）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.taskRunLog.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    return { processedCount: result.count };
  }

  /**
   * 执行充值订单状态轮询
   * @description 主动查询上游支付通道，补偿回调丢失的充值订单
   */
  private async executeRechargeStatusPoll(): Promise<{ processedCount: number }> {
    const { runRechargeStatusPollJob } = await import('@/jobs/recharge-status-poll.job');
    const result = await runRechargeStatusPollJob();
    return { processedCount: result.processedCount };
  }

  /**
   * 执行提现订单状态轮询
   * @description 主动查询上游代付通道，补偿回调丢失的提现订单
   */
  private async executeWithdrawStatusPoll(): Promise<{ processedCount: number }> {
    const { runWithdrawStatusPollJob } = await import('@/jobs/withdraw-status-poll.job');
    const result = await runWithdrawStatusPollJob();
    return { processedCount: result.processedCount };
  }
}

// 单例导出
export const taskService = new TaskService();
