/**
 * @file 管理员密码重置API
 * @description 重置管理员密码
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第14.1.6节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { resetAdminPassword } from '@/services/security.service';
import { BusinessError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

// ================================
// PUT /api/admin/admins/:id/password - 重置管理员密码
// ================================

// 请求体验证Schema
const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(6, '密码至少6个字符')
    .max(32, '密码最多32个字符')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/, '密码必须包含字母和数字'),
  confirmPassword: z.string()
    .min(1, '确认密码不能为空'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

/**
 * 重置管理员密码
 * @description 依据：02.4-后台API接口清单.md 第14.1.6节
 * 核心规则：不能重置超级管理员密码（除非是超级管理员自己）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      // 解析路由参数
      const { id: idStr } = await params;
      const id = parseInt(idStr, 10);
      
      if (isNaN(id) || id <= 0) {
        return errorResponse('VALIDATION_ERROR', '无效的管理员ID', 400);
      }
      
      // 解析请求体
      const body = await req.json();
      
      // 验证参数
      const validationResult = resetPasswordSchema.safeParse(body);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }
      
      const { newPassword } = validationResult.data;
      
      // 调用服务（服务层会检查不能重置超级管理员密码）
      await resetAdminPassword(id, newPassword, adminId);
      
      // 记录操作日志
      await prisma.adminOperationLog.create({
        data: {
          adminId,
          module: 'security',
          action: 'reset_password',
          targetType: 'admin',
          targetId: String(id),
          remark: `重置管理员密码 ID=${id}`,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        },
      });
      
      return successResponse(null, '密码重置成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[PUT /api/admin/admins/:id/password] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
