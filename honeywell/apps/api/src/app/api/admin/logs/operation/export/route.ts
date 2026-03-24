/**
 * @file 操作日志导出API
 * @description 后台管理端 - 导出管理员操作日志为 CSV
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@honeywell/database';

function escapeCsv(value: string | null | undefined): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const { searchParams } = new URL(req.url);
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

      const records = await prisma.adminOperationLog.findMany({
        where,
        include: {
          admin: { select: { username: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10000,
      });

      const csvRows = ['ID,管理员,模块,操作,目标,IP,时间'];
      records.forEach((r) => {
        const target = r.targetType
          ? `${r.targetType}${r.targetId ? '#' + r.targetId : ''}`
          : '';
        csvRows.push([
          r.id,
          escapeCsv(r.admin?.username),
          escapeCsv(r.module),
          escapeCsv(r.action),
          escapeCsv(target),
          escapeCsv(r.ip),
          r.createdAt.toISOString(),
        ].join(','));
      });
      const csv = csvRows.join('\n');

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="operation-logs.csv"',
        },
      });
    } catch (error) {
      console.error('[GET /api/admin/logs/operation/export] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '导出操作日志失败', 500);
    }
  });
}
