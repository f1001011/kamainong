/**
 * @file 活动列表接口
 * @description 获取活动中心的活动列表，包含各活动的可领取状态（红点提示）
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第11.1节 - 活动列表
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse } from '@/lib/response';
import { activityService } from '@/services/activity.service';

/**
 * GET /api/activities
 * @description 获取活动列表
 * @auth 需要登录
 * @returns {ActivityListItem[]} 活动列表
 * 
 * @example 响应示例
 * {
 *   "success": true,
 *   "data": {
 *     "list": [
 *       {
 *         "code": "INVITE_REWARD",
 *         "name": "拉新裂变",
 *         "description": "邀请好友，获取奖励",
 *         "icon": "/images/activity/invite.png",
 *         "isActive": true,
 *         "hasClaimable": true,
 *         "sortOrder": 1
 *       },
 *       {
 *         "code": "COLLECTION_BONUS",
 *         "name": "连单奖励",
 *         "description": "购买VIP产品组合，额外奖励",
 *         "icon": "/images/activity/collection.png",
 *         "isActive": true,
 *         "hasClaimable": false,
 *         "sortOrder": 2
 *       }
 *     ]
 *   }
 * }
 */
export async function GET(request: NextRequest): Promise<Response> {
  return withAuth(request, async (_req, userId) => {
    const list = await activityService.getActivityList(userId);
    
    return successResponse({ list });
  });
}
