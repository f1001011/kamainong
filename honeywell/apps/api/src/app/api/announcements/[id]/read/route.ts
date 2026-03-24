/**
 * @file 标记公告已读接口
 * @description 标记公告为已读状态
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第15节 - 公告接口
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse } from '@/lib/response';
import { announcementService } from '@/services/announcement.service';

/**
 * POST /api/announcements/:id/read
 * @description 标记公告为已读
 * @auth 需要登录
 * @param id - 公告ID
 * @returns 操作结果
 * 
 * @example 响应示例
 * {
 *   "success": true,
 *   "data": null,
 *   "message": "标记成功"
 * }
 * 
 * @error ANNOUNCEMENT_NOT_FOUND - 公告不存在
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  return withAuth(request, async (_req, userId) => {
    const { id } = await params;
    const announcementId = parseInt(id, 10);
    
    if (isNaN(announcementId)) {
      throw new Error('معرف الإعلان غير صالح');
    }
    
    await announcementService.markAsRead(userId, announcementId);
    return successResponse(null, 'تم وضع علامة مقروء');
  });
}
