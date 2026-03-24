/**
 * @file 公告列表接口
 * @description 获取用户可见的公告列表，包含有效期和目标用户检查
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第15.1节 - 公告列表
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse } from '@/lib/response';
import { announcementService } from '@/services/announcement.service';

/**
 * GET /api/announcements
 * @description 获取公告列表
 * @auth 需要登录
 * @query loginTime - 本次登录时间（可选，用于弹出频率判断）
 * @returns {AnnouncementListResult} 公告列表
 * 
 * @example 响应示例
 * {
 *   "success": true,
 *   "data": {
 *     "list": [
 *       {
 *         "id": 1,
 *         "title": "系统升级公告",
 *         "content": "系统将于今晚进行升级维护",
 *         "imageUrl": "https://example.com/banner.jpg",
 *         "buttons": [
 *           { "text": "我知道了", "type": "primary", "action": "close" }
 *         ],
 *         "createdAt": "2024-01-01T00:00:00.000Z"
 *       }
 *     ]
 *   }
 * }
 * 
 * @description 公告弹出频率说明：
 * - ONCE: 每用户仅一次，已读后不再返回
 * - EVERY_LOGIN: 每次登录都返回
 * - DAILY: 每天首次打开时返回一次
 */
export async function GET(request: NextRequest): Promise<Response> {
  return withAuth(request, async (req, userId) => {
    const { searchParams } = new URL(req.url);
    
    // 解析登录时间参数（前端可传入用户本次登录时间）
    const loginTimeParam = searchParams.get('loginTime');
    let loginTime: Date | undefined;
    if (loginTimeParam) {
      const parsedTime = new Date(loginTimeParam);
      if (!isNaN(parsedTime.getTime())) {
        loginTime = parsedTime;
      }
    }
    
    // 获取公告列表
    const result = await announcementService.getAnnouncementList(userId, loginTime);
    return successResponse(result);
  });
}
