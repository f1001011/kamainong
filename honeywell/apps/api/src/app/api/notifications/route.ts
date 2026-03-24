/**
 * @file 通知列表接口
 * @description 获取用户通知列表，支持分页和类型过滤
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第14.1节 - 通知列表
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { paginatedResponse } from '@/lib/response';
import { notificationService } from '@/services/notification.service';
import { NotificationType } from '@honeywell/database';

/**
 * GET /api/notifications
 * @description 获取通知列表（带分页和未读数）
 * @auth 需要登录
 * @query page - 页码，默认1
 * @query pageSize - 每页数量，默认20
 * @query type - 通知类型筛选（可选）
 * @returns {NotificationListResult} 通知列表
 * 
 * @example 响应示例
 * {
 *   "success": true,
 *   "data": {
 *     "list": [
 *       {
 *         "id": 1,
 *         "type": "RECHARGE_SUCCESS",
 *         "title": "充值成功",
 *         "content": "您已成功充值 $ 100.000",
 *         "isRead": false,
 *         "createdAt": "2024-01-01T00:00:00.000Z"
 *       }
 *     ],
 *     "pagination": {
 *       "page": 1,
 *       "pageSize": 20,
 *       "total": 5,
 *       "totalPages": 1
 *     },
 *     "unreadCount": 3
 *   }
 * }
 */
export async function GET(request: NextRequest): Promise<Response> {
  return withAuth(request, async (req, userId) => {
    const { searchParams } = new URL(req.url);
    
    // 解析分页参数
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    
    // 解析类型过滤参数
    const typeParam = searchParams.get('type');
    let type: NotificationType | undefined;
    if (typeParam && Object.values(NotificationType).includes(typeParam as NotificationType)) {
      type = typeParam as NotificationType;
    }
    
    // 获取通知列表
    const result = await notificationService.getNotificationList(userId, {
      page,
      pageSize,
      type,
    });
    
    // 返回带有 unreadCount 的分页响应
    return paginatedResponse(
      result.list,
      result.pagination,
      { unreadCount: result.unreadCount }
    );
  });
}
