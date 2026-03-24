/**
 * @file 全部标记已读接口
 * @description 将用户所有未读通知标记为已读
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第14节 - 通知接口
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse } from '@/lib/response';
import { notificationService } from '@/services/notification.service';

/**
 * POST /api/notifications/read-all
 * @description 全部标记为已读
 * @auth 需要登录
 * @returns {{ updatedCount: number }} 更新数量
 * 
 * @example 响应示例
 * {
 *   "success": true,
 *   "data": {
 *     "updatedCount": 5
 *   },
 *   "message": "已将5条通知标记为已读"
 * }
 */
export async function POST(request: NextRequest): Promise<Response> {
  return withAuth(request, async (_req, userId) => {
    const updatedCount = await notificationService.markAllAsRead(userId);
    return successResponse(
      { updatedCount },
      `تم وضع علامة مقروء على ${updatedCount} إشعارات`
    );
  });
}
