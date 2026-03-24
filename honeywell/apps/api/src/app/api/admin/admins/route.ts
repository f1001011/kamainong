/**
 * @file 管理员列表与创建API
 * @description 获取管理员列表、创建新管理员
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第14.1.1、14.1.2节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/response';
import { getAdminList, createAdmin } from '@/services/security.service';
import { BusinessError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

// ================================
// GET /api/admin/admins - 管理员列表
// ================================

/**
 * 获取管理员列表
 * @description 依据：02.4-后台API接口清单.md 第14.1.1节
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      // 解析查询参数
      const { searchParams } = new URL(req.url);
      
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
      const username = searchParams.get('username') || undefined;
      const nickname = searchParams.get('nickname') || undefined;
      const isActiveParam = searchParams.get('isActive');
      const isActive = isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined;
      const startDate = searchParams.get('startDate') || undefined;
      const endDate = searchParams.get('endDate') || undefined;
      const sortField = searchParams.get('sortField') || undefined;
      const sortOrder = searchParams.get('sortOrder') as 'ascend' | 'descend' | undefined;
      
      // 调用服务
      const result = await getAdminList({
        page,
        pageSize,
        username,
        nickname,
        isActive,
        startDate,
        endDate,
        sortField,
        sortOrder,
      });
      
      // 记录操作日志
      await prisma.adminOperationLog.create({
        data: {
          adminId,
          module: 'security',
          action: 'list',
          targetType: 'admin',
          remark: `查询管理员列表 page=${page} pageSize=${pageSize}`,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        },
      });
      
      return paginatedResponse(result.list, result.pagination);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/admins] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}

// ================================
// POST /api/admin/admins - 创建管理员
// ================================

// 创建管理员请求体验证Schema
const createAdminSchema = z.object({
  username: z.string()
    .min(3, '用户名至少3个字符')
    .max(20, '用户名最多20个字符')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, '用户名必须以字母开头，只能包含字母、数字和下划线'),
  password: z.string()
    .min(6, '密码至少6个字符')
    .max(32, '密码最多32个字符')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/, '密码必须包含字母和数字'),
  nickname: z.string().max(50, '昵称最多50个字符').optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

/**
 * 创建管理员
 * @description 依据：02.4-后台API接口清单.md 第14.1.2节
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      // 解析请求体
      const body = await req.json();
      
      // 验证参数
      const validationResult = createAdminSchema.safeParse(body);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }
      
      const { username, password, nickname, isActive } = validationResult.data;
      
      // 调用服务
      const admin = await createAdmin({
        username,
        password,
        nickname: nickname || undefined,
        isActive,
      });
      
      // 记录操作日志
      await prisma.adminOperationLog.create({
        data: {
          adminId,
          module: 'security',
          action: 'create',
          targetType: 'admin',
          targetId: String(admin.id),
          afterData: { username, nickname },
          remark: `创建管理员 ${username}`,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        },
      });
      
      return successResponse(admin, '管理员添加成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/admins] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
