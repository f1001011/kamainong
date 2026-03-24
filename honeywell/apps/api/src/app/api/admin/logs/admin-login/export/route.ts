/**
 * @file 管理员登录日志导出API
 * @description 后台管理端 - 导出管理员登录日志为 CSV
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
      const username = searchParams.get('username') || undefined;
      const ip = searchParams.get('ip') || undefined;
      const status = searchParams.get('status') || undefined;
      const startDate = searchParams.get('startDate') || undefined;
      const endDate = searchParams.get('endDate') || undefined;

      const where: Prisma.AdminLoginLogWhereInput = {};

      if (username) {
        where.username = { contains: username };
      }
      if (ip) {
        where.ip = { contains: ip };
      }
      if (status === 'SUCCESS' || status === 'FAILED') {
        where.status = status;
      }
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const records = await prisma.adminLoginLog.findMany({
        where,
        include: {
          admin: { select: { username: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10000,
      });

      const csvRows = ['ID,用户名,IP,位置,状态,时间'];
      records.forEach((r) => {
        csvRows.push([
          r.id,
          escapeCsv(r.username),
          escapeCsv(r.ip),
          escapeCsv(r.ipLocation),
          r.status === 'SUCCESS' ? '成功' : '失败',
          r.createdAt.toISOString(),
        ].join(','));
      });
      const csv = csvRows.join('\n');

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="admin-login-logs.csv"',
        },
      });
    } catch (error) {
      console.error('[GET /api/admin/logs/admin-login/export] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '导出管理员登录日志失败', 500);
    }
  });
}
