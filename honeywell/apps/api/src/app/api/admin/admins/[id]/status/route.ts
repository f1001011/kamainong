/**
 * @file 管理员启用/禁用API
 * @description 启用或禁用管理员账号
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第14.1.5节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { toggleAdminStatus } from '@/services/security.service';
import { BusinessError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

// ================================
// PUT /api/admin/admins/:id/status - 启用/禁用管理员
// ================================

// 请求体验证Schema
const toggleStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'isActive是必填字段' }),
});

/**
 * 启用/禁用管理员
 * @description 依据：02.4-后台API接口清单.md 第14.1.5节
 * 核心规则：不能禁用自己，不能操作超级管理员
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
      const validationResult = toggleStatusSchema.safeParse(body);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }
      
      const { isActive } = validationResult.data;
      
      // 调用服务（服务层会检查不能禁用自己和超级管理员）
      const admin = await toggleAdminStatus(id, isActive, adminId);
      
      // 记录操作日志
      await prisma.adminOperationLog.create({
        data: {
          adminId,
          module: 'security',
          action: isActive ? 'enable' : 'disable',
          targetType: 'admin',
          targetId: String(id),
          afterData: { isActive },
          remark: isActive ? `启用管理员 ID=${id}` : `禁用管理员 ID=${id}`,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        },
      });
      
      return successResponse(admin, isActive ? '管理员已启用' : '管理员已禁用');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[PUT /api/admin/admins/:id/status] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
