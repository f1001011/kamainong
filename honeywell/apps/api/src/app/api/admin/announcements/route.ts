/**
 * @file 公告管理 - 列表/创建 API
 * @description 后台管理公告列表获取和创建
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第11.2节 - 公告管理接口
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, paginatedResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import {
  getAdminAnnouncementList,
  createAnnouncement,
  type AnnouncementListParams,
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
// 创建公告的请求体验证Schema
// ================================
const createAnnouncementSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符'),
  content: z.string().min(1, '内容不能为空'),
  // imageUrl 允许 null、相对路径（以/开头）或完整URL
  imageUrl: z.string().refine(
    (val) => val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
    '图片URL必须是相对路径或完整URL'
  ).nullable().optional(),
  targetType: z.enum(['ALL', 'SPECIFIC'], { errorMap: () => ({ message: '无效的投放目标类型' }) }).optional().default('ALL'),
  targetUserIds: z.array(z.number().int().positive()).nullable().optional(),
  popupFrequency: z.enum(['ONCE', 'EVERY_LOGIN', 'DAILY'], { errorMap: () => ({ message: '无效的弹出频率' }) }).optional().default('ONCE'),
  buttons: z.array(announcementButtonSchema).nullable().optional(),
  startAt: z.string().datetime({ offset: true }).nullable().optional(),
  endAt: z.string().datetime({ offset: true }).nullable().optional(),
  sortOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
}).refine(
  (data) => {
    // 如果是定向投放，则targetUserIds必填
    if (data.targetType === 'SPECIFIC') {
      return data.targetUserIds && data.targetUserIds.length > 0;
    }
    return true;
  },
  { message: '定向投放必须指定目标用户', path: ['targetUserIds'] }
).refine(
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
// GET /api/admin/announcements - 公告列表
// ================================
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const { searchParams } = new URL(req.url);
      
      // 解析查询参数
      const params: AnnouncementListParams = {
        page: parseInt(searchParams.get('page') ?? '1', 10),
        pageSize: parseInt(searchParams.get('pageSize') ?? '20', 10),
        keyword: searchParams.get('keyword') ?? undefined,
      };

      // 处理 isActive 参数
      const isActiveStr = searchParams.get('isActive');
      if (isActiveStr !== null) {
        params.isActive = isActiveStr === 'true';
      }

      // 处理 targetType 参数
      const targetTypeStr = searchParams.get('targetType');
      if (targetTypeStr && ['ALL', 'SPECIFIC'].includes(targetTypeStr)) {
        params.targetType = targetTypeStr as 'ALL' | 'SPECIFIC';
      }

      // 处理 popupFrequency 参数
      const popupFrequencyStr = searchParams.get('popupFrequency');
      if (popupFrequencyStr && ['ONCE', 'EVERY_LOGIN', 'DAILY'].includes(popupFrequencyStr)) {
        params.popupFrequency = popupFrequencyStr as 'ONCE' | 'EVERY_LOGIN' | 'DAILY';
      }

      // 处理生效时间范围参数
      const effectiveStartDate = searchParams.get('effectiveStartDate');
      const effectiveEndDate = searchParams.get('effectiveEndDate');
      if (effectiveStartDate) {
        params.effectiveStartDate = effectiveStartDate;
      }
      if (effectiveEndDate) {
        params.effectiveEndDate = effectiveEndDate;
      }

      // 处理排序参数
      const sortField = searchParams.get('sortField');
      const sortOrder = searchParams.get('sortOrder');
      if (sortField && ['id', 'sortOrder', 'createdAt'].includes(sortField)) {
        params.sortField = sortField as 'id' | 'sortOrder' | 'createdAt';
      }
      if (sortOrder && ['ascend', 'descend'].includes(sortOrder)) {
        params.sortOrder = sortOrder as 'ascend' | 'descend';
      }

      const result = await getAdminAnnouncementList(params);
      return paginatedResponse(result.list, result.pagination);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[公告列表] 获取失败:', error);
      return errorResponse('SYSTEM_ERROR', '获取公告列表失败', 500);
    }
  });
}

// ================================
// POST /api/admin/announcements - 创建公告
// ================================
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const body = await req.json();
      
      // 验证请求体
      const parseResult = createAnnouncementSchema.safeParse(body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }

      const data = parseResult.data;
      const announcement = await createAnnouncement({
        title: data.title,
        content: data.content,
        imageUrl: data.imageUrl ?? null,
        targetType: data.targetType,
        targetUserIds: data.targetUserIds ?? null,
        popupFrequency: data.popupFrequency,
        buttons: data.buttons ?? null,
        startAt: data.startAt ?? null,
        endAt: data.endAt ?? null,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      });

      return successResponse(announcement, '创建成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[公告创建] 创建失败:', error);
      return errorResponse('SYSTEM_ERROR', '创建公告失败', 500);
    }
  });
}
