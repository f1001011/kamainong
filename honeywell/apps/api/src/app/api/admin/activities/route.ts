/**
 * @file 活动列表API
 * @description GET /api/admin/activities - 获取所有活动列表
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第8.1节
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { adminActivityService } from '@/services/admin-activity.service';

/**
 * GET /api/admin/activities
 * 获取活动列表
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const activities = await adminActivityService.getActivityList();

      return successResponse({
        list: activities,
      });
    } catch (error) {
      console.error('[AdminActivities] 获取活动列表失败:', error);
      return errorResponse('INTERNAL_ERROR', '获取活动列表失败', 500);
    }
  });
}
