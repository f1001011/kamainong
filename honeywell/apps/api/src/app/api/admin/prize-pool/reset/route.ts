import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

/**
 * 手动重置奖池
 * @route POST /api/admin/prize-pool/reset
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (_req, adminId) => {
    try {
      const pool = await prisma.prizePool.findFirst({
        where: { isActive: true },
      });

      if (!pool) {
        return errorResponse('NOT_FOUND', '未找到活跃的奖池配置', 404);
      }

      const today = new Date().toISOString().split('T')[0];

      const updated = await prisma.prizePool.update({
        where: { id: pool.id },
        data: {
          remainToday: pool.dailyTotal,
          lastResetDate: today,
        },
      });

      await prisma.adminOperationLog.create({
        data: {
          adminId,
          module: 'prize_pool',
          action: 'reset',
          targetType: 'PrizePool',
          targetId: String(pool.id),
          beforeData: { remainToday: pool.remainToday, lastResetDate: pool.lastResetDate },
          afterData: { remainToday: updated.remainToday, lastResetDate: updated.lastResetDate },
          remark: '手动重置奖池',
        },
      });

      return successResponse({
        id: updated.id,
        dailyTotal: updated.dailyTotal,
        remainToday: updated.remainToday,
        lastResetDate: updated.lastResetDate,
      }, '奖池重置成功');
    } catch (error) {
      console.error('[Prize Pool Reset Error]', error);
      return errorResponse('INTERNAL_ERROR', '奖池重置失败');
    }
  });
}
