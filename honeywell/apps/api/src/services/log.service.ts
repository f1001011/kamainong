/**
 * @file 日志查询服务
 * @description 后台管理端 - 日志查询服务（操作日志、管理员登录日志、用户登录日志）
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第15节 - 日志接口
 * @depends 开发文档/04-后台界面/04.10.3-管理员登录日志页.md
 * @depends 开发文档/04-后台界面/04.10.4-用户登录日志页.md
 * @depends 开发文档/04-后台界面/04.10.5-操作日志页.md
 */

import { prisma } from '@/lib/prisma';
import { LoginStatus, Prisma } from '@honeywell/database';

// ================================
// 类型定义
// ================================

/**
 * 操作日志查询参数
 */
export interface OperationLogListParams {
  page?: number;
  pageSize?: number;
  adminId?: number;
  module?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  startDate?: string;
  endDate?: string;
  ip?: string;
}

/**
 * 管理员登录日志查询参数
 */
export interface AdminLoginLogListParams {
  page?: number;
  pageSize?: number;
  adminId?: number;
  username?: string;
  ip?: string;
  status?: 'SUCCESS' | 'FAILED';
  startDate?: string;
  endDate?: string;
}

/**
 * 用户登录日志查询参数
 */
export interface UserLoginLogListParams {
  page?: number;
  pageSize?: number;
  userId?: number;
  phone?: string;
  ip?: string;
  success?: boolean;
  deviceType?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * 操作日志响应项
 */
export interface OperationLogItem {
  id: number;
  adminId: number;
  adminName: string;
  module: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  ip: string | null;
  remark: string | null;
  createdAt: Date;
}

/**
 * 管理员登录日志响应项
 */
export interface AdminLoginLogItem {
  id: number;
  adminId: number | null;
  username: string;
  ip: string;
  ipLocation: string | null;
  userAgent: string | null;
  deviceInfo: string | null;
  status: 'SUCCESS' | 'FAILED';
  failReason: string | null;
  createdAt: Date;
}

/**
 * 用户登录日志响应项
 */
export interface UserLoginLogItem {
  id: number;
  userId: number | null;
  phone: string;
  ip: string;
  ipLocation: string | null;
  userAgent: string | null;
  deviceType: string | null;
  success: boolean;
  failReason: string | null;
  createdAt: Date;
}

/**
 * 管理员登录统计
 */
export interface AdminLoginStatistics {
  todayTotal: number;
  todayAdmins: number;
  todayFailed: number;
  todayFailRate: string;
}

/**
 * 用户登录统计
 */
export interface UserLoginStatistics {
  todayTotal: number;
  todayUsers: number;
  todayFailed: number;
  todayFailRate: string;
}

// ================================
// 辅助函数
// ================================

/**
 * 获取今天的开始时间（UTC）
 * @description 根据系统时区计算今日的UTC开始时间
 */
function getTodayStartUTC(): Date {
  // 简化实现：使用UTC时间的今日开始
  // 实际生产中应从 GlobalConfig 获取系统时区进行计算
  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
  );
  return todayStart;
}

/**
 * 获取今天的结束时间（UTC）
 */
function getTodayEndUTC(): Date {
  const now = new Date();
  const todayEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)
  );
  return todayEnd;
}

/**
 * 解析日期字符串为日期范围
 * @description 将 YYYY-MM-DD 格式的日期字符串转换为日期范围
 */
function parseDateRange(startDate?: string, endDate?: string): { gte?: Date; lte?: Date } {
  const range: { gte?: Date; lte?: Date } = {};

  if (startDate) {
    range.gte = new Date(`${startDate}T00:00:00.000Z`);
  }

  if (endDate) {
    range.lte = new Date(`${endDate}T23:59:59.999Z`);
  }

  return range;
}

/**
 * 计算失败率
 * @param total 总数
 * @param failed 失败数
 * @returns 失败率百分比字符串（保留2位小数）
 */
function calculateFailRate(total: number, failed: number): string {
  if (total === 0) return '0.00';
  return ((failed / total) * 100).toFixed(2);
}

// ================================
// 操作日志服务
// ================================

/**
 * 获取操作日志列表
 * @description 依据：02.4-后台API接口清单.md 第15.1节
 */
