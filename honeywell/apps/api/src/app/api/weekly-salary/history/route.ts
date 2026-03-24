/**
 * GET /api/weekly-salary/history - 获取周薪领取历史记录
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
        prisma.weeklySalaryClaim.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            salary: {
              select: {
                id: true,
                minRecharge: true,
                rewardAmount: true,
              },
            },
          },
        }),
        prisma.weeklySalaryClaim.count({ where }),
      ]);

      const formattedList = list.map((claim) => ({
        id: claim.id,
        weekStart: claim.weekStart.toISOString(),
        weekEnd: claim.weekEnd.toISOString(),
        teamRecharge: claim.teamRecharge.toFixed(2),
        amount: claim.amount.toFixed(2),
        status: claim.status,
        salaryTier: {
          minRecharge: claim.salary.minRecharge.toFixed(2),
          rewardAmount: claim.salary.rewardAmount.toFixed(2),
        },
        createdAt: claim.createdAt.toISOString(),
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
      console.error('[WeeklySalary] 获取领取历史失败:', error);
      return errorResponse('INTERNAL_ERROR', 'Error al obtener historial', 500);
    }
  });
}
