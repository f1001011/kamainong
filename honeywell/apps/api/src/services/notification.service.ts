/**
 * @file 通知服务
 * @description 处理站内通知的列表查询、详情查询、已读标记等核心业务逻辑
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第14节 - 通知接口
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.11节 - Notification表
 */

import { prisma } from '@/lib/prisma';
import { Errors } from '@/lib/errors';
import type { NotificationType } from '@honeywell/database';

/**
 * 通知列表项
 * @description 依据：02.3-前端API接口清单.md 第14.1节
 */
export interface NotificationListItem {
  id: number;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * 通知详情
 * @description 依据：02.3-前端API接口清单.md 第14.2节
 */
export interface NotificationDetail {
  id: number;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * 通知列表查询参数
 */
export interface NotificationListParams {
  page: number;
  pageSize: number;
  type?: NotificationType;
}

/**
 * 通知列表返回结果
 */
export interface NotificationListResult {
  list: NotificationListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}

/**
 * 通知服务类
 */
export class NotificationService {
  /**
   * 获取通知列表
   * @description 依据：02.3-前端API接口清单.md 第14.1节
   * @param userId 用户ID
   * @param params 查询参数
   * @returns 通知列表及分页信息
   */
  async getNotificationList(
    userId: number,
    params: NotificationListParams
  ): Promise<NotificationListResult> {
    const { page, pageSize, type } = params;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where = {
      userId,
      ...(type ? { type } : {}),
    };

    // 并行查询列表、总数和未读数
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          type: true,
          title: true,
          content: true,
          isRead: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    // 格式化返回数据
    const list: NotificationListItem[] = notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      isRead: notification.isRead,
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
      unreadCount,
    };
  }

  /**
   * 获取通知详情
   * @description 依据：02.3-前端API接口清单.md 第14.2节
   * @param userId 用户ID
   * @param notificationId 通知ID
   * @returns 通知详情
   */
  async getNotificationDetail(
    userId: number,
    notificationId: number
  ): Promise<NotificationDetail> {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId, // 确保用户只能查看自己的通知
      },
      select: {
        id: true,
        type: true,
        title: true,
        content: true,
        isRead: true,
        createdAt: true,
      },
    });

    if (!notification) {
      throw Errors.notificationNotFound();
    }

    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    };
  }

  /**
   * 获取未读通知数量
   * @description 依据：02.3-前端API接口清单.md 第14节
   * @param userId 用户ID
   * @returns 未读数量
   */
  async getUnreadCount(userId: number): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * 标记单条通知为已读
   * @description 依据：02.3-前端API接口清单.md 第14节
   * @param userId 用户ID
   * @param notificationId 通知ID
   */
  async markAsRead(userId: number, notificationId: number): Promise<void> {
    // 检查通知是否存在且属于该用户
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw Errors.notificationNotFound();
    }

    // 如果已经是已读状态，直接返回
    if (notification.isRead) {
      return;
    }

    // 更新为已读状态
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * 标记所有通知为已读
   * @description 依据：02.3-前端API接口清单.md 第14节
   * @param userId 用户ID
   * @returns 更新的通知数量
   */
  async markAllAsRead(userId: number): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * 创建通知（内部使用）
   * @description 供其他服务调用，如充值成功、提现完成等场景
   * @param params 通知参数
   */
  async createNotification(params: {
    userId: number;
    type: NotificationType;
    title: string;
    content: string;
  }): Promise<void> {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        content: params.content,
      },
    });
  }
}

// 单例导出
export const notificationService = new NotificationService();
