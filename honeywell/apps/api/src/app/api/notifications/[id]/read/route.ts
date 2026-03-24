/**
 * @file 标记通知已读接口
 * @description 标记单条通知为已读状态
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第14节 - 通知接口
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse } from '@/lib/response';
import { notificationService } from '@/services/notification.service';

/**
 * POST /api/notifications/:id/read
 * @description 标记单条通知为已读
 * @auth 需要登录
 * @param id - 通知ID
 * @returns 操作结果
 * 
 * @example 响应示例
 * {
 *   "success": true,
 *   "data": null,
 *   "message": "标记成功"
 * }
 * 
 * @error NOTIFICATION_NOT_FOUND - 通知不存在
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  return withAuth(request, async (_req, userId) => {
    const { id } = await params;
    const notificationId = parseInt(id, 10);
    
    if (isNaN(notificationId)) {
      throw new Error('معرف الإشعار غير صالح');
    }
    
    await notificationService.markAsRead(userId, notificationId);
    return successResponse(null, 'تم وضع علامة مقروء');
  });
}
