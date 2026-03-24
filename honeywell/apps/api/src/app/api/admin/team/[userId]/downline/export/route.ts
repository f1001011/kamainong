import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

function toCsv(headers: string[], rows: string[][]): string {
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * 导出用户下线团队 CSV
 * @route GET /api/admin/team/[userId]/downline/export
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  return withAdminAuth(request, async () => {
    try {
      const { userId } = await params;
      const uid = parseInt(userId);

      if (isNaN(uid)) {
        return errorResponse('VALIDATION_ERROR', '用户ID无效', 400);
      }

      const downline = await prisma.user.findMany({
        where: { inviterId: uid },
        select: {
          id: true,
          phone: true,
          availableBalance: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const headers = ['ID', '手机号', '余额', '注册时间'];
      const rows = downline.map(u => [
        String(u.id),
        u.phone,
        String(u.availableBalance),
        u.createdAt.toISOString(),
      ]);

      const csv = toCsv(headers, rows);

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="team-downline-${uid}-export.csv"`,
        },
      });
    } catch (error) {
      console.error('[Team Downline Export Error]', error);
      return errorResponse('INTERNAL_ERROR', '导出下线团队失败');
    }
  });
}
