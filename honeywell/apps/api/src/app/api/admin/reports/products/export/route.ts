import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

function toCsv(headers: string[], rows: string[][]): string {
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * 导出产品列表 CSV
 * @route GET /api/admin/reports/products/export
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const products = await prisma.product.findMany({
        orderBy: { sortOrder: 'asc' },
      });

      const headers = ['ID', '名称', '类型', '系列', '价格', '日收益', '状态'];
      const rows = products.map(p => [
        String(p.id),
        p.name,
        p.type,
        p.series,
        String(p.price),
        String(p.dailyIncome),
        p.status,
      ]);

      const csv = toCsv(headers, rows);

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="products-export.csv"',
        },
      });
    } catch (error) {
      console.error('[Products Export Error]', error);
      return errorResponse('INTERNAL_ERROR', '导出产品列表失败');
    }
  });
}
