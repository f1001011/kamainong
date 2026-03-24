/**
 * @file 公告管理 - 详情/更新/删除 API
 * @description 后台管理单个公告的详情查看、更新和删除
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第11.2节 - 公告管理接口
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import {
  getAdminAnnouncementDetail,
  updateAnnouncement,
  deleteAnnouncement,
} from '@/services/content-management.service';

// ================================
// 公告按钮Schema
// 依据：04.8.2-公告管理页.md 第10节 - 按钮配置
// ================================
const announcementButtonSchema = z.object({
  text: z.string().min(1, '按钮文字不能为空'),
  type: z.enum(['primary', 'default']),
  action: z.enum(['close', 'link']),
  url: z.string().optional(),
}).refine(
  (data) => {
    // 如果动作是链接，则url必填
    if (data.action === 'link') {
      return data.url && data.url.length > 0;
    }
    return true;
  },
  { message: '链接动作必须提供URL', path: ['url'] }
);

// ================================
// 更新公告的请求体验证Schema
// ================================
const updateAnnouncementSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符').optional(),
  content: z.string().min(1, '内容不能为空').optional(),
  // imageUrl 允许 null、相对路径（以/开头）或完整URL
  imageUrl: z.string().refine(
    (val) => val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
    '图片URL必须是相对路径或完整URL'
  ).nullable().optional(),
  targetType: z.enum(['ALL', 'SPECIFIC'], { errorMap: () => ({ message: '无效的投放目标类型' }) }).optional(),
  targetUserIds: z.array(z.number().int().positive()).nullable().optional(),
  popupFrequency: z.enum(['ONCE', 'EVERY_LOGIN', 'DAILY'], { errorMap: () => ({ message: '无效的弹出频率' }) }).optional(),
  buttons: z.array(announcementButtonSchema).nullable().optional(),
  startAt: z.string().datetime({ offset: true }).nullable().optional(),
  endAt: z.string().datetime({ offset: true }).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
}).refine(
  (data) => {
    // 验证有效期逻辑
    if (data.startAt && data.endAt) {
      return new Date(data.endAt) > new Date(data.startAt);
    }
    return true;
  },
  { message: '结束时间必须大于开始时间', path: ['endAt'] }
);

// ================================
// GET /api/admin/announcements/:id - 公告详情
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

      const announcement = await getAdminAnnouncementDetail(announcementId);
      return successResponse(announcement);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[公告详情] 获取失败:', error);
      return errorResponse('SYSTEM_ERROR', '获取公告详情失败', 500);
    }
  });
}

// ================================
// PUT /api/admin/announcements/:id - 更新公告
// ================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const { id } = await params;
      const announcementId = parseInt(id, 10);
      
      if (isNaN(announcementId) || announcementId <= 0) {
        return errorResponse('VALIDATION_ERROR', '无效的公告ID', 400);
      }

      const body = await req.json();
      
      // 验证请求体
      const parseResult = updateAnnouncementSchema.safeParse(body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }

      const data = parseResult.data;

      // 如果更新为定向投放，检查目标用户
      if (data.targetType === 'SPECIFIC' && (!data.targetUserIds || data.targetUserIds.length === 0)) {
        return errorResponse('VALIDATION_ERROR', '定向投放必须指定目标用户', 400);
      }

      const announcement = await updateAnnouncement(announcementId, data);
      return successResponse(announcement, '更新成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[公告更新] 更新失败:', error);
      return errorResponse('SYSTEM_ERROR', '更新公告失败', 500);
    }
  });
}

// ================================
// DELETE /api/admin/announcements/:id - 删除公告
// ================================
export async function DELETE(
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

      await deleteAnnouncement(announcementId);
      return successResponse(null, '删除成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[公告删除] 删除失败:', error);
      return errorResponse('SYSTEM_ERROR', '删除公告失败', 500);
    }
  });
}
