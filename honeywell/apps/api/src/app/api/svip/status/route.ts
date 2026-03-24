/**
 * GET /api/svip/status - 获取SVIP状态（含今日领取状态）
 */
import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/auth';
import { getUserSvipQualifications, getUserMaxSvipLevel } from '@/services/svip-reward.service';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, userId) => {
    try {
      const [qualifications, maxLevel] = await Promise.all([
        getUserSvipQualifications(userId),
        getUserMaxSvipLevel(userId),
      ]);

      const totalDailyReward = qualifications.reduce(
        (sum, q) => sum + Number(q.dailyReward), 0
      );

      const todayClaimedAmount = qualifications
        .filter(q => q.claimedToday)
        .reduce((sum, q) => sum + Number(q.dailyReward), 0);

      const todayUnclaimedAmount = qualifications
        .filter(q => !q.claimedToday)
        .reduce((sum, q) => sum + Number(q.dailyReward), 0);

      return successResponse({
        currentMaxLevel: maxLevel,
        qualifications: qualifications.map(q => ({
          productId: q.productId,
          productCode: q.productCode,
          svipLevel: q.svipLevel,
          dailyReward: q.dailyReward.toString(),
          activeCount: q.activeCount,
          requiredCount: q.requiredCount,
          claimedToday: q.claimedToday,
        })),
        totalDailyReward: totalDailyReward.toFixed(2),
        todayClaimedAmount: todayClaimedAmount.toFixed(2),
        todayUnclaimedAmount: todayUnclaimedAmount.toFixed(2),
        canClaimToday: todayUnclaimedAmount > 0,
      });
    } catch (error) {
      console.error('[SVIP] 获取状态失败:', error);
      return errorResponse('INTERNAL_ERROR', 'خطأ في الحصول على حالة SVIP', 500);
    }
  });
}
