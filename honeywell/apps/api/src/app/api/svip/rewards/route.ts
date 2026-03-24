/**
 * GET /api/svip/rewards - 获取SVIP奖励领取记录
 */
import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, userId) => {
    try {
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

      const where = { userId };

      const [list, total] = await Promise.all([
        prisma.svipRewardRecord.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        }),
        prisma.svipRewardRecord.count({ where }),
      ]);

      const formattedList = list.map((record) => ({
        id: record.id,
        svipLevel: record.svipLevel,
        amount: record.amount.toFixed(2),
        rewardDate: record.rewardDate,
        status: record.status,
        productName: record.product.name,
        productCode: record.product.code,
        createdAt: record.createdAt.toISOString(),
      }));

      return successResponse({
        list: formattedList,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error('[SVIP] 获取奖励记录失败:', error);
      return errorResponse('INTERNAL_ERROR', 'Error al obtener historial de recompensas', 500);
    }
  });
}
