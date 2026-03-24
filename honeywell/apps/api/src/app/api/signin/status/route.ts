/**
 * @file 签到状态接口
 * @description 获取用户签到状态，包含普通签到和SVIP签到
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第10.1节 - 签到状态
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse } from '@/lib/response';
import { signInService } from '@/services/signin.service';

/**
 * GET /api/signin/status
 * @description 获取用户签到状态
 * @auth 需要登录
 * @returns {SignInStatusResult} 签到状态
 * 
 * @example 响应示例
 * {
 *   "success": true,
 *   "data": {
 *     "normalSignIn": {
 *       "available": true,
 *       "completed": false,
 *       "windowExpired": false,
 *       "currentStreak": 2,
 *       "targetDays": 3,
 *       "remainingWindowDays": 5,
 *       "todaySigned": false,
 *       "reward": "1.00"
 *     },
 *     "svipSignIn": {
 *       "available": true,
 *       "todaySigned": false,
 *       "reward": "8.00",
 *       "svipLevel": 3
 *     }
 *   }
 * }
 */
export async function GET(request: NextRequest): Promise<Response> {
  return withAuth(request, async (_req, userId) => {
    const status = await signInService.getSignInStatus(userId);
    return successResponse(status);
  });
}
