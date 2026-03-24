/**
 * POST /api/svip/claim - 手动领取SVIP每日奖励
 * @description 用户点击领取按钮，一键领取当日所有达标等级的SVIP奖励
 */
import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/auth';
import { claimSvipDailyReward } from '@/services/svip-reward.service';
import { BusinessError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, userId) => {
    try {
      const result = await claimSvipDailyReward(userId);
      return successResponse(result, 'تمت المطالبة بمكافأة SVIP بنجاح');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[SVIP] 领取失败:', error);
      return errorResponse('INTERNAL_ERROR', 'خطأ في المطالبة بمكافأة SVIP', 500);
    }
  });
}
