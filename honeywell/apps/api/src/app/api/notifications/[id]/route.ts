/**
 * @file 通知详情接口
 * @description 获取单条通知的详细内容
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第14.2节 - 通知详情
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse } from '@/lib/response';
import { notificationService } from '@/services/notification.service';

/**
 * GET /api/notifications/:id
 * @description 获取通知详情
 * @auth 需要登录
 * @param id - 通知ID
 * @returns {NotificationDetail} 通知详情
 * 
 * @example 响应示例
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "type": "RECHARGE_SUCCESS",
 *     "title": "充值成功",
 *     "content": "您已成功充值 $ 100.000",
 *     "isRead": false,
 *     "createdAt": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 * 
 * @error NOTIFICATION_NOT_FOUND - 通知不存在
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  return withAuth(request, async (_req, userId) => {
    const { id } = await params;
    const notificationId = parseInt(id, 10);
    
    if (isNaN(notificationId)) {
      throw new Error('معرف الإشعار غير صالح');
    }
    
    const notification = await notificationService.getNotificationDetail(userId, notificationId);
    return successResponse(notification);
  });
}
