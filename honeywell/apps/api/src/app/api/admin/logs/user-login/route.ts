/**
 * @file 用户登录日志列表API
 * @description 后台管理端 - 获取用户登录日志（支持多条件筛选、分页）
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { errorResponse, paginatedResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@honeywell/database';

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = Math.max(1, Number(searchParams.get('page')) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 20));
      const phone = searchParams.get('phone') || undefined;
      const ip = searchParams.get('ip') || undefined;
      const success = searchParams.get('success');
      const startDate = searchParams.get('startDate') || undefined;
      const endDate = searchParams.get('endDate') || undefined;

      const where: Prisma.UserLoginLogWhereInput = {};

      if (phone) {
        where.phone = { contains: phone };
      }
      if (ip) {
        where.ip = { contains: ip };
      }
      if (success === 'true' || success === 'false') {
        where.success = success === 'true';
      }
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [total, list] = await Promise.all([
        prisma.userLoginLog.count({ where }),
        prisma.userLoginLog.findMany({
          where,
          include: {
            user: { select: { phone: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      return paginatedResponse(list, { page, pageSize, total });
    } catch (error) {
      console.error('[GET /api/admin/logs/user-login] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取用户登录日志失败', 500);
    }
  });
}
