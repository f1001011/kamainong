/**
 * @file 未读通知数量接口
 * @description 获取用户未读通知总数
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第14节 - 通知接口
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse } from '@/lib/response';
import { notificationService } from '@/services/notification.service';

/**
 * GET /api/notifications/unread-count
 * @description 获取未读通知数量
 * @auth 需要登录
 * @returns {{ unreadCount: number }} 未读数量
 * 
 * @example 响应示例
 * {
 *   "success": true,
 *   "data": {
 *     "unreadCount": 5
 *   }
 * }
 */
export async function GET(request: NextRequest): Promise<Response> {
  return withAuth(request, async (_req, userId) => {
    const unreadCount = await notificationService.getUnreadCount(userId);
    return successResponse({ unreadCount });
  });
}
