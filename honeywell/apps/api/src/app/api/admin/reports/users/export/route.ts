import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

function toCsv(headers: string[], rows: string[][]): string {
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * 导出用户列表 CSV
 * @route GET /api/admin/reports/users/export
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const users = await prisma.user.findMany({
        take: 10000,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phone: true,
          availableBalance: true,
          status: true,
          createdAt: true,
        },
      });

      const headers = ['ID', '手机号', '余额', '状态', '注册时间'];
      const rows = users.map(u => [
        String(u.id),
        u.phone,
        String(u.availableBalance),
        u.status,
        u.createdAt.toISOString(),
      ]);

      const csv = toCsv(headers, rows);

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="users-export.csv"',
        },
      });
    } catch (error) {
      console.error('[Users Export Error]', error);
      return errorResponse('INTERNAL_ERROR', '导出用户列表失败');
    }
  });
}
