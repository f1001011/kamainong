/**
 * @file 站内信管理 - 详情 API
 * @description 后台管理站内信详情获取
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第21节 - 站内信管理接口
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { adminNotificationService } from '@/services/admin-notification.service';

// 路由参数类型
interface RouteParams {
  params: Promise<{ id: string }>;
}

// ================================
// GET /api/admin/notifications/:id - 站内信详情
// ================================
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      const { id } = await params;
      const notificationId = parseInt(id, 10);
      
      // 验证ID参数
      if (isNaN(notificationId) || notificationId <= 0) {
        return errorResponse('VALIDATION_ERROR', '无效的站内信ID', 400);
      }

      const notification = await adminNotificationService.getNotificationDetail(notificationId);
      return successResponse(notification);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[站内信详情] 获取失败:', error);
      return errorResponse('SYSTEM_ERROR', '获取站内信详情失败', 500);
    }
  });
}
