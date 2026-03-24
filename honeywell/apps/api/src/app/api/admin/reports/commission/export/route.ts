import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

function toCsv(headers: string[], rows: string[][]): string {
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * 导出返佣记录 CSV（reports 路径别名）
 * @route GET /api/admin/reports/commission/export
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const records = await prisma.commissionRecord.findMany({
        take: 10000,
        orderBy: { createdAt: 'desc' },
        include: {
          receiver: { select: { phone: true } },
          sourceUser: { select: { phone: true } },
          positionOrder: {
            include: { product: { select: { name: true } } },
          },
        },
      });

      const headers = ['ID', '接收人', '来源人', '级别', '金额', '产品', '时间'];
      const rows = records.map((r: (typeof records)[number]) => [
        String(r.id),
        r.receiver.phone,
        r.sourceUser.phone,
        r.level,
        String(r.amount),
        r.positionOrder.product.name,
        r.createdAt.toISOString(),
      ]);

      const csv = toCsv(headers, rows);

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="commissions-export.csv"',
        },
      });
    } catch (error) {
      console.error('[Commission Export Error]', error);
      return errorResponse('INTERNAL_ERROR', '导出返佣记录失败');
    }
  });
}
