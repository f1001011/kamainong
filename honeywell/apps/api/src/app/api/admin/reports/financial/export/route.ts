import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

function toCsv(headers: string[], rows: string[][]): string {
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * 导出财务日报 CSV
 * @route GET /api/admin/reports/financial/export
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const stats = await prisma.dailyStats.findMany({
        take: 365,
        orderBy: { date: 'desc' },
      });

      const headers = ['日期', '充值金额', '提现金额', '新增用户', '购买订单数', '返佣总额'];
      const rows = stats.map(s => [
        s.date.toISOString().split('T')[0],
        String(s.rechargeAmount),
        String(s.withdrawAmount),
        String(s.newUsers),
        String(s.purchaseCount),
        String(s.commissionAmount),
      ]);

      const csv = toCsv(headers, rows);

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="financial-report-export.csv"',
        },
      });
    } catch (error) {
      console.error('[Financial Export Error]', error);
      return errorResponse('INTERNAL_ERROR', '导出财务报表失败');
    }
  });
}
