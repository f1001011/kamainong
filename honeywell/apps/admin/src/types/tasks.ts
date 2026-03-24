/**
 * @file 定时任务类型定义
 * @description 定时任务监控相关的类型定义
 * @depends 开发文档.md 第13.20节 - 定时任务监控
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第17节 - 定时任务接口
 */

/**
 * 任务执行状态
 * @description 依据：05.3-定时任务.md 第3.1节 ScheduledTask表
 * - SUCCESS: 执行成功
 * - FAILED: 执行失败
 * - RUNNING: 运行中
 */
export type TaskRunStatus = 'SUCCESS' | 'FAILED' | 'RUNNING';

/**
 * 任务状态（用于日志筛选，包含所有可能状态）
 */
export type TaskStatus = TaskRunStatus;

/**
 * 任务信息
 * @description 依据：02.4-后台API接口清单.md 第17.1节
 */
export interface Task {
  /** 任务编码 */
  taskCode: string;
  /** 任务名称 */
  taskName: string;
  /** 任务描述 */
  description: string;
  /** Cron 表达式 */
  cronExpression: string;
  /** 是否启用 */
  isEnabled: boolean;
  /** 上次执行时间 */
  lastRunAt: string | null;
  /** 上次执行状态（SUCCESS/FAILED/RUNNING） */
  lastRunStatus: TaskRunStatus | null;
  /** 上次执行耗时（毫秒） */
  lastRunDuration: number | null;
  /** 下次执行时间 */
  nextRunAt: string | null;
  /** 连续失败次数（扩展字段，用于告警显示） */
  consecutiveFailures?: number;
}

/**
 * 任务列表响应
 * @description 依据：02.4-后台API接口清单.md 第17.1节
 */
export interface TaskListResponse {
  list: Task[];
}

/**
 * 任务执行日志
 */
export interface TaskLog {
  /** 日志ID */
  id: number;
  /** 任务编码 */
  taskCode: string;
  /** 执行开始时间 */
  startAt: string;
  /** 执行结束时间 */
  endAt: string | null;
  /** 执行耗时（毫秒） */
  duration: number | null;
  /** 执行状态 */
  status: TaskStatus;
  /** 处理数量 */
  processedCount: number | null;
  /** 错误信息 */
  errorMessage: string | null;
  /** 完整错误堆栈 */
  errorStack?: string | null;
}

/**
 * 任务日志查询参数
 */
export interface TaskLogParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 状态筛选 */
  status?: TaskStatus;
  /** 开始时间 */
  startDate?: string;
  /** 结束时间 */
  endDate?: string;
}

/**
 * 告警配置
 */
export interface AlertConfig {
  /** 任务失败告警开关 */
  taskFailureAlertEnabled: boolean;
  /** 连续失败N次后告警 */
  consecutiveFailureThreshold: number;
  /** 执行超过N秒视为超时 */
  executionTimeoutThreshold: number;
  /** 告警方式 */
  alertMethod: ('admin_notification' | 'email' | 'webhook')[];
}

/**
 * 任务执行状态配置选项
 * @description 依据：05.3-定时任务.md 第3.1节
 */
export const TASK_STATUS_OPTIONS = [
  { value: 'SUCCESS', label: '成功', color: 'green' },
  { value: 'FAILED', label: '失败', color: 'red' },
  { value: 'RUNNING', label: '运行中', color: 'green' },
] as const;

/**
 * Cron 表达式转中文
 * @param cron Cron 表达式
 * @returns 中文描述
 */
export function cronToChineseDescription(cron: string): string {
  // 简单的 Cron 表达式解析
  const parts = cron.split(' ');
  if (parts.length < 5) return cron;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // 每分钟
  if (minute === '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return '每分钟';
  }

  // 每 N 分钟
  if (minute.startsWith('*/') && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    const interval = minute.replace('*/', '');
    return `每 ${interval} 分钟`;
  }

  // 每小时的第 N 分钟
  if (minute !== '*' && !minute.includes('/') && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `每小时第 ${minute} 分`;
  }

  // 每 N 小时
  if (minute !== '*' && hour.startsWith('*/') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    const interval = hour.replace('*/', '');
    return `每 ${interval} 小时`;
  }

  // 每天固定时间
  if (minute !== '*' && hour !== '*' && !hour.includes('/') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    const paddedMinute = minute.padStart(2, '0');
    const paddedHour = hour.padStart(2, '0');
    return `每天 ${paddedHour}:${paddedMinute}`;
  }

  // 每周固定时间
  if (minute !== '*' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const dayNum = parseInt(dayOfWeek);
    const dayName = dayNames[dayNum] || `周${dayOfWeek}`;
    const paddedMinute = minute.padStart(2, '0');
    const paddedHour = hour.padStart(2, '0');
    return `每${dayName} ${paddedHour}:${paddedMinute}`;
  }

  // 每月固定时间
  if (minute !== '*' && hour !== '*' && dayOfMonth !== '*' && month === '*' && dayOfWeek === '*') {
    const paddedMinute = minute.padStart(2, '0');
    const paddedHour = hour.padStart(2, '0');
    return `每月 ${dayOfMonth} 日 ${paddedHour}:${paddedMinute}`;
  }

  // 无法解析，返回原始表达式
  return cron;
}

/**
 * 格式化执行耗时
 * @param duration 毫秒数
 * @returns 格式化后的字符串
 */
export function formatDuration(duration: number | null): string {
  if (duration === null || duration === undefined) return '-';
  
  if (duration < 1000) {
    return `${duration}ms`;
  }
  
  const seconds = Math.floor(duration / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
