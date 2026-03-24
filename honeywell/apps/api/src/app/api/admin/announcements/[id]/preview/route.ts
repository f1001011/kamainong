/**
 * @file 公告管理 - 预览 API
 * @description 后台管理公告预览功能
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第11.2节 - 公告管理接口
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { previewAnnouncement } from '@/services/content-management.service';

// ================================
// GET /api/admin/announcements/:id/preview - 预览公告
// ================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      const { id } = await params;
      const announcementId = parseInt(id, 10);
      
      if (isNaN(announcementId) || announcementId <= 0) {
        return errorResponse('VALIDATION_ERROR', '无效的公告ID', 400);
      }

      const preview = await previewAnnouncement(announcementId);
      return successResponse(preview);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[公告预览] 获取失败:', error);
      return errorResponse('SYSTEM_ERROR', '获取公告预览失败', 500);
    }
  });
}
