/**
 * @file 操作日志列表API
 * @description 后台管理端 - 获取管理员操作日志（支持多条件筛选、分页）
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
      const adminId = searchParams.get('adminId') || undefined;
      const module = searchParams.get('module') || undefined;
      const action = searchParams.get('action') || undefined;
      const startDate = searchParams.get('startDate') || undefined;
      const endDate = searchParams.get('endDate') || undefined;

      const where: Prisma.AdminOperationLogWhereInput = {};

      if (adminId) {
        where.adminId = Number(adminId);
      }
      if (module) {
        where.module = { contains: module };
      }
      if (action) {
        where.action = { contains: action };
      }
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [total, list] = await Promise.all([
        prisma.adminOperationLog.count({ where }),
        prisma.adminOperationLog.findMany({
          where,
          include: {
            admin: { select: { username: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      return paginatedResponse(list, { page, pageSize, total });
    } catch (error) {
      console.error('[GET /api/admin/logs/operation] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取操作日志失败', 500);
    }
  });
}
