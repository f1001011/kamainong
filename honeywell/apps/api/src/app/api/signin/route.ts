/**
 * @file 执行签到接口
 * @description 用户执行签到，发放签到奖励
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第10.2节 - 执行签到
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse } from '@/lib/response';
import { signInService } from '@/services/signin.service';

/**
 * POST /api/signin
 * @description 执行签到
 * @auth 需要登录
 * @returns {ExecuteSignInResult} 签到结果
 * 
 * @example 响应示例
 * {
 *   "success": true,
 *   "data": {
 *     "rewards": [
 *       { "type": "NORMAL", "amount": "1.00" },
 *       { "type": "SVIP", "amount": "8.00" }
 *     ],
 *     "totalAmount": "9.00",
 *     "newStreak": 3,
 *     "signInCompleted": true
 *   },
 *   "message": "签到成功，+9.00"
 * }
 * 
 * @error ALREADY_SIGNED_TODAY - 今日已签到
 * @error SIGNIN_WINDOW_EXPIRED - 签到窗口期已过期
 * @error SIGNIN_COMPLETED - 签到任务已完成（普通用户）
 */
export async function POST(request: NextRequest): Promise<Response> {
  return withAuth(request, async (_req, userId) => {
    const result = await signInService.executeSignIn(userId);
    
    // 构建成功消息
    const message = `Check-in exitoso, +${result.totalAmount}`;
    
    return successResponse(result, message);
  });
}
