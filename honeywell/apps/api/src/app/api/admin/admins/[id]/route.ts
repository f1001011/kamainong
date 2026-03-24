/**
 * @file 管理员更新与删除API
 * @description 更新管理员信息、删除管理员
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第14.1.3、14.1.4节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { updateAdmin, deleteAdmin } from '@/services/security.service';
import { BusinessError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

// ================================
// PUT /api/admin/admins/:id - 更新管理员
// ================================

// 更新管理员请求体验证Schema
const updateAdminSchema = z.object({
  nickname: z.string().max(50, '昵称最多50个字符').optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * 更新管理员
 * @description 依据：02.4-后台API接口清单.md 第14.1.3节
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
      const validationResult = updateAdminSchema.safeParse(body);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }
      
      const { nickname, isActive } = validationResult.data;
      
      // 调用服务
      const admin = await updateAdmin(id, {
        nickname: nickname !== undefined ? nickname || undefined : undefined,
        isActive,
      });
      
      // 记录操作日志
      await prisma.adminOperationLog.create({
        data: {
          adminId,
          module: 'security',
          action: 'update',
          targetType: 'admin',
          targetId: String(id),
          afterData: { nickname, isActive },
          remark: `更新管理员 ID=${id}`,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        },
      });
      
      return successResponse(admin, '管理员信息更新成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[PUT /api/admin/admins/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}

// ================================
// DELETE /api/admin/admins/:id - 删除管理员
// ================================

/**
 * 删除管理员
 * @description 依据：02.4-后台API接口清单.md 第14.1.4节
 * 核心规则：不能删除自己，不能删除超级管理员（ID=1）
 */
export async function DELETE(
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
      
      // 调用服务（服务层会检查不能删除自己和超级管理员）
      await deleteAdmin(id, adminId);
      
      // 记录操作日志
      await prisma.adminOperationLog.create({
        data: {
          adminId,
          module: 'security',
          action: 'delete',
          targetType: 'admin',
          targetId: String(id),
          remark: `删除管理员 ID=${id}`,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        },
      });
      
      return successResponse(null, '管理员删除成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[DELETE /api/admin/admins/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
