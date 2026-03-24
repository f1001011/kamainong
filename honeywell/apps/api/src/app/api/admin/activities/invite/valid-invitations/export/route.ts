import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

function toCsv(headers: string[], rows: string[][]): string {
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * 导出有效邀请记录 CSV
 * @route GET /api/admin/activities/invite/valid-invitations/export
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const records = await prisma.validInvitation.findMany({
        take: 10000,
        orderBy: { createdAt: 'desc' },
        include: {
          inviter: { select: { phone: true } },
          invitee: { select: { phone: true } },
        },
      });

      const headers = ['ID', '邀请人', '被邀请人', '有效类型', '确认时间'];
      const rows = records.map((r: (typeof records)[number]) => [
        String(r.id),
        r.inviter.phone,
        r.invitee.phone,
        r.validType,
        r.validAt.toISOString(),
      ]);

      const csv = toCsv(headers, rows);

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="valid-invitations-export.csv"',
        },
      });
    } catch (error) {
      console.error('[Valid Invitations Export Error]', error);
      return errorResponse('INTERNAL_ERROR', '导出有效邀请记录失败');
    }
  });
}
