/**
 * @file 站内信管理 - 发送系统通知 API
 * @description 后台管理发送系统通知给全部用户或指定用户
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第21.2节 - 发送系统通知
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { adminNotificationService } from '@/services/admin-notification.service';

// ================================
// 发送通知请求体验证Schema
// ================================
const sendNotificationSchema = z.object({
  targetType: z.enum(['ALL', 'SPECIFIC'], {
    errorMap: () => ({ message: '无效的目标类型，必须为 ALL 或 SPECIFIC' }),
  }),
  targetUserIds: z.array(z.number().int().positive('用户ID必须为正整数')).optional(),
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符'),
  content: z.string().min(1, '内容不能为空'),
}).refine(
  (data) => {
    // 如果是指定用户，则targetUserIds必填
    if (data.targetType === 'SPECIFIC') {
      return data.targetUserIds && data.targetUserIds.length > 0;
    }
    return true;
  },
  { message: '指定用户时必须提供用户ID列表', path: ['targetUserIds'] }
);

// ================================
// POST /api/admin/notifications/send - 发送系统通知
// ================================
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const body = await req.json();
      
      // 验证请求体
      const parseResult = sendNotificationSchema.safeParse(body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }

      const data = parseResult.data;
      const result = await adminNotificationService.sendNotification({
        targetType: data.targetType,
        targetUserIds: data.targetUserIds,
        title: data.title,
        content: data.content,
      });

      return successResponse(result, '通知已发送');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[发送系统通知] 发送失败:', error);
      return errorResponse('SYSTEM_ERROR', '发送系统通知失败', 500);
    }
  });
}
