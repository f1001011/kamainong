import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

function toCsv(headers: string[], rows: string[][]): string {
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * 导出连单奖励领取记录 CSV
 * @route GET /api/admin/activities/collection/claims/export
 * @description 从 activityReward 表查询 COLLECTION_BONUS 活动的领取记录
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const records = await prisma.activityReward.findMany({
        where: { activityCode: 'COLLECTION_BONUS' },
        take: 10000,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { phone: true } },
        },
      });

      const headers = ['ID', '用户手机', '档位', '奖励金额', '时间'];
      const rows = records.map((r: typeof records[number]) => [
        String(r.id),
        r.user.phone,
        String(r.rewardLevel),
        String(r.amount),
        r.createdAt.toISOString(),
      ]);

      const csv = toCsv(headers, rows);

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="collection-claims-export.csv"',
        },
      });
    } catch (error) {
      console.error('[Collection Claims Export Error]', error);
      return errorResponse('INTERNAL_ERROR', '导出连单奖励记录失败');
    }
  });
}
