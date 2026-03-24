/**
 * @file 后台站内信管理服务
 * @description 处理后台管理站内信的列表查询、详情查询、发送通知、批量删除等功能
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第21节 - 站内信管理接口
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.11节 - Notification表
 */

import { prisma } from '@/lib/prisma';
import { Errors } from '@/lib/errors';
import type { NotificationType, Prisma } from '@honeywell/database';

/**
 * 站内信列表项（后台）
 * @description 依据：02.4-后台API接口清单.md 第21.1节
 */
export interface AdminNotificationListItem {
  id: number;
  userId: number;
  userPhone: string;
  userNickname: string | null;  // 用户昵称可能为空
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

/**
 * 站内信详情（后台）
 * @description 依据：02.4-后台API接口清单.md 第21.1节
 */
export interface AdminNotificationDetail {
  id: number;
  userId: number;
  userPhone: string;
  userNickname: string | null;  // 用户昵称可能为空
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 站内信列表查询参数
 * @description 依据：02.4-后台API接口清单.md 第21.1节
 */
export interface AdminNotificationListParams {
  page: number;
  pageSize: number;
  userId?: number;
  userPhone?: string;
  type?: NotificationType;
  types?: NotificationType[];  // 支持多选类型筛选
  isRead?: boolean;
  startDate?: string;
  endDate?: string;
}

/**
 * 站内信列表返回结果
 */
export interface AdminNotificationListResult {
  list: AdminNotificationListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 发送通知参数
 * @description 依据：02.4-后台API接口清单.md 第21.2节
 */
export interface SendNotificationParams {
  targetType: 'ALL' | 'SPECIFIC';
  targetUserIds?: number[];
  title: string;
  content: string;
}

/**
 * 发送通知结果
 */
export interface SendNotificationResult {
  sentCount: number;
}

/**
 * 批量删除结果
 */
export interface BatchDeleteResult {
  deletedCount: number;
}

/**
 * 后台站内信管理服务类
 */
export class AdminNotificationService {
  /**
   * 获取站内信列表（后台）
   * @description 依据：02.4-后台API接口清单.md 第21.1节
   * @param params 查询参数
   * @returns 站内信列表及分页信息
   */
  async getNotificationList(
    params: AdminNotificationListParams
  ): Promise<AdminNotificationListResult> {
    const { page, pageSize, userId, userPhone, type, types, isRead, startDate, endDate } = params;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: Prisma.NotificationWhereInput = {};

    // 用户ID筛选
    if (userId !== undefined) {
      where.userId = userId;
    }

    // 用户手机号筛选（需要关联查询）
    if (userPhone) {
      where.user = {
        phone: { contains: userPhone },
      };
    }

    // 通知类型筛选（支持单选和多选）
    if (types && types.length > 0) {
      where.type = { in: types };
    } else if (type) {
      where.type = type;
    }

    // 已读状态筛选
    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    // 时间范围筛选
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // 结束日期设为当天 23:59:59
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDateTime;
      }
    }

    // 并行查询列表和总数
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          user: {
            select: {
              phone: true,
              nickname: true,
            },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    // 格式化返回数据
    const list: AdminNotificationListItem[] = notifications.map((notification) => ({
      id: notification.id,
      userId: notification.userId,
      userPhone: notification.user.phone,
      userNickname: notification.user.nickname,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      isRead: notification.isRead,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
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
   * 获取站内信详情（后台）
   * @description 依据：02.4-后台API接口清单.md 第21节
   * @param notificationId 站内信ID
   * @returns 站内信详情
   */
  async getNotificationDetail(notificationId: number): Promise<AdminNotificationDetail> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        user: {
          select: {
            phone: true,
            nickname: true,
          },
        },
      },
    });

    if (!notification) {
      throw Errors.notificationNotFound();
    }

    return {
      id: notification.id,
      userId: notification.userId,
      userPhone: notification.user.phone,
      userNickname: notification.user.nickname,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      isRead: notification.isRead,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
    };
  }

  /**
   * 发送系统通知
   * @description 依据：02.4-后台API接口清单.md 第21.2节
   * 支持发送给全部用户或指定用户
   * @param params 发送参数
   * @returns 发送数量统计
   */
  async sendNotification(params: SendNotificationParams): Promise<SendNotificationResult> {
    const { targetType, targetUserIds, title, content } = params;

    let userIds: number[] = [];

    if (targetType === 'ALL') {
      // 获取所有活跃用户的ID
      const users = await prisma.user.findMany({
        where: {
          status: 'ACTIVE',
        },
        select: {
          id: true,
        },
      });
      userIds = users.map((u) => u.id);
    } else if (targetType === 'SPECIFIC') {
      // 指定用户ID列表
      if (!targetUserIds || targetUserIds.length === 0) {
        throw Errors.validationError('指定用户时必须提供用户ID列表');
      }
      // 验证用户是否存在
      const existingUsers = await prisma.user.findMany({
        where: {
          id: { in: targetUserIds },
        },
        select: {
          id: true,
        },
      });
      userIds = existingUsers.map((u) => u.id);
    }

    if (userIds.length === 0) {
      return { sentCount: 0 };
    }

    // 批量创建通知
    // 使用 createMany 批量插入，性能更好
    const result = await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: 'SYSTEM_ANNOUNCEMENT' as const,
        title,
        content,
        isRead: false,
      })),
    });

    return { sentCount: result.count };
  }

  /**
   * 批量删除站内信
   * @description 依据：02.4-后台API接口清单.md 第21节
   * @param ids 站内信ID列表
   * @returns 删除数量
   */
  async batchDelete(ids: number[]): Promise<BatchDeleteResult> {
    if (!ids || ids.length === 0) {
      throw Errors.validationError('ID列表不能为空');
    }

    const result = await prisma.notification.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return { deletedCount: result.count };
  }
}

// 单例导出
export const adminNotificationService = new AdminNotificationService();
