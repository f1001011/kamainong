/**
 * @file 公告服务
 * @description 处理系统公告的列表查询、已读标记等核心业务逻辑
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第15节 - 公告接口
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.8节 - Announcement表
 */

import { prisma } from '@/lib/prisma';
import { Errors } from '@/lib/errors';
import { getSystemTimezone } from '@/lib/config';
import type { PopupFrequency, AnnouncementTarget } from '@honeywell/database';

/**
 * 公告按钮配置
 * @description 依据：04.8.2-公告管理页.md 第10节 - 按钮配置
 */
export interface AnnouncementButton {
  text: string;
  type: 'primary' | 'default';
  action: 'close' | 'link';
  url?: string;
}

/**
 * 公告列表项
 * @description 依据：02.3-前端API接口清单.md 第15.1节
 */
export interface AnnouncementListItem {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  buttons: AnnouncementButton[] | null;
  createdAt: string;
}

/**
 * 公告列表返回结果
 */
export interface AnnouncementListResult {
  list: AnnouncementListItem[];
}

/**
 * 公告服务类
 */
export class AnnouncementService {
  /**
   * 获取用户可见的公告列表
   * @description 依据：02.3-前端API接口清单.md 第15.1节
   * 核心逻辑：
   * 1. 检查公告有效期（startAt/endAt）
   * 2. 检查目标用户类型（targetType）
   * 3. 检查弹出频率（popupFrequency）
   *    - ONCE: 每用户仅一次，已读后不返回
   *    - EVERY_LOGIN: 每次登录都返回
   *    - DAILY: 每天首次打开时返回一次
   * @param userId 用户ID
   * @param loginTime 本次登录时间（用于 EVERY_LOGIN 和 DAILY 判断）
   * @returns 公告列表
   */
  async getAnnouncementList(
    userId: number,
    loginTime?: Date
  ): Promise<AnnouncementListResult> {
    const now = new Date();
    const currentLoginTime = loginTime || now;

    // 查询所有启用的公告，按时间范围筛选
    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          // 无时间限制
          { startAt: null, endAt: null },
          // 仅有开始时间
          { startAt: { lte: now }, endAt: null },
          // 仅有结束时间
          { startAt: null, endAt: { gte: now } },
          // 在时间范围内
          {
            startAt: { lte: now },
            endAt: { gte: now },
          },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        content: true,
        imageUrl: true,
        targetType: true,
        targetUserIds: true,
        popupFrequency: true,
        buttons: true,
        createdAt: true,
      },
    });

    // 获取用户已读记录
    const readRecords = await prisma.announcementRead.findMany({
      where: {
        userId,
        announcementId: { in: announcements.map((a) => a.id) },
      },
      select: {
        announcementId: true,
        readAt: true,
      },
    });

    // 已读记录映射
    const readMap = new Map(
      readRecords.map((r) => [r.announcementId, r.readAt])
    );

    // 获取系统时区今日开始时间（用于 DAILY 频率判断）
    const todayStart = await this.getSystemDateStart();

    // 过滤并处理公告
    const visibleAnnouncements: AnnouncementListItem[] = [];

    for (const announcement of announcements) {
      // 1. 检查目标用户类型
      if (!this.isTargetUser(userId, announcement.targetType, announcement.targetUserIds)) {
        continue;
      }

      // 2. 根据弹出频率决定是否显示
      const readAt = readMap.get(announcement.id);
      const shouldShow = this.shouldShowAnnouncement(
        announcement.popupFrequency,
        readAt,
        currentLoginTime,
        todayStart
      );

      if (!shouldShow) {
        continue;
      }

      // 解析按钮配置（JSON 字段需要安全转换）
      let buttons: AnnouncementButton[] | null = null;
      if (announcement.buttons) {
        try {
          // Prisma Json 类型需要先转为 unknown 再转为目标类型
          buttons = announcement.buttons as unknown as AnnouncementButton[];
        } catch {
          buttons = null;
        }
      }

      visibleAnnouncements.push({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        imageUrl: announcement.imageUrl,
        buttons,
        createdAt: announcement.createdAt.toISOString(),
      });
    }

    return { list: visibleAnnouncements };
  }

  /**
   * 标记公告已读
   * @description 依据：02.3-前端API接口清单.md 第15节
   * @param userId 用户ID
   * @param announcementId 公告ID
   */
  async markAsRead(userId: number, announcementId: number): Promise<void> {
    // 检查公告是否存在
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      select: {
        id: true,
        isActive: true,
        targetType: true,
        targetUserIds: true,
      },
    });

    if (!announcement) {
      throw Errors.announcementNotFound();
    }

    // 检查用户是否有权限查看该公告
    if (!this.isTargetUser(userId, announcement.targetType, announcement.targetUserIds)) {
      throw Errors.announcementNotFound();
    }

    // 使用 upsert 防止重复已读记录
    await prisma.announcementRead.upsert({
      where: {
        announcementId_userId: {
          announcementId,
          userId,
        },
      },
      create: {
        announcementId,
        userId,
        readAt: new Date(),
      },
      update: {
        readAt: new Date(),
      },
    });
  }

  /**
   * 检查用户是否为目标用户
   * @param userId 用户ID
   * @param targetType 目标类型
   * @param targetUserIds 指定用户ID列表
   * @returns 是否为目标用户
   */
  private isTargetUser(
    userId: number,
    targetType: AnnouncementTarget,
    targetUserIds: unknown
  ): boolean {
    // 全部用户
    if (targetType === 'ALL') {
      return true;
    }

    // 指定用户
    if (targetType === 'SPECIFIC') {
      if (!targetUserIds || !Array.isArray(targetUserIds)) {
        return false;
      }
      return targetUserIds.includes(userId);
    }

    return false;
  }

  /**
   * 根据弹出频率判断是否应该显示公告
   * @description 依据：02.1-数据库设计.md 第2.8节 - PopupFrequency枚举
   * @param popupFrequency 弹出频率
   * @param readAt 上次已读时间
   * @param currentLoginTime 本次登录时间
   * @param todayStart 今日开始时间（系统时区）
   * @returns 是否应该显示
   */
  private shouldShowAnnouncement(
    popupFrequency: PopupFrequency,
    readAt: Date | undefined,
    currentLoginTime: Date,
    todayStart: Date
  ): boolean {
    switch (popupFrequency) {
      case 'ONCE':
        // 每用户仅一次，已读后不再显示
        return !readAt;

      case 'EVERY_LOGIN':
        // 每次登录都显示
        // 如果没有已读记录，显示
        // 如果已读时间早于本次登录时间，显示
        if (!readAt) {
          return true;
        }
        return readAt < currentLoginTime;

      case 'DAILY':
        // 每天一次
        if (!readAt) {
          return true;
        }
        // 检查是否是今天已读（使用系统时区）
        return readAt < todayStart;

      default:
        return true;
    }
  }

  /**
   * 获取系统时区的当日开始时间
   * @description 依据：开发文档.md 第3节 - 时区处理，时区从 GlobalConfig 获取，禁止硬编码
   * @returns 当日 00:00:00 的 Date 对象（基于系统时区）
   */
  private async getSystemDateStart(): Promise<Date> {
    // 从 GlobalConfig 获取系统时区，禁止硬编码
    const systemTimezone = await getSystemTimezone();

    const now = new Date();
    // 使用 Intl.DateTimeFormat 获取指定时区的日期部分
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: systemTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const dateStr = formatter.format(now); // 格式: YYYY-MM-DD
    const [year, month, day] = dateStr.split('-').map(Number);

    // 返回 UTC 时间的日期起始点（存入数据库时使用）
    return new Date(Date.UTC(year, month - 1, day));
  }
}

// 单例导出
export const announcementService = new AnnouncementService();
