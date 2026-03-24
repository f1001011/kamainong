/**
 * @file 获取当前管理员信息接口
 * @description GET /api/admin/auth/profile - 获取当前管理员信息
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第1节 - 认证接口
 *
 * 核心业务规则：
 * 1. 需要携带有效 Token
 * 2. 返回当前登录管理员的基本信息
 * 3. 支持 Token 自动续期（中间件处理）
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/response';
import { withAdminAuth } from '@/middleware/auth';
import { Errors } from '@/lib/errors';

// ================================
// 路由处理
// ================================

/**
 * 获取管理员信息处理器
 * @description 需要鉴权的路由，通过 withAdminAuth 中间件保护
 */
async function profileHandler(_request: NextRequest, adminId: number) {
  // 查询管理员详细信息
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      username: true,
      nickname: true,
      isActive: true,
      lastLoginAt: true,
      lastLoginIp: true,
      createdAt: true,
    },
  });

  if (!admin) {
    throw Errors.adminNotFound();
  }

  // 返回管理员信息（依据：02.4-后台API接口清单.md 第1.3节）
  return successResponse({
    id: admin.id,
    username: admin.username,
    nickname: admin.nickname,
    isActive: admin.isActive,
    lastLoginAt: admin.lastLoginAt?.toISOString() ?? null,
    lastLoginIp: admin.lastLoginIp,
    createdAt: admin.createdAt.toISOString(),
  });
}

/**
 * GET /api/admin/auth/profile
 * @description 获取当前管理员信息
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, profileHandler);
}
