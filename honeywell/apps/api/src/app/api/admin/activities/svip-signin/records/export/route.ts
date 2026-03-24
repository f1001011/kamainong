import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

function toCsv(headers: string[], rows: string[][]): string {
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * 导出 SVIP 奖励记录 CSV
 * @route GET /api/admin/activities/svip-signin/records/export
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const records = await prisma.svipRewardRecord.findMany({
        take: 10000,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { phone: true } },
          product: { select: { name: true } },
        },
      });

      const headers = ['ID', '用户手机', 'SVIP等级', '奖励金额', '时间'];
      const rows = records.map((r: (typeof records)[number]) => [
        String(r.id),
        r.user.phone,
        String(r.svipLevel),
        String(r.amount),
        r.createdAt.toISOString(),
      ]);

      const csv = toCsv(headers, rows);

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="svip-reward-records-export.csv"',
        },
      });
    } catch (error) {
      console.error('[SVIP Reward Records Export Error]', error);
      return errorResponse('INTERNAL_ERROR', '导出SVIP奖励记录失败');
    }
  });
}
