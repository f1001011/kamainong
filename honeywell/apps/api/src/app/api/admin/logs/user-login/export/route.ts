/**
 * @file 用户登录日志导出API
 * @description 后台管理端 - 导出用户登录日志为 CSV
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

      const records = await prisma.userLoginLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10000,
      });

      const csvRows = ['ID,手机号,IP,位置,设备,结果,时间'];
      records.forEach((r) => {
        csvRows.push([
          r.id,
          escapeCsv(r.phone),
          escapeCsv(r.ip),
          escapeCsv(r.ipLocation),
          escapeCsv(r.deviceType),
          r.success ? '成功' : '失败',
          r.createdAt.toISOString(),
        ].join(','));
      });
      const csv = csvRows.join('\n');

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="user-login-logs.csv"',
        },
      });
    } catch (error) {
      console.error('[GET /api/admin/logs/user-login/export] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '导出用户登录日志失败', 500);
    }
  });
}