export async function getOperationLogList(params: OperationLogListParams) {
  const {
    page = 1,
    pageSize = 20,
    adminId,
    module,
    action,
    targetType,
    targetId,
    startDate,
    endDate,
    ip,
  } = params;

  const skip = (page - 1) * pageSize;

  // 构建查询条件
  const where: Prisma.AdminOperationLogWhereInput = {};

  if (adminId) {
    where.adminId = adminId;
  }

  if (module) {
    where.module = module;
  }

  if (action) {
    where.action = action;
  }

  if (targetType) {
    where.targetType = targetType;
  }

  if (targetId) {
    where.targetId = targetId;
  }

  if (ip) {
    where.ip = {
      contains: ip,
    };
  }

  // 时间范围筛选
  const dateRange = parseDateRange(startDate, endDate);
  if (dateRange.gte || dateRange.lte) {
    where.createdAt = dateRange;
  }

  // 并行执行查询
  const [list, total] = await Promise.all([
    prisma.adminOperationLog.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: {
            username: true,
            nickname: true,
          },
        },
      },
    }),
    prisma.adminOperationLog.count({ where }),
  ]);

  // 格式化响应数据
  const formattedList: OperationLogItem[] = list.map((log) => ({
    id: log.id,
    adminId: log.adminId,
    adminName: log.admin.nickname || log.admin.username,
    module: log.module,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    beforeData: log.beforeData as Record<string, unknown> | null,
    afterData: log.afterData as Record<string, unknown> | null,
    ip: log.ip,
    remark: log.remark,
    createdAt: log.createdAt,
  }));

  return {
    list: formattedList,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// ================================
// 管理员登录日志服务
// ================================

/**
 * 获取管理员登录日志列表
 * @description 依据：02.4-后台API接口清单.md 第15.2节
 */
export async function getAdminLoginLogList(params: AdminLoginLogListParams) {
  const {
    page = 1,
    pageSize = 20,
    adminId,
    username,
    ip,
    status,
    startDate,
    endDate,
  } = params;

  const skip = (page - 1) * pageSize;

  // 构建查询条件
  const where: Prisma.AdminLoginLogWhereInput = {};

  if (adminId) {
    where.adminId = adminId;
  }

  if (username) {
    where.username = {
      contains: username,
    };
  }

  if (ip) {
    where.ip = {
      contains: ip,
    };
  }

  if (status) {
    where.status = status as LoginStatus;
  }

  // 时间范围筛选
  const dateRange = parseDateRange(startDate, endDate);
  if (dateRange.gte || dateRange.lte) {
    where.createdAt = dateRange;
  }

  // 今日时间范围
  const todayStart = getTodayStartUTC();
  const todayEnd = getTodayEndUTC();

  // 并行执行查询
  const [list, total, todayStats] = await Promise.all([
    // 获取日志列表
    prisma.adminLoginLog.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    // 获取总数
    prisma.adminLoginLog.count({ where }),
    // 获取今日统计
    prisma.adminLoginLog.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      _count: true,
    }),
  ]);

  // 获取今日活跃管理员数（去重）
  const todayAdminsCount = await prisma.adminLoginLog.findMany({
    where: {
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
      status: 'SUCCESS',
      adminId: {
        not: null,
      },
    },
    select: {
      adminId: true,
    },
    distinct: ['adminId'],
  });

  // 计算今日统计数据
  let todayTotal = 0;
  let todayFailed = 0;
  for (const stat of todayStats) {
    todayTotal += stat._count;
    if (stat.status === 'FAILED') {
      todayFailed = stat._count;
    }
  }

  const statistics: AdminLoginStatistics = {
    todayTotal,
    todayAdmins: todayAdminsCount.length,
    todayFailed,
    todayFailRate: calculateFailRate(todayTotal, todayFailed),
  };

  // 格式化响应数据
  const formattedList: AdminLoginLogItem[] = list.map((log) => ({
    id: log.id,
    adminId: log.adminId,
    username: log.username,
    ip: log.ip,
    ipLocation: log.ipLocation,
    userAgent: log.userAgent,
    deviceInfo: log.deviceInfo,
    status: log.status as 'SUCCESS' | 'FAILED',
    failReason: log.failReason,
    createdAt: log.createdAt,
  }));

  return {
    list: formattedList,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
    statistics,
  };
}

// ================================
// 用户登录日志服务
// ================================

/**
 * 获取用户登录日志列表
 * @description 依据：02.4-后台API接口清单.md 第15.3节
 */
export async function getUserLoginLogList(params: UserLoginLogListParams) {
  const {
    page = 1,
    pageSize = 20,
    userId,
    phone,
    ip,
    success,
    deviceType,
    startDate,
    endDate,
  } = params;

  const skip = (page - 1) * pageSize;

  // 构建查询条件
  const where: Prisma.UserLoginLogWhereInput = {};

  if (userId) {
    where.userId = userId;
  }

  if (phone) {
    where.phone = {
      contains: phone,
    };
  }

  if (ip) {
    where.ip = {
      contains: ip,
    };
  }

  if (success !== undefined) {
    where.success = success;
  }

  if (deviceType) {
    where.deviceType = deviceType;
  }

  // 时间范围筛选
  const dateRange = parseDateRange(startDate, endDate);
  if (dateRange.gte || dateRange.lte) {
    where.createdAt = dateRange;
  }

  // 今日时间范围
  const todayStart = getTodayStartUTC();
  const todayEnd = getTodayEndUTC();

  // 并行执行查询
  const [list, total, todaySuccessCount, todayFailedCount, todayUsersCount] = await Promise.all([
    // 获取日志列表
    prisma.userLoginLog.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    // 获取总数
    prisma.userLoginLog.count({ where }),
    // 今日成功次数
    prisma.userLoginLog.count({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        success: true,
      },
    }),
    // 今日失败次数
    prisma.userLoginLog.count({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        success: false,
      },
    }),
    // 今日活跃用户数（去重）
    prisma.userLoginLog.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        success: true,
        userId: {
          not: null,
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    }),
  ]);

  // 计算今日统计数据
  const todayTotal = todaySuccessCount + todayFailedCount;

  const statistics: UserLoginStatistics = {
    todayTotal,
    todayUsers: todayUsersCount.length,
    todayFailed: todayFailedCount,
    todayFailRate: calculateFailRate(todayTotal, todayFailedCount),
  };

  // 格式化响应数据
  const formattedList: UserLoginLogItem[] = list.map((log) => ({
    id: log.id,
    userId: log.userId,
    phone: log.phone,
    ip: log.ip,
    ipLocation: log.ipLocation,
    userAgent: log.userAgent,
    deviceType: log.deviceType,
    success: log.success,
    failReason: log.failReason,
    createdAt: log.createdAt,
  }));

  return {
    list: formattedList,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
    statistics,
  };
}

// ================================
// 导出服务对象
// ================================

export const logService = {
  getOperationLogList,
  getAdminLoginLogList,
  getUserLoginLogList,
};

export default logService;
