/**
 * @file 领取邀请奖励接口
 * @description 领取拉新裂变活动的阶梯奖励
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第11.3节 - 领取邀请奖励
 * @depends 开发文档/开发文档.md 第9.2节 - 拉新裂变活动
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse } from '@/lib/response';
import { Errors } from '@/lib/errors';
import { activityService } from '@/services/activity.service';

/**
 * POST /api/activities/invite/claim
 * @description 领取邀请奖励
 * @auth 需要登录
 * @body { tier: number } 阶梯序号
 * @returns {ClaimRewardResult} 领取结果
 * 
 * @example 请求示例
 * POST /api/activities/invite/claim
 * { "tier": 3 }
 * 
 * @example 响应示例
 * {
 *   "success": true,
 *   "data": {
 *     "tier": 3,
 *     "reward": "30.00",
 *     "balanceAfter": "1730.00"
 *   },
 *   "message": "Recompensa reclamada"
 * }
 * 
 * @error REWARD_NOT_AVAILABLE - 未达领取条件（status != CLAIMABLE）
 * @error REWARD_ALREADY_CLAIMED - 已领取（status == CLAIMED）
 * @error ACTIVITY_NOT_ACTIVE - 活动已关闭
 * @error ACTIVITY_NOT_FOUND - 活动不存在
 */
export async function POST(request: NextRequest): Promise<Response> {
  return withAuth(request, async (req, userId) => {
    // 解析请求体
    const body = await req.json();
    const { tier } = body;

    // 参数校验
    if (typeof tier !== 'number' || tier < 1) {
      throw Errors.validationError('tier 参数无效');
    }

    // 领取奖励
    const result = await activityService.claimInviteReward(userId, tier);
    
    return successResponse(result, 'تمت المطالبة بالمكافأة');
  });
}
