import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

function toCsv(headers: string[], rows: string[][]): string {
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * 导出签到记录 CSV
 * @route GET /api/admin/activities/normal-signin/records/export
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const records = await prisma.signInRecord.findMany({
        where: { signType: 'NORMAL' },
        take: 10000,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { phone: true } },
        },
      });

      const headers = ['ID', '用户手机', '奖励金额', '签到时间'];
      const rows = records.map((r: (typeof records)[number]) => [
        String(r.id),
        r.user.phone,
        String(r.amount),
        r.createdAt.toISOString(),
      ]);

      const csv = toCsv(headers, rows);

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="signin-records-export.csv"',
        },
      });
    } catch (error) {
      console.error('[SignIn Records Export Error]', error);
      return errorResponse('INTERNAL_ERROR', '导出签到记录失败');
    }
  });
}
