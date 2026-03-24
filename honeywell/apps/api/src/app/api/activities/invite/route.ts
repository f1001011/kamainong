/**
 * @file 拉新裂变活动状态接口
 * @description 获取拉新裂变活动状态，包含有效邀请人数和各阶梯状态
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第11.2节 - 拉新裂变状态
 * @depends 开发文档/开发文档.md 第9.2节 - 拉新裂变活动
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse } from '@/lib/response';
import { activityService } from '@/services/activity.service';

/**
 * GET /api/activities/invite
 * @description 获取拉新裂变活动状态
 * @auth 需要登录
 * @returns {InviteActivityStatus} 拉新裂变活动状态
 * 
 * @example 响应示例
 * {
 *   "success": true,
 *   "data": {
 *     "activityName": "Recompensa por invitacion",
 *     "activityDesc": "Invita amigos y gana recompensas escalonadas",
 *     "validInviteCount": 25,
 *     "tiers": [
 *       { "tier": 1, "requiredCount": 1, "reward": "1.00", "status": "CLAIMED" },
 *       { "tier": 2, "requiredCount": 10, "reward": "10.00", "status": "CLAIMED" },
 *       { "tier": 3, "requiredCount": 30, "reward": "30.00", "status": "CLAIMABLE" },
 *       { "tier": 4, "requiredCount": 60, "reward": "60.00", "status": "LOCKED" },
 *       { "tier": 5, "requiredCount": 100, "reward": "100.00", "status": "LOCKED" }
 *     ]
 *   }
 * }
 * 
 * @error ACTIVITY_NOT_FOUND - 活动不存在
 * @error ACTIVITY_NOT_ACTIVE - 活动已关闭
 */
export async function GET(request: NextRequest): Promise<Response> {
  return withAuth(request, async (_req, userId) => {
    const status = await activityService.getInviteActivityStatus(userId);
    
    return successResponse(status);
  });
}
